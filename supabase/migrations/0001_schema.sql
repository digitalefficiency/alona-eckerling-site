-- ============================================================================
-- 0001_schema — the CMS data model.
--
-- THE ONE IDEA: published data lives in the entity tables, the working copy
-- lives in ONE polymorphic `drafts` table, and every publish snapshots into
-- `revisions` (append-only).
--
-- Why not draft+published columns on one row: RLS is ROW level, not column
-- level. A dual-column row would hand every draft to anyone holding the anon
-- key (which is public by definition). A separate table has NO anon policy at
-- all, so the leak is structurally impossible rather than policy-dependent.
--
-- THE PUBLIC READ PATH TOUCHES ONLY THE ENTITY TABLES. Image URLs are
-- DENORMALISED into the published row at publish time (`image_path`, and the
-- {path, alt} inside a section payload). media_assets and media_refs are
-- staff-only, so the anon key cannot enumerate the asset table and walk back to
-- images belonging to unpublished drafts.
--
-- Every type is schema-qualified. Under `set search_path = ''` (which every
-- function in 0003 carries) only pg_catalog is implicitly searched, so an
-- unqualified `content_status` in a DECLARE block fails with 42704 the first
-- time the function is called.
--
-- Applied with: supabase db push   (see supabase/README.md)
-- ============================================================================

-- ── enums ───────────────────────────────────────────────────────────────────

create type public.content_status as enum ('draft', 'published', 'hidden');
-- draft     = never published; no public render
-- published = live
-- hidden    = was live, taken off the site by the editor; content preserved

create type public.page_kind as enum ('core', 'content');
-- core    = a designed landing page (home/about/coaching/contact/testimonials).
--           Cannot be deleted, slug cannot change.
-- content = a page she created herself.

create type public.entity_kind as enum ('page', 'recipe', 'post', 'testimonial', 'setting');

