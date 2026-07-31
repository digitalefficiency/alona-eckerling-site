-- apply-remaining.sql — everything the database still needs, in one paste.
--
-- WHY THIS FILE EXISTS: 0001 (the schema) was applied by `supabase db push`
-- before the connection from this network became unreliable. 0002, 0003 and the
-- page seed never landed. The dashboard SQL editor runs server-side and does
-- not depend on that connection, so this is the reliable path.
--
-- Paste the WHOLE file into the SQL editor and run once. It is transactional
-- per section and idempotent-safe to the extent that matters: if it fails
-- partway, read the error — the assertions in the RLS section are designed to
-- fail loudly rather than leave a half-open database.
--
-- The final section records 0002/0003 in supabase_migrations.schema_migrations
-- so `supabase db push` will treat them as applied and never try again — the
-- alternative is a future push re-running CREATE POLICY onto duplicates.

-- ═══════════════ 0002 — RLS, grants, storage, assertions ═══════════════

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
    raise exception
      'this role cannot create policies on storage.objects. Run the storage section from the dashboard SQL editor, or grant the migration role membership in supabase_storage_admin.';
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

-- ═══════════════ 0003 — the write path (save/publish/restore/rename) ═══════════════

-- ============================================================================
-- 0003_publish — the write path: save_draft, publish_entity, restore_revision,
-- set_visibility, save_setting, rename_slug.
--
-- All are SECURITY INVOKER, so RLS still applies: these functions are a
-- transaction boundary, not a privilege escalation.
--
-- FOUR INVARIANTS THIS FILE EXISTS TO ENFORCE:
--
-- 1. PUBLISH IS AGAINST WHAT SHE REVIEWED. Every mutation carries the token she
--    was holding. Same contract as the git blob sha in
--    src/lib/cms/actions.ts:119. Without it, a server-side autosave firing from
--    her phone overwrites the draft between the moment she reads the preview
--    and the moment she clicks פרסום, and the revision log records the phone's
--    payload as "reviewed".
--
-- 2. A HIDDEN SECTION NEVER SHIPS. pages.sections is world-readable through the
--    anon key, and RLS cannot filter inside a jsonb value. publish_entity
--    strips invisible sections; the full authoring document lives only in
--    drafts and revisions, which have no anon policy at all.
--
-- 3. AN RLS-DENIED WRITE IS NEVER REPORTED AS SUCCESS. For UPDATE, a row that
--    fails a policy's USING expression is SILENTLY SKIPPED: PostgreSQL raises
--    42501 only on a WITH CHECK violation, and WITH CHECK is never reached for
--    a row USING already filtered out. Every update in this file therefore
--    checks that it actually touched a row.
--
-- 4. NO JSON VALUE FROM THE DESK CAN ABORT A PUBLISH. `->>` stringifies, so a
--    JSON number 30.0 becomes '30.0' and '30.0'::integer raises 22P02; and
--    jsonb_array_elements over a JSON null raises 22023. Every extraction below
--    is guarded by jsonb_typeof, and an unusable value is ignored rather than
--    thrown, because the alternative is a publish button that fails on a value
--    the editor cannot see or fix.
--
-- Error contract (the desk maps these):
--   stale_rev / stale_setting  → the existing Hebrew conflict copy
--   forbidden                  → "השדה הזה נעול לעריכה"
--   *_not_found                → a bug, surface it
-- SQLSTATEs are custom (CMS0x) on purpose: 40001 is serialization_failure, and
-- some pooler and client layers retry it automatically, which for a stale
-- publish is precisely the wrong response.
-- ============================================================================

-- ── save_draft ──────────────────────────────────────────────────────────────
-- Returns the new rev. Autosave calls this too: on a conflict it must STOP and
-- show the banner, never force-write.

create or replace function public.save_draft(
  p_type         public.entity_kind,
  p_id           uuid,
  p_payload      jsonb,
  p_expected_rev integer
) returns integer
  language plpgsql
  security invoker
  set search_path = ''
as $$
declare
  v_rev integer;
  v_cur integer;
begin
  if p_expected_rev is null then
    -- first draft for this entity
    insert into public.drafts (entity_type, entity_id, payload, rev, updated_by)
    values (p_type, p_id, p_payload, 1, auth.uid())
    on conflict (entity_type, entity_id) do nothing
    returning rev into v_rev;

    if v_rev is null then
      -- RETURNING does not fire on DO NOTHING, so a null here means "a draft
      -- already exists". Report the current rev so the desk can recover
      -- instead of guessing.
      select rev into v_cur
        from public.drafts
       where entity_type = p_type and entity_id = p_id;

      raise exception 'stale_rev'
        using errcode = 'CMS01',
              detail  = format('draft already exists at rev %s', coalesce(v_cur::text, 'unknown')),
              hint    = 'reload the draft and resend with p_expected_rev';
    end if;
    return v_rev;
  end if;

  update public.drafts
     set payload    = p_payload,
         rev        = rev + 1,
         updated_at = now(),
         updated_by = auth.uid()
   where entity_type = p_type
     and entity_id   = p_id
     and rev         = p_expected_rev
  returning rev into v_rev;

  if v_rev is null then
    select rev into v_cur
      from public.drafts
     where entity_type = p_type and entity_id = p_id;

    if v_cur is null then
      raise exception 'draft_not_found' using errcode = 'CMS03';
    end if;

    raise exception 'stale_rev'
      using errcode = 'CMS01',
            detail  = format('draft is at rev %s, you sent %s', v_cur, p_expected_rev),
            hint    = 'reload the draft and resend with the current rev';
  end if;

  return v_rev;
end
$$;

-- ── visible_sections ────────────────────────────────────────────────────────
-- Invariant 2, isolated so it is testable on its own. A non-array input (JSON
-- null, an object, a missing key) yields an empty document rather than raising:
-- publish must never abort on a malformed payload it can safely normalise.

create or replace function public.visible_sections(p_sections jsonb)
  returns jsonb
  language sql
  immutable
  security invoker
  set search_path = ''
as $$
  select coalesce(
    (
      select jsonb_agg(s order by ord)
        from jsonb_array_elements(
               case when jsonb_typeof(p_sections) = 'array' then p_sections else '[]'::jsonb end
             ) with ordinality as t(s, ord)
       -- default to VISIBLE when the flag is absent or is not a JSON boolean.
       -- A section with no usable flag is one the editor never touched, and
       -- silently hiding it is worse than showing it. Reading it as
       -- (s ->> 'visible')::boolean would raise 22P02 on any non-boolean value
       -- and abort the whole publish.
       where coalesce(
               case when jsonb_typeof(s -> 'visible') = 'boolean'
                    then (s -> 'visible')::text::boolean end,
               true)
    ),
    '[]'::jsonb
  )
$$;

-- ── resolve_section_media ───────────────────────────────────────────────────
-- media_assets is staff-only, and public pages render server side with the anon
-- key and no session. So a section that stores only an image_id would ship a
-- uuid the public renderer cannot resolve, and the page would show an empty
-- image slot with no error anywhere. Resolve at publish time, exactly as the
-- recipe branch already does for its own image, and write {path, alt} into the
-- published payload.

create or replace function public.resolve_section_media(p_sections jsonb)
  returns jsonb
  language sql
  stable
  security invoker
  set search_path = ''
as $$
  select coalesce(
    (
      select jsonb_agg(
               case
                 -- the uuid shape is checked BEFORE the cast: a malformed
                 -- image_id must leave the section alone, not raise 22P02 and
                 -- take the whole publish down with it.
                 when jsonb_typeof(s -> 'payload') = 'object'
                  and (s -> 'payload' ->> 'image_id') ~
                      '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
                 then jsonb_set(
                        s,
                        '{payload,image}',
                        coalesce(
                          (select jsonb_build_object('path', m.public_path, 'alt', m.alt)
                             from public.media_assets m
                            where m.id = (s -> 'payload' ->> 'image_id')::uuid
                              and m.deleted_at is null
                              and m.public_path is not null),
                          -- keep whatever the draft already carried rather than
                          -- replacing a working image with null
                          coalesce(s -> 'payload' -> 'image', 'null'::jsonb)))
                 else s
               end
               order by ord)
        from jsonb_array_elements(
               case when jsonb_typeof(p_sections) = 'array' then p_sections else '[]'::jsonb end
             ) with ordinality as t(s, ord)
    ),
    '[]'::jsonb
  )
$$;

-- ── jsonb extraction helpers ────────────────────────────────────────────────
-- Invariant 4, in one place instead of scattered inline CASE expressions.

create or replace function public.jsonb_text_array(p_value jsonb)
  returns text[]
  language sql
  immutable
  security invoker
  set search_path = ''
