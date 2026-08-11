-- ============================================================================
-- 0002_rls — row level security, grants, and the assertions that keep them honest.
--
-- THREE RULES THIS FILE EXISTS TO ENFORCE:
--
-- 1. EVERY POLICY NAMES ITS ROLE WITH `TO`. A CREATE POLICY with no TO clause
--    defaults to role PUBLIC, and PUBLIC includes anon. A "staff only" SELECT
--    policy written without TO hands the entire draft history to anyone holding
--    the anon key, which is a public credential embedded in the client bundle.
--
-- 2. NO CLIENT ROLE MAY HARD-DELETE CONTENT. `FOR ALL` covers DELETE too, so
--    the content tables get explicit select/insert/update policies and nothing
--    else. Removing the policy is not enough on its own: with the grant intact
--    and no policy, .delete() returns HTTP 200 with zero rows affected, a
--    silent no-op the desk would report as success. Revoked, it returns 42501,
--    which is a bug she can see. Removal is `deleted_at`; the purge runs as a
--    scheduled owner-only job outside RLS.
--
-- 3. THE MEDIA TABLES ARE STAFF-ONLY. The published rows already carry the URL
--    and alt text they render (recipes.image_path, pages.sections). Leaving
--    media_assets/media_refs anon-readable would let anyone with the anon key
--    join the reference graph and pull every image attached to an unpublished
--    draft or to a section marked visible:false — the exact leak that
--    publish_entity closes at the front door.
--
-- The file ends with four assertions. They fail the deploy. Do not remove them.
-- ============================================================================

alter table public.pages         enable row level security;
alter table public.recipes       enable row level security;
alter table public.posts         enable row level security;
alter table public.testimonials  enable row level security;
alter table public.site_settings enable row level security;
alter table public.media_assets  enable row level security;
alter table public.media_refs    enable row level security;
alter table public.leads         enable row level security;
alter table public.drafts        enable row level security;
alter table public.revisions     enable row level security;
alter table public.redirects     enable row level security;

-- ── the grant layer ─────────────────────────────────────────────────────────
-- Supabase grants anon and authenticated broad table privileges on the public
-- schema by default and relies on RLS as the gate. RLS is the right gate for
-- rows, but a privilege the design never intends to use should not exist at
-- all: it is what turns a future policy mistake into a data-loss event.
--
-- FIRST the grants this design actually uses, stated explicitly. On Supabase
-- every one of them is already covered by the platform's default `grant all`,
-- so these lines are no-ops there — but this file must also be true on a
-- database that granted nothing (the local replay harness today, the Vangus
-- Postgres if the stack ever moves). A security file that silently depends on
-- the host platform's generosity is the same class of bug as the policy
-- without TO that this file's assertions exist to catch.

grant usage on schema public to anon, authenticated;
grant select on public.pages, public.recipes, public.posts, public.site_settings
  to anon;
grant select, insert, update on
  public.pages, public.recipes, public.posts, public.testimonials,
  public.media_assets, public.media_refs, public.site_settings,
  public.drafts, public.redirects, public.leads
to authenticated;
grant delete on public.drafts to authenticated;  -- discarding a draft is the one true delete
grant select on public.revisions to authenticated;  -- history panel; INSERT is column-granted below
-- publish_entity rebuilds the published reference edges (delete from
-- media_refs where ref_kind='published' ...) and rename_slug prunes a
-- redirect that would shadow the new slug — both SECURITY INVOKER, both
-- running as authenticated. Without these two grants every publish and every
-- rename dies with 42501 on any host that granted nothing.
grant delete on public.media_refs, public.redirects to authenticated;

-- THEN the pruning of what the platform hands out beyond that.
revoke all on public.drafts      from anon;
revoke all on public.revisions   from anon;
revoke all on public.redirects   from anon;
revoke all on public.leads       from anon;
revoke all on public.media_refs  from anon;
revoke all on public.media_assets from anon;

-- Removal is a tombstone everywhere. This also removes DELETE from the admin,
-- who authenticates as `authenticated` too; that is deliberate. The 30-day
-- purge runs as `postgres` via a scheduled job, outside RLS and unaffected.
revoke delete on public.pages        from anon, authenticated;
revoke delete on public.recipes      from anon, authenticated;
revoke delete on public.posts        from anon, authenticated;
revoke delete on public.testimonials from anon, authenticated;
revoke delete on public.media_assets from anon, authenticated;
revoke delete on public.leads        from anon, authenticated;