create type public.media_origin as enum ('code', 'cms');
-- code = referenced by a string literal inside src/**. The film frames, the
--        generated "rooms", the hero poster. NEVER deletable from the desk:
--        media_refs cannot see a TSX literal, so a naive refcount would read 0
--        for exactly the assets whose removal breaks the homepage.
-- cms  = uploaded or migrated content imagery. Hers.

create type public.settings_tier as enum ('editor', 'owner');
-- editor = Alona owns it (whatsapp, hours, socials, response promise...)
-- owner  = Rom owns it (license number, legal name, site url, legal docs).
--          The MoH license appears in 13 places across 7 files on a YMYL site;
--          one fat-fingered digit is a false credential claim.

-- ── helpers ─────────────────────────────────────────────────────────────────
-- security invoker + empty search_path: these are read by every RLS policy, so
-- they must not be hijackable through a mutable search_path.

create or replace function public.app_role()
  returns text
  language sql
  stable
  security invoker
  set search_path = ''
as $$
  -- app_metadata ONLY. user_metadata is writable by the user themselves via
  -- supabase.auth.updateUser(), so a role claim living there is self-grantable.
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '')
$$;

create or replace function public.is_cms_user()
  returns boolean
  language sql
  stable
  security invoker
  set search_path = ''
as $$
  select public.app_role() in ('editor', 'admin')
$$;

create or replace function public.is_admin()
  returns boolean
  language sql
  stable
  security invoker
  set search_path = ''
as $$
  select public.app_role() = 'admin'
$$;

create or replace function public.touch_updated_at()
  returns trigger
  language plpgsql
  security invoker
  set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end
$$;

-- ── media ───────────────────────────────────────────────────────────────────
-- Declared first: recipes/pages reference it.

create table public.media_assets (
  id            uuid primary key default gen_random_uuid(),
  bucket        text        not null default 'media',
  path          text        not null,           -- object key inside the bucket
  -- The URL the site actually renders. Denormalised into the published entity
  -- rows at publish time so the public read path never needs this table.
  -- For migrated code-owned assets this is the literal that still lives in
  -- src/**, e.g. '/media/generated/02-problem-s01.jpg'.
  public_path   text,
  origin        public.media_origin not null default 'cms',
  locked        boolean     not null default false,
  alt           text        not null default '',
  width         integer,
  height        integer,
  bytes         integer,
  mime          text,
  original_name text,
  -- How the row got here. 'migrated' is a file that already existed in the repo
  -- when the CMS was built; 'upload' is one Alona added herself. The phase-5
  -- upload plan is computed from this together with origin, so losing it means
  -- losing the answer to "which bytes still have to move".
  source        text not null default 'upload' check (source in ('upload', 'migrated')),
  -- Tombstone, never a hard delete. The public URL is immutable-cached, sits in
  -- Google's image index, and in links she has already shared. A purge is a
  -- separate, manual, owner-only script.
  deleted_at    timestamptz,
  created_at    timestamptz not null default now(),
  created_by    uuid references auth.users,

  -- Invariant 5 at the schema level, not merely in a policy predicate: a
  -- code-owned asset is ALWAYS locked. Without this, one seed row that forgets
  -- `locked => true` is a film frame the editor can quietly tombstone.
  constraint media_assets_code_is_locked_ck check (origin <> 'code' or locked)
);

-- Partial: a tombstoned path must not block re-uploading the same bytes.
create unique index media_assets_path_live_idx
  on public.media_assets (bucket, path)
  where deleted_at is null;

create unique index media_assets_public_path_idx
  on public.media_assets (public_path)
  where deleted_at is null and public_path is not null;

create index media_assets_origin_idx
  on public.media_assets (origin)
  where deleted_at is null;

-- public_path must never be null for a live asset, because publish_entity
-- resolves image_path from it and a null there silently blanks a live image.
-- Code-owned rows carry the literal that is still in src/**; everything else
-- gets the Storage public URL derived here.
create or replace function public.media_default_public_path()
  returns trigger
  language plpgsql
  security invoker
  set search_path = ''
as $$
begin
  if new.public_path is null then
    new.public_path := '/storage/v1/object/public/' || new.bucket || '/' || new.path;
  end if;
  return new;
end
$$;

create trigger media_assets_public_path
  before insert or update on public.media_assets
  for each row execute function public.media_default_public_path();

-- Reference graph. Rebuilt from FOUR sources (published rows, drafts,
-- revisions, settings) plus a CI scan of src/** for `code` refs. A revision
-- that references an image is reason enough not to delete it, otherwise
-- "restore" ships a broken image.
--
-- Identity note: a PRIMARY KEY constraint takes BARE COLUMN NAMES only.
-- coalesce() is legal in CREATE INDEX but never in a constraint, so the
-- sentinels live on the columns as NOT NULL DEFAULTs. That expresses the same
-- identity AND makes ON CONFLICT inference work, which matters because the
-- rebuild job upserts rather than delete-all/insert-all.
create table public.media_refs (
  media_id    uuid not null references public.media_assets(id) on delete cascade,
  ref_kind    text not null check (ref_kind in ('published', 'draft', 'revision', 'setting', 'code')),
  entity_type public.entity_kind,
  -- the all-zero uuid is the "no entity" sentinel (code and setting rows)
  entity_id   uuid not null default '00000000-0000-0000-0000-000000000000'::uuid,
  -- for ref_kind='code': "src/app/page.tsx:65"
  source      text not null default '',
  field       text not null default '',

  -- A code ref with no source is unauditable: it is exactly the row claiming
  -- "the homepage needs this asset" while naming no file anyone can check.
  constraint media_refs_code_needs_source check (ref_kind <> 'code' or source <> ''),

  primary key (media_id, ref_kind, entity_id, source, field)
);

create index media_refs_entity_idx on public.media_refs (entity_type, entity_id);

-- ── pages ───────────────────────────────────────────────────────────────────

create table public.pages (
  id           uuid primary key default gen_random_uuid(),
  slug         text        not null,           -- '' is home
  kind         public.page_kind not null default 'content',
  title        text        not null,
  description  text,
  -- The PUBLISHED section document: an ordered array of
  -- {id, type, schema_version, payload}. Written by publish_entity(), which
  -- FILTERS OUT invisible sections — a hidden section must never ship inside a
  -- world-readable row.
  sections     jsonb       not null default '[]'::jsonb,
  -- The section order the site shipped with, so "החזרת הסדר המקורי" is one
  -- click. Holds ONLY [{id, type}] in launch order: restoring order must never
  -- restore copy she has written since.
  baseline_order jsonb     not null default '[]'::jsonb,
  status       public.content_status not null default 'draft',
  published_at timestamptz,
  deleted_at   timestamptz,
  updated_at   timestamptz not null default now(),
  updated_by   uuid references auth.users
);

create unique index pages_slug_live_idx on public.pages (slug) where deleted_at is null;
create trigger pages_touch before update on public.pages
  for each row execute function public.touch_updated_at();

-- A core page is a designed landing page; deleting it deletes a route that the
-- nav, the sitemap and the legacy redirect map all point at.
create or replace function public.guard_core_page()
  returns trigger
  language plpgsql
  security invoker
  set search_path = ''
as $$
begin
  if tg_op = 'DELETE' and old.kind = 'core' then
    raise exception 'core_page_undeletable' using errcode = '42501';
  end if;
  if tg_op = 'UPDATE' and old.kind = 'core' then
    if new.slug is distinct from old.slug then
      raise exception 'core_page_slug_immutable' using errcode = '42501';
    end if;
    if new.deleted_at is not null and old.deleted_at is null then
      raise exception 'core_page_undeletable' using errcode = '42501';
    end if;
  end if;
  return coalesce(new, old);
end
$$;

create trigger pages_guard_core
  before update or delete on public.pages
  for each row execute function public.guard_core_page();

-- A page she creates lives at /<slug>, the same namespace as the code routes.
-- Nothing else stops her naming one "recipes" or "privacy": pages_slug_live_idx
-- only enforces uniqueness WITHIN pages. A collision does not error, it just
-- means one of the two never renders, and which one is decided by Next's route
-- precedence rather than by anybody's intent.
create or replace function public.guard_reserved_slug()
  returns trigger
  language plpgsql
  security invoker
  set search_path = ''
as $$
begin
  if new.kind = 'content' and lower(new.slug) in (
    '', 'recipes', 'blog', 'privacy', 'terms', 'accessibility', 'team', 'admin',
    'api', 'preview', 'styleguide', 'contact', 'about', 'coaching', 'testimonials',
    'sitemap.xml', 'robots.txt', 'feed.xml', 'manifest.webmanifest', '_next'
  ) then
    raise exception 'slug_reserved'
      using errcode = '23514',
            detail  = format('%s is a route the site already owns', new.slug),
            hint    = 'choose a different address for this page';
  end if;
  return new;
end
$$;

create trigger pages_guard_reserved
  before insert or update on public.pages
  for each row execute function public.guard_reserved_slug();

-- ── recipes ─────────────────────────────────────────────────────────────────

create table public.recipes (
  id            uuid primary key default gen_random_uuid(),
  slug          text        not null,
  legacy_slug   text,                          -- the Hebrew Wix slug, for redirects
  title         text        not null,
  description   text        not null,          -- 70-160, the one HARD length rule
  date          date        not null,
  category      text        not null,
  tags          text[]      not null default '{}',

  -- Prep time is kept TWICE on purpose. 24 of the 34 migrated recipes say
  -- "לא צוין". An int column alone would make them unsavable, she would type 0
  -- to get past the block, and the JSON-LD would emit PT0M, which Google
  -- rejects. The text is what the page shows; the int only feeds structured
  -- data, and only when it is a positive number.
  prep_time_text text,
  prep_minutes   integer check (prep_minutes is null or prep_minutes > 0),
  servings       text,

  -- image_id is the library link; image_path is the URL the page renders and is
  -- what the migration fills from the existing `/media/client/recipes/*.jpg`
  -- frontmatter. Keeping both is what makes the public read path independent of
  -- media_assets, and what makes the media migration reversible.
  image_id      uuid references public.media_assets(id),
  image_path    text,
  image_alt     text,

  intro         text        not null default '',
  -- [{kind: 'item'|'sublabel'|'note', text}]. Classified ONCE at migration from
  -- the RAW markdown line: parseRecipeBody strips the bullet glyph, and the
  -- bullet is the only reliable signal separating an ingredient from a
  -- structural line. JSON-LD recipeIngredient = kind='item' only.
  ingredients   jsonb       not null default '[]'::jsonb,
  steps         jsonb       not null default '[]'::jsonb,
  tip           text        not null default '',
  -- Anything the parser did not recognise, round-tripped verbatim. This is the
  -- contract that has kept 34 files lossless. Do not narrow it.
  extra         text        not null default '',
  headings      jsonb       not null default '{"ingredients":"רכיבים","steps":"אופן הכנה","tip":"טיפ"}'::jsonb,

  status        public.content_status not null default 'draft',
  published_at  timestamptz,
  deleted_at    timestamptz,                   -- 30-day soft delete
  updated_at    timestamptz not null default now(),
  updated_by    uuid references auth.users
);

create unique index recipes_slug_live_idx on public.recipes (slug) where deleted_at is null;
create index recipes_tags_idx on public.recipes using gin (tags);
create index recipes_published_idx on public.recipes (status, date desc) where deleted_at is null;
create trigger recipes_touch before update on public.recipes
  for each row execute function public.touch_updated_at();

-- A published slug is a URL someone has linked to. Renaming it is allowed, but
-- only through public.rename_slug() (0003), which writes the redirect row in
-- the same transaction.
--
-- The bypass is a transaction-local GUC. That works ONLY from inside a function
-- body, because a function body is one transaction: PostgREST gives every REST
-- call and every RPC its own transaction, so there is no way to prepend a
-- `SET LOCAL` to a plain `.from('recipes').update()`. That is the point — the
-- only door is the one that also creates the redirect.
create or replace function public.guard_published_slug()
  returns trigger
  language plpgsql
  security invoker
  set search_path = ''
as $$
begin
  if old.published_at is not null
     and new.slug is distinct from old.slug
     and coalesce(current_setting('cms.slug_rename', true), '') <> 'on' then
    raise exception 'slug_immutable_after_publish' using errcode = '42501';
  end if;
  return new;
end
$$;

create trigger recipes_guard_slug before update on public.recipes
  for each row execute function public.guard_published_slug();

-- Pages get the same guard. guard_core_page already refuses a slug change on a
-- core page; this covers the content pages she creates herself, so that
-- renaming one always goes through rename_slug() and always leaves a redirect.
create trigger pages_guard_slug before update on public.pages
  for each row execute function public.guard_published_slug();

-- ── posts (blog) ────────────────────────────────────────────────────────────
-- Built now, hidden in the desk until the first post exists. An empty tab
-- teaches her the desk is full of things that do nothing.

create table public.posts (
  id           uuid primary key default gen_random_uuid(),
  slug         text        not null,
  title        text        not null,
  description  text        not null,
  date         date        not null,
  tags         text[]      not null default '{}',
  image_id     uuid references public.media_assets(id),
  image_path   text,
  image_alt    text,
  body_md      text        not null default '',
  status       public.content_status not null default 'draft',
  published_at timestamptz,
  deleted_at   timestamptz,
  updated_at   timestamptz not null default now(),
  updated_by   uuid references auth.users
);

create unique index posts_slug_live_idx on public.posts (slug) where deleted_at is null;
create trigger posts_touch before update on public.posts
  for each row execute function public.touch_updated_at();
create trigger posts_guard_slug before update on public.posts
  for each row execute function public.guard_published_slug();

-- ── testimonials ────────────────────────────────────────────────────────────

create table public.testimonials (
  id           uuid primary key default gen_random_uuid(),
  quote        text        not null,
  name         text        not null,
  context      text        not null,           -- required: an unattributed quote is not proof
  outcome      text,
  -- Third-party PII on a YMYL site: who gave permission, and when.
  consent_by   text,
  consent_at   date,
  position     integer     not null default 0,
  status       public.content_status not null default 'draft',
  published_at timestamptz,
  deleted_at   timestamptz,
  updated_at   timestamptz not null default now(),
  updated_by   uuid references auth.users
);

create index testimonials_published_idx on public.testimonials (status, position);
create trigger testimonials_touch before update on public.testimonials
  for each row execute function public.touch_updated_at();

-- ── site settings ───────────────────────────────────────────────────────────

create table public.site_settings (
  key        text primary key,
  value      jsonb        not null,
  tier       public.settings_tier not null default 'editor',
  updated_at timestamptz  not null default now(),
  updated_by uuid references auth.users
);

create trigger site_settings_touch before update on public.site_settings
  for each row execute function public.touch_updated_at();

-- ── leads ───────────────────────────────────────────────────────────────────
-- CHECKs mirror the validation already in src/app/api/lead/route.ts, because
-- the anon INSERT grant is directly callable and must not depend on the route.

create table public.leads (
  id            uuid primary key default gen_random_uuid(),
  submission_id uuid        not null unique,   -- idempotency; the route already mints one
  name          text        not null check (char_length(name) between 2 and 120),
  phone         text        not null check (char_length(phone) between 6 and 30),
  email         text        check (email is null or email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  city          text        check (city is null or char_length(city) <= 80),
  subject       text        check (subject is null or char_length(subject) <= 120),
  message       text        check (message is null or char_length(message) <= 4000),
  consent       boolean     not null check (consent = true),
  form_id       text        check (form_id is null or char_length(form_id) <= 60),
  form_page     text        check (form_page is null or char_length(form_page) <= 200),
  attribution   jsonb,
  -- Columns below are NEVER granted to anon (see 0002). Without column-level
  -- grants an attacker sets created_at to the year 3000 and pins their row to
  -- the top of her inbox forever.
  created_at    timestamptz not null default now(),
  status        text        not null default 'new' check (status in ('new', 'handled')),
  handled_at    timestamptz,
  notes         text,
  -- Leads is the one table the open internet can write to, so it is the one
  -- table that will accumulate spam, and it is also the table a data-erasure
  -- request lands on. DELETE is revoked from every client role, so without a
  -- tombstone there would be no removal path at all short of a psql session.
  deleted_at    timestamptz
);

create index leads_live_idx on public.leads (created_at desc) where deleted_at is null;

-- ── drafts ──────────────────────────────────────────────────────────────────
-- One working copy per entity. `rev` replaces the git blob sha as the
-- optimistic-concurrency token (the contract at src/lib/cms/actions.ts:119).

create table public.drafts (
  entity_type public.entity_kind not null,
  entity_id   uuid        not null,
  payload     jsonb       not null,
  rev         integer     not null default 1,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users,
  primary key (entity_type, entity_id)
);

-- ── revisions ───────────────────────────────────────────────────────────────
-- Append-only. NOT a backup: it lives in the same database under the same
-- credentials and dies with it. See supabase/README.md for the backup posture.

create table public.revisions (
  id          bigint generated always as identity primary key,
  entity_type public.entity_kind not null,
  entity_id   uuid        not null,
  action      text        not null check (action in ('publish', 'restore', 'hide', 'unhide', 'settings_save', 'slug_rename')),
  snapshot    jsonb       not null,
  note        text,
  created_at  timestamptz not null default now(),
  -- Defaulted so the RLS check `created_by = auth.uid()` (0002) has something
  -- to compare against even when a caller omits the column: authorship is not
  -- optional on the only audit trail that survives the removal of git.
  created_by  uuid default auth.uid() references auth.users
);

create index revisions_entity_idx on public.revisions (entity_type, entity_id, id desc);

-- ── redirects ───────────────────────────────────────────────────────────────
-- CMS-era slug renames only. The 34-entry Wix map stays in
-- src/lib/legacy-redirects.ts: it is frozen history and needs no database.
-- Served to visitors by nginx from a generated map file, never by a
-- per-request DB read (a throwing middleware 500s the whole site).

create table public.redirects (
  source      text primary key,
  destination text not null,
  permanent   boolean not null default true,
  created_at  timestamptz not null default now()
);