as $$
  -- Returns NULL when the value is not an array (caller keeps the old value),
  -- and an EMPTY array for [] so that clearing every tag is actually possible.
  select case
           when jsonb_typeof(p_value) = 'array' then
             coalesce((select array_agg(e #>> '{}') from jsonb_array_elements(p_value) as e), '{}'::text[])
           else null
         end
$$;

-- Guarding jsonb_typeof alone is not enough: the LEAF CAST can still throw.
-- 3000000000 raises 22003, a negative value passes the type check and then
-- trips the CHECK on recipes.prep_minutes with 23514, and '2025-02-31' matches
-- the ISO regex and raises 22008. Each of those aborts a publish over a value
-- the editor cannot see or fix, which is the exact failure mode invariant 4
-- exists to prevent. So: plpgsql, range-checked, and anything still unparseable
-- comes back NULL instead of throwing.

create or replace function public.jsonb_positive_int(p_value jsonb)
  returns integer
  language plpgsql
  immutable
  security invoker
  set search_path = ''
as $$
declare
  v numeric;
begin
  v := case jsonb_typeof(p_value)
         when 'number' then trunc((p_value #>> '{}')::numeric)
         when 'string' then nullif(regexp_replace(p_value #>> '{}', '\D', '', 'g'), '')::numeric
         else null
       end;
  if v is null or v < 1 or v > 2147483647 then
    return null;
  end if;
  return v::integer;
exception when others then
  return null;
end
$$;

-- Same, but 0 and negatives are legal. Ordering fields need 0: it is the first
-- slot. Reusing the positive-only helper for testimonials.position made
-- "drag to the top" silently do nothing.
create or replace function public.jsonb_int(p_value jsonb)
  returns integer
  language plpgsql
  immutable
  security invoker
  set search_path = ''
as $$
declare
  v numeric;
begin
  v := case jsonb_typeof(p_value)
         when 'number' then trunc((p_value #>> '{}')::numeric)
         when 'string' then nullif(regexp_replace(p_value #>> '{}', '[^0-9-]', '', 'g'), '')::numeric
         else null
       end;
  if v is null or v < -2147483648 or v > 2147483647 then
    return null;
  end if;
  return v::integer;
exception when others then
  return null;
end
$$;

create or replace function public.jsonb_iso_date(p_value jsonb)
  returns date
  language plpgsql
  immutable
  security invoker
  set search_path = ''
as $$
begin
  if jsonb_typeof(p_value) <> 'string' then
    return null;
  end if;
  if (p_value #>> '{}') !~ '^\d{4}-\d{2}-\d{2}$' then
    return null;
  end if;
  return (p_value #>> '{}')::date;
exception when others then
  -- a well-formed but impossible date such as 2025-02-31
  return null;
end
$$;

-- ── publish_entity ──────────────────────────────────────────────────────────

create or replace function public.publish_entity(
  p_type         public.entity_kind,
  p_id           uuid,
  p_expected_rev integer,
  p_note         text default null
) returns jsonb
  language plpgsql
  security invoker
  set search_path = ''
as $$
declare
  d         public.drafts%rowtype;
  v_payload jsonb;
  v_now     timestamptz := now();
  v_rev     integer;
begin
  select * into d
    from public.drafts
   where entity_type = p_type
     and entity_id   = p_id
   for update;

  if not found then
    raise exception 'draft_not_found' using errcode = 'CMS03';
  end if;

  if d.rev is distinct from p_expected_rev then
    raise exception 'stale_rev'
      using errcode = 'CMS01',
            detail  = format('draft is at rev %s, you sent %s', d.rev, p_expected_rev),
            hint    = 'reload the preview and publish again';
  end if;

  v_payload := d.payload;

  if p_type = 'page' then
    update public.pages as p
       set title       = coalesce(v_payload ->> 'title', p.title),
           description = case when v_payload ? 'description'
                              then v_payload ->> 'description' else p.description end,
           -- invariant 2: only what is visible crosses into the public row, and
           -- any image_id inside a section is resolved to a {path, alt} the
           -- anon-key renderer can use.
           --
           -- The `jsonb_typeof = 'array'` guard is load-bearing: without it, a
           -- payload that simply omits `sections` would publish an EMPTY
           -- document and blank the whole live page. Every other assignment in
           -- this function preserves the old value when the key is absent; this
           -- one has to as well.
           sections     = case
                            when jsonb_typeof(v_payload -> 'sections') = 'array'
                            then public.resolve_section_media(
                                   public.visible_sections(v_payload -> 'sections'))
                            else p.sections
                          end,
           status       = 'published',
           published_at = coalesce(p.published_at, v_now),
           updated_by   = auth.uid()
     where p.id = p_id;

  elsif p_type = 'recipe' then
    update public.recipes as r
       set title          = coalesce(v_payload ->> 'title', r.title),
           description    = coalesce(v_payload ->> 'description', r.description),
           date           = coalesce(public.jsonb_iso_date(v_payload -> 'date'), r.date),
           category       = coalesce(v_payload ->> 'category', r.category),
           tags           = coalesce(public.jsonb_text_array(v_payload -> 'tags'), r.tags),
           prep_time_text = case when v_payload ? 'prep_time_text'
                                 then v_payload ->> 'prep_time_text' else r.prep_time_text end,
           prep_minutes   = case when v_payload ? 'prep_minutes'
                                 then public.jsonb_positive_int(v_payload -> 'prep_minutes')
                                 else r.prep_minutes end,
           servings       = case when v_payload ? 'servings'
                                 then v_payload ->> 'servings' else r.servings end,
           image_id       = case when v_payload ? 'image_id'
                                 then nullif(v_payload ->> 'image_id', '')::uuid else r.image_id end,
           -- the URL the page renders, resolved from the library at publish
           -- time so the public read path never touches media_assets
           -- last resort is the CURRENT path, never null: a lookup that comes
           -- back empty is a bug, and blanking a live photo because of it is
           -- the worst possible response. Clearing an image on purpose is done
           -- by sending image_path: "".
           image_path     = case
                              when v_payload ? 'image_id' and nullif(v_payload ->> 'image_id', '') is not null
                                then coalesce(
                                       (select m.public_path from public.media_assets m
                                         where m.id = (v_payload ->> 'image_id')::uuid
                                           and m.deleted_at is null),
                                       nullif(v_payload ->> 'image_path', ''),
                                       r.image_path)
                              when v_payload ? 'image_path'
                                then nullif(v_payload ->> 'image_path', '')
                              else r.image_path
                            end,
           image_alt      = case when v_payload ? 'image_alt'
                                 then v_payload ->> 'image_alt' else r.image_alt end,
           intro          = coalesce(v_payload ->> 'intro', r.intro),
           ingredients    = case when jsonb_typeof(v_payload -> 'ingredients') = 'array'
                                 then v_payload -> 'ingredients' else r.ingredients end,
           steps          = case when jsonb_typeof(v_payload -> 'steps') = 'array'
                                 then v_payload -> 'steps' else r.steps end,
           tip            = coalesce(v_payload ->> 'tip', r.tip),
           extra          = coalesce(v_payload ->> 'extra', r.extra),
           headings       = case when jsonb_typeof(v_payload -> 'headings') = 'object'
                                 then v_payload -> 'headings' else r.headings end,
           status         = 'published',
           published_at   = coalesce(r.published_at, v_now),
           updated_by     = auth.uid()
     where r.id = p_id;

  elsif p_type = 'post' then
    update public.posts as p
       set title        = coalesce(v_payload ->> 'title', p.title),
           description  = coalesce(v_payload ->> 'description', p.description),
           date         = coalesce(public.jsonb_iso_date(v_payload -> 'date'), p.date),
           tags         = coalesce(public.jsonb_text_array(v_payload -> 'tags'), p.tags),
           image_id     = case when v_payload ? 'image_id'
                               then nullif(v_payload ->> 'image_id', '')::uuid else p.image_id end,
           image_path   = case
                            when v_payload ? 'image_id' and nullif(v_payload ->> 'image_id', '') is not null
                              then coalesce(
                                     (select m.public_path from public.media_assets m
                                       where m.id = (v_payload ->> 'image_id')::uuid
                                         and m.deleted_at is null),
                                     nullif(v_payload ->> 'image_path', ''),
                                     p.image_path)
                            when v_payload ? 'image_path'
                              then nullif(v_payload ->> 'image_path', '')
                            else p.image_path
                          end,
           image_alt    = case when v_payload ? 'image_alt'
                               then v_payload ->> 'image_alt' else p.image_alt end,
           body_md      = coalesce(v_payload ->> 'body_md', p.body_md),
           status       = 'published',
           published_at = coalesce(p.published_at, v_now),
           updated_by   = auth.uid()
     where p.id = p_id;

  elsif p_type = 'testimonial' then
    update public.testimonials as t
       set quote        = coalesce(v_payload ->> 'quote', t.quote),
           name         = coalesce(v_payload ->> 'name', t.name),
           context      = coalesce(v_payload ->> 'context', t.context),
           outcome      = case when v_payload ? 'outcome'
                               then v_payload ->> 'outcome' else t.outcome end,
           consent_by   = case when v_payload ? 'consent_by'
                               then v_payload ->> 'consent_by' else t.consent_by end,
           consent_at   = case when v_payload ? 'consent_at'
                               then public.jsonb_iso_date(v_payload -> 'consent_at') else t.consent_at end,
           -- jsonb_int, not jsonb_positive_int: 0 is the first slot, and the
           -- positive-only helper would turn "drag to the top" into a no-op.
           position     = case when v_payload ? 'position'
                               then coalesce(public.jsonb_int(v_payload -> 'position'), t.position)
                               else t.position end,
           status       = 'published',
           published_at = coalesce(t.published_at, v_now),
           updated_by   = auth.uid()
     where t.id = p_id;

  else
    raise exception 'unsupported_entity_type' using errcode = '22023';
  end if;

  -- invariant 3: an RLS-denied UPDATE affects zero rows and raises nothing.
  if not found then
    raise exception 'publish_failed'
      using errcode = 'CMS02',
            detail  = 'the entity does not exist, or this account is not allowed to publish it',
            hint    = 'check the entity id and the account role';
  end if;

  -- Keep the published edges of the reference graph current. This is what the
  -- media library's delete guard reads, and an empty graph fails in the unsafe
  -- direction: an asset with no edges looks free to delete. The `code` edges
  -- come from the CI scan of src/**, which must run with the service-role key
  -- (anon holds no privilege on media_refs, and an authenticated key without
  -- the cms role claim writes zero rows without erroring).
  delete from public.media_refs
   where ref_kind = 'published' and entity_type = p_type and entity_id = p_id;

  insert into public.media_refs (media_id, ref_kind, entity_type, entity_id, field)
  select m.id, 'published', p_type, p_id, ref.field
    from (
      select case when (v_payload ->> 'image_id') ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
                  then (v_payload ->> 'image_id')::uuid end as media_id,
             'image_id'::text as field
      union all
      select case when (s -> 'payload' ->> 'image_id') ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
                  then (s -> 'payload' ->> 'image_id')::uuid end,
             'section:' || coalesce(s ->> 'id', '?')
        from jsonb_array_elements(
               case when jsonb_typeof(v_payload -> 'sections') = 'array'
                    then v_payload -> 'sections' else '[]'::jsonb end
             ) as s
    ) as ref
    join public.media_assets m on m.id = ref.media_id and m.deleted_at is null
  on conflict do nothing;

  -- The snapshot is the FULL authoring document, hidden sections included:
  -- that is what restore has to bring back.
  insert into public.revisions (entity_type, entity_id, action, snapshot, note, created_by)
  values (p_type, p_id, 'publish', v_payload, p_note, auth.uid());

  update public.drafts
     set rev = rev + 1, updated_at = v_now
   where entity_type = p_type and entity_id = p_id
  returning rev into v_rev;

  return jsonb_build_object('rev', v_rev, 'published_at', v_now);
end
$$;

-- ── restore_revision ────────────────────────────────────────────────────────
-- Lands as a DRAFT, never straight to live. One extra click, and "undo" becomes
-- something she can rehearse without fear: she restores, looks at the preview,
-- and only then publishes.

create or replace function public.restore_revision(p_revision_id bigint)
  returns jsonb
  language plpgsql
  security invoker
  set search_path = ''
as $$
declare
  r     public.revisions%rowtype;
  v_rev integer;
begin
  select * into r from public.revisions where id = p_revision_id;
  if not found then
    raise exception 'revision_not_found' using errcode = 'CMS03';
  end if;

  insert into public.drafts (entity_type, entity_id, payload, rev, updated_by)
  values (r.entity_type, r.entity_id, r.snapshot, 1, auth.uid())
  on conflict (entity_type, entity_id) do update
    set payload    = excluded.payload,
        rev        = public.drafts.rev + 1,
        updated_at = now(),
        updated_by = auth.uid()
  returning rev into v_rev;

  if v_rev is null then
    raise exception 'restore_failed' using errcode = 'CMS02';
  end if;

  insert into public.revisions (entity_type, entity_id, action, snapshot, note, created_by)
  values (r.entity_type, r.entity_id, 'restore', r.snapshot,
          'שוחזר מגרסה ' || p_revision_id::text, auth.uid());

  return jsonb_build_object('rev', v_rev, 'entity_type', r.entity_type, 'entity_id', r.entity_id);
end
$$;

-- ── set_visibility ──────────────────────────────────────────────────────────
-- Tier one of the two-tier delete: "הסתרה מהאתר", fully reversible, content
-- preserved. Tier two (the 30-day soft delete) sets deleted_at.

create or replace function public.set_visibility(
  p_type    public.entity_kind,
  p_id      uuid,
  p_visible boolean
) returns void
  language plpgsql
  security invoker
  set search_path = ''
as $$
declare
  -- schema-qualified: under an empty search_path only pg_catalog is implicitly
  -- searched, so a bare `content_status` fails with 42704 when plpgsql compiles
  -- this block on first call.
  v_status public.content_status := case when p_visible then 'published' else 'hidden' end;
  v_snap   jsonb;
begin
  if p_type = 'page' then
    update public.pages set status = v_status, updated_by = auth.uid() where id = p_id;
  elsif p_type = 'recipe' then
    update public.recipes set status = v_status, updated_by = auth.uid() where id = p_id;
  elsif p_type = 'post' then
    update public.posts set status = v_status, updated_by = auth.uid() where id = p_id;
  elsif p_type = 'testimonial' then
    update public.testimonials set status = v_status, updated_by = auth.uid() where id = p_id;
  else
    raise exception 'unsupported_entity_type' using errcode = '22023';
  end if;

  if not found then
    raise exception 'visibility_change_failed'
      using errcode = 'CMS02',
            detail  = 'the entity does not exist, or this account is not allowed to change it';
  end if;

  select payload into v_snap
    from public.drafts where entity_type = p_type and entity_id = p_id;

  insert into public.revisions (entity_type, entity_id, action, snapshot, created_by)
  values (p_type, p_id,
          case when p_visible then 'unhide' else 'hide' end,
          coalesce(v_snap, '{}'::jsonb),
          auth.uid());
end
$$;

-- ── rename_slug ─────────────────────────────────────────────────────────────
-- The ONE door through the slug guard, and it is the door that also writes the
-- redirect. The bypass is a transaction-local GUC, which works here precisely
-- because a function body is a single transaction: PostgREST gives every REST
-- call its own transaction, so a plain .from('recipes').update({slug}) can
-- never set it and can never rename a published slug.

create or replace function public.rename_slug(
  p_type     public.entity_kind,
  p_id       uuid,
  p_new_slug text
) returns void
  language plpgsql
  security invoker
  set search_path = ''
as $$
declare
  v_old    text;
  v_prefix text;
begin
  if p_type = 'recipe' then
    v_prefix := '/recipes/';
    select slug into v_old from public.recipes where id = p_id for update;
  elsif p_type = 'post' then
    v_prefix := '/blog/';
    select slug into v_old from public.posts where id = p_id for update;
  elsif p_type = 'page' then
    -- Content pages too. guard_core_page already refuses a slug change on a
    -- core page, so this only opens the ones she created herself. Without it,
    -- renaming a page would 404 every link to the old address with nothing
    -- written to redirects and no error to notice.
    v_prefix := '/';
    select slug into v_old from public.pages where id = p_id for update;
  else
    raise exception 'unsupported_entity_type' using errcode = '22023';
  end if;

  if v_old is null then
    raise exception 'entity_not_found' using errcode = 'CMS03';
  end if;

  if v_old = p_new_slug then
    return;
  end if;

  perform set_config('cms.slug_rename', 'on', true);

  if p_type = 'recipe' then
    update public.recipes set slug = p_new_slug, updated_by = auth.uid() where id = p_id;
  elsif p_type = 'post' then
    update public.posts set slug = p_new_slug, updated_by = auth.uid() where id = p_id;
  else
    update public.pages set slug = p_new_slug, updated_by = auth.uid() where id = p_id;
  end if;

  if not found then
    raise exception 'rename_failed'
      using errcode = 'CMS02',
            detail  = 'the entity does not exist, or this account is not allowed to rename it';
  end if;

  -- The old URL is one someone has linked to. The rename and the redirect are
  -- the same transaction on purpose: there is no window in which the old
  -- address 404s.
  --
  -- Two housekeeping steps first, both of which exist to stop a redirect LOOP.
  -- Renaming A→B→A would otherwise leave /A → /B while /A is once again a live
  -- page, so the live page redirects to a 404. And a chain C→A followed by
  -- A→B leaves C pointing at an address that no longer resolves.
  delete from public.redirects where source = v_prefix || p_new_slug;
  update public.redirects
     set destination = v_prefix || p_new_slug
   where destination = v_prefix || v_old;

  insert into public.redirects (source, destination, permanent)
  values (v_prefix || v_old, v_prefix || p_new_slug, true)
  on conflict (source) do update
    set destination = excluded.destination, permanent = excluded.permanent;

  insert into public.revisions (entity_type, entity_id, action, snapshot, note, created_by)
  values (p_type, p_id, 'slug_rename',
          jsonb_build_object('from', v_old, 'to', p_new_slug),
          v_prefix || v_old || ' -> ' || v_prefix || p_new_slug,
          auth.uid());
end
$$;

-- ── save_media_meta ─────────────────────────────────────────────────────────
-- media_assets was the one write surface with no invariant-3 guard. There was
-- no RPC, so the library would have written it as
-- `.from('media_assets').update({ alt })`, and media_staff_update's USING
-- clause silently skips a row it rejects: PostgREST answers 200 with an empty
-- body and supabase-js reports no error.
--
-- That is not theoretical here. Five of Alona's OWN recipe photos are
-- origin='code' and locked, because about/page.tsx and coaching/page.tsx name
-- their paths directly. She sees her photo in her library, fixes a typo in its
-- alt text, is told נשמר, and nothing changed — with no reason to look again.
--
-- NOTE ON WHY THE DIRECT GRANT SURVIVES: these functions are SECURITY INVOKER,
-- which is the discipline the whole file rests on — RLS stays the single
-- authorization layer and no function is a privilege escalation. Revoking
-- UPDATE on media_assets from `authenticated` would therefore disable this RPC
-- along with the direct write. So the grant stays and this is the DOCUMENTED
-- door: the desk must call save_media_meta, never .from('media_assets').update.
-- A direct update is not unsafe, it is merely silent, which is the bug.

create or replace function public.save_media_meta(
  p_id  uuid,
  p_alt text
) returns timestamptz
  language plpgsql
  security invoker
  set search_path = ''
as $$
declare
  v_now timestamptz;
begin
  update public.media_assets
     set alt = p_alt
   where id = p_id
     and deleted_at is null
  returning created_at into v_now;

  if v_now is null then
    if exists (select 1 from public.media_assets where id = p_id and deleted_at is null) then
      raise exception 'media_forbidden'
        using errcode = 'CMS02',
              detail  = 'this asset is owned by the site design and cannot be edited from the desk',
              hint    = 'code-owned assets are admin only';
    end if;
    raise exception 'media_not_found' using errcode = 'CMS03';
  end if;

  return v_now;
end
$$;

-- ── save_setting ────────────────────────────────────────────────────────────
-- Settings have no draft stage (a phone number does not need staging), but
-- every write appends a revision. That single INSERT restores the undo story
-- the git layer used to provide for free, and it is what stands between a
-- cleared accessibility-coordinator field and an unrecoverable legal page.

-- Deterministic id per key, so revisions group per setting.
create or replace function public.uuid_for_setting(p_key text)
  returns uuid
  language sql
  immutable
  security invoker
  set search_path = ''
as $$
  select ('00000000-0000-5000-8000-' || substr(md5(p_key), 1, 12))::uuid
$$;

create or replace function public.save_setting(
  p_key                 text,
  p_value               jsonb,
  p_expected_updated_at timestamptz default null
) returns timestamptz
  language plpgsql
  security invoker
  set search_path = ''
as $$
declare
  v_old  jsonb;
  v_tier public.settings_tier;
  v_now  timestamptz;
begin
  select value, tier into v_old, v_tier
    from public.site_settings
   where key = p_key;

  if not found then
    raise exception 'setting_not_found' using errcode = 'CMS03';
  end if;

  -- A key that feeds a legal page must not be emptied by accident. Refusing a
  -- blank over a non-blank is cheaper than explaining to a regulator why the
  -- accessibility statement lost its named coordinator.
  if v_tier = 'owner'
     and v_old is not null and v_old <> 'null'::jsonb
     and (p_value is null or p_value = 'null'::jsonb or p_value = '""'::jsonb) then
    raise exception 'refusing_blank_over_legal_value' using errcode = '23514';
  end if;

  update public.site_settings
     set value = p_value, updated_by = auth.uid()
   where key = p_key
     and (p_expected_updated_at is null or updated_at = p_expected_updated_at)
  returning updated_at into v_now;

  -- Invariant 3, and this is the single most dangerous instance of it. The
  -- SELECT above succeeds for EVERY key, because settings_read is `using
  -- (true)`. The UPDATE, for an editor touching a tier='owner' row, fails
  -- USING and is skipped in silence. Without this block the desk shows
  -- "נשמר", the Ministry of Health license on the live site is unchanged, and
  -- the revision log gains an entry asserting a change that never happened.
  if v_now is null then
    if exists (
      select 1 from public.site_settings
       where key = p_key
         and (p_expected_updated_at is null or updated_at = p_expected_updated_at)
    ) then
      raise exception 'setting_forbidden'
        using errcode = 'CMS02',
              detail  = format('the key %s is not writable by this account', p_key),
              hint    = 'owner-tier settings are admin only';
    end if;

    raise exception 'stale_setting'
      using errcode = 'CMS01',
            detail  = 'someone else saved this setting first',
            hint    = 'reload the settings form and try again';
  end if;

  insert into public.revisions (entity_type, entity_id, action, snapshot, note, created_by)
  values ('setting',
          public.uuid_for_setting(p_key),
          'settings_save',
          jsonb_build_object('key', p_key, 'previous', v_old, 'next', p_value),
          p_key,
          auth.uid());

  return v_now;
end
$$;

-- ── function privileges ─────────────────────────────────────────────────────
-- EXECUTE is granted to PUBLIC by default, and PUBLIC includes anon. These are
-- SECURITY INVOKER so RLS still holds, but the anon key has no business being
-- able to call the write path at all.

revoke execute on function public.save_draft(public.entity_kind, uuid, jsonb, integer)      from public, anon;
revoke execute on function public.publish_entity(public.entity_kind, uuid, integer, text)   from public, anon;
revoke execute on function public.restore_revision(bigint)                                  from public, anon;
revoke execute on function public.set_visibility(public.entity_kind, uuid, boolean)         from public, anon;
revoke execute on function public.rename_slug(public.entity_kind, uuid, text)               from public, anon;
revoke execute on function public.save_setting(text, jsonb, timestamptz)                    from public, anon;
revoke execute on function public.save_media_meta(uuid, text)                                from public, anon;

grant execute on function public.save_draft(public.entity_kind, uuid, jsonb, integer)       to authenticated;
grant execute on function public.publish_entity(public.entity_kind, uuid, integer, text)    to authenticated;
grant execute on function public.restore_revision(bigint)                                   to authenticated;
grant execute on function public.set_visibility(public.entity_kind, uuid, boolean)          to authenticated;
grant execute on function public.rename_slug(public.entity_kind, uuid, text)                to authenticated;
grant execute on function public.save_setting(text, jsonb, timestamptz)                     to authenticated;
grant execute on function public.save_media_meta(uuid, text)                                 to authenticated;

-- ── compile check ───────────────────────────────────────────────────────────
-- plpgsql does not resolve a DECLARE block until first execution, so a type
-- name that is unqualified under an empty search_path stays hidden until the
-- feature is used in production. Call each function once against a
-- deliberately absent entity: an undefined_object error means a body failed to
-- compile and must fail the deploy; not-found and RLS denial are expected.

do $$
declare
  zero uuid := '00000000-0000-0000-0000-000000000000'::uuid;
begin
  begin
    perform public.set_visibility('page', zero, false);
  exception
    when undefined_object or undefined_table or undefined_function then
      raise exception 'set_visibility failed to compile: %', sqlerrm;
    when others then null;
  end;

  begin
    perform public.publish_entity('page', zero, 1);
  exception
    when undefined_object or undefined_table or undefined_function then
      raise exception 'publish_entity failed to compile: %', sqlerrm;
    when others then null;
  end;

  begin
    perform public.save_draft('page', zero, '{}'::jsonb, 1);
  exception
    when undefined_object or undefined_table or undefined_function then
      raise exception 'save_draft failed to compile: %', sqlerrm;
    when others then null;
  end;

  begin
    perform public.restore_revision(-1);
  exception
    when undefined_object or undefined_table or undefined_function then
      raise exception 'restore_revision failed to compile: %', sqlerrm;
    when others then null;
  end;

  begin
    perform public.rename_slug('recipe', zero, 'x');
  exception
    when undefined_object or undefined_table or undefined_function then
      raise exception 'rename_slug failed to compile: %', sqlerrm;
    when others then null;
  end;

  begin
    perform public.save_setting('__compile_check__', '"x"'::jsonb);
  exception
    when undefined_object or undefined_table or undefined_function then
      raise exception 'save_setting failed to compile: %', sqlerrm;
    when others then null;
  end;

  begin
    perform public.save_media_meta(zero, 'x');
  exception
    when undefined_object or undefined_table or undefined_function then
      raise exception 'save_media_meta failed to compile: %', sqlerrm;
    when others then null;
  end;
end
$$;

-- ═══════════════ seed — the five page documents ═══════════════

-- seed-pages.sql — generated by scripts/migrate/03-pages.mjs. Do not edit by hand.
-- 5 pages, 29 sections.
--
-- Transcribed from content/pages/*.json, which already carries the shape of a
-- pages.sections value. Idempotent: the id is derived from the slug.
--
-- baseline_order is written ONLY on insert. It records the order the site
-- shipped with, and the desk's «החזרת הסדר המקורי» button reads it — a later
-- seed that re-pointed it at the current order would make that button a no-op
-- exactly when it is needed.

begin;

insert into public.pages (id, slug, kind, title, description, sections, baseline_order, status, published_at)
values ('105b8030-6649-53c5-805a-b2a3fcb1f9c7', 'about', 'core'::public.page_kind, 'עליי', null,
        '[{"id":"hero","type":"about-hero","schema_version":1,"visible":true,"payload":{"crumbLabel":"עליי","kicker":"נעים להכיר","title":"אלונה אקרלינג","lede":"דיאטנית קלינית מוסמכת שמלווה נשים אל שקט סביב האוכל, בגובה העיניים, בלי דיאטות ובלי אשמה. הנה מי שעומדת מאחורי כל מילה כאן.","licenseChip":"דיאטנית קלינית מוסמכת · R.D. · רישיון משרד הבריאות 204526-11","ctaPrimary":"בואי נדבר","ctaPrimarySub":"שיחת היכרות בלי עלות","ctaMicro":"תראי בעצמך אם זה מתאים · בלי התחייבות","ctaSecondary":"קראי את הסיפור שלי ↓","portraitLabel":"אלונה אקרלינג, דיאטנית קלינית מוסמכת, פורטרט","portraitSignature":"אלונה","portraitRole":"דיאטנית קלינית מוסמכת · R.D."}},{"id":"story","type":"about-story","schema_version":1,"visible":true,"payload":{"kicker":"הסיפור שלי","title":"לפני שהייתי דיאטנית,\nהייתי בדיוק במקום שלך","p1":"הכל התחיל אצלי בתקופת הקורונה, כשגיליתי את הבישול הבריא והתחלתי לשתף באינסטגרם.","p2":"ואז טבעתי במיתוסים: בשלב מסוים כבר לא ידעתי מה נכון ומה לא נכון. בדיוק בגלל זה הלכתי ללמוד, כדי להבין מה באמת קורה בגוף שלנו.","credo1":"אני מאמינה שאוכל בריא לא צריך להיות משעמם. להפך: הוא יכול להיות עשיר, מגוון, טעים וצבעוני, ולא מסובך בכלל.","credo2":"אין מאכלים אסורים, אין אשמה. רק איזון חכם שמאפשר ליהנות מהכל.","credo2Accent":"ליהנות","signOff":"זמינה בשבילך לכל שאלה,","signature":"אלונה","image":"/media/client/recipes/moroccan-fish.jpg","imageAlt":"דגים מרוקאים של שישי, מנה אמיתית מהמטבח של אלונה"}},{"id":"age","type":"about-age","schema_version":1,"visible":true,"payload":{"kicker":"על הגיל, בלי להתחמק","quote":"כן, אני צעירה.\nוזה בדיוק מה שמאפשר לי\nלהחזיק את המדע הכי עדכני,\nולדבר איתך בגובה העיניים, לא מלמעלה.","quoteAccent":"בדיוק","support":"אני מגיעה עם אנרגיה, סקרנות ורצון ללמוד ולהתפתח.","signature":"אלונה"}},{"id":"credentials","type":"about-credentials","schema_version":1,"visible":true,"payload":{"kicker":"הרקע, בגילוי מלא","title":"הרקע אמיתי, ואפשר לבדוק אותו","titleAccent":"אמיתי","anchorTitle":"דיאטנית קלינית מוסמכת · R.D.","anchorLine":"רישיון משרד הבריאות 204526-11","anchorVerify":"בדקי אותי במאגר משרד הבריאות","anchorVerifyHref":"https://practitioners.health.gov.il","bscTitle":"B.Sc במדעי התזונה","bscLine":"המרכז האקדמי פרס, 2024","internTitle":"התמחות קלינית · בית החולים איכילוב","internLine":"חצי שנה, 2025","craftTitle":"דיאטנית שמבשלת","craftLine":"לא רק אומרת לך מה לאכול. יודעת בדיוק איך זה נראה במטבח האמיתי.","craftLink":"אל המתכונים ←","craftMicro":"בערך 30 מתכונים, מתעדכן מדי שבוע","craftImage":"/media/client/recipes/quinoa-citrus-salad.jpg","craftImageAlt":"סלט קינואה והדרים, מנה אמיתית מהמטבח של אלונה","bridge":"אז אם השאלה היא \"אינפלואנסרית או דיאטנית אמיתית?\", הנה הרקע, גלוי לבדיקה.","teamLink":"לעמוד ההסמכות המלא ←"}},{"id":"press","type":"about-press","schema_version":1,"visible":true,"payload":{"reserved":"שיתופי פעולה ומדיה יתווספו כאן עם האישור. אני לא מציגה לוגו שלא אושר."}},{"id":"cta","type":"about-cta","schema_version":1,"visible":true,"payload":{"kicker":"הצעד שלך","title":"עכשיו כשאת מכירה אותי,\nבשיחת היכרות בלי עלות, תראי בעצמך אם זה מתאים.","body":"עכשיו את כבר יודעת מאיפה אני מגיעה ומה הרקע שלי. מה שנשאר זה לשמוע אותך: שיחה קצרה, בלי עלות ובלי התחייבות, בגובה העיניים, ונראה אם הדרך שלי מתאימה לך. האוכל שאת אוהבת נשאר בפנים.","recipes":"ורוצה קודם פשוט לראות מה אני מבשלת? המתכונים כאן ←","trustToken":"דיאטנית קלינית מוסמכת · R.D. · רישיון משרד הבריאות 204526-11","button":"בואי נדבר, שיחת היכרות חינם","signature":"אלונה","promise":"אני חוזרת אלייך אישית, עד 4 ימי עסקים."}}]'::jsonb,
        '[{"id":"hero","type":"about-hero"},{"id":"story","type":"about-story"},{"id":"age","type":"about-age"},{"id":"credentials","type":"about-credentials"},{"id":"press","type":"about-press"},{"id":"cta","type":"about-cta"}]'::jsonb, 'published', now())
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  sections = excluded.sections;
insert into public.pages (id, slug, kind, title, description, sections, baseline_order, status, published_at)
values ('3ee8653c-e193-569e-83ce-1c7d03fb0ef9', 'coaching', 'core'::public.page_kind, 'איך עובדים איתי', null,
        '[{"id":"meta","type":"page-meta","schema_version":1,"visible":true,"payload":{"title":"איך עובדים איתי","serviceName":"ליווי תזונתי אישי","serviceType":"ליווי תזונתי אישי"}},{"id":"hero","type":"coaching-hero","schema_version":1,"visible":true,"payload":{"breadcrumb":"איך עובדים איתי","kicker":"ליווי אחת-על-אחת","title":"ככה נעבוד ביחד","body":"את כבר יודעת מה לאכול. הדרך צריכה להיבנות סביב השבוע שלך, בלי לוותר על האוכל שאת אוהבת, כדי שסוף-סוף יהיה שקט בראש והתוצאה תישאר.","trustToken":"דיאטנית קלינית מוסמכת · R.D. · רישיון משרד הבריאות 204526-11","ctaPrimary":"בואי נדבר","ctaSub":"שיחת היכרות חינם","ctaWhatsapp":"אפשר גם לכתוב לי בוואטסאפ","micro":"בלי התחייבות · מענה עד 4 ימי עסקים · על החבילות נדבר בשיחה"}},{"id":"problem","type":"coaching-problem","schema_version":1,"visible":true,"payload":{"kicker":"למה דווקא ליווי","title":"את כבר יודעת מה לאכול","titleAccent":"יודעת","lead":"מה שחסר זה לא עוד ידע.","body1":"שמרת את הפוסטים, קראת את התפריטים, התחלת ביום ראשון. ולבד, שוב, זה לא החזיק, וזה לא כי טעית או לא ניסית מספיק.","quote":"הפער הוא לא במה לאכול. הפער הוא לעשות את זה לבד.","quoteAccent":"לבד","body2":"הידע כבר אצלך; מה שאף מדריך לא נתן לך זה מישהי לצדך, בתוך השבוע האמיתי שלך.","cta":"אז ככה זה עובד כשלא לבד ←"}},{"id":"method","type":"coaching-method","schema_version":1,"visible":true,"payload":{"kicker":"שיטה, לא קסם","title":"ארבעה דברים שהופכים ידע לתוצאה שנשארת","titleAccent":"שנשארת","pillars":[{"title":"נבנה סביב השבוע האמיתי שלך","body":"לא תפריט גנרי שנלחם בחיים שלך, אלא דרך שנבנית סביב מה שבאמת קורה אצלך בשבוע: העבודה, הילדים, האירועים, והערב שבו אין כוח לבשל. בגלל זה זה מחזיק."},{"title":"בלי לוותר על האוכל שאת אוהבת","body":"אנחנו לא מוחקות מאכלים ולא עושות רשימות אסור. לומדות איך לשלב את מה שאת אוהבת בתוך משהו שעובד, בלי אשמה, כדי שיהיה שקט בראש."},{"title":"החלטות על סמך מדע עדכני","body":"כל החלטה נשענת על מה שידוע היום על הגוף, לא על הדיאטה הבאה שכולם מדברים עליה. זה ההבדל בין ניחוש לבין שיטה."},{"title":"ליווי צמוד גם בין הפגישות","body":"אני איתך בין הפגישות, לא רק בחדר: כדי שהידע יהפוך להרגל, ושלא תישארי לבד באמצע הדרך."}],"cta":"ככה זה נראה בפועל, הנה החבילות ←"}},{"id":"packages","type":"coaching-packages","schema_version":1,"visible":true,"payload":{"kicker":"שלוש דרכים להיכנס","title":"בחרי את הליווי שמתאים לך","titleAccent":"שמתאים לך","lead":"אותה שיטה, בשלוש רמות של ליווי. בלי מחיר קשיח: נבחר ביחד את מה שמתאים לחיים שלך, בשיחת היכרות בלי התחייבות.","facts":["60 עד 75 דקות","ליווי בסיס · 60 יום","ליווי מורחב · 120 יום","מענה עד 4 ימי עסקים"],"fitLabel":"למי זה מתאים:","includedLabel":"מה כלול:","cardCta":"בואי נדבר","sharedLine":"על החבילה והמחיר נדבר בשיחה. נתאים אותם אלייך, בלי התחייבות.","packages":[{"slug":"single-session","name":"פגישת עומק · חד-פעמית","chip":"60 עד 75 דקות","fit":"לרגע שבו את רוצה כיוון מקצועי אחד, נקי: פגישה עמוקה ותוכנית אישית שנשארת איתך.","included":["אבחון מעמיק בפגישה של 60 עד 75 דקות","תוכנית אישית שנבנית סביב השבוע שלך","קובץ מפורט עם כלים, טיפים והנחיות להתנהלות עצמאית"],"highlight":false},{"slug":"coaching-60","name":"ליווי בסיס · 60 יום","chip":"","fit":"כשאת רוצה לא רק לדעת מה נכון, אלא שמישהי תלווה אותך עד שזה נכנס לשגרה.","included":["פגישת אבחון מעמיקה + 4 מפגשי מעקב (אחת לשבועיים)","וואטסאפ ביני לבינך בין המפגשים","פידבק על יומן האכילה","צירוף לקבוצת הוואטסאפ + גישה לאפליקציה ותכנים מקצועיים"],"highlight":false},{"slug":"coaching-120","name":"ליווי מורחב · 120 יום","chip":"","fit":"מתאים כשהדפוס ותיק וניסית כבר הכל, וחשוב לך שהפעם זה יישאר.","included":["כל מה שבליווי הבסיס","ליווי לאורך כ-120 יום, לעומק ולאורך זמן","4 מפגשי מעקב + ליווי צמוד בוואטסאפ ובאפליקציה"],"highlight":true}]}},{"id":"process","type":"coaching-process","schema_version":1,"visible":true,"payload":{"kicker":"שלב אחרי שלב","title":"מה קורה בכל שלב","lead":"בחרת כיוון? הנה מה שקורה בפועל, בלי הפתעות: אותה דרך חמה, אחת-על-אחת, שנבנית סביב השבוע שלך.","steps":[{"t":"שיחת היכרות","d":"בחינם ובלי התחייבות. נכיר, תספרי לי מה עובר עלייך, ונבין ביחד אם אני האדם הנכון ללוות אותך. שיחה, לא שיחת מכירה."},{"t":"פגישה עמוקה + תוכנית אישית","d":"60 עד 75 דקות שיושבות לעומק: מה את אוהבת לאכול, איך נראה היום שלך, מה כבר ניסית, ובדיקות דם אם רלוונטי. את יוצאת עם תוכנית שנבנית סביב החיים שלך, לא במקומם."},{"t":"ליווי שנשאר","d":"כאן זה לא נגמר. בין המפגשים אני איתך בוואטסאפ, עם פידבק על יומן האכילה, ובחבילות גם אפליקציית ליווי, כדי שהדברים ייכנסו לשגרה ויישארו. לא עוד דיאטה שנגמרת ואת נשארת לבד איתה."}],"cta":"מרגישה שזה מדבר אלייך? בואי נדבר ←"}},{"id":"proof","type":"coaching-proof","schema_version":1,"visible":true,"payload":{"kicker":"תראי בעצמך","title":"מהמטבח של אלונה","titleAccent":"אלונה","lead":"אוכל שאני באמת מבשלת, בתוך שבוע רגיל, בלי למחוק את מה שאת אוהבת.","photo":"/media/client/recipes/green-shakshuka.jpg","photoAlt":"שקשוקה ירוקה - שקשוקת תרד חלומית","tiles":[{"src":"/media/client/recipes/one-pot-bulgur-stew.jpg","alt":"תבשיל בורגול בסיר אחד"},{"src":"/media/client/recipes/roasted-tomato-soup.jpg","alt":"מרק עגבניות צלויות"}],"testimonialEmpty":"המלצות אמיתיות יופיעו כאן ברגע שיהיו. אני לא ממציאה סיפור שלא קרה.","cta":"הצצה למטבח שלי ←"}},{"id":"faq","type":"coaching-faq","schema_version":1,"visible":true,"payload":{"kicker":"לפני שנדבר","title":"כל מה שאת שואלת את עצמך עכשיו","lead":"ריכזתי כאן את השאלות שחוזרות אליי הכי הרבה, בכנות, בלי מכירה. אם נשאר לך עוד משהו, בדיוק בשביל זה יש שיחת היכרות בלי התחייבות.","items":[{"q":"אני כבר יודעת מה לאכול. אז מה ליווי בכלל ייתן לי?","a":"רוב הנשים שמגיעות אליי יודעות בדיוק מה נכון. הפער אף פעם לא היה בידע, הוא בלעשות את זה לבד, בתוך שבוע עמוס. הליווי הוא לא עוד מידע: הוא דרך שנבנית סביב השבוע האמיתי שלך, ומישהי אחת שנשארת איתך עד שזה נכנס לשגרה."},{"q":"ניסיתי כבר הכל. למה שדווקא זה יעבוד?","a":"כי זה לא עוד דיאטה ולא עוד תפריט. אין אצלי קיצורי דרך, טרנדים והבטחות קסם: בונות דרך סביב החיים שלך, בלי לוותר על האוכל שאת אוהבת, בקצב שאפשר להתמיד בו."},{"q":"אני לא רוצה עוד תפריט נוקשה שאי אפשר לעמוד בו.","a":"ואני לא עובדת ככה. אין תפריט אחיד ואין רשימת איסורים: יש התאמה לשבוע שלך, לטעמים שלך ולקצב שלך, וגמישות כשהחיים משתנים."},{"q":"יש לי כל הזמן רעש ואשמה בראש סביב אוכל. זה יכול להשתנות?","a":"זה בדיוק הלב של העבודה שלי. המטרה היא שקט: פחות התלבטות, פחות אשמה, יותר ראש נקי. בלי שיפוט ובלי \"נפלת\"."},{"q":"אני אוכלת הרבה מתוך לחץ או רגש. את מתייחסת גם לזה?","a":"כן, זה חלק מרכזי בליווי. מסתכלות יחד על הדפוסים בעדינות, בלי שיפוט, ובונות במקומם הרגלים שקטים יותר ומערכת יחסים טובה יותר עם אוכל."},{"q":"איך אני יודעת שהפעם זה יישאר ולא יחזור כמו תמיד?","a":"כי אנחנו לא רודפות אחרי תוצאה מהירה שנעלמת. בונות הרגלים באמת, בקצב שנכון לך, כך שאפשר להתמיד לאורך זמן. הליווי המורחב קיים בדיוק בשביל זה."},{"q":"מה קורה אחרי שהליווי נגמר? אני חוזרת לאותו מקום?","a":"המטרה שלי הפוכה מתלות: שתצאי עם דרך שהיא כבר שלך. תוכנית שנשארת בידיים שלך, הרגלים שהפכו טבעיים, וכלים שיישארו גם הרבה אחרי שהליווי יסתיים."},{"q":"אני מרגישה שאני מתמודדת עם זה לבד. איך הליווי עוזר בזה?","a":"בזה שאני באמת שם. יש פגישות אחת-על-אחת, ובחבילות הליווי גם וואטסאפ ביני לבינך בין המפגשים, עם פידבק על יומן האכילה. המטרה היא שלא תישארי לבד מול האתגרים של היום יום."},{"q":"את בת 26. יש לך מספיק ניסיון, או שאת עוד אינפלואנסרית?","a":"שאלה הוגנת. אני דיאטנית קלינית מוסמכת, רישיון משרד הבריאות 204526-11 (אפשר לבדוק במאגר משרד הבריאות), עם B.Sc במדעי התזונה והתמחות קלינית בבית החולים איכילוב. ואני דווקא חושבת שהגיל הוא יתרון: אני מגיעה עם אנרגיה, סקרנות ורצון ללמוד ולהתפתח. את כל הסיפור תמצאי בעמוד \"עליי\"."},{"q":"אין לי זמן וכוח לעוד פרויקט גדול. איך זה משתלב בחיים?","a":"זה בכוונה לא פרויקט ענק. בונים את התהליך סביב החיים האמיתיים: גם אם את עובדת שעות ארוכות, אוכלת בחוץ או כמעט לא מבשלת, נמצא יחד מה שעובד אצלך. ויש גם פגישת עומק חד-פעמית, למי שרוצה כיוון בלי התחייבות ארוכה."},{"q":"אינסטגרם מלא בתוכן חינם. למה בכלל לשלם על ליווי?","a":"תוכן חינם הוא נהדר, אבל הוא כללי ומיועד לכולם, ולכן קל לדעת ולא לעשות. ליווי נותן ארבעה דברים שפוסט לא ייתן: התאמה אישית, מבנה, מישהי שבאמת חוזרת אלייך, וקהילה של בנות באותה דרך. המידע חינם; מה שמחזיק לאורך זמן זה הליווי."}],"closeLine":"נשאר לך \"כן, אבל\" שלא מופיע כאן? בשיחת היכרות בלי עלות ובלי התחייבות נענה עליו יחד.","closeCta":"בואי נדבר ←","magnet":"עדיין לא בטוחה? הצצה למטבח שלי."}},{"id":"cta","type":"coaching-cta","schema_version":1,"visible":true,"payload":{"title":"הגעת עד לפה.\nנשאר רק להכיר. בואי נדבר.","body":"שיחת היכרות קצרה, בלי התחייבות. נכיר, ונבין יחד אם אני האדם הנכון ללוות אותך, בלי לוותר על האוכל שאת אוהבת, כדי שסוף-סוף יהיה שקט בראש.","packagesLine":"הליווי נמכר בחבילות שמתאימות לחיים שלך. על זה נדבר בשיחה, בלי הפתעות ובלי מחיר שקופץ מהמסך.","promise":"אני חוזרת אלייך אישית, עד 4 ימי עסקים.","trustToken":"דיאטנית קלינית מוסמכת · R.D. · רישיון משרד הבריאות 204526-11","aboutPointer":"רוצה קודם להכיר אותי? הסיפור שלי בעמוד עליי ←","formHeading":"בואי נדבר, שיחת היכרות חינם"}}]'::jsonb,
        '[{"id":"meta","type":"page-meta"},{"id":"hero","type":"coaching-hero"},{"id":"problem","type":"coaching-problem"},{"id":"method","type":"coaching-method"},{"id":"packages","type":"coaching-packages"},{"id":"process","type":"coaching-process"},{"id":"proof","type":"coaching-proof"},{"id":"faq","type":"coaching-faq"},{"id":"cta","type":"coaching-cta"}]'::jsonb, 'published', now())
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  sections = excluded.sections;
insert into public.pages (id, slug, kind, title, description, sections, baseline_order, status, published_at)
values ('e99e9eca-8d71-517e-8456-1c385339da0a', 'contact', 'core'::public.page_kind, 'צור קשר', null,
        '[{"id":"door","type":"contact-door","schema_version":1,"visible":true,"payload":{"crumb":"צור קשר","kicker":"הדלת פתוחה","title":"בואי נדבר.","body":"אם הגעת עד לפה, כנראה משהו כבר מדבר אלייך. אין צורך להחליט על כלום עכשיו: נתחיל בשיחת היכרות קצרה, בלי התחייבות ובלי לחץ. אספר לך איך אני עובדת, את תספרי לי מה קורה אצלך, ומשם נחליט ביחד.","bodyAccent":"בלי התחייבות","cta":"בואי נדבר","ctaSub":"שיחת היכרות חינם","promise":"אני חוזרת אלייך אישית, עד 4 ימי עסקים.","place":"ברעננה, ואונליין מכל מקום בארץ.","trustToken":"דיאטנית קלינית מוסמכת · R.D. · רישיון משרד הבריאות"}},{"id":"lead","type":"contact-lead","schema_version":1,"visible":true,"payload":{"title":"הצעד הראשון הוא רק שיחה.","titleAccent":"רק שיחה.","body":"כמו שאמרתי למעלה: שיחה אחת קצרה, בלי התחייבות ובלי לחץ. משם נחליט ביחד, בלי למחוק שום דבר שאת אוהבת לאכול.","packages":"הליווי נמכר בחבילות שמתאימות לחיים שלך. איזו חבילה מתאימה לך וכמה היא עולה, אלה דברים שאני אומרת לך בשיחה עצמה, בפשטות.","nameLabel":"שם","phoneLabel":"טלפון / וואטסאפ","messageLabel":"מה הכי מעסיק אותך עכשיו? (לא חובה)","emailLabel":"אימייל","consentLabel":"אני מאשרת שאלונה תחזור אליי בטלפון / וואטסאפ / מייל","submitLabel":"בואי נדבר, שיחת היכרות חינם","submittingLabel":"שולח…","whatsappLabel":"מעדיפה לכתוב? דברי איתי ישירות בוואטסאפ","thanks":"קיבלתי את הפנייה שלך. אני חוזרת אלייך אישית, עד 4 ימי עסקים, בערוץ שבחרת. עד אז, את מוזמנת להציץ במתכונים ולנשום קצת.","thanksLink":"להציץ במתכונים","promise":"אני חוזרת אלייך אישית, עד 4 ימי עסקים.","place":"קליניקה ברעננה · ליווי אונליין בכל הארץ","trustToken":"דיאטנית קלינית מוסמכת · R.D. · רישיון משרד הבריאות"}},{"id":"where","type":"contact-where","schema_version":1,"visible":true,"payload":{"kicker":"איפה נפגשות","title":"איפה שנוח לך:\nאונליין בכל הארץ, או בקליניקה ברעננה","body":"רוב הליווי מתקיים אונליין, מכל מקום בארץ, בלי לצאת מהבית ובלי לאבד זמן על נסיעות. ואם נוח לך פנים-אל-פנים, יש קליניקה ברעננה. נמצא יחד את הדרך שמתאימה לחיים שלך.","items":[{"title":"ליווי אונליין בכל הארץ","body":"מהסלון שלך, מתי שמתאים. הכול מרחוק."},{"title":"קליניקה ברעננה","body":"מעדיפה פנים-אל-פנים? יש גם מקום לשבת בו."},{"title":"וואטסאפ בין הפגישות","body":"לא נעלמת. ערוץ אמיתי לשאלות קטנות בדרך, בחבילות הליווי."}],"chip":"אני חוזרת אלייך אישית, עד 4 ימי עסקים."}}]'::jsonb,
        '[{"id":"door","type":"contact-door"},{"id":"lead","type":"contact-lead"},{"id":"where","type":"contact-where"}]'::jsonb, 'published', now())
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  sections = excluded.sections;
insert into public.pages (id, slug, kind, title, description, sections, baseline_order, status, published_at)
values ('70ea7ea5-1bde-5d4a-84e8-a6714860615c', '', 'core'::public.page_kind, 'אלונה אקרלינג', null,
        '[{"id":"hero","type":"home-hero","schema_version":1,"visible":true,"payload":{"kicker":"תזונת נשים · ליווי אישי","title":"את כבר יודעת מה לאכול.\nמה שחסר זה לא עוד תפריט.","titleAccent":"לא עוד תפריט","lede":"אלא דרך שנבנית סביב השבוע האמיתי שלך, בלי לוותר על האוכל שאת אוהבת. כדי שסוף-סוף יהיה שקט בראש, והתוצאה תישאר.","ctaPrimary":"בואי נדבר","ctaSub":"שיחת היכרות חינם","trustToken":"דיאטנית קלינית מוסמכת · R.D.","trustTokenLicense":" · רישיון משרד הבריאות","ctaRecipes":"עוד לא מוכנה לשיחה? המתכונים שלי כאן","poster":"/media/generated/01-hero-film-poster.jpg","filmWebm":"/media/generated/01-hero-film.webm","filmMp4":"/media/generated/01-hero-film.mp4"}},{"id":"film","type":"home-film","schema_version":1,"visible":true,"payload":{"kicker":"מוכר לך? · צלחת אחת, ערב אחד","staticKicker":"מוכר לך?","staticHeading":"ניסית כבר הכל, והאוכל עדיין מרגיש כמו מלחמה.","staticBody":"את יודעת בדיוק מה נכון לאכול, אבל לבד זה לא מחזיק. כל ביס מגיע עם חשבון בראש, וביס אחד \"לא נכון\" הופך מהר ל\"היום כבר נהרס\". ארוחה אמיתית, בלי חשבון ובלי אשמה, אפשרית, ואת לא צריכה להגיע לזה לבד.","finalAlt":"צלחת מאוזנת ומלאה, ערוכה ומוכנה","chips":["אוקיי, סלט. בטוח.","רגע, קינואה זה פחמימה?","בטטה בערב?!","כמה קלוריות זה כבר?","טחינה זה שמן... אבל אני אוהבת."],"captions":[{"big":"ארוחת ערב. כמה קשה זה כבר יכול להיות?"},{"big":"שומעת את הרעש הזה?","small":"זה לא רעב. זו כל דיאטה שנשארה לך בראש."},{"big":"ארוחה אמיתית. בלי חשבון, בלי אשמה."},{"big":"ואת לא צריכה להגיע לזה לבד.","small":"בדיוק בשביל זה יש ליווי."}]}},{"id":"guide","type":"home-guide","schema_version":1,"visible":true,"payload":{"kicker":"נעים להכיר","title":"אני מכירה את הבלבול הזה","empathy":"גם אני עמדתי מול הבלגן הזה. בשלב מסוים כבר לא ידעתי מה נכון ומה לא נכון. בדיוק בגלל זה הלכתי ללמוד, כדי להבין מה באמת קורה בגוף שלנו.","name":"אלונה אקרלינג","role":"דיאטנית קלינית מוסמכת · R.D.","cta":"בואי לראות איך עובדים יחד ←","titleAccent":"מכירה","credentials":["דיאטנית קלינית מוסמכת · R.D.","רישיון משרד הבריאות 204526-11","B.Sc במדעי התזונה","התמחות קלינית · איכילוב"],"mechanism":["דיאטנית שמבשלת","נבנה סביב השבוע שלך","מדע עדכני","ליווי אחת-על-אחת"]}},{"id":"plan","type":"home-plan","schema_version":1,"visible":true,"payload":{"kicker":"איך זה עובד","title":"שלושה צעדים, בשפה שלך","lead":"תפריטים כבר יש לך. הדרך צריכה להיבנות סביב השבוע שלך.","cta":"רוצה לראות איך זה נראה בפועל? הצצה למטבח שלי ←","titleAccent":"בשפה שלך","steps":[{"n":"01","t":"שיחת היכרות","d":"שיחה קצרה, בחינם ובלי שום התחייבות. את מספרת לי מה עובר עלייך עכשיו, מה כבר ניסית, ומה הכי מעייף אותך סביב האוכל, ואני בעיקר מקשיבה. בסוף השיחה נבין ביחד אם אני האדם הנכון ללוות אותך, ואם התשובה היא לא, אגיד לך את זה בכנות. זו שיחה, לא שיחת מכירה, ואת לא צריכה להגיע אליה מוכנה."},{"n":"02","t":"פגישה עמוקה + תוכנית אישית","d":"פגישה של 60 עד 75 דקות שיושבת לעומק: מה את אוהבת לאכול, איך נראה היום שלך באמת, מה כבר ניסית ומה נשבר בדרך, ובדיקות דם אם רלוונטי. אין כאן שיפוט ואין רשימת איסורים, יש הקשבה למה שבאמת קורה אצלך בשבוע. מהפגישה את יוצאת עם תוכנית אישית שנבנית סביב החיים שלך ולא במקומם, והאוכל שאת אוהבת נשאר בפנים. התוכנית נשארת אצלך, ולא נעלמת ברגע שיצאת מהחדר."},{"n":"03","t":"ליווי שנשאר","d":"אני לא נעלמת אחרי הפגישה, וזה בדיוק החלק שרוב הדיאטות מפספסות. בחבילות הליווי אני איתך בוואטסאפ בין המפגשים, לשאלות הקטנות שצצות באמצע היום ולרגעים שבהם מתחשק לוותר, ויש גם פידבק על יומן האכילה ומפגשי מעקב לאורך הדרך. ככה הדברים מפסיקים להיות רעיון יפה ונכנסים לשגרה, גם בשבועות העמוסים. המטרה שלי היא שלא תישארי לבד מול האתגרים של היום יום, ושבסוף הדרך יישאר לך משהו שהוא כבר שלך. לא עוד דיאטה שנגמרת."}]}},{"id":"proof","type":"home-proof","schema_version":1,"visible":true,"payload":{"kicker":"תראי בעצמך","title":"היא באמת מבשלת","body":"לא עוד תמונה יפה. אוכל אמיתי שאני מבשלת, מתוך שבוע רגיל ועמוס.","countChip":"בערך 30 מתכונים · מתכון חדש כל שבוע","darkTestimonial":"המלצות אמיתיות יופיעו כאן ברגע שיהיו. אני לא ממציאה סיפור שלא קרה.","darkLogos":"שיתופי פעולה ומדיה יתווספו עם האישור.","cta":"לכל המתכונים ←","titleAccent":"באמת"}},{"id":"stakes","type":"home-stakes","schema_version":1,"visible":true,"payload":{"kicker":"נמאס מהסבב הזה?","title":"עוד שנה רועשת, או דרך שסוף-סוף שקטה","cue":"הדרך שאני ממליצה עליה","band":"במקום עוד שנה כזאת, בואי נדבר. שיחת היכרות בלי עלות ובלי התחייבות.","bandCta":"בואי נדבר ←","bandSecondary":"או קחי בינתיים הצצה למתכונים","titleAccent":"שקטה","quiet":{"label":"הדרך השקטה","note":"פעם אחת, בליווי, והאוכל שאת אוהבת נשאר על השולחן","points":["דרך שנבנית סביב השבוע האמיתי שלך","שקט. לאכול בלי לספור ובלי להתנצל","משהו שנשאר איתך, כי זו לא עוד דיאטה","אחת-על-אחת, גם בין הפגישות"]},"noisy":{"label":"עוד שנה רועשת","note":"עוד דיאטה שמתחילה ביום ראשון ונשברת ברביעי","points":["תפריט חדש שאת כבר יודעת שלא יחזיק","רעש בראש סביב כל ארוחה, ואשמה אחריה","\"הפעם זה יחזיק\", שכבר אמרת לעצמך","לבד מול עוד ניסיון"]}}},{"id":"success","type":"home-success","schema_version":1,"visible":true,"payload":{"kicker":"ככה זה יכול להרגיש","lines":"בפעם הראשונה, אני לא בדיאטה.\nאכלתי בחוץ, נהניתי, ובלי אשמה.\nיש לי אנרגיה, ובראש שקט.","bridge":"וזה מתחיל בשיחה אחת, בלי לחץ. ←"}},{"id":"cta","type":"home-cta","schema_version":1,"visible":true,"payload":{"title":"בואי נדבר.\nהצעד הראשון קטן, וחינם.","body":"שיחת היכרות קצרה, בלי התחייבות. נכיר, ונבין יחד אם אני האדם הנכון ללוות אותך אל השקט הזה.","packages":"הליווי נמכר בחבילות שמתאימות לחיים שלך. על זה בדיוק נדבר בשיחה, בלי הפתעות ובלי מחיר שקופץ מהמסך.","promise":"אני חוזרת אלייך אישית, עד 4 ימי עסקים.","trustToken":"דיאטנית קלינית מוסמכת · R.D.","trustTokenLicense":" · רישיון משרד הבריאות"}}]'::jsonb,
        '[{"id":"hero","type":"home-hero"},{"id":"film","type":"home-film"},{"id":"guide","type":"home-guide"},{"id":"plan","type":"home-plan"},{"id":"proof","type":"home-proof"},{"id":"stakes","type":"home-stakes"},{"id":"success","type":"home-success"},{"id":"cta","type":"home-cta"}]'::jsonb, 'published', now())
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  sections = excluded.sections;
insert into public.pages (id, slug, kind, title, description, sections, baseline_order, status, published_at)
values ('94fcc1ec-cf68-53b9-8c27-96725e169abd', 'testimonials', 'core'::public.page_kind, 'המלצות', null,
        '[{"id":"hero","type":"testimonials-hero","schema_version":1,"visible":true,"payload":{"kicker":"רק אמיתי","title":"המלצות אמיתיות, כשיהיו","body":"כאן יופיעו סיפורים של נשים שליוויתי, במילים שלהן ובאישור שלהן. עוד אין לי כאלה להראות לך, ואני מעדיפה להשאיר את המקום הזה ריק מאשר להמציא סיפור שלא קרה.","bridge":"עד אז, מה שכן אפשר לראות באמת: המתכונים שאני מבשלת, הרישיון והלימודים שלי, ושיחת היכרות שבה תתרשמי בעצמך.","invite":"ואם בא לך, את מוזמנת להיות אחת הראשונות שמספרות.","cta":"בואי נדבר ←"}},{"id":"grid","type":"testimonials-grid","schema_version":1,"visible":true,"payload":{"title":"המלצות אמיתיות בלבד","emptyLead":"עוד לא פרסמתי המלצות. אעדכן כאן ברגע שיהיו.","emptyBody":"אני לא ממציאה סיפור שלא קרה. כשיגיעו המלצות אמיתיות, של נשים אמיתיות, הן יופיעו כאן, במילים שלהן ובאישורן.","redirectIntro":"בינתיים, הנה מה שאפשר לבדוק כבר עכשיו:","redirects":["המתכונים שאני באמת מבשלת ←","הרישיון והלימודים שלי ←"],"reciprocity":"עבדנו יחד? אשמח אם תשתפי, רק באישורך המלא ←"}},{"id":"cta","type":"testimonials-cta","schema_version":1,"visible":true,"payload":{"title":"לא תמצאי כאן סיפור שלא קרה.\nבואי נכתוב אחד אמיתי, יחד.","body":"המלצות אמיתיות יופיעו כאן עם שם ואישור פרסום, ולא רגע לפני. הכנות הזאת היא בדיוק מה שתקבלי גם בליווי עצמו. בינתיים, הדבר האמיתי ביותר שאני יכולה להציע לך הוא שיחת היכרות קצרה, בלי עלות ובלי התחייבות.","packages":"הליווי נמכר בחבילות שמתאימות לחיים שלך. על החבילה והמחיר נדבר בשיחה עצמה, בגובה העיניים.","promise":"אני חוזרת אלייך אישית, עד 4 ימי עסקים.","trustToken":"דיאטנית קלינית מוסמכת · R.D. · רישיון משרד הבריאות 204526-11","ctaPrimary":"בואי נדבר, שיחת היכרות חינם","ctaRecipes":"משהו לבדוק בעצמך עכשיו: המתכונים כאן ←"}}]'::jsonb,
        '[{"id":"hero","type":"testimonials-hero"},{"id":"grid","type":"testimonials-grid"},{"id":"cta","type":"testimonials-cta"}]'::jsonb, 'published', now())
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  sections = excluded.sections;

commit;

-- ═══════════════ ledger — mark 0002/0003 as applied ═══════════════
insert into supabase_migrations.schema_migrations (version, name, statements)
values
  ('20260729000002', 'rls', array['applied via dashboard SQL editor']),
  ('20260729000003', 'publish', array['applied via dashboard SQL editor'])
on conflict (version) do nothing;