-- anon writes NOTHING except a lead. The default grant leaves it holding
-- INSERT, UPDATE, REFERENCES and TRIGGER on every content table, which is
-- exactly the standing privilege this file's own doctrine says should not
-- exist: it is what turns a future policy mistake into a data-loss event.
revoke insert, update, references, trigger on
  public.pages, public.recipes, public.posts, public.testimonials, public.media_assets
from anon;
revoke insert, update, delete, references, trigger on public.site_settings from anon;

-- What makes "append-only" true rather than merely stated.
revoke update, delete on public.revisions from anon, authenticated;

-- TRUNCATE is a SEPARATE privilege that Supabase's default `grant all` hands to
-- anon and authenticated, and it bypasses RLS entirely: no policy, no row
-- trigger, so guard_core_page never runs and deleted_at never happens. One
-- statement would empty the revision log that is the only undo story for
-- settings and the only source restore_revision reads. PostgREST does not emit
-- TRUNCATE today, but the privilege should not exist to be reached later.
revoke truncate on
  public.pages, public.recipes, public.posts, public.testimonials,
  public.media_assets, public.media_refs, public.leads,
  public.revisions, public.drafts, public.site_settings, public.redirects
from anon, authenticated;

-- ── published content: anon reads, staff writes (never deletes) ─────────────

create policy pages_read_published on public.pages
  for select to anon
  using (status = 'published' and deleted_at is null);

create policy pages_staff_read on public.pages
  for select to authenticated using (public.is_cms_user());
create policy pages_staff_insert on public.pages
  for insert to authenticated with check (public.is_cms_user());
create policy pages_staff_update on public.pages
  for update to authenticated using (public.is_cms_user()) with check (public.is_cms_user());

create policy recipes_read_published on public.recipes
  for select to anon
  using (status = 'published' and deleted_at is null);

-- Staff SELECT is deliberately unfiltered by deleted_at: a 30-day recovery
-- window is only usable if she can still see what is inside it.
create policy recipes_staff_read on public.recipes
  for select to authenticated using (public.is_cms_user());
create policy recipes_staff_insert on public.recipes
  for insert to authenticated with check (public.is_cms_user());
create policy recipes_staff_update on public.recipes
  for update to authenticated using (public.is_cms_user()) with check (public.is_cms_user());

create policy posts_read_published on public.posts
  for select to anon
  using (status = 'published' and deleted_at is null);

create policy posts_staff_read on public.posts
  for select to authenticated using (public.is_cms_user());
create policy posts_staff_insert on public.posts
  for insert to authenticated with check (public.is_cms_user());
create policy posts_staff_update on public.posts
  for update to authenticated using (public.is_cms_user()) with check (public.is_cms_user());

-- The consent trail is NOT public. `consent_by` and `consent_at` record which
-- real person allowed her quote to be published, and when. RLS gates the ROW,
-- never the COLUMN, so a plain SELECT policy would serve that third party's
-- name to anyone holding the anon key — which is a public credential sitting in
-- the page source. Same reasoning that produced the column list on `leads`;
-- it just was not carried across to the other table that holds someone else's
-- personal data. Today that trail lives in a private git file, so publishing it
-- would be a new exposure created by this migration, not an inherited one.
--
-- A policy's USING expression does not require the caller to hold privileges on
-- the columns it references, so filtering on status and deleted_at keeps
-- working after they are revoked.
revoke select on public.testimonials from anon;
grant select (id, quote, name, context, outcome, position, published_at) on public.testimonials to anon;

create policy testimonials_read_published on public.testimonials
  for select to anon
  using (status = 'published' and deleted_at is null);

create policy testimonials_staff_read on public.testimonials
  for select to authenticated using (public.is_cms_user());
create policy testimonials_staff_insert on public.testimonials
  for insert to authenticated with check (public.is_cms_user());
create policy testimonials_staff_update on public.testimonials
  for update to authenticated using (public.is_cms_user()) with check (public.is_cms_user());

-- ── settings ────────────────────────────────────────────────────────────────
-- Everyone reads (they render in the footer and the JSON-LD of every page), but
-- the `owner` tier is writable by admin only: the Ministry of Health license
-- number, the legal name, the site url and the legal-document bodies live here.
--
-- Note the tier guard appears in BOTH using and with check. USING alone would
-- let the editor take an editor-tier row and rewrite it as tier='owner'; WITH
-- CHECK alone would let her read-modify-write an owner row.

create policy settings_read on public.site_settings
  for select to anon, authenticated
  using (true);

create policy settings_editor_write on public.site_settings
  for update to authenticated
  using       (public.is_cms_user() and (tier = 'editor' or public.is_admin()))
  with check  (public.is_cms_user() and (tier = 'editor' or public.is_admin()));

create policy settings_admin_insert on public.site_settings
  for insert to authenticated
  with check (public.is_admin());

create policy settings_admin_delete on public.site_settings
  for delete to authenticated
  using (public.is_admin());

-- ── media: staff only, and code-owned assets are untouchable by the editor ──
-- The predicate is `origin = 'cms' and not locked`, not `not locked` alone.
-- The schema CHECK in 0001 already ties origin='code' to locked=true; this is
-- the second lock on the same door, because the thing behind it is the 35
-- generated assets whose deletion breaks the homepage film.

create policy media_staff_read on public.media_assets
  for select to authenticated
  using (public.is_cms_user());

create policy media_staff_insert on public.media_assets
  for insert to authenticated
  with check (public.is_cms_user() and ((origin = 'cms' and not locked) or public.is_admin()));

create policy media_staff_update on public.media_assets
  for update to authenticated
  using       (public.is_cms_user() and ((origin = 'cms' and not locked) or public.is_admin()))
  with check  (public.is_cms_user() and ((origin = 'cms' and not locked) or public.is_admin()));

-- No DELETE policy, and DELETE revoked above. Removal is `deleted_at`.

-- The reference graph is rebuilt at every publish, so deleting stale rows is
-- the normal path — but only for the rows publish OWNS. The ref_kind='code'
-- edges are the entire mechanism protecting the 14 film frames and the other
-- code-owned assets from a Delete button: they are seeded by the migration and
-- refreshed by a CI scan, never by the desk. FOR ALL would let a single
-- .from('media_refs').delete() strip exactly the protection this design was
-- built around.
create policy media_refs_staff_read on public.media_refs
  for select to authenticated
  using (public.is_cms_user());

create policy media_refs_staff_insert on public.media_refs
  for insert to authenticated
  with check (public.is_cms_user() and ref_kind <> 'code');

create policy media_refs_staff_update on public.media_refs
  for update to authenticated
  using (public.is_cms_user() and ref_kind <> 'code')
  with check (public.is_cms_user() and ref_kind <> 'code');

create policy media_refs_staff_delete on public.media_refs
  for delete to authenticated
  using (public.is_cms_user() and ref_kind <> 'code');

-- ── drafts: staff only, full stop ───────────────────────────────────────────

create policy drafts_staff_all on public.drafts
  for all to authenticated
  using (public.is_cms_user())
  with check (public.is_cms_user());

-- ── revisions: append-only even for the editor ──────────────────────────────

create policy revisions_staff_read on public.revisions
  for select to authenticated
  using (public.is_cms_user());

-- Append-only is not the same as tamper-evident. Without the column grant below
-- the editor could POST straight to /rest/v1/revisions and choose created_by,
-- created_at, action and snapshot freely: a history that can be written into is
-- a history that cannot be trusted, and this table is the ONLY undo story left
-- once the git layer is gone. The WITH CHECK pins authorship; the column grant
-- is what stops a backdated created_at, because RLS cannot gate columns.
revoke insert on public.revisions from authenticated;
grant insert (entity_type, entity_id, action, snapshot, note, created_by) on public.revisions to authenticated;

create policy revisions_staff_insert on public.revisions
  for insert to authenticated
  with check (public.is_cms_user() and created_by = auth.uid());

-- ── redirects ───────────────────────────────────────────────────────────────

create policy redirects_staff_all on public.redirects
  for all to authenticated
  using (public.is_cms_user())
  with check (public.is_cms_user());

-- ── leads ───────────────────────────────────────────────────────────────────
-- RLS gates the ROW; it cannot gate COLUMNS. Supabase's default grants let anon
-- write every column, including created_at (backdate a row to the top of her
-- inbox forever), status and notes. Column-level GRANT is the only mechanism
-- that stops that, so the list below is the real boundary.

grant insert (submission_id, name, phone, email, city, subject, message, consent, form_id, form_page, attribution)
  on public.leads to anon;

create policy leads_anon_insert on public.leads
  for insert to anon
  with check (consent = true);

create policy leads_staff_read on public.leads
  for select to authenticated
  using (public.is_cms_user());

create policy leads_staff_update on public.leads
  for update to authenticated
  using (public.is_cms_user())
  with check (public.is_cms_user());

-- Caller contract: insert WITHOUT .select(). There is deliberately no anon
-- SELECT policy, so `.insert(x).select().single()` returns 42501 even though
-- the row committed, and the visitor sees a failure and submits twice.
-- supabase-js sends Prefer: return=minimal when .select() is omitted.

-- ── storage ─────────────────────────────────────────────────────────────────
-- Bucket `media`, public read (objects are fetched by URL from <img> tags; the
-- bucket's public flag covers that and needs no SELECT policy, so anon still
-- cannot LIST the bucket).
--
-- Writes are partitioned BY PATH PREFIX. This is the direct replacement for
-- WRITABLE_PREFIXES in src/lib/cms/safe-path.mjs, which today is the only thing
-- standing between a client-typed value and a repo-wide write. It must not be
-- lost in the port.
--
-- These are the only statements whose success depends on a Supabase-managed
-- grant rather than on something this migration created: storage.objects is
-- owned by supabase_storage_admin. Whether the migration role can create
-- policies there varies by platform version — a membership probe gave a false
-- answer in practice — so the only honest test is the attempt itself, wrapped
-- so a refusal aborts with an instruction instead of a bare ownership error
-- AFTER RLS was already enabled.
do $$
begin
  execute $pol$
  create policy media_bucket_editor_insert on storage.objects
    for insert to authenticated
    with check (
      bucket_id = 'media'
      and public.is_cms_user()
      and (storage.foldername(name))[1] in ('uploads', 'recipes')
    )
  $pol$;
  execute $pol$
  create policy media_bucket_editor_update on storage.objects
    for update to authenticated
    using (
      bucket_id = 'media'
      and public.is_cms_user()
      and (storage.foldername(name))[1] in ('uploads', 'recipes')
    )
    with check (
      bucket_id = 'media'
      and public.is_cms_user()
      and (storage.foldername(name))[1] in ('uploads', 'recipes')
    )
  $pol$;
  execute $pol$
  create policy media_bucket_admin_all on storage.objects
    for all to authenticated
    using (bucket_id = 'media' and public.is_admin())
    with check (bucket_id = 'media' and public.is_admin())
  $pol$;
exception
  when insufficient_privilege then
    -- On storage-hardened projects (every project created after mid-2025) NO
    -- SQL role reachable from the dashboard may create policies on
    -- storage.objects — they are managed through the Storage API. Aborting
    -- here once rolled back an entire dashboard apply because of three
    -- policies that guard a bucket which does not exist yet. The uploads phase
    -- creates the bucket AND these policies together via the Storage API;
    -- until then they protect nothing, so their absence must not block the
    -- schema. The final status SELECT of the paste reports how many of the
    -- three exist, so this branch is visible even though the dashboard does
    -- not surface RAISE NOTICE output.
    raise notice
      'storage.objects policies were NOT created (storage is platform-managed on this project). Create the three media-bucket policies via the Storage API together with the bucket, in the uploads phase.';
end
$$;

-- ============================================================================
-- ASSERTIONS. These run at migration time and fail the deploy. They are the
-- reason a policy mistake cannot reach production quietly.
--
-- Scoped to the `public` schema and to the three storage policies this file
-- creates. A blanket scan of `storage` would fire on policies Supabase ships
-- itself and would break every future migration for a reason that is not ours.
-- ============================================================================

-- 1. no policy of ours left on role PUBLIC (which includes anon)
do $$
declare
  offenders text;
begin
  select string_agg(schemaname || '.' || tablename || '.' || policyname, ', ')
    into offenders
    from pg_policies
   where 'public' = any (roles)
     and (schemaname = 'public'
          or policyname in ('media_bucket_editor_insert',
                            'media_bucket_editor_update',
                            'media_bucket_admin_all'));

  if offenders is not null then
    raise exception
      'RLS policy left on role PUBLIC (which includes anon): %. Add an explicit TO clause.',
      offenders;
  end if;
end
$$;

-- 2. no table OF OURS without RLS.
--    Scoped to the eleven tables 0001 creates, and not to the whole schema: an
--    extension that installs a table into public (postgis' spatial_ref_sys is
--    the classic) would otherwise block every future deploy over something that
--    is not a defect in this schema. relkind 'p' covers partitioned tables.
do $$
declare
  missing text;
begin
  select string_agg(c.relname, ', ')
    into missing
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public'
     and c.relkind in ('r', 'p')
     and c.relname in ('pages', 'recipes', 'posts', 'testimonials', 'site_settings',
                       'media_assets', 'media_refs', 'leads', 'drafts', 'revisions', 'redirects')
     and not c.relrowsecurity;

  if missing is not null then
    raise exception 'Tables without RLS enabled: %', missing;
  end if;
end
$$;

-- 3. no client role holds DELETE or TRUNCATE on a tombstone table.
--    has_table_privilege counts privileges held through role membership too,
--    which is what makes this worth asserting rather than assuming.
do $$
declare
  t   text;
  r   text;
  p   text;
  bad text := '';
begin
  foreach t in array array['pages', 'recipes', 'posts', 'testimonials', 'media_assets', 'revisions', 'leads'] loop
    foreach r in array array['anon', 'authenticated'] loop
      foreach p in array array['DELETE', 'TRUNCATE'] loop
        if has_table_privilege(r, format('public.%I', t), p) then
          bad := bad || r || '->' || t || '(' || p || ')  ';
        end if;
      end loop;
    end loop;
  end loop;

  if bad <> '' then
    raise exception
      'DELETE/TRUNCATE still granted to a client role. Removal is deleted_at, not a row drop: %', bad;
  end if;
end
$$;

-- 3b. anon holds no write privilege anywhere, with exactly one intended
--     exception: INSERT on leads, and there only on the granted columns.
do $$
declare
  t   text;
  p   text;
  bad text := '';
begin
  foreach t in array array['pages', 'recipes', 'posts', 'testimonials', 'site_settings',
                           'media_assets', 'media_refs', 'leads', 'drafts', 'revisions', 'redirects'] loop
    foreach p in array array['INSERT', 'UPDATE', 'DELETE'] loop
      if t = 'leads' and p = 'INSERT' then continue; end if;
      if has_table_privilege('anon', format('public.%I', t), p) then
        bad := bad || 'anon->' || t || '(' || p || ')  ';
      end if;
    end loop;
  end loop;

  if bad <> '' then
    raise exception 'anon holds a write privilege it never uses: %', bad;
  end if;
end
$$;

-- 3c. the consent trail stays off the public wire
do $$
begin
  if has_column_privilege('anon', 'public.testimonials', 'consent_by', 'SELECT')
     or has_column_privilege('anon', 'public.testimonials', 'consent_at', 'SELECT') then
    raise exception 'anon can read the testimonial consent trail — that is a third party''s personal data';
  end if;
  -- and the public grid must still work
  if not has_column_privilege('anon', 'public.testimonials', 'quote', 'SELECT') then
    raise exception 'anon cannot read testimonials.quote — the public grid would be empty';
  end if;
end
$$;

-- 4. no DELETE-capable policy on a tombstone table (FOR ALL includes DELETE)
do $$
declare
  offenders text;
begin
  select string_agg(tablename || '.' || policyname || ' (' || cmd || ')', ', ')
    into offenders
    from pg_policies
   where schemaname = 'public'
     and tablename in ('pages', 'recipes', 'posts', 'testimonials', 'media_assets', 'revisions')
     and cmd in ('DELETE', 'ALL');

  if offenders is not null then
    raise exception
      'DELETE-capable policy on a tombstone table (FOR ALL includes DELETE): %. Use explicit select/insert/update.',
      offenders;
  end if;
end
$$;
