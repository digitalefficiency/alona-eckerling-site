-- ═══════════════════════════════════════════════════════════════════════════
-- apply-all.sql — כל מה שהמסד עוד צריך, בהדבקה אחת. (2026-08-11, גרסה 3)
--
-- איך מריצים, שלב אחרי שלב:
--   1. לוודא שאתם בפרויקט הנכון: jfutsumxzaakoohfnkxe (Frankfurt).
--   2. SQL Editor → New query → להדביק את *כל* הקובץ (330KB — ההדבקה לוקחת רגע).
--   3. ללחוץ Run בלי לסמן שום טקסט (אם טקסט מסומן, רק הוא רץ!).
--   4. אם קופץ חלון אישור "destructive operation" — לאשר. זה על ה־REVOKE
--      המכוונים שבקובץ; בלעדיהם אין הרצה בכלל.
--   5. הצלחה נראית כך: טבלת תוצאה אחת עם השורה status = 'apply-all הצליח'
--      וספירות: pages=5, page_drafts=5, recipes=34, media=56, functions=3.
--      storage_policies=0 זה בסדר גמור (מוסבר בפנים; יטופל בשלב ההעלאות).
--      אם רואים שגיאה אדומה — שום דבר לא נשמר; לשלוח לרום את הטקסט שלה.
--
-- הקובץ רץ כטרנזקציה אחת: או שהכל נקלט, או שכלום.
--   * רץ פעם שנייה אחרי הצלחה? ייכשל מיד על "policy already exists" —
--     זה סימן שהכל כבר חל, לא תקלה.
--   * אחרי שהאתר חי ואלונה עורכת — לא להריץ שוב אף חלק מהקובץ: זרעי התוכן
--     דורסים עריכות אמיתיות בטקסט של יום המיגרציה.
--
-- נבדק בשלמותו על PostgreSQL 16 מקומי, כולל חיקוי של פרויקט מוקשח־storage
-- (התפקיד המריץ אינו בעלים של storage.objects) — עבר נקי על שני התרחישים.
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════ 20260729000002_rls.sql ═══════════════
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

-- ═══════════════ 20260729000003_publish.sql ═══════════════
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

-- The helpers first: they are the write path's internals. They leak nothing on
-- their own (security invoker; anon holds no privilege on the tables they
-- read), but a PostgREST rpc endpoint that exists for no caller is standing
-- surface — the same doctrine as the unused-privilege revokes in 0002.
-- Revoking PUBLIC also strips authenticated's implicit access, and the write
-- RPCs invoke these helpers AS the calling role (security invoker), so
-- authenticated must be granted back explicitly or every publish would 42501.
revoke execute on function public.visible_sections(jsonb)       from public, anon;
revoke execute on function public.resolve_section_media(jsonb)  from public, anon;
revoke execute on function public.jsonb_text_array(jsonb)       from public, anon;
revoke execute on function public.jsonb_positive_int(jsonb)     from public, anon;
revoke execute on function public.jsonb_int(jsonb)              from public, anon;
revoke execute on function public.jsonb_iso_date(jsonb)         from public, anon;
revoke execute on function public.uuid_for_setting(text)        from public, anon;
grant execute on function public.visible_sections(jsonb)        to authenticated;
grant execute on function public.resolve_section_media(jsonb)   to authenticated;
grant execute on function public.jsonb_text_array(jsonb)        to authenticated;
grant execute on function public.jsonb_positive_int(jsonb)      to authenticated;
grant execute on function public.jsonb_int(jsonb)               to authenticated;
grant execute on function public.jsonb_iso_date(jsonb)          to authenticated;
grant execute on function public.uuid_for_setting(text)         to authenticated;

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

-- ═══════════════ seed-media.sql ═══════════════
-- seed-media.sql — generated by scripts/migrate/02-media.mjs. Do not edit by hand.
-- 56 assets (26 code-owned, 30 hers).
-- 8 orphan file(s) on disk are deliberately NOT seeded; see MEDIA-REPORT.md.
--
-- Nothing is uploaded. Every row points at the /media/ URL that serves the
-- file today, so the site keeps rendering exactly as it does now. Phase 5
-- moves the content images into Storage and rewrites public_path.
--
-- The ref_kind='code' rows are the point of this file. They are what stops
-- the media library from offering a Delete button on the 14 frames of the
-- homepage film, whose only references are string literals in page.tsx.


insert into public.media_assets
  (id, bucket, path, public_path, origin, locked, alt, width, height, bytes, mime, original_name, source)
values ('04454fc2-83c5-53ea-8613-66ae5e9d6d80', 'media', 'recipes/baked-tofu-schnitzel.jpg', '/media/client/recipes/baked-tofu-schnitzel.jpg', 'cms'::public.media_origin, false, 'שניצל טופו אפוי', 750, 1000, 168252, 'image/jpeg', 'baked-tofu-schnitzel.jpg', 'migrated')
on conflict (id) do update set
  path = excluded.path, public_path = excluded.public_path,
  origin = excluded.origin, locked = excluded.locked, source = excluded.source,
  alt = case when public.media_assets.alt = '' then excluded.alt else public.media_assets.alt end,
  width = excluded.width, height = excluded.height,
  bytes = excluded.bytes, mime = excluded.mime, original_name = excluded.original_name;
insert into public.media_assets
  (id, bucket, path, public_path, origin, locked, alt, width, height, bytes, mime, original_name, source)
values ('545618e1-21ef-5ff6-8f30-8f07738d562b', 'media', 'recipes/baked-tuna-patties.jpg', '/media/client/recipes/baked-tuna-patties.jpg', 'cms'::public.media_origin, false, 'קציצות טונה אפויות', 1536, 1707, 153876, 'image/jpeg', 'baked-tuna-patties.jpg', 'migrated')
on conflict (id) do update set
  path = excluded.path, public_path = excluded.public_path,
  origin = excluded.origin, locked = excluded.locked, source = excluded.source,
  alt = case when public.media_assets.alt = '' then excluded.alt else public.media_assets.alt end,
  width = excluded.width, height = excluded.height,
  bytes = excluded.bytes, mime = excluded.mime, original_name = excluded.original_name;
insert into public.media_assets
  (id, bucket, path, public_path, origin, locked, alt, width, height, bytes, mime, original_name, source)
values ('c0d6cff5-dd5c-507d-823e-348c0d93873c', 'media', 'recipes/bean-noodle-fish-salad.jpg', '/media/client/recipes/bean-noodle-fish-salad.jpg', 'cms'::public.media_origin, false, 'סלט אטריות שעועית עם דג', 750, 1000, 234182, 'image/jpeg', 'bean-noodle-fish-salad.jpg', 'migrated')
on conflict (id) do update set
  path = excluded.path, public_path = excluded.public_path,
  origin = excluded.origin, locked = excluded.locked, source = excluded.source,
  alt = case when public.media_assets.alt = '' then excluded.alt else public.media_assets.alt end,
  width = excluded.width, height = excluded.height,
  bytes = excluded.bytes, mime = excluded.mime, original_name = excluded.original_name;
insert into public.media_assets
  (id, bucket, path, public_path, origin, locked, alt, width, height, bytes, mime, original_name, source)
values ('a35cf10c-3379-5e6b-8312-87695468b17f', 'media', 'recipes/broccoli-onion-quiche.jpg', '/media/client/recipes/broccoli-onion-quiche.jpg', 'cms'::public.media_origin, false, 'קיש גבינות, בצל וברוקולי', 792, 1000, 149998, 'image/jpeg', 'broccoli-onion-quiche.jpg', 'migrated')
on conflict (id) do update set
  path = excluded.path, public_path = excluded.public_path,
  origin = excluded.origin, locked = excluded.locked, source = excluded.source,
  alt = case when public.media_assets.alt = '' then excluded.alt else public.media_assets.alt end,
  width = excluded.width, height = excluded.height,
  bytes = excluded.bytes, mime = excluded.mime, original_name = excluded.original_name;
insert into public.media_assets
  (id, bucket, path, public_path, origin, locked, alt, width, height, bytes, mime, original_name, source)
values ('5e153091-b444-5125-8ca3-c8928029e4e8', 'media', 'recipes/bulgur-broccoli-salad.jpg', '/media/client/recipes/bulgur-broccoli-salad.jpg', 'cms'::public.media_origin, false, 'סלט בורגול ברוקולי ומלא דברים טובים', 562, 1000, 159567, 'image/jpeg', 'bulgur-broccoli-salad.jpg', 'migrated')
on conflict (id) do update set
  path = excluded.path, public_path = excluded.public_path,
  origin = excluded.origin, locked = excluded.locked, source = excluded.source,
  alt = case when public.media_assets.alt = '' then excluded.alt else public.media_assets.alt end,
  width = excluded.width, height = excluded.height,
  bytes = excluded.bytes, mime = excluded.mime, original_name = excluded.original_name;
insert into public.media_assets
  (id, bucket, path, public_path, origin, locked, alt, width, height, bytes, mime, original_name, source)
values ('123da434-ad96-5b38-834b-a3676bbec714', 'media', 'recipes/cauliflower-fried-rice.jpg', '/media/client/recipes/cauliflower-fried-rice.jpg', 'cms'::public.media_origin, false, '"אורז מטוגן" מוקפץ אסיאתי מכרובית', 1536, 1702, 290139, 'image/jpeg', 'cauliflower-fried-rice.jpg', 'migrated')
on conflict (id) do update set
  path = excluded.path, public_path = excluded.public_path,
  origin = excluded.origin, locked = excluded.locked, source = excluded.source,
  alt = case when public.media_assets.alt = '' then excluded.alt else public.media_assets.alt end,
  width = excluded.width, height = excluded.height,
  bytes = excluded.bytes, mime = excluded.mime, original_name = excluded.original_name;
insert into public.media_assets
  (id, bucket, path, public_path, origin, locked, alt, width, height, bytes, mime, original_name, source)
values ('a48ee3b8-f1fc-566f-8d2a-9fc877a43673', 'media', 'recipes/cauliflower-tabbouleh.jpg', '/media/client/recipes/cauliflower-tabbouleh.jpg', 'cms'::public.media_origin, false, 'סלט טאבולה כרובית הכי טעים שתאכלו', 750, 1000, 227156, 'image/jpeg', 'cauliflower-tabbouleh.jpg', 'migrated')
on conflict (id) do update set
  path = excluded.path, public_path = excluded.public_path,
  origin = excluded.origin, locked = excluded.locked, source = excluded.source,
  alt = case when public.media_assets.alt = '' then excluded.alt else public.media_assets.alt end,
  width = excluded.width, height = excluded.height,
  bytes = excluded.bytes, mime = excluded.mime, original_name = excluded.original_name;
insert into public.media_assets
  (id, bucket, path, public_path, origin, locked, alt, width, height, bytes, mime, original_name, source)
values ('29044999-a456-56e0-8565-894086a89955', 'media', 'recipes/date-energy-bars.jpg', '/media/client/recipes/date-energy-bars.jpg', 'cms'::public.media_origin, false, 'חטיפי אנרגיה ביתיים עם תמרים', 1000, 857, 183918, 'image/jpeg', 'date-energy-bars.jpg', 'migrated')
on conflict (id) do update set
  path = excluded.path, public_path = excluded.public_path,
  origin = excluded.origin, locked = excluded.locked, source = excluded.source,
  alt = case when public.media_assets.alt = '' then excluded.alt else public.media_assets.alt end,
  width = excluded.width, height = excluded.height,
  bytes = excluded.bytes, mime = excluded.mime, original_name = excluded.original_name;
insert into public.media_assets
  (id, bucket, path, public_path, origin, locked, alt, width, height, bytes, mime, original_name, source)
values ('ca9d70f4-550e-5ad9-86df-a77177af6056', 'media', 'recipes/fish-patties-sweet-sauce.jpg', '/media/client/recipes/fish-patties-sweet-sauce.jpg', 'cms'::public.media_origin, false, 'קציצות דג אמנון ברוטב מתקתק', 1536, 2048, 432560, 'image/jpeg', 'fish-patties-sweet-sauce.jpg', 'migrated')
on conflict (id) do update set
  path = excluded.path, public_path = excluded.public_path,
  origin = excluded.origin, locked = excluded.locked, source = excluded.source,
  alt = case when public.media_assets.alt = '' then excluded.alt else public.media_assets.alt end,
  width = excluded.width, height = excluded.height,
  bytes = excluded.bytes, mime = excluded.mime, original_name = excluded.original_name;
insert into public.media_assets
  (id, bucket, path, public_path, origin, locked, alt, width, height, bytes, mime, original_name, source)
values ('82b6ffac-32f6-5649-85e6-08062115e155', 'media', 'recipes/flourless-brownies.jpg', '/media/client/recipes/flourless-brownies.jpg', 'cms'::public.media_origin, false, 'בראוניז ללא קמח מ4 מרכיבים', 562, 1000, 106396, 'image/jpeg', 'flourless-brownies.jpg', 'migrated')
on conflict (id) do update set
  path = excluded.path, public_path = excluded.public_path,
  origin = excluded.origin, locked = excluded.locked, source = excluded.source,
  alt = case when public.media_assets.alt = '' then excluded.alt else public.media_assets.alt end,
  width = excluded.width, height = excluded.height,
  bytes = excluded.bytes, mime = excluded.mime, original_name = excluded.original_name;
insert into public.media_assets
  (id, bucket, path, public_path, origin, locked, alt, width, height, bytes, mime, original_name, source)
values ('0ee67b73-be88-5acf-8d39-0afc657c60d5', 'media', 'recipes/green-curry-stir-fry.jpg', '/media/client/recipes/green-curry-stir-fry.jpg', 'cms'::public.media_origin, false, 'מוקפץ קארי ירוק טבעוני, ללא גלוטן', 856, 1000, 215675, 'image/jpeg', 'green-curry-stir-fry.jpg', 'migrated')
on conflict (id) do update set
  path = excluded.path, public_path = excluded.public_path,
  origin = excluded.origin, locked = excluded.locked, source = excluded.source,
  alt = case when public.media_assets.alt = '' then excluded.alt else public.media_assets.alt end,
  width = excluded.width, height = excluded.height,
  bytes = excluded.bytes, mime = excluded.mime, original_name = excluded.original_name;
insert into public.media_assets
  (id, bucket, path, public_path, origin, locked, alt, width, height, bytes, mime, original_name, source)
values ('ad3e582d-c1fa-5f84-8207-0bb0cd068cc8', 'media', 'recipes/green-shakshuka.jpg', '/media/client/recipes/green-shakshuka.jpg', 'cms'::public.media_origin, false, 'שקשוקה ירוקה - שקשוקת תרד חלומית', 1536, 2048, 494803, 'image/jpeg', 'green-shakshuka.jpg', 'migrated')
on conflict (id) do update set
  path = excluded.path, public_path = excluded.public_path,
  origin = excluded.origin, locked = excluded.locked, source = excluded.source,
  alt = case when public.media_assets.alt = '' then excluded.alt else public.media_assets.alt end,
  width = excluded.width, height = excluded.height,
  bytes = excluded.bytes, mime = excluded.mime, original_name = excluded.original_name;
insert into public.media_assets
  (id, bucket, path, public_path, origin, locked, alt, width, height, bytes, mime, original_name, source)
values ('d58d5228-fcfc-5687-8e25-9f305e822583', 'media', 'recipes/homemade-granola.jpg', '/media/client/recipes/homemade-granola.jpg', 'cms'::public.media_origin, false, 'גרנולה ביתית ב10 דקות הכנה', 1330, 1922, 179959, 'image/jpeg', 'homemade-granola.jpg', 'migrated')
on conflict (id) do update set
  path = excluded.path, public_path = excluded.public_path,
  origin = excluded.origin, locked = excluded.locked, source = excluded.source,
  alt = case when public.media_assets.alt = '' then excluded.alt else public.media_assets.alt end,
  width = excluded.width, height = excluded.height,
  bytes = excluded.bytes, mime = excluded.mime, original_name = excluded.original_name;
insert into public.media_assets
  (id, bucket, path, public_path, origin, locked, alt, width, height, bytes, mime, original_name, source)
values ('83cea13c-5d78-5b5c-8b63-581ceb7e5000', 'media', 'recipes/homemade-hummus.jpg', '/media/client/recipes/homemade-hummus.jpg', 'cms'::public.media_origin, false, 'חומוס ביתי', 1477, 1724, 284631, 'image/jpeg', 'homemade-hummus.jpg', 'migrated')
on conflict (id) do update set
  path = excluded.path, public_path = excluded.public_path,
  origin = excluded.origin, locked = excluded.locked, source = excluded.source,
  alt = case when public.media_assets.alt = '' then excluded.alt else public.media_assets.alt end,
  width = excluded.width, height = excluded.height,
  bytes = excluded.bytes, mime = excluded.mime, original_name = excluded.original_name;
insert into public.media_assets
  (id, bucket, path, public_path, origin, locked, alt, width, height, bytes, mime, original_name, source)
values ('0ff3c5d7-022f-5828-8112-ed1075f07753', 'media', 'recipes/moroccan-fish.jpg', '/media/client/recipes/moroccan-fish.jpg', 'cms'::public.media_origin, false, 'דגים מרוקאים של שישי', 1330, 2110, 177206, 'image/jpeg', 'moroccan-fish.jpg', 'migrated')
on conflict (id) do update set
  path = excluded.path, public_path = excluded.public_path,
  origin = excluded.origin, locked = excluded.locked, source = excluded.source,
  alt = case when public.media_assets.alt = '' then excluded.alt else public.media_assets.alt end,
  width = excluded.width, height = excluded.height,
  bytes = excluded.bytes, mime = excluded.mime, original_name = excluded.original_name;
insert into public.media_assets
  (id, bucket, path, public_path, origin, locked, alt, width, height, bytes, mime, original_name, source)
values ('80dcf5f9-95fe-573e-8272-a6dbf310435f', 'media', 'recipes/oatmeal-chocolate-chip-cookies.jpg', '/media/client/recipes/oatmeal-chocolate-chip-cookies.jpg', 'cms'::public.media_origin, false, 'עוגיות שוקולד צ''יפס שיבולת שועל', 1536, 2048, 398583, 'image/jpeg', 'oatmeal-chocolate-chip-cookies.jpg', 'migrated')
on conflict (id) do update set
  path = excluded.path, public_path = excluded.public_path,
  origin = excluded.origin, locked = excluded.locked, source = excluded.source,
  alt = case when public.media_assets.alt = '' then excluded.alt else public.media_assets.alt end,
  width = excluded.width, height = excluded.height,
  bytes = excluded.bytes, mime = excluded.mime, original_name = excluded.original_name;
insert into public.media_assets
  (id, bucket, path, public_path, origin, locked, alt, width, height, bytes, mime, original_name, source)
values ('cb73a810-0018-5ec0-86ff-8319193b6618', 'media', 'recipes/one-pot-bulgur-stew.jpg', '/media/client/recipes/one-pot-bulgur-stew.jpg', 'cms'::public.media_origin, false, 'תבשיל בורגול בסיר אחד', 750, 1000, 193183, 'image/jpeg', 'one-pot-bulgur-stew.jpg', 'migrated')
on conflict (id) do update set
  path = excluded.path, public_path = excluded.public_path,
  origin = excluded.origin, locked = excluded.locked, source = excluded.source,
  alt = case when public.media_assets.alt = '' then excluded.alt else public.media_assets.alt end,
  width = excluded.width, height = excluded.height,
  bytes = excluded.bytes, mime = excluded.mime, original_name = excluded.original_name;
insert into public.media_assets
  (id, bucket, path, public_path, origin, locked, alt, width, height, bytes, mime, original_name, source)
values ('e7d6ff09-5351-521e-81a0-24bfedfa3b57', 'media', 'recipes/protein-cheesecake.jpg', '/media/client/recipes/protein-cheesecake.jpg', 'cms'::public.media_origin, false, 'עוגת גבינה אפויה דלת קלוריות ועשירה בחלבון', 885, 1000, 213139, 'image/jpeg', 'protein-cheesecake.jpg', 'migrated')
on conflict (id) do update set
  path = excluded.path, public_path = excluded.public_path,
  origin = excluded.origin, locked = excluded.locked, source = excluded.source,
  alt = case when public.media_assets.alt = '' then excluded.alt else public.media_assets.alt end,
  width = excluded.width, height = excluded.height,
  bytes = excluded.bytes, mime = excluded.mime, original_name = excluded.original_name;
insert into public.media_assets
  (id, bucket, path, public_path, origin, locked, alt, width, height, bytes, mime, original_name, source)
values ('23bd15f6-9d8e-5cf8-8cd6-8f4d07d53329', 'media', 'recipes/quinoa-citrus-salad.jpg', '/media/client/recipes/quinoa-citrus-salad.jpg', 'cms'::public.media_origin, false, 'סלט קינואה ברוטב ויניגרט הדרים דבש', 562, 1000, 152909, 'image/jpeg', 'quinoa-citrus-salad.jpg', 'migrated')
on conflict (id) do update set
  path = excluded.path, public_path = excluded.public_path,
  origin = excluded.origin, locked = excluded.locked, source = excluded.source,
  alt = case when public.media_assets.alt = '' then excluded.alt else public.media_assets.alt end,
  width = excluded.width, height = excluded.height,
  bytes = excluded.bytes, mime = excluded.mime, original_name = excluded.original_name;
insert into public.media_assets
  (id, bucket, path, public_path, origin, locked, alt, width, height, bytes, mime, original_name, source)
values ('e0ec0649-5888-5bb2-8a32-4dbdef5ba560', 'media', 'recipes/quinoa-in-red-sauce.jpg', '/media/client/recipes/quinoa-in-red-sauce.jpg', 'cms'::public.media_origin, false, 'קינואה ברוטב אדום', 750, 1000, 239702, 'image/jpeg', 'quinoa-in-red-sauce.jpg', 'migrated')
on conflict (id) do update set
  path = excluded.path, public_path = excluded.public_path,
  origin = excluded.origin, locked = excluded.locked, source = excluded.source,
  alt = case when public.media_assets.alt = '' then excluded.alt else public.media_assets.alt end,
  width = excluded.width, height = excluded.height,
  bytes = excluded.bytes, mime = excluded.mime, original_name = excluded.original_name;
insert into public.media_assets
  (id, bucket, path, public_path, origin, locked, alt, width, height, bytes, mime, original_name, source)
values ('b861b4c0-5866-540f-8ecf-8a8e428bd85f', 'media', 'recipes/roasted-tomato-soup.jpg', '/media/client/recipes/roasted-tomato-soup.jpg', 'cms'::public.media_origin, false, 'מרק עגבניות צלויות', 1324, 1953, 199322, 'image/jpeg', 'roasted-tomato-soup.jpg', 'migrated')
on conflict (id) do update set
  path = excluded.path, public_path = excluded.public_path,
  origin = excluded.origin, locked = excluded.locked, source = excluded.source,
  alt = case when public.media_assets.alt = '' then excluded.alt else public.media_assets.alt end,
  width = excluded.width, height = excluded.height,
  bytes = excluded.bytes, mime = excluded.mime, original_name = excluded.original_name;
insert into public.media_assets
  (id, bucket, path, public_path, origin, locked, alt, width, height, bytes, mime, original_name, source)
values ('22e283c7-c034-5198-87bb-f461225e697f', 'media', 'recipes/soba-noodle-salad.jpg', '/media/client/recipes/soba-noodle-salad.jpg', 'cms'::public.media_origin, false, 'סלט אטריות סובה', 1406, 1839, 198688, 'image/jpeg', 'soba-noodle-salad.jpg', 'migrated')
on conflict (id) do update set
  path = excluded.path, public_path = excluded.public_path,
  origin = excluded.origin, locked = excluded.locked, source = excluded.source,
  alt = case when public.media_assets.alt = '' then excluded.alt else public.media_assets.alt end,
  width = excluded.width, height = excluded.height,
  bytes = excluded.bytes, mime = excluded.mime, original_name = excluded.original_name;
insert into public.media_assets
  (id, bucket, path, public_path, origin, locked, alt, width, height, bytes, mime, original_name, source)
values ('0f97f7a4-5f2e-5b96-837e-1d7fdd17afda', 'media', 'recipes/spelt-banana-cake.jpg', '/media/client/recipes/spelt-banana-cake.jpg', 'cms'::public.media_origin, false, 'עוגת בננות מקמח כוסמין', 1536, 2048, 250608, 'image/jpeg', 'spelt-banana-cake.jpg', 'migrated')
on conflict (id) do update set
  path = excluded.path, public_path = excluded.public_path,
  origin = excluded.origin, locked = excluded.locked, source = excluded.source,
  alt = case when public.media_assets.alt = '' then excluded.alt else public.media_assets.alt end,
  width = excluded.width, height = excluded.height,
  bytes = excluded.bytes, mime = excluded.mime, original_name = excluded.original_name;
insert into public.media_assets
  (id, bucket, path, public_path, origin, locked, alt, width, height, bytes, mime, original_name, source)
values ('a0a4672e-ef6c-5975-843e-235b1039284d', 'media', 'recipes/spinach-cheese-bourekas.jpg', '/media/client/recipes/spinach-cheese-bourekas.jpg', 'cms'::public.media_origin, false, 'בורקס גבינה ותרד מבצק יוגורט', 1525, 1857, 371774, 'image/jpeg', 'spinach-cheese-bourekas.jpg', 'migrated')
on conflict (id) do update set
  path = excluded.path, public_path = excluded.public_path,
  origin = excluded.origin, locked = excluded.locked, source = excluded.source,
  alt = case when public.media_assets.alt = '' then excluded.alt else public.media_assets.alt end,
  width = excluded.width, height = excluded.height,
  bytes = excluded.bytes, mime = excluded.mime, original_name = excluded.original_name;
insert into public.media_assets
  (id, bucket, path, public_path, origin, locked, alt, width, height, bytes, mime, original_name, source)
values ('93b6e7cb-e51a-5313-8b38-85dd1ffbcfa6', 'media', 'recipes/spinach-cheese-pie.jpg', '/media/client/recipes/spinach-cheese-pie.jpg', 'cms'::public.media_origin, false, 'פשטידת תרד וגבינות רזות', 926, 1000, 204589, 'image/jpeg', 'spinach-cheese-pie.jpg', 'migrated')
on conflict (id) do update set
  path = excluded.path, public_path = excluded.public_path,
  origin = excluded.origin, locked = excluded.locked, source = excluded.source,
  alt = case when public.media_assets.alt = '' then excluded.alt else public.media_assets.alt end,
  width = excluded.width, height = excluded.height,
  bytes = excluded.bytes, mime = excluded.mime, original_name = excluded.original_name;
insert into public.media_assets
  (id, bucket, path, public_path, origin, locked, alt, width, height, bytes, mime, original_name, source)
values ('021cc574-181c-5188-828d-b6d26d2cf956', 'media', 'recipes/sweet-and-sour-tofu.jpg', '/media/client/recipes/sweet-and-sour-tofu.jpg', 'cms'::public.media_origin, false, 'טופו חמוץ מתוק', 644, 1000, 144837, 'image/jpeg', 'sweet-and-sour-tofu.jpg', 'migrated')
on conflict (id) do update set
  path = excluded.path, public_path = excluded.public_path,
  origin = excluded.origin, locked = excluded.locked, source = excluded.source,
  alt = case when public.media_assets.alt = '' then excluded.alt else public.media_assets.alt end,
  width = excluded.width, height = excluded.height,
  bytes = excluded.bytes, mime = excluded.mime, original_name = excluded.original_name;
insert into public.media_assets
  (id, bucket, path, public_path, origin, locked, alt, width, height, bytes, mime, original_name, source)
values ('793cc894-88de-5ead-8ac6-37915d2440ca', 'media', 'recipes/three-ingredient-date-balls.jpg', '/media/client/recipes/three-ingredient-date-balls.jpg', 'cms'::public.media_origin, false, 'כדורי תמרים מ3 מרכיבים', 750, 1000, 132943, 'image/jpeg', 'three-ingredient-date-balls.jpg', 'migrated')
on conflict (id) do update set
  path = excluded.path, public_path = excluded.public_path,
  origin = excluded.origin, locked = excluded.locked, source = excluded.source,
  alt = case when public.media_assets.alt = '' then excluded.alt else public.media_assets.alt end,
  width = excluded.width, height = excluded.height,
  bytes = excluded.bytes, mime = excluded.mime, original_name = excluded.original_name;
insert into public.media_assets
  (id, bucket, path, public_path, origin, locked, alt, width, height, bytes, mime, original_name, source)
values ('bdcd4084-32ab-5b02-80bb-f686ef4770a4', 'media', 'recipes/tofu-shawarma.jpg', '/media/client/recipes/tofu-shawarma.jpg', 'cms'::public.media_origin, false, 'שווארמה טופו', 784, 1000, 159881, 'image/jpeg', 'tofu-shawarma.jpg', 'migrated')
on conflict (id) do update set
  path = excluded.path, public_path = excluded.public_path,
  origin = excluded.origin, locked = excluded.locked, source = excluded.source,
  alt = case when public.media_assets.alt = '' then excluded.alt else public.media_assets.alt end,
  width = excluded.width, height = excluded.height,
  bytes = excluded.bytes, mime = excluded.mime, original_name = excluded.original_name;
insert into public.media_assets
  (id, bucket, path, public_path, origin, locked, alt, width, height, bytes, mime, original_name, source)
values ('56bafe81-9063-5968-83da-28e2b1fe888b', 'media', 'recipes/tuna-shawarma.jpg', '/media/client/recipes/tuna-shawarma.jpg', 'cms'::public.media_origin, false, 'שווארמה טונה', 292, 390, 46299, 'image/jpeg', 'tuna-shawarma.jpg', 'migrated')
on conflict (id) do update set
  path = excluded.path, public_path = excluded.public_path,
  origin = excluded.origin, locked = excluded.locked, source = excluded.source,
  alt = case when public.media_assets.alt = '' then excluded.alt else public.media_assets.alt end,
  width = excluded.width, height = excluded.height,
  bytes = excluded.bytes, mime = excluded.mime, original_name = excluded.original_name;
insert into public.media_assets
  (id, bucket, path, public_path, origin, locked, alt, width, height, bytes, mime, original_name, source)
values ('f4f3dac2-0e7b-5fdd-86d6-79fc58c66999', 'media', 'recipes/zucchini-feta-salad.jpg', '/media/client/recipes/zucchini-feta-salad.jpg', 'cms'::public.media_origin, false, 'סלט זוקיני חי עם פטה ושקדים', 1330, 1914, 227037, 'image/jpeg', 'zucchini-feta-salad.jpg', 'migrated')
on conflict (id) do update set
  path = excluded.path, public_path = excluded.public_path,
  origin = excluded.origin, locked = excluded.locked, source = excluded.source,
  alt = case when public.media_assets.alt = '' then excluded.alt else public.media_assets.alt end,
  width = excluded.width, height = excluded.height,
  bytes = excluded.bytes, mime = excluded.mime, original_name = excluded.original_name;
insert into public.media_assets
  (id, bucket, path, public_path, origin, locked, alt, width, height, bytes, mime, original_name, source)
values ('37846488-798c-5d77-8279-da707bd3e848', 'media', 'system/01-hero-film-poster.jpg', '/media/generated/01-hero-film-poster.jpg', 'code'::public.media_origin, true, '', 2000, 1116, 205320, 'image/jpeg', '01-hero-film-poster.jpg', 'migrated')
on conflict (id) do update set
  path = excluded.path, public_path = excluded.public_path,
  origin = excluded.origin, locked = excluded.locked, source = excluded.source,
  alt = case when public.media_assets.alt = '' then excluded.alt else public.media_assets.alt end,
  width = excluded.width, height = excluded.height,
  bytes = excluded.bytes, mime = excluded.mime, original_name = excluded.original_name;
insert into public.media_assets
  (id, bucket, path, public_path, origin, locked, alt, width, height, bytes, mime, original_name, source)
values ('09ba62ff-0c9a-51a6-8eaa-e62731f7cfd3', 'media', 'system/01-hero-film.mp4', '/media/generated/01-hero-film.mp4', 'code'::public.media_origin, true, '', null, null, 491673, 'video/mp4', '01-hero-film.mp4', 'migrated')
on conflict (id) do update set
  path = excluded.path, public_path = excluded.public_path,
  origin = excluded.origin, locked = excluded.locked, source = excluded.source,
  alt = case when public.media_assets.alt = '' then excluded.alt else public.media_assets.alt end,
  width = excluded.width, height = excluded.height,
  bytes = excluded.bytes, mime = excluded.mime, original_name = excluded.original_name;
insert into public.media_assets
  (id, bucket, path, public_path, origin, locked, alt, width, height, bytes, mime, original_name, source)
values ('479048f3-ded8-53d1-80ac-cd495ad0a406', 'media', 'system/01-hero-film.webm', '/media/generated/01-hero-film.webm', 'code'::public.media_origin, true, '', null, null, 406107, 'video/webm', '01-hero-film.webm', 'migrated')
on conflict (id) do update set
  path = excluded.path, public_path = excluded.public_path,
  origin = excluded.origin, locked = excluded.locked, source = excluded.source,
  alt = case when public.media_assets.alt = '' then excluded.alt else public.media_assets.alt end,
  width = excluded.width, height = excluded.height,
  bytes = excluded.bytes, mime = excluded.mime, original_name = excluded.original_name;
insert into public.media_assets
  (id, bucket, path, public_path, origin, locked, alt, width, height, bytes, mime, original_name, source)
values ('e9ae162a-b866-5c37-85a4-a1b752bfe41a', 'media', 'system/02-problem-s01.jpg', '/media/generated/02-problem-s01.jpg', 'code'::public.media_origin, true, '', 1400, 781, 178272, 'image/jpeg', '02-problem-s01.jpg', 'migrated')
on conflict (id) do update set
  path = excluded.path, public_path = excluded.public_path,
  origin = excluded.origin, locked = excluded.locked, source = excluded.source,
  alt = case when public.media_assets.alt = '' then excluded.alt else public.media_assets.alt end,
  width = excluded.width, height = excluded.height,
  bytes = excluded.bytes, mime = excluded.mime, original_name = excluded.original_name;
insert into public.media_assets
  (id, bucket, path, public_path, origin, locked, alt, width, height, bytes, mime, original_name, source)
values ('8a366bb3-b9b6-5cab-8354-844624d9d958', 'media', 'system/02-problem-s02.jpg', '/media/generated/02-problem-s02.jpg', 'code'::public.media_origin, true, '', 1400, 781, 194836, 'image/jpeg', '02-problem-s02.jpg', 'migrated')
on conflict (id) do update set
  path = excluded.path, public_path = excluded.public_path,
  origin = excluded.origin, locked = excluded.locked, source = excluded.source,
  alt = case when public.media_assets.alt = '' then excluded.alt else public.media_assets.alt end,
  width = excluded.width, height = excluded.height,
  bytes = excluded.bytes, mime = excluded.mime, original_name = excluded.original_name;
insert into public.media_assets
  (id, bucket, path, public_path, origin, locked, alt, width, height, bytes, mime, original_name, source)
values ('e2776280-a528-5363-890f-7fa8527c757f', 'media', 'system/02-problem-s03.jpg', '/media/generated/02-problem-s03.jpg', 'code'::public.media_origin, true, '', 1400, 781, 65381, 'image/jpeg', '02-problem-s03.jpg', 'migrated')
on conflict (id) do update set
  path = excluded.path, public_path = excluded.public_path,
  origin = excluded.origin, locked = excluded.locked, source = excluded.source,
  alt = case when public.media_assets.alt = '' then excluded.alt else public.media_assets.alt end,
  width = excluded.width, height = excluded.height,
  bytes = excluded.bytes, mime = excluded.mime, original_name = excluded.original_name;
insert into public.media_assets
  (id, bucket, path, public_path, origin, locked, alt, width, height, bytes, mime, original_name, source)
values ('8c35a3b8-d72c-54a1-8212-860f2b2f7dad', 'media', 'system/02-problem-s04.jpg', '/media/generated/02-problem-s04.jpg', 'code'::public.media_origin, true, '', 1400, 781, 69034, 'image/jpeg', '02-problem-s04.jpg', 'migrated')
on conflict (id) do update set
  path = excluded.path, public_path = excluded.public_path,
  origin = excluded.origin, locked = excluded.locked, source = excluded.source,
  alt = case when public.media_assets.alt = '' then excluded.alt else public.media_assets.alt end,
  width = excluded.width, height = excluded.height,
  bytes = excluded.bytes, mime = excluded.mime, original_name = excluded.original_name;
insert into public.media_assets
  (id, bucket, path, public_path, origin, locked, alt, width, height, bytes, mime, original_name, source)
values ('e02ea435-6598-599f-8fe2-578470b447f5', 'media', 'system/02-problem-s05.jpg', '/media/generated/02-problem-s05.jpg', 'code'::public.media_origin, true, '', 1400, 781, 68031, 'image/jpeg', '02-problem-s05.jpg', 'migrated')
on conflict (id) do update set
  path = excluded.path, public_path = excluded.public_path,
  origin = excluded.origin, locked = excluded.locked, source = excluded.source,
  alt = case when public.media_assets.alt = '' then excluded.alt else public.media_assets.alt end,
  width = excluded.width, height = excluded.height,
  bytes = excluded.bytes, mime = excluded.mime, original_name = excluded.original_name;
insert into public.media_assets
  (id, bucket, path, public_path, origin, locked, alt, width, height, bytes, mime, original_name, source)
values ('6a7103ab-c8ab-50bf-8dca-ecc6e99808cc', 'media', 'system/02-problem-s06.jpg', '/media/generated/02-problem-s06.jpg', 'code'::public.media_origin, true, '', 1400, 781, 70213, 'image/jpeg', '02-problem-s06.jpg', 'migrated')
on conflict (id) do update set
  path = excluded.path, public_path = excluded.public_path,
  origin = excluded.origin, locked = excluded.locked, source = excluded.source,
  alt = case when public.media_assets.alt = '' then excluded.alt else public.media_assets.alt end,
  width = excluded.width, height = excluded.height,
  bytes = excluded.bytes, mime = excluded.mime, original_name = excluded.original_name;
insert into public.media_assets
  (id, bucket, path, public_path, origin, locked, alt, width, height, bytes, mime, original_name, source)
values ('1a8d2ca3-b9fe-5a35-8709-b890e84ed162', 'media', 'system/02-problem-s07.jpg', '/media/generated/02-problem-s07.jpg', 'code'::public.media_origin, true, '', 1400, 781, 69778, 'image/jpeg', '02-problem-s07.jpg', 'migrated')
on conflict (id) do update set
  path = excluded.path, public_path = excluded.public_path,
  origin = excluded.origin, locked = excluded.locked, source = excluded.source,
  alt = case when public.media_assets.alt = '' then excluded.alt else public.media_assets.alt end,
  width = excluded.width, height = excluded.height,
  bytes = excluded.bytes, mime = excluded.mime, original_name = excluded.original_name;
insert into public.media_assets
  (id, bucket, path, public_path, origin, locked, alt, width, height, bytes, mime, original_name, source)
values ('3463d3c7-d9d7-57d0-8578-a8adfd1f6857', 'media', 'system/02-problem-s08.jpg', '/media/generated/02-problem-s08.jpg', 'code'::public.media_origin, true, '', 1400, 781, 71381, 'image/jpeg', '02-problem-s08.jpg', 'migrated')
on conflict (id) do update set
  path = excluded.path, public_path = excluded.public_path,
  origin = excluded.origin, locked = excluded.locked, source = excluded.source,
  alt = case when public.media_assets.alt = '' then excluded.alt else public.media_assets.alt end,
  width = excluded.width, height = excluded.height,
  bytes = excluded.bytes, mime = excluded.mime, original_name = excluded.original_name;
insert into public.media_assets
  (id, bucket, path, public_path, origin, locked, alt, width, height, bytes, mime, original_name, source)
values ('131acc5b-2b42-517f-89ec-7e2475d669f8', 'media', 'system/02-problem-s09.jpg', '/media/generated/02-problem-s09.jpg', 'code'::public.media_origin, true, '', 1400, 781, 72324, 'image/jpeg', '02-problem-s09.jpg', 'migrated')
on conflict (id) do update set
  path = excluded.path, public_path = excluded.public_path,
  origin = excluded.origin, locked = excluded.locked, source = excluded.source,
  alt = case when public.media_assets.alt = '' then excluded.alt else public.media_assets.alt end,
  width = excluded.width, height = excluded.height,
  bytes = excluded.bytes, mime = excluded.mime, original_name = excluded.original_name;
insert into public.media_assets
  (id, bucket, path, public_path, origin, locked, alt, width, height, bytes, mime, original_name, source)
values ('913c88bb-8afa-5ac5-872c-37c9852ac942', 'media', 'system/02-problem-s10.jpg', '/media/generated/02-problem-s10.jpg', 'code'::public.media_origin, true, '', 1400, 781, 71424, 'image/jpeg', '02-problem-s10.jpg', 'migrated')
on conflict (id) do update set
  path = excluded.path, public_path = excluded.public_path,
  origin = excluded.origin, locked = excluded.locked, source = excluded.source,
  alt = case when public.media_assets.alt = '' then excluded.alt else public.media_assets.alt end,
  width = excluded.width, height = excluded.height,
  bytes = excluded.bytes, mime = excluded.mime, original_name = excluded.original_name;
insert into public.media_assets
  (id, bucket, path, public_path, origin, locked, alt, width, height, bytes, mime, original_name, source)
values ('476eb1fd-8824-5cc2-85b4-de0d9242d877', 'media', 'system/02-problem-s11.jpg', '/media/generated/02-problem-s11.jpg', 'code'::public.media_origin, true, '', 1400, 781, 73932, 'image/jpeg', '02-problem-s11.jpg', 'migrated')
on conflict (id) do update set
  path = excluded.path, public_path = excluded.public_path,
  origin = excluded.origin, locked = excluded.locked, source = excluded.source,
  alt = case when public.media_assets.alt = '' then excluded.alt else public.media_assets.alt end,
  width = excluded.width, height = excluded.height,
  bytes = excluded.bytes, mime = excluded.mime, original_name = excluded.original_name;
insert into public.media_assets
  (id, bucket, path, public_path, origin, locked, alt, width, height, bytes, mime, original_name, source)
values ('5ae5e310-91ad-57cb-8760-c2a7a90ffb50', 'media', 'system/02-problem-s12.jpg', '/media/generated/02-problem-s12.jpg', 'code'::public.media_origin, true, '', 1400, 781, 75246, 'image/jpeg', '02-problem-s12.jpg', 'migrated')
on conflict (id) do update set
  path = excluded.path, public_path = excluded.public_path,
  origin = excluded.origin, locked = excluded.locked, source = excluded.source,
  alt = case when public.media_assets.alt = '' then excluded.alt else public.media_assets.alt end,
  width = excluded.width, height = excluded.height,
  bytes = excluded.bytes, mime = excluded.mime, original_name = excluded.original_name;
insert into public.media_assets
  (id, bucket, path, public_path, origin, locked, alt, width, height, bytes, mime, original_name, source)
values ('b82af640-0d1c-5187-81d8-8a22434bcb28', 'media', 'system/02-problem-s13.jpg', '/media/generated/02-problem-s13.jpg', 'code'::public.media_origin, true, '', 1400, 781, 196652, 'image/jpeg', '02-problem-s13.jpg', 'migrated')
on conflict (id) do update set
  path = excluded.path, public_path = excluded.public_path,
  origin = excluded.origin, locked = excluded.locked, source = excluded.source,
  alt = case when public.media_assets.alt = '' then excluded.alt else public.media_assets.alt end,
  width = excluded.width, height = excluded.height,
  bytes = excluded.bytes, mime = excluded.mime, original_name = excluded.original_name;
insert into public.media_assets
  (id, bucket, path, public_path, origin, locked, alt, width, height, bytes, mime, original_name, source)
values ('8ff90673-2f13-533c-89c4-7f4eaf6f7151', 'media', 'system/02-problem-s14.jpg', '/media/generated/02-problem-s14.jpg', 'code'::public.media_origin, true, '', 1400, 781, 72644, 'image/jpeg', '02-problem-s14.jpg', 'migrated')
on conflict (id) do update set
  path = excluded.path, public_path = excluded.public_path,
  origin = excluded.origin, locked = excluded.locked, source = excluded.source,
  alt = case when public.media_assets.alt = '' then excluded.alt else public.media_assets.alt end,
  width = excluded.width, height = excluded.height,
  bytes = excluded.bytes, mime = excluded.mime, original_name = excluded.original_name;
insert into public.media_assets
  (id, bucket, path, public_path, origin, locked, alt, width, height, bytes, mime, original_name, source)
values ('56858106-7f47-5e7b-8e8e-ec32dbd6a45d', 'media', 'system/03-guide-desk.jpg', '/media/generated/03-guide-desk.jpg', 'code'::public.media_origin, true, '', 2000, 1116, 213919, 'image/jpeg', '03-guide-desk.jpg', 'migrated')
on conflict (id) do update set
  path = excluded.path, public_path = excluded.public_path,
  origin = excluded.origin, locked = excluded.locked, source = excluded.source,
  alt = case when public.media_assets.alt = '' then excluded.alt else public.media_assets.alt end,
  width = excluded.width, height = excluded.height,
  bytes = excluded.bytes, mime = excluded.mime, original_name = excluded.original_name;
insert into public.media_assets
  (id, bucket, path, public_path, origin, locked, alt, width, height, bytes, mime, original_name, source)
values ('5e1c94de-30e3-5c7b-8035-e1a5a6eb5aef', 'media', 'system/04-plan-week.jpg', '/media/generated/04-plan-week.jpg', 'code'::public.media_origin, true, '', 900, 1117, 81289, 'image/jpeg', '04-plan-week.jpg', 'migrated')
on conflict (id) do update set
  path = excluded.path, public_path = excluded.public_path,
  origin = excluded.origin, locked = excluded.locked, source = excluded.source,
  alt = case when public.media_assets.alt = '' then excluded.alt else public.media_assets.alt end,
  width = excluded.width, height = excluded.height,
  bytes = excluded.bytes, mime = excluded.mime, original_name = excluded.original_name;
insert into public.media_assets
  (id, bucket, path, public_path, origin, locked, alt, width, height, bytes, mime, original_name, source)
values ('18fd53b5-2dda-5445-8ab8-58080cb12ffd', 'media', 'system/04-rung-01-first-call.jpg', '/media/generated/04-rung-01-first-call.jpg', 'code'::public.media_origin, true, '', 1600, 1073, 96221, 'image/jpeg', '04-rung-01-first-call.jpg', 'migrated')
on conflict (id) do update set
  path = excluded.path, public_path = excluded.public_path,
  origin = excluded.origin, locked = excluded.locked, source = excluded.source,
  alt = case when public.media_assets.alt = '' then excluded.alt else public.media_assets.alt end,
  width = excluded.width, height = excluded.height,
  bytes = excluded.bytes, mime = excluded.mime, original_name = excluded.original_name;
insert into public.media_assets
  (id, bucket, path, public_path, origin, locked, alt, width, height, bytes, mime, original_name, source)
values ('b769a630-bc95-56d3-8673-2eaece77295b', 'media', 'system/04-rung-02-plan-page.jpg', '/media/generated/04-rung-02-plan-page.jpg', 'code'::public.media_origin, true, '', 1600, 1073, 134349, 'image/jpeg', '04-rung-02-plan-page.jpg', 'migrated')
on conflict (id) do update set
  path = excluded.path, public_path = excluded.public_path,
  origin = excluded.origin, locked = excluded.locked, source = excluded.source,
  alt = case when public.media_assets.alt = '' then excluded.alt else public.media_assets.alt end,
  width = excluded.width, height = excluded.height,
  bytes = excluded.bytes, mime = excluded.mime, original_name = excluded.original_name;
insert into public.media_assets
  (id, bucket, path, public_path, origin, locked, alt, width, height, bytes, mime, original_name, source)
values ('849307e0-db99-5482-8acc-3d36368eebde', 'media', 'system/04-rung-03-message-away.jpg', '/media/generated/04-rung-03-message-away.jpg', 'code'::public.media_origin, true, '', 1600, 1073, 88552, 'image/jpeg', '04-rung-03-message-away.jpg', 'migrated')
on conflict (id) do update set
  path = excluded.path, public_path = excluded.public_path,
  origin = excluded.origin, locked = excluded.locked, source = excluded.source,
  alt = case when public.media_assets.alt = '' then excluded.alt else public.media_assets.alt end,
  width = excluded.width, height = excluded.height,
  bytes = excluded.bytes, mime = excluded.mime, original_name = excluded.original_name;
insert into public.media_assets
  (id, bucket, path, public_path, origin, locked, alt, width, height, bytes, mime, original_name, source)
values ('8531f209-dfa0-52c9-85fa-46c9ad5036e6', 'media', 'system/06-fork-noisy.jpg', '/media/generated/06-fork-noisy.jpg', 'code'::public.media_origin, true, '', 1600, 1073, 80486, 'image/jpeg', '06-fork-noisy.jpg', 'migrated')
on conflict (id) do update set
  path = excluded.path, public_path = excluded.public_path,
  origin = excluded.origin, locked = excluded.locked, source = excluded.source,
  alt = case when public.media_assets.alt = '' then excluded.alt else public.media_assets.alt end,
  width = excluded.width, height = excluded.height,
  bytes = excluded.bytes, mime = excluded.mime, original_name = excluded.original_name;
insert into public.media_assets
  (id, bucket, path, public_path, origin, locked, alt, width, height, bytes, mime, original_name, source)
values ('4fc6453f-9245-54ab-843e-46d9c71f8066', 'media', 'system/06-fork-quiet.jpg', '/media/generated/06-fork-quiet.jpg', 'code'::public.media_origin, true, '', 1600, 1073, 77476, 'image/jpeg', '06-fork-quiet.jpg', 'migrated')
on conflict (id) do update set
  path = excluded.path, public_path = excluded.public_path,
  origin = excluded.origin, locked = excluded.locked, source = excluded.source,
  alt = case when public.media_assets.alt = '' then excluded.alt else public.media_assets.alt end,
  width = excluded.width, height = excluded.height,
  bytes = excluded.bytes, mime = excluded.mime, original_name = excluded.original_name;
insert into public.media_assets
  (id, bucket, path, public_path, origin, locked, alt, width, height, bytes, mime, original_name, source)
values ('106847b4-a93d-50a1-8b96-7a488d3b5aee', 'media', 'system/07-success-evening-wide.jpg', '/media/generated/07-success-evening-wide.jpg', 'code'::public.media_origin, true, '', 2000, 1116, 132356, 'image/jpeg', '07-success-evening-wide.jpg', 'migrated')
on conflict (id) do update set
  path = excluded.path, public_path = excluded.public_path,
  origin = excluded.origin, locked = excluded.locked, source = excluded.source,
  alt = case when public.media_assets.alt = '' then excluded.alt else public.media_assets.alt end,
  width = excluded.width, height = excluded.height,
  bytes = excluded.bytes, mime = excluded.mime, original_name = excluded.original_name;
insert into public.media_assets
  (id, bucket, path, public_path, origin, locked, alt, width, height, bytes, mime, original_name, source)
values ('fa5ea903-afdb-535e-889c-f15f4eb55cc2', 'media', 'system/09-coaching-table.jpg', '/media/generated/09-coaching-table.jpg', 'code'::public.media_origin, true, '', 896, 1200, 68166, 'image/jpeg', '09-coaching-table.jpg', 'migrated')
on conflict (id) do update set
  path = excluded.path, public_path = excluded.public_path,
  origin = excluded.origin, locked = excluded.locked, source = excluded.source,
  alt = case when public.media_assets.alt = '' then excluded.alt else public.media_assets.alt end,
  width = excluded.width, height = excluded.height,
  bytes = excluded.bytes, mime = excluded.mime, original_name = excluded.original_name;

-- ── the code edges ─────────────────────────────────────────────────────────
-- Rebuilt wholesale on every run, because a stale edge is worse than none: it
-- protects a file the code stopped using while the real reference goes
-- uncounted.
delete from public.media_refs where ref_kind = 'code';
insert into public.media_refs (media_id, ref_kind, source)
values ('37846488-798c-5d77-8279-da707bd3e848', 'code', 'src/app/page.tsx:61')
on conflict do nothing;
insert into public.media_refs (media_id, ref_kind, source)
values ('09ba62ff-0c9a-51a6-8eaa-e62731f7cfd3', 'code', 'src/app/page.tsx:63')
on conflict do nothing;
insert into public.media_refs (media_id, ref_kind, source)
values ('479048f3-ded8-53d1-80ac-cd495ad0a406', 'code', 'src/app/page.tsx:62')
on conflict do nothing;
insert into public.media_refs (media_id, ref_kind, source)
values ('e9ae162a-b866-5c37-85a4-a1b752bfe41a', 'code', 'src/app/page.tsx:71')
on conflict do nothing;
insert into public.media_refs (media_id, ref_kind, source)
values ('8a366bb3-b9b6-5cab-8354-844624d9d958', 'code', 'src/app/page.tsx:72')
on conflict do nothing;
insert into public.media_refs (media_id, ref_kind, source)
values ('e2776280-a528-5363-890f-7fa8527c757f', 'code', 'src/app/page.tsx:73')
on conflict do nothing;
insert into public.media_refs (media_id, ref_kind, source)
values ('8c35a3b8-d72c-54a1-8212-860f2b2f7dad', 'code', 'src/app/page.tsx:74')
on conflict do nothing;
insert into public.media_refs (media_id, ref_kind, source)
values ('e02ea435-6598-599f-8fe2-578470b447f5', 'code', 'src/app/page.tsx:75')
on conflict do nothing;
insert into public.media_refs (media_id, ref_kind, source)
values ('6a7103ab-c8ab-50bf-8dca-ecc6e99808cc', 'code', 'src/app/page.tsx:76')
on conflict do nothing;
insert into public.media_refs (media_id, ref_kind, source)
values ('1a8d2ca3-b9fe-5a35-8709-b890e84ed162', 'code', 'src/app/page.tsx:77')
on conflict do nothing;
insert into public.media_refs (media_id, ref_kind, source)
values ('3463d3c7-d9d7-57d0-8578-a8adfd1f6857', 'code', 'src/app/page.tsx:78')
on conflict do nothing;
insert into public.media_refs (media_id, ref_kind, source)
values ('131acc5b-2b42-517f-89ec-7e2475d669f8', 'code', 'src/app/page.tsx:79')
on conflict do nothing;
insert into public.media_refs (media_id, ref_kind, source)
values ('913c88bb-8afa-5ac5-872c-37c9852ac942', 'code', 'src/app/page.tsx:80')
on conflict do nothing;
insert into public.media_refs (media_id, ref_kind, source)
values ('476eb1fd-8824-5cc2-85b4-de0d9242d877', 'code', 'src/app/page.tsx:81')
on conflict do nothing;
insert into public.media_refs (media_id, ref_kind, source)
values ('5ae5e310-91ad-57cb-8760-c2a7a90ffb50', 'code', 'src/app/page.tsx:82')
on conflict do nothing;
insert into public.media_refs (media_id, ref_kind, source)
values ('b82af640-0d1c-5187-81d8-8a22434bcb28', 'code', 'src/app/page.tsx:83')
on conflict do nothing;
insert into public.media_refs (media_id, ref_kind, source)
values ('8ff90673-2f13-533c-89c4-7f4eaf6f7151', 'code', 'src/app/page.tsx:84')
on conflict do nothing;
insert into public.media_refs (media_id, ref_kind, source)
values ('56858106-7f47-5e7b-8e8e-ec32dbd6a45d', 'code', 'src/app/page.tsx:111')
on conflict do nothing;
insert into public.media_refs (media_id, ref_kind, source)
values ('5e1c94de-30e3-5c7b-8035-e1a5a6eb5aef', 'code', 'src/app/page.tsx:384')
on conflict do nothing;
insert into public.media_refs (media_id, ref_kind, source)
values ('18fd53b5-2dda-5445-8ab8-58080cb12ffd', 'code', 'src/app/page.tsx:126')
on conflict do nothing;
insert into public.media_refs (media_id, ref_kind, source)
values ('b769a630-bc95-56d3-8673-2eaece77295b', 'code', 'src/app/page.tsx:127')
on conflict do nothing;
insert into public.media_refs (media_id, ref_kind, source)
values ('849307e0-db99-5482-8acc-3d36368eebde', 'code', 'src/app/page.tsx:128')
on conflict do nothing;
insert into public.media_refs (media_id, ref_kind, source)
values ('8531f209-dfa0-52c9-85fa-46c9ad5036e6', 'code', 'src/app/page.tsx:505')
on conflict do nothing;
insert into public.media_refs (media_id, ref_kind, source)
values ('4fc6453f-9245-54ab-843e-46d9c71f8066', 'code', 'src/app/page.tsx:504')
on conflict do nothing;
insert into public.media_refs (media_id, ref_kind, source)
values ('106847b4-a93d-50a1-8b96-7a488d3b5aee', 'code', 'src/app/page.tsx:541')
on conflict do nothing;
insert into public.media_refs (media_id, ref_kind, source)
values ('fa5ea903-afdb-535e-889c-f15f4eb55cc2', 'code', 'src/app/coaching/page.tsx:157')
on conflict do nothing;
insert into public.media_refs (media_id, ref_kind, source)
values ('fa5ea903-afdb-535e-889c-f15f4eb55cc2', 'code', 'src/app/coaching/page.tsx:231')
on conflict do nothing;


-- ═══════════════ seed-recipes.sql ═══════════════
-- seed-recipes.sql — generated by scripts/migrate/01-recipes.mjs. Do not edit by hand.
-- 34 recipes, 30 images.
--
-- Idempotent: ids are derived from the slug, so re-running updates in place
-- rather than duplicating. status and published_at are deliberately NOT
-- refreshed, so a re-run can never republish a recipe the editor hid.
--
-- Images are NOT uploaded here. Each media_assets row points at the existing
-- /media/... URL, which keeps working exactly as it does today. Phase 5 moves
-- the bytes into Storage and rewrites public_path.


-- ── this file requires seed-media.sql to have run first ───────────────────
-- media_assets has exactly ONE owner: 02-media.mjs. It holds the full
-- inventory, the code-reference graph, the dimensions and the origin/locked
-- classification, and it is the only place that knows which five of her
-- recipe photos are also hardcoded in a marketing page and must stay locked.
-- This file used to write the same 30 rows with different values and neither
-- ON CONFLICT clause updated the columns the other one set, so whichever ran
-- last quietly won. Now it writes none of them, and refuses to run early.
do $$
begin
  if not exists (select 1 from public.media_assets where source = 'migrated') then
    raise exception 'run seed-media.sql before seed-recipes.sql'
      using hint = 'media_assets is seeded by scripts/migrate/02-media.mjs';
  end if;
end
$$;

-- ── recipes ────────────────────────────────────────────────────────────────
insert into public.recipes (id, slug, legacy_slug, title, description, date, category, tags, prep_time_text, prep_minutes, servings, image_id, image_path, image_alt, intro, ingredients, steps, tip, extra, headings, status, published_at)
values ('5936e859-7095-5d9f-88da-df8dbd29fbc0', 'baked-corn-fritters', 'לביבות-תירס-אפויות', 'לביבות תירס אפויות', 'לביבות תירס אפויות בתנור במקום מטוגנות, קלות להכנה וטעימות. גרסה בריאה יותר ללביבות של חנוכה, שגם ילדים אוהבים.', '2026-01-25'::date, 'צהריים', array['צמחוני', 'קל ומהיר']::text[], 'לא צוין', null, null, null, null, null, 'לביבות תירס אפויות וטעימות, קלות להכנה, שילדים אוהבים.

לקראת חנוכה אתם חייבים לשמור את המתכון הזה, לביבות לא מטוגנות ובריאות יותר שאתם הולכים לקבל עליהם ים מחמאות וגם ילדים עפים עליהם!', '[{"kind":"item","text":"קופסת שימורים תירס ללא סוכר (400 גרם לפני סינון)"},{"kind":"item","text":"100 גרם מתוך התירס נטחן ואת השאר נשאיר שלמים"},{"kind":"item","text":"1 ביצה"},{"kind":"item","text":"4 כפות שיבולת שועל דקה"},{"kind":"item","text":"1 כפית אבקת אפיה"},{"kind":"item","text":"צרור בצל ירוק"},{"kind":"item","text":"2\\1 כפית מלח"},{"kind":"item","text":"פלפל שחור, פפריקה, אבקת שום"},{"kind":"item","text":"תרסיס שמן"}]'::jsonb, '["מחממים תנור ל180 מעלות.","פותחים קופסת תירס שימורים (400 גרם) ומתוכה טוחנים 100 גרם תירס במעבד מזון ומעבירים לקערה, מה שנשאר מוסיפים לקערה בצורה השלמה.","מוסיפים לקערה את שאר הרכיבים ומערבבים לתערובת אחידה.","בעזרת ידיים רטובות \\ כף ניצור צורת לביבות ונניח אותן על תבנית עם נייר אפיה משומן.","נרסס מעל עוד קצת מהתרסיס שמן זית ונכניס לתנור ל20-25 דקות עד שמשחים."]'::jsonb, '', '', '{"ingredients":"רכיבים","steps":"אופן הכנה","tip":"טיפ"}'::jsonb, 'published'::public.content_status, '2026-01-25T00:00:00Z'::timestamptz)
on conflict (id) do update set
  legacy_slug = excluded.legacy_slug,
  title = excluded.title,
  description = excluded.description,
  date = excluded.date,
  category = excluded.category,
  tags = excluded.tags,
  prep_time_text = excluded.prep_time_text,
  prep_minutes = excluded.prep_minutes,
  servings = excluded.servings,
  image_id = excluded.image_id,
  image_path = excluded.image_path,
  image_alt = excluded.image_alt,
  intro = excluded.intro,
  ingredients = excluded.ingredients,
  steps = excluded.steps,
  tip = excluded.tip,
  extra = excluded.extra,
  headings = excluded.headings;
insert into public.recipes (id, slug, legacy_slug, title, description, date, category, tags, prep_time_text, prep_minutes, servings, image_id, image_path, image_alt, intro, ingredients, steps, tip, extra, headings, status, published_at)
values ('d3f59ba0-1ca6-5445-885c-1294b18ac0a8', 'baked-tofu-schnitzel', 'שניצל-טופו-אפוי', 'שניצל טופו אפוי', 'שניצל טופו דק וקריספי שאפוי בתנור, טבעוני וקל להכנה. המתכון בנוי משלושה חלקים: מרינדה לטופו, בלילת קורנפלור ומים וציפוי פירורי לחם.', '2026-01-25'::date, 'צהריים', array['טבעוני', 'קל ומהיר']::text[], 'לא צוין', null, null, '04454fc2-83c5-53ea-8613-66ae5e9d6d80', '/media/client/recipes/baked-tofu-schnitzel.jpg', 'שניצל טופו אפוי', 'שניצל טופו דק דק, קריספי ואפילו אפוי בתנור!
טבעוני וקל להכנה, אחד המתכונים האהובים עליי.

הדבר היחיד שקצת חסר לי בתור צמחונית זה שניצל, אבל ברוך בורא הטופו שאני כל פעם מגלה כמה החומר גלם הזה מעולה וכמה דברים שווים וטעימים אפשר להכין איתו!

אז החלטתי להכין שניצל טופו שיצא מוצלח ביותר! ואתם חייבים לנסות את זה.

אז המתכון מתחלק ל-3 : המרינדה של הטופו, קערת קורנפלור ומים וקערת פירורי לחם.', '[{"kind":"item","text":"1 חבילת טופו (300 גרם)"},{"kind":"item","text":"תרסיס שמן זית"},{"kind":"sublabel","text":"למרינדה:"},{"kind":"item","text":"1/4 כוס סויה (משתמשת בדלת נתרן)"},{"kind":"item","text":"1 כפית סילאן"},{"kind":"item","text":"1 כפית חרדל דיז’ון"},{"kind":"item","text":"1 כפית שמן זית"},{"kind":"item","text":"1 שן שום כתושה"},{"kind":"sublabel","text":"קערת קורנפלור ומים:"},{"kind":"item","text":"1/2 כוס מים"},{"kind":"item","text":"1/2 כוס קורנפלור/קמח אחר"},{"kind":"sublabel","text":"קערת פירורי לחם:"},{"kind":"item","text":"1/2 כוס פירורי לחם"},{"kind":"item","text":"2\\1 תבלין אורגנו (אפשר לוותר)"}]'::jsonb, '["מחממים תנור ל180 מעלות.","פורסים את הטופו לפרוסות דקות ומייבשים אותם היטב עם נייר סופג \\ מגבת.","מניחים את פרוסות הטופו בקופסה\\כלי שנוכל לסגור.","מערבבים את רכיבי המרינדה בקערה ושופכים אותה לתוך הכלי עם הטופו ככה שכולו יכוסה במרינדה.","סוגרים את הקופסה ומכניסים למקרר ל30 דקות (אפשר פחות אך ככל שזה יהיה יותר זמן במקרר הטופו יותר יספוג את הטעמים).","בינתיים בקערה אחת שמים את הקורנפלור ואת המים ומערבבים לבלילה אחידה, ובקערה שניה את הפירורי לחם.","מוציאים את הטופו מהמקרר וטובלים בכל פעם פרוסת טופו בבלילת הקורנפלור והמים ולאחר מכן מצפים בפירורי הלחם ומניחים על תבנית מרופדת בנייר אפיה - חוזרים על הפעולות.","מרססים בשמן את פרוסות הטופו ומכניסים לתנור ל15 דקות, מוציאים, הופכים את השניצלים לצד השני ומכניסים ל10 דקות נוספות. בשביל שהשניצל יהיה שחום וקריספי מ 2 הצדדים."]'::jsonb, '', '', '{"ingredients":"רכיבים","steps":"אופן הכנה","tip":"טיפ"}'::jsonb, 'published'::public.content_status, '2026-01-25T00:00:00Z'::timestamptz)
on conflict (id) do update set
  legacy_slug = excluded.legacy_slug,
  title = excluded.title,
  description = excluded.description,
  date = excluded.date,
  category = excluded.category,
  tags = excluded.tags,
  prep_time_text = excluded.prep_time_text,
  prep_minutes = excluded.prep_minutes,
  servings = excluded.servings,
  image_id = excluded.image_id,
  image_path = excluded.image_path,
  image_alt = excluded.image_alt,
  intro = excluded.intro,
  ingredients = excluded.ingredients,
  steps = excluded.steps,
  tip = excluded.tip,
  extra = excluded.extra,
  headings = excluded.headings;
insert into public.recipes (id, slug, legacy_slug, title, description, date, category, tags, prep_time_text, prep_minutes, servings, image_id, image_path, image_alt, intro, ingredients, steps, tip, extra, headings, status, published_at)
values ('68cb6bf0-09f1-5022-83d1-026407b863ed', 'baked-tuna-patties', 'קציצות-טונה-אפויות', 'קציצות טונה אפויות', 'קציצות טונה אפויות עשירות בחלבון, מ-5 מרכיבים עיקריים וכ-20 דקות עבודה. 55 קלוריות ו-6 גרם חלבון לקציצה, מנה קלילה לצהריים או ערב.', '2026-01-25'::date, 'צהריים', array['עתיר חלבון', 'דל קלוריות', 'קל ומהיר']::text[], '20 דקות', 20, '13 קציצות', '545618e1-21ef-5ff6-8f30-8f07738d562b', '/media/client/recipes/baked-tuna-patties.jpg', 'קציצות טונה אפויות', 'קציצות טונה אפויות מפוצצות בחלבון! בריאות, קלות והכנה וטעימות בטירוף, מ-5 מרכיבים עיקריים וגג 20 דקות של עבודה!

תגידו שלום להתמכרות הבאה שלכם, קציצות טונה ! ב- 55 קלוריות לקציצה ו 6 גרם חלבון!

מדובר במנת חלבון מעולה וקלילה לארוחת צהרים \ ערב שכיף לאכול ליד כל תוספת ומוכנה במהירות.

ובנוסף עם מלא אופציית גיוון .

(ערכים תזונתיים רשומים בסוף העמוד)', '[{"kind":"item","text":"2 קופסאות טונה במים"},{"kind":"item","text":"2 ביצים"},{"kind":"item","text":"1 בצל לבן"},{"kind":"item","text":"1 כפית שמן זית"},{"kind":"item","text":"1-2 שיני שום"},{"kind":"item","text":"זוקיני \\ קישוא \\ גזר מגורד וסחוט מנוזלים"},{"kind":"item","text":"1.5 כף קמח שתרצו"},{"kind":"item","text":"1 כף טראיקי"},{"kind":"item","text":"מעט מלח ופלפל שחור \\ צ''ילי גרוס לפי הטעם"},{"kind":"item","text":"חופן כוסברה\\ פטרוליזיה קצוצה למי שאוהב (לא חובה)"}]'::jsonb, '["מחממים תנור ל180 מעלות.","מחממים שמן זית במחבת ומטגנים את הבצל והשום עד השחמה.","מסננים היטב את הטונה מהמים ומעבירים לקערה.","מגרדים את הירק שבחרנו על פומפיה וסוחטים את המים מהם.","מוסיפים לקערה גדולה את הביצים, התיבול, הקמח, הבצל , השום והכוסברה.","מערבבים את כל הרכיבים.","בעזרת ידיים רטובות\\ משומנות מעט יוצרים קציצות ומניחים אותן על תבנית עם נייר אפיה.","מרססים מעל \\ מברישים מעט שמן זית ומכניסים לאפיה של כ20 דקות עד שהקציצות מזהיבות."]'::jsonb, '', '### ערכים תזונתיים עבור קציצה מתוך 13:

אנרגיה (קלוריות): 55 קק"ל.

שומן (גרם): 1.5 גרם.

פחמימות (גרם): 4.2 גרם.

חלבון (גרם): 6.2 גרם.', '{"ingredients":"רכיבים","steps":"אופן הכנה","tip":"טיפ"}'::jsonb, 'published'::public.content_status, '2026-01-25T00:00:00Z'::timestamptz)
on conflict (id) do update set
  legacy_slug = excluded.legacy_slug,
  title = excluded.title,
  description = excluded.description,
  date = excluded.date,
  category = excluded.category,
  tags = excluded.tags,
  prep_time_text = excluded.prep_time_text,
  prep_minutes = excluded.prep_minutes,
  servings = excluded.servings,
  image_id = excluded.image_id,
  image_path = excluded.image_path,
  image_alt = excluded.image_alt,
  intro = excluded.intro,
  ingredients = excluded.ingredients,
  steps = excluded.steps,
  tip = excluded.tip,
  extra = excluded.extra,
  headings = excluded.headings;
insert into public.recipes (id, slug, legacy_slug, title, description, date, category, tags, prep_time_text, prep_minutes, servings, image_id, image_path, image_alt, intro, ingredients, steps, tip, extra, headings, status, published_at)
values ('93c648b8-21ae-5779-8542-0ea39b71b67f', 'bean-noodle-fish-salad', 'סלט-אטריות-שעועית-עם-דג', 'סלט אטריות שעועית עם דג', 'סלט אטריות שעועית ברוטב אסיאתי עם דג אמנון ישראלי טרי. מנה קלילה, משביעה ומאוזנת, עשירה בחלבון וויטמין D.', '2026-01-23'::date, 'סלטים', array['עתיר חלבון']::text[], 'לא צוין', null, null, 'c0d6cff5-dd5c-507d-823e-348c0d93873c', '/media/client/recipes/bean-noodle-fish-salad.jpg', 'סלט אטריות שעועית עם דג', 'סלט אטריות שעועית ברוטב אסיאתי בתוספת דג, כמו מנה של מסעדה זו ההתמכרות הבאה שלכם!

איך אני אוהבת סלטים מיוחדים ובטח שהוא בתוספת של דג אמנון ישראלי טרי

שמוסיף לי למנה מלא חלבון, ויטמין D ועוד ויטמינים ומינרלים חשובים שנמצאים בדג הטרי. ואל תשכחו שכשאנחנו צורכים תוצרת ישראלית אנחנו עוזרים לחקלאות הישראלית ולמגדלי הדגים שלנו.

אז מדובר במנה קלילה, משביעה, מאוזנת וטעימה שאני יכולה לאכול כל יום!', '[{"kind":"item","text":"3 פילה דג אמנון ישראלי טרי"},{"kind":"item","text":"1 כף שמן זית"},{"kind":"sublabel","text":"לסלט:"},{"kind":"item","text":"1 שקית (250 גרם) אטריות שעועית"},{"kind":"item","text":"1 אבוקדו"},{"kind":"item","text":"2 גזר חתוך לרצועות"},{"kind":"item","text":"2 מלפפון חתוך לרצועות"},{"kind":"item","text":"1/2 בצל סגול"},{"kind":"item","text":"1/2 ברוקולי מאודה"},{"kind":"item","text":"חופן כוסברה"},{"kind":"item","text":"בצל ירוק"},{"kind":"item","text":"אופציונאלי: פרוסות פלפל חריף"},{"kind":"item","text":"וחופן בוטנים גרוסים"},{"kind":"sublabel","text":"לרוטב:"},{"kind":"item","text":"1/4 כוס סויה"},{"kind":"item","text":"2 כפות מייפל טבעי"},{"kind":"item","text":"מיץ לימון מחצי ליים/לימון"},{"kind":"item","text":"2-3 שיני שום"},{"kind":"item","text":"1/2 כפית ג’ינג’ר מגורד"},{"kind":"item","text":"1 כף שמן שומשום"},{"kind":"item","text":"1/2 כפית צ’ילי חריף"}]'::jsonb, '["סוחטים על הדג מעט לימון.","מחממים כף שמן זית במחבת ומטגנים את הדגים כ3 דקות מכל צד עד שהוא מוכן.","חותכים את הדגים לקוביות.","בינתיים מכירים את אטריות השעועית ע״פ הוראות היצרן, מסננים ומעבירים לקערה גדולה.","חותכים את כל הירקות ומוסיפים לקערה.","מערבבים את כל המצרכים לרוטב ושופכים מעל הסלט.","מערבבים כל רכיבי הסלט עם הרוטב ולבסוף מוסיפים את הדג. בתיאבון!!"]'::jsonb, '', '', '{"ingredients":"רכיבים","steps":"אופן הכנה","tip":"טיפ"}'::jsonb, 'published'::public.content_status, '2026-01-23T00:00:00Z'::timestamptz)
on conflict (id) do update set
  legacy_slug = excluded.legacy_slug,
  title = excluded.title,
  description = excluded.description,
  date = excluded.date,
  category = excluded.category,
  tags = excluded.tags,
  prep_time_text = excluded.prep_time_text,
  prep_minutes = excluded.prep_minutes,
  servings = excluded.servings,
  image_id = excluded.image_id,
  image_path = excluded.image_path,
  image_alt = excluded.image_alt,
  intro = excluded.intro,
  ingredients = excluded.ingredients,
  steps = excluded.steps,
  tip = excluded.tip,
  extra = excluded.extra,
  headings = excluded.headings;
insert into public.recipes (id, slug, legacy_slug, title, description, date, category, tags, prep_time_text, prep_minutes, servings, image_id, image_path, image_alt, intro, ingredients, steps, tip, extra, headings, status, published_at)
values ('65bf3d52-f325-520e-8804-750580db831d', 'broccoli-onion-quiche', 'קיש-גבינות-בצל-וברוקולי', 'קיש גבינות, בצל וברוקולי', 'קיש גבינות רזות, בצל וברוקולי בבצק פריך וקל מקמח כוסמין. פשוט להכנה ומתאים לבראנץ, לארוחת בוקר או לארוחת ערב בריאה.', '2026-01-25'::date, 'מאפים', array['צמחוני']::text[], 'לא צוין', null, 'תבנית פאי 20 ס"מ', 'a35cf10c-3379-5e6b-8312-87695468b17f', '/media/client/recipes/broccoli-onion-quiche.jpg', 'קיש גבינות, בצל וברוקולי', 'קיש גבינות רזות, בצל וברוקולי מבצק פריך וקל מקמח כוסמין

פשוט ומצויין!

אתם לא מבינים איזה טעים ופשוט להכנה!

תיראו, אני לא אוהבת להתעסק עם בצקים, לא מתחברת ואם כן- שיהיו פשוטים!

בקיצור אתם הולכים לקבל על הקיש הזה ים מחמאות.

והוא מעולה לבראנצ׳ או לגיוון מעולה וטעים לארוחת ערב/בוקר בריאה ושווה', '[{"kind":"note","text":"(תבנית פאי 20 ס\"מ)"},{"kind":"sublabel","text":"לבצק:"},{"kind":"item","text":"130 גרם קמח כוסמין"},{"kind":"item","text":"1/4 כוס שמן זית"},{"kind":"item","text":"2 כפות מים פושרים"},{"kind":"item","text":"חלמון ביצה"},{"kind":"item","text":"מעט מלח"},{"kind":"sublabel","text":"למלית גבינות בצל וברוקולי:"},{"kind":"item","text":"1 בצל שלם"},{"kind":"item","text":"2 שיני שום"},{"kind":"item","text":"1 כף שמן זית"},{"kind":"item","text":"1 ברוקולי לאחר בישול קל"},{"kind":"item","text":"250 גרם (חפיסה) קוטג׳ 5%"},{"kind":"item","text":"100 גרם בולגרית 5%"},{"kind":"item","text":"חופן/30 גרם פרמזן׳/ גבינה מגורדת אחרת"},{"kind":"item","text":"1 כפית אבקת אפיה"},{"kind":"item","text":"תבלינים: מעט מלח, פלפל שחור, 1/2 כפית אגוז מוסקט טחון, 1/2 כפית אבקת שום גבישי"}]'::jsonb, '["מחממים תנור ל180 מעלות.","מכינים את הבצק- בקערה נערבב את כל הרכיבים לבצק ונתחיל ללוש, במידה ודביק להוסיף עוד קמח.","מכניסים את הבצק למקרר ל15 דקות שיתייצב.","למלית גבינות - בינתיים מטגנים את הבצל והשום בשמן זית ומבשלים את הברוקולי עד לריכוך קל.","מערבבים בקערה את כל הרכיבים למלית גבינות (קוטג׳, בולגרית, פרמזן, בצל, ברוקולי, תבלינים).","מוציאים את הבצק מהמקרר, מקמחים משטח ובעזרת מארוך מרדדים את הבצק דק ובעדינות מניחים אותו על תבנית פאי/קיש *משומנת מעט!","שופכים את מלית הגבינות, הבצל והברוקולי מעל הבצק.","מפזרים מעל עוד גבינה מגורדת/פרמזן.","אופים כ-30-40 דקות, עד שמשחים מלמעלה."]'::jsonb, '', '', '{"ingredients":"רכיבים","steps":"אופן הכנה","tip":"טיפ"}'::jsonb, 'published'::public.content_status, '2026-01-25T00:00:00Z'::timestamptz)
on conflict (id) do update set
  legacy_slug = excluded.legacy_slug,
  title = excluded.title,
  description = excluded.description,
  date = excluded.date,
  category = excluded.category,
  tags = excluded.tags,
  prep_time_text = excluded.prep_time_text,
  prep_minutes = excluded.prep_minutes,
  servings = excluded.servings,
  image_id = excluded.image_id,
  image_path = excluded.image_path,
  image_alt = excluded.image_alt,
  intro = excluded.intro,
  ingredients = excluded.ingredients,
  steps = excluded.steps,
  tip = excluded.tip,
  extra = excluded.extra,
  headings = excluded.headings;
insert into public.recipes (id, slug, legacy_slug, title, description, date, category, tags, prep_time_text, prep_minutes, servings, image_id, image_path, image_alt, intro, ingredients, steps, tip, extra, headings, status, published_at)
values ('ff37508b-c4fa-51e0-8af1-ca90c112d41d', 'bulgur-broccoli-salad', 'סלט-בורגול-ברוקולי-ומלא-דברים-טובים', 'סלט בורגול ברוקולי ומלא דברים טובים', 'סלט ברוקולי ובורגול עם פטה, פלחי תפוז ואגוזי לוז ברוטב מתקתק וחמצמץ. סלט עשיר ומרענן שיכול להיות גם ארוחה שלמה.', '2026-01-07'::date, 'סלטים', array['צמחוני']::text[], 'לא צוין', null, '4-5 מנות', '5e153091-b444-5125-8ca3-c8928029e4e8', '/media/client/recipes/bulgur-broccoli-salad.jpg', 'סלט בורגול ברוקולי ומלא דברים טובים', 'הסלט הכי טעים בעולם! אמרתי את זה.
סלט ברוקולי ובורגול עם פטה ברוטב מתקתק וחמצמץ לא מהעולם הזה, סלט שהולך להפתיע אתכם ברמות.

אני ממש אוהבת סלטים מיוחדים וכיפיים, זה באמת אחד המאכלים האהובים עליי שאני יכולה לאכול כל יום. ולא אני לא מדברת על סלט מלפפון עגבניה, אני מדברת על סלטים מגוונים, עשירים, עם שילובי ירקות, פירות, אגוזים, דגנים, קטניות... שפע. אפשר לעשות דברים מדהימים מירקות! וסלט יכול להיות גם ארוחה שלמה.

בקיצור כמו שהבנתם, אכלתי לא מעט סלטים בחיים שלי ואם אני אומרת לכם שהסלט הזה הוא אחד הטובים שאכלתי אתם צריכים לסמוך עליי! הכל פשוט משתלב ביחד בצורה מדויקת (כן גם הפילחי תפוז) ואני ממש ממליצה לא לוותר על שום רכיב בסלט או ברוטב.

לרוב בימי ראשון אני אוהבת לאכול סלט, הכי כיף לי לפתוח את השבוע ככה בצורה מאוזנת ומרעננת אחרי כל האוכל של הסופ"ש. בקיצור זה ה-סלט לפתוח איתו את השבוע!', '[{"kind":"note","text":"(4-5 מנות)"},{"kind":"item","text":"1 יחידה ברוקולי טרי"},{"kind":"item","text":"1.5 כוסות בורגול לאחר בישול"},{"kind":"item","text":"2-3 צרורות בצל ירוק קצוץ"},{"kind":"item","text":"צרור כוסברה קצוצה"},{"kind":"item","text":"100 גרם פטה או בולגרית מעודנת (כל % שתרצו) - לאופציה טבעונית אפשר להוסיף פטה טבעונית"},{"kind":"item","text":"פלחי תפוז מ1/2 תפוז"},{"kind":"item","text":"חופן אגוזי לוז קצוצים גס"},{"kind":"sublabel","text":"לרוטב:"},{"kind":"item","text":"3 כפות שמן זית"},{"kind":"item","text":"1 כף טחינה גולמית"},{"kind":"item","text":"1 שן שום"},{"kind":"item","text":"מיץ לימון מלימון שלם"},{"kind":"item","text":"2 כפות דבש"},{"kind":"item","text":"1/2 כפית מלח"},{"kind":"item","text":"מעט פלפל שחור"}]'::jsonb, '["מכינים את הבורגול ע״פ הוראות היצרן (בערך 1/2 כוס בורגול לפני בישול).","מפרידים את פרחי הברוקולי מהגזע ושמים את פרחי הברוקולי במעבד מזון, טוחנים עד לקבלת פרחי ברוקולי קטנים קטנים אבל לא פירורים.","שמים בקערה את הברוקולי הטחון, הבורגול, הכוסברה והבצל ירוק הקצוצים ואת פלחי התפוז. מוסיפים גם את הפטה - למעוך אותה לפני עם מזלג.","מערבבים את כל רכיבי הרוטב ושופכים מעל הסלט.","מוסיפים את האגוזים ומערבבים את הסלט טוב. תיהנו!"]'::jsonb, '', '', '{"ingredients":"רכיבים","steps":"אופן הכנה","tip":"טיפ"}'::jsonb, 'published'::public.content_status, '2026-01-07T00:00:00Z'::timestamptz)
on conflict (id) do update set
  legacy_slug = excluded.legacy_slug,
  title = excluded.title,
  description = excluded.description,
  date = excluded.date,
  category = excluded.category,
  tags = excluded.tags,
  prep_time_text = excluded.prep_time_text,
  prep_minutes = excluded.prep_minutes,
  servings = excluded.servings,
  image_id = excluded.image_id,
  image_path = excluded.image_path,
  image_alt = excluded.image_alt,
  intro = excluded.intro,
  ingredients = excluded.ingredients,
  steps = excluded.steps,
  tip = excluded.tip,
  extra = excluded.extra,
  headings = excluded.headings;
insert into public.recipes (id, slug, legacy_slug, title, description, date, category, tags, prep_time_text, prep_minutes, servings, image_id, image_path, image_alt, intro, ingredients, steps, tip, extra, headings, status, published_at)
values ('ed583597-7ea5-59f3-8533-3c10c2e032c6', 'cauliflower-fried-rice', 'אורז-מטוגן-מוקפץ-אסיאתי-מכרובית', '"אורז מטוגן" מוקפץ אסיאתי מכרובית', 'אורז מוקפץ אסיאתי שכולו מכרובית טחונה, מתכון צמחוני בריא וקל, דל פחמימות וללא גלוטן, שהופך שאריות ירקות מהמקרר למנה משביעה וטעימה.', '2026-01-25'::date, 'צהריים', array['צמחוני', 'ללא גלוטן', 'דל פחמימה', 'דל קלוריות', 'קל ומהיר']::text[], 'לא צוין', null, null, '123da434-ad96-5b38-834b-a3676bbec714', '/media/client/recipes/cauliflower-fried-rice.jpg', '"אורז מטוגן" מוקפץ אסיאתי מכרובית', '״אורז מטוגן מוקפץ״ אסיאתי או "פרייד רייס" וירקות צמחוני (עם אופציה לטבעוני) מכרובית!!! ללא גלוטן

מדובר על מתכון שמתאים גם לקיטוגנים \ סכרתיים מכיוון שהוא דל בפחמימות ועשיר במלא ירקות ודברים טובים!

אורז שכולו עשוי מכרובית שטחנו בבלנדר והוא הולך להיות הכוכב החדש במטבח שלכם וזה גם המתכון שלי שכיכב בפאולה וליאון.

המתכון הזה הולך לסדר אתכם בכל פעם שבא לכם להכין משהו בריא וקל אבל מיוחד וטעים במיוחד!

ושיהיה גם משביע בלי הרבה קלוריות

כל מה שצריך זה כרובית עייפה, כמה שאריות ירקות עייפים במקרר, שימורי תירס\אפונה שאתם לא יודעים מה לעשות איתם ?

המתכון הזה בשבילכם!', '[{"kind":"item","text":"1 כרובית בינונית טרייה"},{"kind":"item","text":"1 בצל לבן\\סגול שלם"},{"kind":"item","text":"2 שיני שום"},{"kind":"item","text":"2 כפות שמן זית"},{"kind":"item","text":"אפונה, גזר מגורד, תירס (או איזה ירקות/תוספות שאתם אוהבים)"},{"kind":"item","text":"ביצה (אופציה טבעונית : טופו מגורד או ללא כלום)"},{"kind":"item","text":"צרור בצל ירוק"},{"kind":"item","text":"חופן כוסברה קצוצה"},{"kind":"sublabel","text":"רוטב:"},{"kind":"item","text":"1/4 כוס סויה"},{"kind":"item","text":"2 כפות סילאן"},{"kind":"item","text":"1 כפית שמן שומשום"},{"kind":"item","text":"צילי גרוס"},{"kind":"item","text":"מעט ג’ינג’ר (לא חובה)"}]'::jsonb, '["מפרידים את הכרובית לפרחים, מכניסים למעבד מזון וטוחנים עד לקבלת פירורים בגודל אורז.","חותכים בצל , שום ואת שאר הירקות.","מחממים שמן זית במחבת רחבה וגדולה ומטגנים את הבצל והשום , עד השחמה.","מוסיפים את פירורי הכרובית ושאר הירקות ומקפיצים כמה דקות .","מוסיפים כף נוספת של שמן זית ואת כל מרכיבי הרוטב ומקפיצים כמה דקות נוספות.","ניתן לפזר בסוף עוד בצל ירוק \\ שומשום \\ בוטנים גרוסים."]'::jsonb, '', '', '{"ingredients":"רכיבים","steps":"אופן הכנה","tip":"טיפ"}'::jsonb, 'published'::public.content_status, '2026-01-25T00:00:00Z'::timestamptz)
on conflict (id) do update set
  legacy_slug = excluded.legacy_slug,
  title = excluded.title,
  description = excluded.description,
  date = excluded.date,
  category = excluded.category,
  tags = excluded.tags,
  prep_time_text = excluded.prep_time_text,
  prep_minutes = excluded.prep_minutes,
  servings = excluded.servings,
  image_id = excluded.image_id,
  image_path = excluded.image_path,
  image_alt = excluded.image_alt,
  intro = excluded.intro,
  ingredients = excluded.ingredients,
  steps = excluded.steps,
  tip = excluded.tip,
  extra = excluded.extra,
  headings = excluded.headings;
insert into public.recipes (id, slug, legacy_slug, title, description, date, category, tags, prep_time_text, prep_minutes, servings, image_id, image_path, image_alt, intro, ingredients, steps, tip, extra, headings, status, published_at)
values ('ef48f72f-2fda-5564-88bc-597ffae4b745', 'cauliflower-tabbouleh', 'סלט-טאבולה-כרובית-הכי-טעים-שתאכלו', 'סלט טאבולה כרובית הכי טעים שתאכלו', 'סלט טאבולה מכרובית טרייה עם תמרים עסיסיים, פיסטוקים, עשבי תיבול ורוטב לימון וסילאן. מנה טבעונית ובריאה שפשוטה להכנה.', '2026-01-25'::date, 'סלטים', array['טבעוני', 'קל ומהיר']::text[], 'לא צוין', null, null, 'a48ee3b8-f1fc-566f-8d2a-9fc877a43673', '/media/client/recipes/cauliflower-tabbouleh.jpg', 'סלט טאבולה כרובית הכי טעים שתאכלו', 'סלט טאבולה כרובית בתוספת תמרים השילוב שלא ידענו שאנחנו צריכים. מנה טבעונית, בריאה, מרשימה וקלה להכנה.

סלט כרובית טרי עם חתיכות קטנות של התמרים הלחים והמתוקים של שרית אהובתי, פיסטוקים, עשבי תיבול ועוד ים דברים טובים, על מצע של יוגורט - מנה במסעדה!
תתכוננו להתמכר לטאבולה בגרסה הזאת, וזה כל כך פשוט להכנה וטעיםםם שלא תאמינו', '[{"kind":"item","text":"1 כרובית בינונית טריה"},{"kind":"item","text":"1 בצל סגול שלם קצוץ"},{"kind":"item","text":"2 צרורות בצל ירוק קצוץ"},{"kind":"item","text":"חופן כוסברה קצוצה לפי הטעם (מבחינתי כל המרבה הרי זה משובח..)"},{"kind":"item","text":"7 תמרי מ''גהול עסיסיים (השתמשתי בתמרים של שרית)"},{"kind":"item","text":"חופן פיסטוקים/אגוזים אחרים"},{"kind":"sublabel","text":"לרוטב:"},{"kind":"item","text":"1/4 כוס שמן זית"},{"kind":"item","text":"מיץ לימון מלימון שלם"},{"kind":"item","text":"1 כפית מלח"},{"kind":"item","text":"פלפל שחור לפי הטעם"},{"kind":"item","text":"1 כף סילאן"}]'::jsonb, '["חותכים כרובית בינונית טרייה לפרחים וטוחנים במעבד מזון עד למרקם של בין אורז \\ קוסקוס.","מעבירים לקערה ומוסיפים את שאר הירקות, התמרים החתוכים והאגוזים.","שופכים את הרוטב מעל הסלט ומערבבים הכל ביחד.","הצעת הגשה -> להניח מעל יוגורט."]'::jsonb, '', 'תתכוננו להתמכר', '{"ingredients":"רכיבים","steps":"אופן הכנה","tip":"טיפ"}'::jsonb, 'published'::public.content_status, '2026-01-25T00:00:00Z'::timestamptz)
on conflict (id) do update set
  legacy_slug = excluded.legacy_slug,
  title = excluded.title,
  description = excluded.description,
  date = excluded.date,
  category = excluded.category,
  tags = excluded.tags,
  prep_time_text = excluded.prep_time_text,
  prep_minutes = excluded.prep_minutes,
  servings = excluded.servings,
  image_id = excluded.image_id,
  image_path = excluded.image_path,
  image_alt = excluded.image_alt,
  intro = excluded.intro,
  ingredients = excluded.ingredients,
  steps = excluded.steps,
  tip = excluded.tip,
  extra = excluded.extra,
  headings = excluded.headings;
insert into public.recipes (id, slug, legacy_slug, title, description, date, category, tags, prep_time_text, prep_minutes, servings, image_id, image_path, image_alt, intro, ingredients, steps, tip, extra, headings, status, published_at)
values ('508e68da-39f0-51d9-80da-612bd4f8cd4d', 'date-energy-bars', 'חטיפי-אנרגיה-ביתיים-עם-תמרים', 'חטיפי אנרגיה ביתיים עם תמרים', 'חטיפי אנרגיה ביתיים מתמרים, חמאת בוטנים, שיבולת שועל ואגוזים. 5 מרכיבים בלבד, 10 דקות הכנה, טבעוני וללא גלוטן.', '2026-01-07'::date, 'חטיפים', array['טבעוני', 'ללא גלוטן', 'קל ומהיר']::text[], '10 דקות', 10, '16 חטיפים', '29044999-a456-56e0-8565-894086a89955', '/media/client/recipes/date-energy-bars.jpg', 'חטיפי אנרגיה ביתיים עם תמרים', 'חטיף אנרגיה ביתי עם תמרים מ5 מרכיבים בלבד! טבעוני, ללא גלוטן, 10 דקות הכנה ומהרכיבים הכי טובים ואיכותיים שיש.

אנחנו קונים חטיפי אנרגיה בסופר במחשבה שחטיפי אנרגיה כשמם כן הם אמורים להביא לנו אנרגיה ושהם כנראה בריאים יותר וטובים יותר ממתק או חטיף שוקולד אחר נכון? אבל אז מסתכלים על הרשימת מרכיבים ומבינים שגם פה מדובר ביותר ממתק ופחות חטיף אנרגיה.. המון מרכיבים, את חלקם אנחנו לא מכירים, המון סוכרים, שומן רווי וכו''. שאין בעיה לצרוך דברים כאלה פעם ב ואני מאמינה שהכל זה עניין של איזון וכמות, אבל שרוצים משהו באמת בריא יותר, כנראה שזה לא מה שאנחנו מחפשים.

אז החלטתי להכין חטיף אנרגיה אמיתי בבית, כזה שבאמת בריא יותר, ממינימום מרכיבים ומרכיבים מזינים, טבעיים ואיכותיים יותר! והם מושלמים לקחת לעבודה\ לשלוח עם הילדים לבית ספר\ לפני אימון וכו''.

מדובר בחטיף טעים ביותר עם תמרים איכותיים, שיבולת שועל, אגוזים.. בקיצור תענוג אמיתי.', '[{"kind":"item","text":"8-9 תמרים עסיסיים מסוג מג’הול של שרית"},{"kind":"item","text":"2 כפות מים"},{"kind":"item","text":"3 כפות חמאת בוטנים טבעית"},{"kind":"item","text":"3/4 כוס (70 גרם) שיבולת שועל דקה"},{"kind":"item","text":"1/2 כוס (55 גרם) שיבולת שועל עבה"},{"kind":"item","text":"1/2 כוס (48 גרם) אגוזי פקאן / מלך קצוצים גס"},{"kind":"item","text":"1 כפית קינמון"},{"kind":"item","text":"אופציונלי: שוקולד מריר + כפית שמן לקישוט מעל"}]'::jsonb, '["מגלענים את התמרים, מניחים במעבד מזון את התמרים, חמאת בוטנים ו2 כפות מים. **במידה והשתמשתם בתמרים רגילים ולא עסיסיים של שרית מומלץ להשרות אותם במים רותחים 10 דקות.","קולים על מחבת את השיבולת שועל הדקה והעבה והאגוזים למשך 2-3 דקות ומעבירים לקערה.","מוסיפים לאותה הקערה את המחית של התמרים עם החמאת בוטנים שטחנו במעבד מזון, מוסיפים קינמון ומערבבים יחד טוב עד לקבלת תערובת שמזכירה בצק, לא להבהל אם דביק.","משטחים את התערובת היטב על נייר אפיה בתבנית מרובעת, מהדקים.","מזלפים מעל שוקולד מריר מומס (לא חובה) ומכניסים להקפאה ל2-3 שעות.","לאחר שמוציאים מהמקפיא חותכים לריבועים ונהנים! ניתן לשמור במקפיא או במקרר."]'::jsonb, '', 'ערכים תזונתיים לחטיף מתוך 16:

- קלוריות - 112 קק״ל.
- חלבון - 2.5 גרם.
- פחמימות - 16.2 גרם.
- שומן - 4.8 גרם.', '{"ingredients":"רכיבים","steps":"אופן הכנה","tip":"טיפ"}'::jsonb, 'published'::public.content_status, '2026-01-07T00:00:00Z'::timestamptz)
on conflict (id) do update set
  legacy_slug = excluded.legacy_slug,
  title = excluded.title,
  description = excluded.description,
  date = excluded.date,
  category = excluded.category,
  tags = excluded.tags,
  prep_time_text = excluded.prep_time_text,
  prep_minutes = excluded.prep_minutes,
  servings = excluded.servings,
  image_id = excluded.image_id,
  image_path = excluded.image_path,
  image_alt = excluded.image_alt,
  intro = excluded.intro,
  ingredients = excluded.ingredients,
  steps = excluded.steps,
  tip = excluded.tip,
  extra = excluded.extra,
  headings = excluded.headings;
insert into public.recipes (id, slug, legacy_slug, title, description, date, category, tags, prep_time_text, prep_minutes, servings, image_id, image_path, image_alt, intro, ingredients, steps, tip, extra, headings, status, published_at)
values ('b97ef42d-6cce-5f0a-8508-a6cd09b42c59', 'easy-pea-soup', 'מרק-אפונה-פשוט-וקל', 'מרק אפונה פשוט וקל', 'מרק אפונה פשוט וקל להכנה, בריא, מזין ומשביע. האפונה עשירה בחלבון מהצומח ובסיבים תזונתיים, ומרק אחד חם יסדר לכם את החורף.', '2026-01-25'::date, 'מרקים', array['טבעוני', 'צמחוני', 'עתיר חלבון', 'קל ומהיר']::text[], 'לא צוין', null, null, null, null, null, 'מרק אפונה פשוט וקל , בריא ומזין , משביע ועשיר בחלבון מהצומח

מרק אפונה קל להכנה שהולך לסדר לכם את החורף הקרוב ולהפוך אותו לחמים ומשביע יותר .

משהו שאולי לא ידעתם עליי - מרק אפונה הוא אחד המרקים האהובים עלי!

גם טעים, גם בריא וגם משביע בזכות האפונה שהיא קטניה שנחשבת לאחלה מקור חלבון מהצומח, מקור לסיבים תזונתיים וויטמינים וגם דלה בקלוריות .
אז מה אתם אומרים על להתחיל לשלב אותה יותר בתזונה? ובדרך סופר קלה להכנה!', '[{"kind":"item","text":"שקית אפונה קפואה של סנפרוסט (800 גר׳)"},{"kind":"item","text":"1 בצל לבן קצוץ"},{"kind":"item","text":"2-3 שיני שום"},{"kind":"item","text":"1 גזר"},{"kind":"item","text":"1 מקל סלרי/פטרוזיליה"},{"kind":"item","text":"2 כפות שמן זית"},{"kind":"item","text":"6 כוסות מים רותחים (שיכסו את האפונה)"},{"kind":"sublabel","text":"תיבול:"},{"kind":"item","text":"1.5 כפית מלח"},{"kind":"item","text":"2\\1 כפית פלפל שחור"},{"kind":"item","text":"1 כפית אבקת שום"}]'::jsonb, '["קוצצים את הבצל, השום וחותכים את הגזר לקוביות.","מחממים שמן זית בסיר, מטגנים מעט את הבצל עד השחמה, מוסיפים את השום, הגזר והסלרי ומבשלים עד ריכוך קל.","מוסיפים את האפונה הקפואה ומוסיפים מים רותחים עד שיכסו כל האפונה, מתבלים, מביאים לרתיחה ומכסים את הסיר.","מבשלים על אש בינונית 15-20 דקות עד שהאפונה מתרככת.","טוחנים את המרק בבלנדר מוט ידני/ מעבד מזון עד למרקם קרמי ואחיד ומבשלים 10 דקות נוספות .","אם סמיך לכם מידי אפשר להוסיף מים (כנל לטעום ולהוסיף תיבול שחסר לכם) ."]'::jsonb, '', '', '{"ingredients":"רכיבים","steps":"אופן הכנה","tip":"טיפ"}'::jsonb, 'published'::public.content_status, '2026-01-25T00:00:00Z'::timestamptz)
on conflict (id) do update set
  legacy_slug = excluded.legacy_slug,
  title = excluded.title,
  description = excluded.description,
  date = excluded.date,
  category = excluded.category,
  tags = excluded.tags,
  prep_time_text = excluded.prep_time_text,
  prep_minutes = excluded.prep_minutes,
  servings = excluded.servings,
  image_id = excluded.image_id,
  image_path = excluded.image_path,
  image_alt = excluded.image_alt,
  intro = excluded.intro,
  ingredients = excluded.ingredients,
  steps = excluded.steps,
  tip = excluded.tip,
  extra = excluded.extra,
  headings = excluded.headings;
insert into public.recipes (id, slug, legacy_slug, title, description, date, category, tags, prep_time_text, prep_minutes, servings, image_id, image_path, image_alt, intro, ingredients, steps, tip, extra, headings, status, published_at)
values ('a4c600f1-23e3-5ffd-8542-57fd8020a141', 'fish-patties-sweet-sauce', 'קציצות-דג-אמנון-ברוטב-מתקתק', 'קציצות דג אמנון ברוטב מתקתק', 'קציצות דג אמנון טרי ברוטב מתקתק וחמצמץ של רימונים, דבש, שום ולימון. עשירות בחלבון איכותי ובוויטמינים, ומתאימות לערב החג.', '2026-01-25'::date, 'צהריים', array['עתיר חלבון']::text[], 'לא צוין', null, '14-15 קציצות', 'ca9d70f4-550e-5ad9-86df-a77177af6056', '/media/client/recipes/fish-patties-sweet-sauce.jpg', 'קציצות דג אמנון ברוטב מתקתק', 'קציצות דג אמנון ברוטב רימונים ודבש מתקתק שהן פצצת חלבון ובריאות!! מתאימות לערב החג

קציצות דג אמנון ישראלי טרי שידוע כדג עם שלל יתרונות בריאותיים וערכים תזונתיים מעולים.

עשיר בויטימנים (ביחוד ויטמין D) ומינרלים, דל בשומן ועשיר בחלבון איכותי.

והכנתי לכם מתכון מעולה וביתי לקציצות דג מתקתקות וחמצמצות עם מלא שום, דבש, לימון - מעדן! שאתם הולכים לקבל עליו ים מחמאות!', '[{"kind":"note","text":"(עבור 14-15 קציצות)"},{"kind":"sublabel","text":"לקציצות:"},{"kind":"item","text":"500 גרם פילה אמנון ישראלי טרי טחון"},{"kind":"item","text":"חופן כוסברה ופטרוליזיה קצוצות"},{"kind":"item","text":"בצל שלם"},{"kind":"item","text":"2 שיני שום"},{"kind":"item","text":"ביצה L"},{"kind":"item","text":"כף שמן זית"},{"kind":"item","text":"מלח, פלפל"},{"kind":"item","text":"כף דבש"},{"kind":"sublabel","text":"לרוטב:"},{"kind":"item","text":"2\\1 כוס מים"},{"kind":"item","text":"1.5 כף שמן זית"},{"kind":"item","text":"2\\1 בצל לבן"},{"kind":"item","text":"3-4 שיני שום קצוצות"},{"kind":"item","text":"מיץ לימון מלימון שלם"},{"kind":"item","text":"2 כפות דבש"},{"kind":"item","text":"מלח, פלפל שחור"},{"kind":"item","text":"חופן רימונים"}]'::jsonb, '["מחממים תנור ל190 מעלות.","קוצצים את הבצל והשום ומטגנים במחבת עם שמן זית עד השחמה וריכוך.","מוסיפים את כל הרכיבים לקציצות לקערה כולל הדג הטחון , הבצל והשום (הכל יחד).","מערבבים לתערובת אחידה.","בעזרת ידיים רטובות \\ משומנת יוצרים קציצות ומניחים על תבנית עם נייר אפיה משומן קלות.","מכניסים לתנור לאפיה של 20 דקות .","בינתיים נכין את הרוטב : מחממים שמן זית על מחבת רחבה ומטגנים בצל ושום.","מוסיפים את המים, הלימון, הדבש והתיבול ומביאים לרתיחה עד שהרוטב מצטמצם.","כאשר הקציצות יוצאות מהתנור מניחים אותן בצורה מסודרת בתוך המחבת \\ סיר עם הרוטב, מכסים ומבשלים כ 15 דקות נוספות , ניתן בעזרת כף לקחת מהרוטב ולפזר על הקציצות."]'::jsonb, '', '', '{"ingredients":"רכיבים","steps":"אופן הכנה","tip":"טיפ"}'::jsonb, 'published'::public.content_status, '2026-01-25T00:00:00Z'::timestamptz)
on conflict (id) do update set
  legacy_slug = excluded.legacy_slug,
  title = excluded.title,
  description = excluded.description,
  date = excluded.date,
  category = excluded.category,
  tags = excluded.tags,
  prep_time_text = excluded.prep_time_text,
  prep_minutes = excluded.prep_minutes,
  servings = excluded.servings,
  image_id = excluded.image_id,
  image_path = excluded.image_path,
  image_alt = excluded.image_alt,
  intro = excluded.intro,
  ingredients = excluded.ingredients,
  steps = excluded.steps,
  tip = excluded.tip,
  extra = excluded.extra,
  headings = excluded.headings;
insert into public.recipes (id, slug, legacy_slug, title, description, date, category, tags, prep_time_text, prep_minutes, servings, image_id, image_path, image_alt, intro, ingredients, steps, tip, extra, headings, status, published_at)
values ('a28117e3-e2c6-575a-8a63-36c4d12ad1b7', 'flourless-brownies', 'בראוניז-ללא-קמח-מ4-מרכיבים', 'בראוניז ללא קמח מ4 מרכיבים', 'בראוניז פאדגים ורכים בלי קמח בכלל, מ-4 מרכיבים בסיסיים בלבד, ללא גלוטן ואפילו דלי קלוריות. קלים להכנה ומפנקים.', '2026-01-21'::date, 'מתוקים', array['ללא גלוטן', 'דל קלוריות', 'קל ומהיר']::text[], 'לא צוין', null, '12 חתיכות', '82b6ffac-32f6-5649-85e6-08062115e155', '/media/client/recipes/flourless-brownies.jpg', 'בראוניז ללא קמח מ4 מרכיבים', 'בראוניז פאדג’ים ורכים, בלי קמח בכלל, מ4 מרכיבים, ללא גלוטן ואפילו דלי קלוריות

תקשיבו אני גם בהלם מכמה שהבראוניז האלו יצאו מושלמים!!

עזבו שהם מכילים רק 4 רכיבים דיי בסיסים, הם קלים להכנה וכל כך טעימים, מפנקים ורכים

שבא לנו משהו שוקולדי ומפנק אבל גם שיהיה גם יחסית מאוזן.

ממליצה לכם לשמור אותם במקפיא, זה הופך אותם לעוד יותר טעימים. סמכו עליי', '[{"kind":"note","text":"(עבור 12 חתיכות)"},{"kind":"item","text":"100 גרם שוקולד מריר (משתמשת בללא סוכר)"},{"kind":"item","text":"50 גרם חמאה"},{"kind":"item","text":"3 ביצים L מופרדות"},{"kind":"item","text":"1/2 כוס תחליף סוכר / סוכר"}]'::jsonb, '["מחממים תנור ל180 מעלות.","מפרידים את הביצים ומקציפים את החלבונים (הלבן) עם הסוכר עד לקבלת תערובת בהירה וקיצפית.","בינתיים ממיסים בסיר/ במיקרו את השוקולד עם החמאה ושופכים לתוך קערה, מוסיפים את החלמוני ביצה ומערבבים.","מעבירים לקערה של השוקולד, החמאה והחלמונים את הקצף של החלבונים והסוכר בעדינות ומאחדים בקיפולים.","מעבירים לתבנית משומנת עם נייר אפיה ואופים כ30 דקות עד שמכניסים קיסם והוא יוצא עם מעט פירורים. תיהנו!!"]'::jsonb, '', '### ערכים תזונתיים לחתיכה מתוך 12 (עם תחליף סוכר):

- אנרגיה (קלוריות) - 99 קק"ל.
- שומן - 8.5 גרם.
- חלבון - 2.8 גרם.
- פחמימה - 8 גרם.

### ערכים תזונתיים לחתיכה מתוך 12 (עם סוכר רגיל):

- אנרגיה (קלוריות) - 132 קק"ל.
- שומן - 8.5 גרם.
- חלבון - 2.8 גרם.
- פחמימה - 12.1 גרם.', '{"ingredients":"רכיבים","steps":"אופן הכנה","tip":"טיפ"}'::jsonb, 'published'::public.content_status, '2026-01-21T00:00:00Z'::timestamptz)
on conflict (id) do update set
  legacy_slug = excluded.legacy_slug,
  title = excluded.title,
  description = excluded.description,
  date = excluded.date,
  category = excluded.category,
  tags = excluded.tags,
  prep_time_text = excluded.prep_time_text,
  prep_minutes = excluded.prep_minutes,
  servings = excluded.servings,
  image_id = excluded.image_id,
  image_path = excluded.image_path,
  image_alt = excluded.image_alt,
  intro = excluded.intro,
  ingredients = excluded.ingredients,
  steps = excluded.steps,
  tip = excluded.tip,
  extra = excluded.extra,
  headings = excluded.headings;
insert into public.recipes (id, slug, legacy_slug, title, description, date, category, tags, prep_time_text, prep_minutes, servings, image_id, image_path, image_alt, intro, ingredients, steps, tip, extra, headings, status, published_at)
values ('ab1289e1-1c74-5679-834f-b26ad4bdf975', 'green-curry-stir-fry', 'מוקפץ-קארי-ירוק-טבעוני-ללא-גלוטן', 'מוקפץ קארי ירוק טבעוני, ללא גלוטן', 'מנה טבעונית משביעה בסיר אחד: מוקפץ נודלס קארי ירוק עם טופו וירקות ירוקים, שמשלבת ירקות, פחמימה, חלבון ושומן לארוחת צהריים או ערב.', '2026-01-07'::date, 'ערב', array['טבעוני', 'ללא גלוטן']::text[], 'לא צוין', null, null, '0ee67b73-be88-5acf-8d39-0afc657c60d5', '/media/client/recipes/green-curry-stir-fry.jpg', 'מוקפץ קארי ירוק טבעוני, ללא גלוטן', '**מוקפץ קארי ירוק עם טופו וירקות ירוקים, מנה טבעונית וטעימה**

אני יודעת שלא כולם אוהבים קארי ושהעולם מתחלק לאנשים שאוהבים קארי ואנשים שבכלל לא אוהבים. אני בצד האוהב אם היה קשה לנחש, אבל שתדעו שלא תמיד הייתי שם וזו אהבה שנוצרה בשנתיים האחרונות, אז החלטתי להכין לראשונה קארי! מדובר על אחלה מנה משביעה לארוחת צהריים/ערב שמכילה גם ירקות, גם פחמימה, גם חלבון וגם שומן, הכל בסיר אחד.', '[{"kind":"sublabel","text":"לטופו:"},{"kind":"item","text":"חבילת טופו (300 גרם)"},{"kind":"item","text":"1 כף קורנפלור"},{"kind":"sublabel","text":"למוקפץ:"},{"kind":"item","text":"2 כפות שמן זית"},{"kind":"item","text":"1 חבילת אטריות אורז (500 גרם)"},{"kind":"item","text":"1 ברוקולי טרי מפורק לפרחים"},{"kind":"item","text":"1 חבילת פטריות פרוסות"},{"kind":"item","text":"1 בצל חתוך לרצועות"},{"kind":"item","text":"באק צ’וי/תרד/ ירוקים שתרצו"},{"kind":"item","text":"פטריות שימאגי (לא חובה אבל מוסיף)"},{"kind":"item","text":"צרור בצל ירוק"},{"kind":"sublabel","text":"רוטב:"},{"kind":"item","text":"400 גרם קרם קוקוס (שמתי 17%)"},{"kind":"item","text":"חופן תרד"},{"kind":"item","text":"חופן בזיליקום"},{"kind":"item","text":"חופן כוסברה"},{"kind":"item","text":"2 כפות מחית קארי ירוק"},{"kind":"item","text":"2 כפות רוטב סויה דלת נתרן"},{"kind":"item","text":"1 כפית סילאן"},{"kind":"item","text":"2 שיני שום"},{"kind":"note","text":"**להגשה:** בצל ירוק, כוסברה, בוטנים גרוסים","inline":true}]'::jsonb, '["חותכים וקוצצים מראש את כל הירקות.","חותכים את הטופו לקוביות, מעבירים לקערה ומוסיפים את הקורנפלור, מערבבים.","מחממים במחבת רחבה/ווק 2 כפות שמן זית ומוסיפים את הטופו, מטגנים 2-3 דקות.","מוסיפים את הבצל, הברוקולי, הפטריות והבאק צוי ומטגנים כ5 דקות עד ריכוך קל של הירקות.","טוחנים את כל רכיבי הרוטב במעבד מזון ושופכים את הרוטב מעל כל הירקות.","מביאים לרתיחה שהרוטב יעטוף את הירקות.","מוסיפים אטריות שבישלנו ע״פ הוראות ההכנה על גבי האריזה.","מערבבים ומבשלים כמה דקות.","מוסיפים את הבצל הירוק.","ולפני הגשה נפזר עוד בצל ירוק, כוסברה ובוטנים. בתיאבון😋"]'::jsonb, '', '', '{"ingredients":"רכיבים","steps":"אופן הכנה","tip":"טיפ"}'::jsonb, 'published'::public.content_status, '2026-01-07T00:00:00Z'::timestamptz)
on conflict (id) do update set
  legacy_slug = excluded.legacy_slug,
  title = excluded.title,
  description = excluded.description,
  date = excluded.date,
  category = excluded.category,
  tags = excluded.tags,
  prep_time_text = excluded.prep_time_text,
  prep_minutes = excluded.prep_minutes,
  servings = excluded.servings,
  image_id = excluded.image_id,
  image_path = excluded.image_path,
  image_alt = excluded.image_alt,
  intro = excluded.intro,
  ingredients = excluded.ingredients,
  steps = excluded.steps,
  tip = excluded.tip,
  extra = excluded.extra,
  headings = excluded.headings;
insert into public.recipes (id, slug, legacy_slug, title, description, date, category, tags, prep_time_text, prep_minutes, servings, image_id, image_path, image_alt, intro, ingredients, steps, tip, extra, headings, status, published_at)
values ('499bd416-8ea8-5299-808d-4ba33cc9d727', 'green-shakshuka', 'שקשוקה-ירוקה-שקשוקת-תרד-חלומית', 'שקשוקה ירוקה - שקשוקת תרד חלומית', 'שקשוקת תרד ירוקה כמו בבתי קפה, בגרסה מאוזנת ובריאה יותר: עשירה בעלים ובוויטמינים, קלה להכנה ומתאימה לארוחת בוקר, ערב או בראנץ''.', '2026-01-21'::date, 'בוקר', array['צמחוני', 'קל ומהיר']::text[], 'לא צוין', null, null, 'ad3e582d-c1fa-5f84-8207-0bb0cd068cc8', '/media/client/recipes/green-shakshuka.jpg', 'שקשוקה ירוקה - שקשוקת תרד חלומית', 'שקשוקת תרד ירוקה בדיוק כמו בבתי קפה

רק מאוזנת ובריאה יותר, עשירה בעלים, ויטמינים וקלה להכנה!

נכון בכל בית קפה יש שקשוקה ירוקה שניראת הכי טוב בתפריט? אז כזאת.

שבא לכם ארוחת ערב \ בוקר \ בראנצ'' טעימה ומגוונת אבל שעדיין תהיה בריאה, השקשוקה המעולה הזאת היא לגמרי הפיתרון שלכם.', '[{"kind":"item","text":"1 שקית עלי תרד (300 גרם)"},{"kind":"item","text":"חופן עלי בזיליקום טריים (10-12 עלים)"},{"kind":"item","text":"125 מ״ל שמנת לבישול 9% (2\\1 מיכל)"},{"kind":"item","text":"1 בצל בינוני"},{"kind":"item","text":"2 שיני שום כתושות"},{"kind":"item","text":"2 כפות שמן זית"},{"kind":"item","text":"3-4 ביצים"},{"kind":"item","text":"תבלינים- 2\\1 כפית מלח, 4\\1 כפית פלפל שחור גרוס, 2\\1 כפית אגוז מוסקט"},{"kind":"item","text":"אופציונלי: גבינת פטה"}]'::jsonb, '["קוצצים את הבצל לקוביות \\ רצועות.","מחממים מחבת עם שמן זית ומוסיפים את הבצל עד להזהבה וריכוך ולאחר מכן את השום.","טוחנים בבלנדר / מעבד מזון את התרד והבזיליקום למרקם סמיך ומעבירים למחבת החמה עם הבצל והשום.","מוסיפים את השמנת לבישול ואת התבלינים, מערבבים ומבשלים על אש נמוכה כ-5 דקות.","מוסיפים את הביצים בזהירות, מכסים עם מכסה ומבשלים בערך 6-7 דקות על אש בינונית עד שהביצים מוכנות לפי מידת העשייה שאנחנו אוהבים. מומלץ לאכול לצד סלט ולחם טוב לקבלת ארוחה מלאה ומאוזנת!"]'::jsonb, '', '', '{"ingredients":"רכיבים","steps":"אופן הכנה","tip":"טיפ"}'::jsonb, 'published'::public.content_status, '2026-01-21T00:00:00Z'::timestamptz)
on conflict (id) do update set
  legacy_slug = excluded.legacy_slug,
  title = excluded.title,
  description = excluded.description,
  date = excluded.date,
  category = excluded.category,
  tags = excluded.tags,
  prep_time_text = excluded.prep_time_text,
  prep_minutes = excluded.prep_minutes,
  servings = excluded.servings,
  image_id = excluded.image_id,
  image_path = excluded.image_path,
  image_alt = excluded.image_alt,
  intro = excluded.intro,
  ingredients = excluded.ingredients,
  steps = excluded.steps,
  tip = excluded.tip,
  extra = excluded.extra,
  headings = excluded.headings;
insert into public.recipes (id, slug, legacy_slug, title, description, date, category, tags, prep_time_text, prep_minutes, servings, image_id, image_path, image_alt, intro, ingredients, steps, tip, extra, headings, status, published_at)
values ('cc89e410-070e-50d7-824a-457f46cad11a', 'homemade-granola', 'גרנולה-ביתית-ב10-דקות-הכנה', 'גרנולה ביתית ב10 דקות הכנה', 'גרנולה ביתית משיבולת שועל ופצפוצי אורז ב-10 דקות הכנה, בריאה יותר ועם הרבה פחות סוכר מגרנולה קנויה, וכל כך פשוטה שלא חוזרים לקנות.', '2026-01-07'::date, 'בוקר', array['קל ומהיר', 'טבעוני', 'צמחוני']::text[], '10 דקות', 10, null, 'd58d5228-fcfc-5687-8e25-9f305e822583', '/media/client/recipes/homemade-granola.jpg', 'גרנולה ביתית ב10 דקות הכנה', 'גרנולת שיבולת שועל ופצפוצי אורז שהיא הכי טעימה שיש וקלה ביותר להכנה.

למה לקנות גרנולה בסופר שאפשר להכין אותה ב10 דקות בצורה הרבה יותר בריאה ועם הרבה פחות סוכר??

ואחרי שמתחילים להכין אותה ומבינים כמה זה פשוט אי אפשר לחזור יותר לקנות גרנולה.

אז יום ראשון, שבוע חדש, הטיגונים של חנוכה מאחורינו וזה בדיוק הזמן לדאוג לעצמינו בגרנולה ביתית ומאוזנת לשבוע החדש.', '[{"kind":"item","text":"2 כוסות (80 גרם) פצפוצי אורז"},{"kind":"item","text":"1 כוס (90 גרם) שיבולת שועל"},{"kind":"item","text":"1/2 כוס של אגוזים וגרעינים מכל סוג ניתן לשלב - אני הוספתי 1/4 כוס גרעיני דלעת ו1/4 כוס שקדים פרוסים."},{"kind":"item","text":"2 כפות חמוציות ללא תוספת סוכר"},{"kind":"item","text":"1 כפית קינמון"},{"kind":"item","text":"3 כפות סילאן"}]'::jsonb, '["מחממים תנור ל180 מעלות.","מערבבים את כל הרכיבים יחד בקערה גדולה.","משטחים את תערובת הגרנולה על תבנית עם נייר אפיה.","מכניסים לתנור ל5-6 דקות (הפצפוצי אורז נשרפים מהר!), פותחים את התנור מערבבים מעט ומחזירים לאפיה של 5 דקות נוספות.","מוציאים מהתנור ונותנים לגרנולה להתקרר מעט.","מעבירים לצנצנת אטומה נשמר עד חודש."]'::jsonb, '', '', '{"ingredients":"רכיבים","steps":"אופן הכנה","tip":"טיפ"}'::jsonb, 'published'::public.content_status, '2026-01-07T00:00:00Z'::timestamptz)
on conflict (id) do update set
  legacy_slug = excluded.legacy_slug,
  title = excluded.title,
  description = excluded.description,
  date = excluded.date,
  category = excluded.category,
  tags = excluded.tags,
  prep_time_text = excluded.prep_time_text,
  prep_minutes = excluded.prep_minutes,
  servings = excluded.servings,
  image_id = excluded.image_id,
  image_path = excluded.image_path,
  image_alt = excluded.image_alt,
  intro = excluded.intro,
  ingredients = excluded.ingredients,
  steps = excluded.steps,
  tip = excluded.tip,
  extra = excluded.extra,
  headings = excluded.headings;
insert into public.recipes (id, slug, legacy_slug, title, description, date, category, tags, prep_time_text, prep_minutes, servings, image_id, image_path, image_alt, intro, ingredients, steps, tip, extra, headings, status, published_at)
values ('1f220be5-91a0-5b3c-8c39-063f020e879f', 'homemade-hummus', 'חומוס-ביתי', 'חומוס ביתי', 'חומוס ביתי ב-10 דקות הכנה שמרגיש כמו החומוס בחומוסיות. קטנייה עשירה בחלבון מן הצומח ודרך מצוינת לשלב עוד קטניות בתזונה.', '2026-01-23'::date, 'צהריים', array['עתיר חלבון', 'קל ומהיר', 'טבעוני', 'צמחוני']::text[], '10 דקות', 10, null, '83cea13c-5d78-5b5c-8b63-581ceb7e5000', '/media/client/recipes/homemade-hummus.jpg', 'חומוס ביתי', 'חומוס ביתי ב10 דקות הכנה, פשוט וקל ומרגיש בדיוק כמו החומוס בחומוסיות!

אני לא יודעת אם כולכם יודעים, אבל לחומוס יש ערך תזונתי גבוהה והוא נחשב לקטנייה בריאה שעשירה בחלבון מן הצומח, וזו אחלה דרך לשלב עוד קטניות בתזונה שלנו בצורה מגוונת ושווה ביותר

מאז שהתחלתי להכין ככה חומוס, אני מכינה אוהבת להכין ולאכול רק ככה את החומוס שלי ! זה הכי טעים וכל כך פשוט!

ואפילו מתאים להריוניות שמתגעגעות לחומוס (:', '[{"kind":"item","text":"חומוס בקופסת שימורים (משקל נקי 550 גרם, לאחר סינון 290 גרם)"},{"kind":"item","text":"4 כפות טחינה גולמית"},{"kind":"item","text":"1 שן שום"},{"kind":"item","text":"מיץ לימון מלימון שלם"},{"kind":"item","text":"1/2 כוס מי חומוס מהשימורים"},{"kind":"item","text":"2\\1 כפית מלח"},{"kind":"item","text":"1/2 כפית כמון"},{"kind":"item","text":"אופציונאלי : מומלץ להגיש עם ביצה קשה, כוסברה/פטרוזיליה, שמן זית בנדיבות, פפריקה."}]'::jsonb, '["מסננים את גרגרי החומוס מהשימורים ושומרים 1/2 כוס מהמים בצד.","מכניסים לבלנדר את כל הרכיבים וטוחנים הכל עד למרקם חלק של חומוס (אפשר שישארו בפנים מעט חתיכות של גרגרים זה מוסיף).","מעבירים את התכולה לצלחת עמוקה.","מוסיפים מעל את הביצה ושאר התוספות.","מנגבים עם פיתה באהבה ובתאבון."]'::jsonb, '', '', '{"ingredients":"רכיבים","steps":"אופן הכנה","tip":"טיפ"}'::jsonb, 'published'::public.content_status, '2026-01-23T00:00:00Z'::timestamptz)
on conflict (id) do update set
  legacy_slug = excluded.legacy_slug,
  title = excluded.title,
  description = excluded.description,
  date = excluded.date,
  category = excluded.category,
  tags = excluded.tags,
  prep_time_text = excluded.prep_time_text,
  prep_minutes = excluded.prep_minutes,
  servings = excluded.servings,
  image_id = excluded.image_id,
  image_path = excluded.image_path,
  image_alt = excluded.image_alt,
  intro = excluded.intro,
  ingredients = excluded.ingredients,
  steps = excluded.steps,
  tip = excluded.tip,
  extra = excluded.extra,
  headings = excluded.headings;
insert into public.recipes (id, slug, legacy_slug, title, description, date, category, tags, prep_time_text, prep_minutes, servings, image_id, image_path, image_alt, intro, ingredients, steps, tip, extra, headings, status, published_at)
values ('bf6e674b-4d18-5efe-88a2-5dca568cfa27', 'moroccan-fish', 'דגים-מרוקאים-של-שישי', 'דגים מרוקאים של שישי', 'סיר דגים מרוקאים חריפים ליום שישי עם יחסית מעט שמן, רוטב עשיר שכיף לנגב עם חלה, מנה ביתית בריאה ומלאה בחלבון וקטניות.', '2026-01-07'::date, 'ערב', array['עתיר חלבון', 'ללא גלוטן']::text[], 'לא צוין', null, null, '0ff3c5d7-022f-5828-8112-ed1075f07753', '/media/client/recipes/moroccan-fish.jpg', 'דגים מרוקאים של שישי', 'סיר דגים מרוקאים חריפים של יום שישי הכי מפנקים וטעימים שיש ובלי הרבה שמן.

הדגים המרוקאים שלי שאני מכינה בכל שבת וכל פעם מלקקים את האצבעות! רוב המתכונים לדגים של שישי מכילים הרבה שמן, אני מכינה אותם עם יחסית מעט שמן והם עדיין יוצאים הכי טעימים ומפנקים שיש! לא כבדים מידי, עם הרבה רוטב שהכי כיף לנגב עם החלה.

כמעט כל שישי שאני מצלמת לסטורי את הדגים שהכנתי לקידוש אני מקבלת ים בקשות של מתכון! ואתם לגמרי צודקים, אז הגיע הזמן.

באמת שזה לא קשה להכנה והסיר הזה כל כך שווה את זה, מנה כל כך טעימה, מפנקת, שנותנת תחושה של בית, של שבת, חריפה ועשירה בטעמים וגם בריאה ומלאה בחלבון ואפילו קטניות! חייבים לנסות את זה ליום שישי הקרוב.', '[{"kind":"item","text":"7-8 פילה דג אמנון/לברק/דניס/מוסר"},{"kind":"item","text":"2 כפות שמן זית"},{"kind":"item","text":"1 פלפל אדום (גמבה)"},{"kind":"item","text":"1 עגבניה"},{"kind":"item","text":"10-12 עגבניות שרי"},{"kind":"item","text":"10 שיני שום"},{"kind":"item","text":"1 קופסת גרגרי חומוס שימורים"},{"kind":"item","text":"1 פלפל ירוק חריף"},{"kind":"item","text":"1 כפית מלח"},{"kind":"item","text":"1 כפית פפריקה מתוקה"},{"kind":"item","text":"1 כוס מים רותחים"},{"kind":"item","text":"1 צרור כוסברה"},{"kind":"sublabel","text":"רוטב:"},{"kind":"item","text":"1 כפית מלח"},{"kind":"item","text":"1 כפית פפריקה"},{"kind":"item","text":"1 כפית שום גבישי"},{"kind":"item","text":"1/2 כפית פלפל שחור טחון"},{"kind":"item","text":"2 כפות רסק עגבניות מרוכז"},{"kind":"item","text":"1/4 כוס שמן זית"},{"kind":"item","text":"2 כוסות מים"},{"kind":"item","text":"מעל הדגים מוסיפים עוד כוסברה לאחר הבישול"}]'::jsonb, '["חותכים את הגמבה, העגבניות, הפלפל החריף וקולפים את השיני שום.","מחממים במחבת סוטאז’ רחבה 2 כפות שמן זית ומוסיפים את הגמבה ולאחר מכן את העגבניות, הפלפל החריף, הכוסברה והשום.","מטגנים כמה דקות עד לריכוך עם מכסה סגור ומוסיפים את החומוסים.","מוסיפים מלח, פפריקה וכוס מים ומערבבים.","כשהגמבות מתרככות מעט מוסיפים את הדגים בעדינות אחד ליד השני.","מכסים ומביאים לרתיחה.","בינתיים מכינים את הרוטב- מערבבים את רכיבי הרוטב בקערה.","שופכים את הרוטב מעל הדגים, מביאים לרתיחה, מכסים, מורידים את לאש בינונית-נמוכה ומבשלים כחצי שעה.","מעל הדגים מפזרים עוד מלא כוסברה הכי טעים!","מומלץ לנגב עם חלה טריה, שבת שלום🤍🤍"]'::jsonb, '', '', '{"ingredients":"רכיבים","steps":"אופן הכנה","tip":"טיפ"}'::jsonb, 'published'::public.content_status, '2026-01-07T00:00:00Z'::timestamptz)
on conflict (id) do update set
  legacy_slug = excluded.legacy_slug,
  title = excluded.title,
  description = excluded.description,
  date = excluded.date,
  category = excluded.category,
  tags = excluded.tags,
  prep_time_text = excluded.prep_time_text,
  prep_minutes = excluded.prep_minutes,
  servings = excluded.servings,
  image_id = excluded.image_id,
  image_path = excluded.image_path,
  image_alt = excluded.image_alt,
  intro = excluded.intro,
  ingredients = excluded.ingredients,
  steps = excluded.steps,
  tip = excluded.tip,
  extra = excluded.extra,
  headings = excluded.headings;
insert into public.recipes (id, slug, legacy_slug, title, description, date, category, tags, prep_time_text, prep_minutes, servings, image_id, image_path, image_alt, intro, ingredients, steps, tip, extra, headings, status, published_at)
values ('fb5819e5-a303-55a4-872d-113512fd3768', 'oatmeal-chocolate-chip-cookies', 'עוגיות-שוקולד-צ-יפס-שיבולת-שועל', 'עוגיות שוקולד צ''יפס שיבולת שועל', 'עוגיות שיבולת שועל ושוקולד צ''יפס בריאות משישה מרכיבים בלבד, קלות להכנה ומזינות, עם פירוט ערכים תזונתיים לכל עוגיה.', '2026-01-23'::date, 'מתוקים', array['צמחוני', 'קל ומהיר']::text[], 'לא צוין', null, '14 עוגיות', '80dcf5f9-95fe-573e-8272-a6dbf310435f', '/media/client/recipes/oatmeal-chocolate-chip-cookies.jpg', 'עוגיות שוקולד צ''יפס שיבולת שועל', 'עוגיות בריאות שיבולת שועל ושוקולד ציפס , מ-6 מרכיבים בלבד וקלות להכנה.

עוגיות שוקולד צ''יפס הן אחד הדברים שאני הכי אוהבת , בכל רגע ושעה ביום .

אז בהתאם לבלוג , הכנתי אותם בגרסה הבריאה יותר , משיבולת שועל שתהפוך אותן למזינות יותר ותעלה להן את הערכים התזונתיים!

(ערכים תזונתיים רשומים בסוף העמוד)', '[{"kind":"note","text":"(עבור 14 עוגיות)"},{"kind":"item","text":"1 (90 גרם) כוס שיבולת שועל דקה"},{"kind":"item","text":"1/2 כוס קמח שיבולת שועל (טוחנים שיבולת שועל בבלנדר לקמח)"},{"kind":"item","text":"1 כפית אבקת אפיה"},{"kind":"item","text":"1/2 כפית קינמון (לא חובה)"},{"kind":"item","text":"1 ביצה L"},{"kind":"item","text":"1/4 כוס מייפל טבעי/סילאן/דבש"},{"kind":"item","text":"3 כפות חמאת בוטנים/טחינה גולמית/חמאת שקדים"},{"kind":"item","text":"35 גרם (חופן) שוקולד צ’יפס מריר/שוקולד קצוץ לחתיכות"}]'::jsonb, '["מחממים תנור ל180 מעלות.","מערבבים בקערה את הרכיבים היבשים (שיבולת שועל, קמח שיבולת שועל, אבקת אפיה וקינמון).","מוסיפים את הביצה, המייפל והחמאת בוטנים/חמאת אגוזים אחרת ומערבבים עד לקבלת בצק אחיד ודביק.","מוסיפים את השוקולד ציפס ומערבבים לפיזור אחיד.","מכניסים את הבצק ל10 דקות למקרר להתייצבות.","יוצרים בעזרת ידיים מעט רטובות/ בעזרת כף גלידה עוגיות ומניחים על תבנית עם נייר אפיה.","אופים כ10-12 דקות! עד שהעוגיות משחימות, מחכים שהן יצטננו ואוכלים בהנאה."]'::jsonb, '', '### ערכים תזונתיים לעוגיה מתוך 14:

אנרגיה (קלוריות) - 89 קק"ל.

שומן - 4 גרם.

חלבון- 2.7 גרם.

פחמימה- 11 גרם.', '{"ingredients":"רכיבים","steps":"אופן הכנה","tip":"טיפ"}'::jsonb, 'published'::public.content_status, '2026-01-23T00:00:00Z'::timestamptz)
on conflict (id) do update set
  legacy_slug = excluded.legacy_slug,
  title = excluded.title,
  description = excluded.description,
  date = excluded.date,
  category = excluded.category,
  tags = excluded.tags,
  prep_time_text = excluded.prep_time_text,
  prep_minutes = excluded.prep_minutes,
  servings = excluded.servings,
  image_id = excluded.image_id,
  image_path = excluded.image_path,
  image_alt = excluded.image_alt,
  intro = excluded.intro,
  ingredients = excluded.ingredients,
  steps = excluded.steps,
  tip = excluded.tip,
  extra = excluded.extra,
  headings = excluded.headings;
insert into public.recipes (id, slug, legacy_slug, title, description, date, category, tags, prep_time_text, prep_minutes, servings, image_id, image_path, image_alt, intro, ingredients, steps, tip, extra, headings, status, published_at)
values ('cf28635c-291c-56f9-8005-db1567fe5ac9', 'one-pot-bulgur-stew', 'תבשיל-בורגול-בסיר-אחד', 'תבשיל בורגול בסיר אחד', 'תבשיל בורגול, ירקות וקטניות בסיר אחד: 20 דקות הכנה וארוחת צהריים בריאה, משביעה ומאוזנת, גם בימים שאין כוח להסתבך במטבח.', '2026-01-25'::date, 'צהריים', array['טבעוני', 'קל ומהיר']::text[], '20 דקות', 20, null, 'cb73a810-0018-5ec0-86ff-8319193b6618', '/media/client/recipes/one-pot-bulgur-stew.jpg', 'תבשיל בורגול בסיר אחד', 'תבשיל בורגול, ירקות וקטניות בסיר אחד

סיר מאוזן וקליל, של 20 דקות הכנה ויש לכם ארוחת צהריים בריאה, משביעה ומאוזנת

מאז שהכנתי את זה פעם ראשונה אני לא יכולה להכין בורגול בצורה שונה

אתם לא מבינים איזה טעים זה יוצא!

מתכון שהולך לסדר אתכם בימים שאין לכם כוח להסתבך במטבח אבל בא לכם לדאוג לעצמכם במנה בריאה וטובה', '[{"kind":"item","text":"1 בצל שלם"},{"kind":"item","text":"2 שיני שום כתושות"},{"kind":"item","text":"2 גזרים מגורדים"},{"kind":"item","text":"1 קישוא / זוקיני מגורד"},{"kind":"item","text":"1 כוס גרגרי חומוס (משימורים/קפואים)"},{"kind":"item","text":"2 כפות שמן זית"},{"kind":"item","text":"1 כוס בורגול"},{"kind":"item","text":"2 כוסות מים רותחים"},{"kind":"item","text":"תיבול: חצי כפית מלח, 1/4 כפית פלפל שחור, 1/2 כפית כורכום, כפית קינמון, 1/2 כפית שום גבישי"}]'::jsonb, '["קוצצים את הבצל, את השום ומגרדים את שאר את הירקות.","מטגנים את הבצל, השום, הגזר, הקישוא/תרד ומכסים את הסיר ל5 דקות לריכוך הירקות, מערבבים.","מוסיפים את גרגרי החומוס.","מוסיפים את הבורגול ואת המים הרותחים.","מתבלים, מערבבים ומכסים את הסיר ל15 דקות בישול על אש בינונית.","מערבבים, טועמים ואם חסר משהו- מוסיפים. בתיאבון."]'::jsonb, '', '', '{"ingredients":"רכיבים","steps":"אופן הכנה","tip":"טיפ"}'::jsonb, 'published'::public.content_status, '2026-01-25T00:00:00Z'::timestamptz)
on conflict (id) do update set
  legacy_slug = excluded.legacy_slug,
  title = excluded.title,
  description = excluded.description,
  date = excluded.date,
  category = excluded.category,
  tags = excluded.tags,
  prep_time_text = excluded.prep_time_text,
  prep_minutes = excluded.prep_minutes,
  servings = excluded.servings,
  image_id = excluded.image_id,
  image_path = excluded.image_path,
  image_alt = excluded.image_alt,
  intro = excluded.intro,
  ingredients = excluded.ingredients,
  steps = excluded.steps,
  tip = excluded.tip,
  extra = excluded.extra,
  headings = excluded.headings;
insert into public.recipes (id, slug, legacy_slug, title, description, date, category, tags, prep_time_text, prep_minutes, servings, image_id, image_path, image_alt, intro, ingredients, steps, tip, extra, headings, status, published_at)
values ('5cdfd65f-4ac8-5b78-8b3b-253b5682605c', 'protein-cheesecake', 'עוגת-גבינה-אפויה-דלת-קלוריות-ועשירה-בחלבון', 'עוגת גבינה אפויה דלת קלוריות ועשירה בחלבון', 'עוגת גבינה אפויה עשירה בחלבון, דלה בקלוריות ומופחתת סוכר, שטעמה כמו עוגת גבינה רגילה, עם ערכים תזונתיים לכל פרוסה.', '2026-01-25'::date, 'מתוקים', array['עתיר חלבון', 'דל קלוריות', 'צמחוני']::text[], 'לא צוין', null, '13 פרוסות', 'e7d6ff09-5351-521e-81a0-24bfedfa3b57', '/media/client/recipes/protein-cheesecake.jpg', 'עוגת גבינה אפויה דלת קלוריות ועשירה בחלבון', 'עוגת גבינה אפויה בריאה עשירה בחלבון, דלה בקלוריות, מופחתת סוכר וטעימה ביותר!

באמת שלא תרגישו בהבדל בטעם מעוגת גבינה רגילה, המשפחה שלי שחולה על עוגות גבינה חיסלה אותה תוך יום.

שתדעו שתמיד היה לי חשש מעוגות גבינה אפויות, היה נראה לי מסובך ועם הרבה שלבים, אבל שחררתי את החשש ועשיתי קצת נסיונות והבנתי שזה ממש לא מסובך כמו שחשבתי
ושאפשר לעשות עוגת גבינה טעימה ואפילו בריאה בלי יותר מידי באלגן!', '[{"kind":"note","text":"(עבור תבנית עגולה בקוטר 24 ס\"מ - 13 פרוסות עוגה)"},{"kind":"item","text":"500 גרם גבינה לבנה 5%"},{"kind":"item","text":"200 גרם (גביע) יוגורט פרו וניל"},{"kind":"item","text":"4 ביצים מופרדות לחלמונים וחלבונים"},{"kind":"item","text":"4 כפות קורנפלור"},{"kind":"item","text":"2 כפות גדושות פודינג וניל"},{"kind":"item","text":"4 כפות תחליף סוכר"},{"kind":"item","text":"1 כפית תמצית וניל"}]'::jsonb, '["מחממים תנור ל-170 מעלות.","מערבבים בקערה את הגבינה, היוגורט, 4 חלמוני ביצה (הצהוב), קורנפלור, פודינג וניל ותמצית וניל עד לקבלת תערובת חלקה ואחידה.","בקערת מיקסר עם בלון הקצפה מקציפים את החלבונים עם התחליף סוכר\\ סוכר עד לקצפת אחידה.","שופכים את הקצפת לקערת הגבינות בתנועות של קיפולים עדינים עד לאיחוד מלא.","שופכים את הבלילה לתבנית עגולה.","מניחים בתחתית התנור תבנית גדולה עם מים ומעליה / בתוכה נניח את התבנית עם בלילת העוגה (זה מונע מהעוגה לצנוח בגלל האדי מים בתנור).","אופים את העוגה 40-50 דקות עד שהיא נהיית זהובה מלמעלה (לא לפתוח במהלך האפיה היא תצנח) וכשהיא מוכנה משאירים אותה בפנים 20-30 דקות להתקרר. לאחר מכן אפשר להוציא ולפרוס."]'::jsonb, '', 'מומלץ להוסיף אבקת סוכר מעל זה ממש מוסיף. וזה הכי טעים לאכול אותה אחרי לילה במקרר.

נשמרת במקרר.

### ערכים תזונתיים לפרוסה מתוך 13 (עם תחליף סוכר):

אנרגיה (קלוריות) - 89 קק"ל.
שומן - 4 גרם.
חלבון- 7.6 גרם.
פחמימה- 5.5 גרם.

### ערכים תזונתיים לפרוסה מתוך 13 (עם סוכר רגיל):

אנרגיה (קלוריות) - 120 קק"ל.
שומן -- 4 גרם.
חלבון- 7.6 גרם.
פחמימה- 13.4 גרם.', '{"ingredients":"רכיבים","steps":"אופן הכנה","tip":"טיפ"}'::jsonb, 'published'::public.content_status, '2026-01-25T00:00:00Z'::timestamptz)
on conflict (id) do update set
  legacy_slug = excluded.legacy_slug,
  title = excluded.title,
  description = excluded.description,
  date = excluded.date,
  category = excluded.category,
  tags = excluded.tags,
  prep_time_text = excluded.prep_time_text,
  prep_minutes = excluded.prep_minutes,
  servings = excluded.servings,
  image_id = excluded.image_id,
  image_path = excluded.image_path,
  image_alt = excluded.image_alt,
  intro = excluded.intro,
  ingredients = excluded.ingredients,
  steps = excluded.steps,
  tip = excluded.tip,
  extra = excluded.extra,
  headings = excluded.headings;
insert into public.recipes (id, slug, legacy_slug, title, description, date, category, tags, prep_time_text, prep_minutes, servings, image_id, image_path, image_alt, intro, ingredients, steps, tip, extra, headings, status, published_at)
values ('3a9e6495-3dc8-5a94-85b6-577b8036636f', 'protein-pancakes', 'פנקייקים-בריאים-עשירים-בחלבון', 'פנקייקים בריאים עשירים בחלבון', 'פנקייקים עשירים בחלבון ודלים בקלוריות מחמישה מרכיבים בלבד. מתכון קל וכיפי שאפשר להכין גם עם ילדים, לארוחת בוקר מתוקה ומאוזנת או לנשנוש בין הארוחות.', '2026-01-21'::date, 'בוקר', array['עתיר חלבון', 'דל קלוריות', 'צמחוני', 'קל ומהיר']::text[], 'לא צוין', null, '13 פנקייקים קטנים', null, null, null, 'פנקייקים עשירים בחלבון ודלים בקלוריות , מ5 מרכיבים!

תשמרו את המתכון הזה לארוחת בוקר הבאה שלכם או אפילו לנשנוש מפנק בין הארוחות!

מתכון קל שאפשר להכין גם עם ילדים.

מדובר בפנקייקים הכי פשוטים וכיפיים שיש, לרגעים שבא לנו בוקר מתוק וטעים אבל גם מאוזן, עם ערכים מעולים שמתאימים גם למתאמנים .

(ערכים תזונתיים רשומים בסוף העמוד)', '[{"kind":"note","text":"(עבור 13 פנקייקים קטנים-בינוניים)"},{"kind":"item","text":"4 כפות שיבולת שועל דקה (40 גרם)"},{"kind":"item","text":"ביצה L"},{"kind":"item","text":"200 גרם (גביע) יוגורט פרו וניל"},{"kind":"item","text":"1 כף סוויטאנגו/תחליף סוכר/סוכר"},{"kind":"item","text":"1/2 כפית אבקת אפיה"},{"kind":"item","text":"1/2 כפית קינמון"}]'::jsonb, '["שמים בנינגה/בלנדר את כל הרכיבים לפנקייקים וטוחנים עד לקבלת תערובת חלקה.","נחמם מחבת ונרסס מעט שמן, יוצקים בעזרת כף גלידה/ישר מהבלנדר מהבלילה למחבת.","כאשר יש בועות קטנות על הפנקייקים אפשר להפוך לצד השני ומטגנים דקה נוספת על אש בינונית/נמוכה.","חוזרים על הפעולות עד שנגמרת הבלילת פנקייקים.","מומלץ להגיש עם מייפל טבעי/ שוקולד/יוגורט פרו/ פירות.."]'::jsonb, '', '### ערכים תזונתיים עבור כל הכמות:

אנרגיה (קלוריות) - 367 קק"ל.

שומן - 9.7 גרם.

חלבון- 32.9 גרם.

פחמימה- 51.8 גרם.', '{"ingredients":"רכיבים","steps":"אופן הכנה","tip":"טיפ"}'::jsonb, 'published'::public.content_status, '2026-01-21T00:00:00Z'::timestamptz)
on conflict (id) do update set
  legacy_slug = excluded.legacy_slug,
  title = excluded.title,
  description = excluded.description,
  date = excluded.date,
  category = excluded.category,
  tags = excluded.tags,
  prep_time_text = excluded.prep_time_text,
  prep_minutes = excluded.prep_minutes,
  servings = excluded.servings,
  image_id = excluded.image_id,
  image_path = excluded.image_path,
  image_alt = excluded.image_alt,
  intro = excluded.intro,
  ingredients = excluded.ingredients,
  steps = excluded.steps,
  tip = excluded.tip,
  extra = excluded.extra,
  headings = excluded.headings;
insert into public.recipes (id, slug, legacy_slug, title, description, date, category, tags, prep_time_text, prep_minutes, servings, image_id, image_path, image_alt, intro, ingredients, steps, tip, extra, headings, status, published_at)
values ('61bf5821-d8f3-5649-8b80-dc28e9b86507', 'quinoa-citrus-salad', 'סלט-קינואה-ברוטב-ויניגרט-הדרים-דבש', 'סלט קינואה ברוטב ויניגרט הדרים דבש', 'סלט קינואה גדול, בריא ומשביע ברוטב ויניגרט הדרים ודבש שמכינים בקלי קלות: ארוחה שלמה עם חלבון מהצומח, הרבה ירקות, פחמימה מלאה וקטניות.', '2026-01-07'::date, 'סלטים', array['צמחוני', 'קל ומהיר']::text[], 'לא צוין', null, '5-6 מנות', '23bd15f6-9d8e-5cf8-8cd6-8f4d07d53329', '/media/client/recipes/quinoa-citrus-salad.jpg', 'סלט קינואה ברוטב ויניגרט הדרים דבש', '**סלט קינואה בריא, משביע וכל כך טעים ברוטב של ויניגרט הדרים דבש שמכינים בקלי קלות!**

באחד מהימים החודש היה יום הקינואה, אז ניצלתי את המאורע לפנק את עצמי ולעשות טוב לגוף שלי בסלט קינואה גדול ושווה בדיוק כמו שאני אוהבת.

מה שאני הכי אוהבת בסלטים האלה שהם כמו ארוחה שלמה! יש פה חלבון מהצומח, הרבה ירקות, פחמימה מלאה, קטניות וזה באמת מושלם וסופר בריא וקליל.

בקיצור יום הקינואה, לא יום הקינואה ... בשבילי זה אחלה של תזכורת לעצמי ולכם לקום לדאוג לעצמכם ולגוף שלכם באוכל אמיתי, בריא מזין וטעים. בכל יום.', '[{"kind":"item","text":"1 כוס קינואה לפני בישול (לבשל ע״פ הוראות היצרן)"},{"kind":"item","text":"2 מלפפונים"},{"kind":"item","text":"1 פלפל צהוב"},{"kind":"item","text":"1/2 בצל סגול"},{"kind":"item","text":"1/2 אבוקדו"},{"kind":"item","text":"1 כוס גרגרי חומוס בשימורים"},{"kind":"item","text":"2 צרורות בצל ירוק"},{"kind":"item","text":"1 צרור עלי כוסברה"},{"kind":"item","text":"חופן בזיליקום / נענע / עשבי תיבול אחרים"},{"kind":"item","text":"חופן חמוציות"},{"kind":"item","text":"חופן גרעיני דלעת / גרעינים אחרים"},{"kind":"item","text":"3 כפות שמן זית"},{"kind":"item","text":"1/2 כוס מיץ תפוזים סחוט טרי"},{"kind":"item","text":"1 כף חומץ בלסמי"},{"kind":"item","text":"2 כפות דבש \\ סילאן \\ מייפל לטבעונים"},{"kind":"item","text":"2 שיני שום"},{"kind":"item","text":"1/2 כפית חרדל דיז’ון"},{"kind":"item","text":"1/2 כפית מלח"},{"kind":"item","text":"1/2 כפית פלפל שחור טחון"}]'::jsonb, '["שוטפים את הקינואה ומכינים אותה על פי הוראות היצרן (בדרך כלל על כל 1 כוס קינואה 2 כוסות מים רותחים).","קוצצים את המלפפונים, הפלפל הצהוב, הבצל ועשבי התיבול. את האבוקדו חותכים לקוביות.","בקערה גדולה שמים את הקינואה לאחר שהיא התקררה ואת כל שאר הרכיבים של הסלט.","מכינים בקערה קטנה נפרדת את הרוטב ושופכים אותו מעל הסלט.","מערבבים את הסלט היטב ואוכלים בהנאה.","את הסלט אפשר גם לשמור במקרר 2-3 ימים."]'::jsonb, '', '', '{"ingredients":"רכיבים","steps":"אופן הכנה","tip":"טיפ"}'::jsonb, 'published'::public.content_status, '2026-01-07T00:00:00Z'::timestamptz)
on conflict (id) do update set
  legacy_slug = excluded.legacy_slug,
  title = excluded.title,
  description = excluded.description,
  date = excluded.date,
  category = excluded.category,
  tags = excluded.tags,
  prep_time_text = excluded.prep_time_text,
  prep_minutes = excluded.prep_minutes,
  servings = excluded.servings,
  image_id = excluded.image_id,
  image_path = excluded.image_path,
  image_alt = excluded.image_alt,
  intro = excluded.intro,
  ingredients = excluded.ingredients,
  steps = excluded.steps,
  tip = excluded.tip,
  extra = excluded.extra,
  headings = excluded.headings;
insert into public.recipes (id, slug, legacy_slug, title, description, date, category, tags, prep_time_text, prep_minutes, servings, image_id, image_path, image_alt, intro, ingredients, steps, tip, extra, headings, status, published_at)
values ('1f62d8af-b0d9-537e-8948-9ea9741fda3f', 'quinoa-in-red-sauce', 'קינואה-ברוטב-אדום', 'קינואה ברוטב אדום', 'תבשיל קינואה אדומה שמתבשלת ברוטב של עצמה: מנה טבעונית ללא גלוטן, בריאה, מזינה ומשביעה, עשירה בסיבים תזונתיים ובחלבון לשובע לאורך זמן.', '2026-01-25'::date, 'צהריים', array['טבעוני', 'צמחוני', 'ללא גלוטן']::text[], 'לא צוין', null, null, 'e0ec0649-5888-5bb2-8a32-4dbdef5ba560', '/media/client/recipes/quinoa-in-red-sauce.jpg', 'קינואה ברוטב אדום', '**תבשיל קינואה אדומה שהתבשלה ברוטב של עצמה!**

**טבעוני, צמחוני, ללא גלוטן**

הקינואה ששברה את הרשת! מדובר בקינואה הכי טעימה שהכנתי

קינואה עשירה בסיבים תזונתיים, ויטמינים ומינרלים ונחשבת לפחמימה מרכבת שגם עשירה בחלבון שתגרום לכם לשובע לטווח ארוך יותר.

לגבי המתכון - כל מי שלא אוהב קינואה, חושש ממנה, או שאף פעם לא ניסה, זה המתכון בשבילכם.

מתכון כיפי, טעים ומנחם שעושה טוב בבלב וגם בבטן.

(ערכים תזונתיים רשומים בסוף העמוד)', '[{"kind":"item","text":"3 כפות שמן זית"},{"kind":"item","text":"2 בצל לבן"},{"kind":"item","text":"3 שיני שום חתוך דק"},{"kind":"item","text":"3 כפות רסק עגבניות חתוכות דק (ללא תוספת סוכר) 75 גרם"},{"kind":"item","text":"2 כפות גדושות רכז עגבניות מרוכז (משתמשת בשל מוטי ללא סוכר)"},{"kind":"item","text":"1 כפית סילאן/מייפל/סוכר"},{"kind":"item","text":"1 כפית פפריקה מתוקה"},{"kind":"item","text":"1 כפית מלח"},{"kind":"item","text":"מעט פלפל שחור וצ''ילי גרוס לפי הטעם"},{"kind":"item","text":"1.5 כוסות קינואה לבנה שטופה"},{"kind":"item","text":"3 כוסות מים רותחים"}]'::jsonb, '["קוצצים את הבצל, מחממים שמן זית בסיר ומוסיפים את הבצל, מטגנים אותו עד שהוא משחים מעט ומוסיפים את השום.","מוסיפים לסיר את הרסק עגבניות, התרכיז עגבניות ואת שאר התבלינים ומערבבים יחד.","מוסיפים לסיר את המים הרותחים ומביאים לרתיחה.","מוסיפים את הקינואה לתוך הסיר ומערבבים הכל יחד.","מנמיכים לאש בינונית ומבשלים עם מכסה סגור כ-20 דקות עד שהקינואה מוכנה."]'::jsonb, '', '## ערכים תזונתיים לכל הסיר

אנרגיה (קלוריות) - 1,457 קק"ל.

שומן - 42.7 גרם.

חלבון - 50.2 גרם.

פחמימה - 211 גרם.', '{"ingredients":"רכיבים","steps":"אופן הכנה","tip":"טיפ"}'::jsonb, 'published'::public.content_status, '2026-01-25T00:00:00Z'::timestamptz)
on conflict (id) do update set
  legacy_slug = excluded.legacy_slug,
  title = excluded.title,
  description = excluded.description,
  date = excluded.date,
  category = excluded.category,
  tags = excluded.tags,
  prep_time_text = excluded.prep_time_text,
  prep_minutes = excluded.prep_minutes,
  servings = excluded.servings,
  image_id = excluded.image_id,
  image_path = excluded.image_path,
  image_alt = excluded.image_alt,
  intro = excluded.intro,
  ingredients = excluded.ingredients,
  steps = excluded.steps,
  tip = excluded.tip,
  extra = excluded.extra,
  headings = excluded.headings;
insert into public.recipes (id, slug, legacy_slug, title, description, date, category, tags, prep_time_text, prep_minutes, servings, image_id, image_path, image_alt, intro, ingredients, steps, tip, extra, headings, status, published_at)
values ('b2a1109d-8b56-5363-8a84-a3196c553b95', 'roasted-tomato-soup', 'מרק-עגבניות-צלויות', 'מרק עגבניות צלויות', 'מרק עגבניות צלויות בתנור עם בצל ושום, בתוספת גריסים שמסמיכים אותו והופכים אותו למשביע ומזין. הבישול מעלה את זמינות הליקופן שבעגבנייה.', '2026-01-25'::date, 'מרקים', array['טבעוני', 'צמחוני']::text[], 'לא צוין', null, null, 'b861b4c0-5866-540f-8ecf-8a8e428bd85f', '/media/client/recipes/roasted-tomato-soup.jpg', 'מרק עגבניות צלויות', 'מרק עגבניות צלויות בתוספת גריסים, מרק בריא, מזין, מנחם והכי טעים שיש!

שמעתי שהולך להיות סוף שבוע קצת חורפי וישר נהיה לי חשק להכין מרק

ולמה יש על מרק עגבניות?? מדובר בעגבניות שצלויות בתנור עם בצל, שום ועוד דברים טובים..

בתוספת של גריסים שמסמיכים את המרק והופכים לאותו להרבה יותר משביע ומזין!

בנוסף, ידעתם שעגבניה מבושלת יותר בריאה מעגבנייה טריה??

עגבנייה מכילה הרבה ליקופן שזה נוגד חמצון חזק שמעולה למניעה של מחלות ואפילו הוכח כמפחית סיכון לסרטן, והבישול של העגבניה מעלה את זמינות הליקופן ואת הספיגה שלו!

אז יש לכם עוד תירוץ להכין את המרק הזה.. שאתם הולכים לקבל עליו ים של מחמאות.', '[{"kind":"item","text":"8-9 עגבניות בגודל בינוני"},{"kind":"item","text":"1 פלפל אדום"},{"kind":"item","text":"1 בצל סגול גדול/ 2 קטנים"},{"kind":"item","text":"1 ראש שום שלם"},{"kind":"item","text":"3 כפות שמן זית"},{"kind":"item","text":"רוזמרין"},{"kind":"item","text":"מלח גס"},{"kind":"item","text":"1 כף רסק עגבניות"},{"kind":"item","text":"1 כף סילאן"},{"kind":"item","text":"1/2 כפית פפריקה אדומה"},{"kind":"item","text":"1/2 כפית פלפל שחור"},{"kind":"item","text":"1 כפית מלח"},{"kind":"item","text":"1 ליטר מים רותחים (5 כוסות)"},{"kind":"sublabel","text":"לגריסים:"},{"kind":"item","text":"1/2 כוס גריסים מבושלים"},{"kind":"item","text":"2 כוסות מים"}]'::jsonb, '["מחממים תנור ל190 מעלות ומרפדים תבנית בנייר אפיה.","חוצים את העגבניות לרבעים ומניחים על נייר האפיה, חותכים את הפלפל לרצועות ואת הבצל לרבע ומניחים גם על ניר האפיה.","חותכים לראש השום את החלק העליון ומניחים במרכז התבנית, מוסיפים את עלי הרוזמרין.","מזלפים מעל הכל שמן זית ומלח גס ומכניסים לתנור ל40 דקות עד שהירקות מתרככים.","מעבירים לסיר גדול את כל תכולת התבנית עם המיצים והשמן.","את ראש השום מוציאים ומועכים את השום מתוך הקליפה החוצה אל תוך הסיר.","מוסיפים רסק עגבניות, תבלינים ומים רותחים, מערבבים ומביאים לרתיחה, מכסים את הסיר ומבשלים כ10 דקות הכל יחד.","מכבים את האש ועם בלנדר מוט טוחנים הכל יחד למרקם חלק.","מוסיפים את הגריסים שבישלנו מראש ומערבבים.","טועמים ומוסיפים תיבול לפי הטעם."]'::jsonb, '', '', '{"ingredients":"רכיבים","steps":"אופן הכנה","tip":"טיפ"}'::jsonb, 'published'::public.content_status, '2026-01-25T00:00:00Z'::timestamptz)
on conflict (id) do update set
  legacy_slug = excluded.legacy_slug,
  title = excluded.title,
  description = excluded.description,
  date = excluded.date,
  category = excluded.category,
  tags = excluded.tags,
  prep_time_text = excluded.prep_time_text,
  prep_minutes = excluded.prep_minutes,
  servings = excluded.servings,
  image_id = excluded.image_id,
  image_path = excluded.image_path,
  image_alt = excluded.image_alt,
  intro = excluded.intro,
  ingredients = excluded.ingredients,
  steps = excluded.steps,
  tip = excluded.tip,
  extra = excluded.extra,
  headings = excluded.headings;
insert into public.recipes (id, slug, legacy_slug, title, description, date, category, tags, prep_time_text, prep_minutes, servings, image_id, image_path, image_alt, intro, ingredients, steps, tip, extra, headings, status, published_at)
values ('9a9987dd-875f-52c1-8a2d-fe0809585802', 'soba-noodle-salad', 'סלט-אטריות-סובה', 'סלט אטריות סובה', 'סלט אטריות סובה מכוסמת ברוטב טחינה אסיאתי, טבעוני וללא גלוטן, פשוט להכנה, בריא ומזין, עם שקדים מקורמלים שאסור לוותר עליהם.', '2026-01-25'::date, 'סלטים', array['טבעוני', 'צמחוני', 'ללא גלוטן']::text[], 'לא צוין', null, null, '22e283c7-c034-5198-87bb-f461225e697f', '/media/client/recipes/soba-noodle-salad.jpg', 'סלט אטריות סובה', 'סלט אטריות סובה ברוטב טחינה אסיאתי

טבעוני, ללא גלוטן, פשוט להכנה, בריא ומזין

מי שעוד לא גילה את האטריות סובה - הרשו לי להציג לכם אותם:

אטריות סובה עשויות מכוסמת (ולא אין טעם של כוסמת) מה שאומר שהן מכילות את אותן היתרונות הבריאותיים של הכוסמת.

הכוסמת עשירה בסיבים תזונתיים ובנוגדי חמצון, מכילה חלבון צמחי וחומצות אמינו חיוניות, בעלת ערך גליקמי נמוך מה שיגרום לרמות הגלוקוז בדם להשאר מאוזנים יותר ובנוסף מכילה ויטמינים רבים מקבוצת B ומקור למינרלים כמו אבץ, ברזל, סלניום ומגנזיום.

בקיצור אחרי שדיברנו על היתרונות הבריאותיים של המנה - הגיע הזמן להכין סלט אטריות סובה עשיר וטעים ברמות!', '[{"kind":"sublabel","text":"לסלט:"},{"kind":"item","text":"אטריות סובה מבושלות לפי ההוראות על החפיסה (אני הכנתי חצי חפיסה, 150 גרם אטריות יבשות)"},{"kind":"item","text":"1 כרובית בינונית (קפואה\\טריה) מאודה לאחר בישול"},{"kind":"item","text":"2-3 גבעולי בצל ירוק"},{"kind":"item","text":"חבילת פטריות"},{"kind":"item","text":"עלים ירוקים (חסה/בייבי/קייל)"},{"kind":"sublabel","text":"לרוטב:"},{"kind":"item","text":"1/4 כוס סויה"},{"kind":"item","text":"1.5 כף וחצי מייפל טבעי/סילאן"},{"kind":"item","text":"2 כפות טחינה גולמית"},{"kind":"item","text":"2 שיני שום"},{"kind":"item","text":"1 כפית שמן שומשום"},{"kind":"item","text":"מעט תבלין צילי גרוס"},{"kind":"sublabel","text":"שקדים מקורמלים: (לא לוותר)"},{"kind":"item","text":"50-60 גרם שקדים פרוסים"},{"kind":"item","text":"2\\1 כפית סילאן"}]'::jsonb, '["מכינים את האטריות סובה ע\"פ הוראות היצרן, מסננים.","מאדים את הכרובית (אני מבשלת במים רותחים עד שמתרככת וחותכת לפרחים).","מוסיפים את כל רכיבי הסלט לקערה (אטריות, פטריות, כרובית, בצל ירוק, פטריות, חסה..).","מכינים את הרוטב, מערבבים ושופכים מעל הסלט.","קולים את השקדים על מחבת עם כפית הסילאן במשך 2-3 דקות עד שהם משחימים.","מוסיפים לסלט את השקדים המקורמלים ומערבבים הכל היטב, תיהנו!"]'::jsonb, '', '', '{"ingredients":"רכיבים","steps":"אופן הכנה","tip":"טיפ"}'::jsonb, 'published'::public.content_status, '2026-01-25T00:00:00Z'::timestamptz)
on conflict (id) do update set
  legacy_slug = excluded.legacy_slug,
  title = excluded.title,
  description = excluded.description,
  date = excluded.date,
  category = excluded.category,
  tags = excluded.tags,
  prep_time_text = excluded.prep_time_text,
  prep_minutes = excluded.prep_minutes,
  servings = excluded.servings,
  image_id = excluded.image_id,
  image_path = excluded.image_path,
  image_alt = excluded.image_alt,
  intro = excluded.intro,
  ingredients = excluded.ingredients,
  steps = excluded.steps,
  tip = excluded.tip,
  extra = excluded.extra,
  headings = excluded.headings;
insert into public.recipes (id, slug, legacy_slug, title, description, date, category, tags, prep_time_text, prep_minutes, servings, image_id, image_path, image_alt, intro, ingredients, steps, tip, extra, headings, status, published_at)
values ('e2fd825d-c71d-534a-8cbe-c467ecf3c939', 'spelt-banana-cake', 'עוגת-בננה-מקמח-כוסמין', 'עוגת בננות מקמח כוסמין', 'עוגת בננות עסיסית מקמח כוסמין, קלה ומהירה להכנה בקערה אחת, מושלמת ליד הקפה של הבוקר, עם אפשרות לתחליף סוכר ותוספות לבחירה.', '2026-01-25'::date, 'מתוקים', array['דל קלוריות', 'קל ומהיר']::text[], '35 דקות', 35, '12 פרוסות', '0f97f7a4-5f2e-5b96-837e-1d7fdd17afda', '/media/client/recipes/spelt-banana-cake.jpg', 'עוגת בננות מקמח כוסמין', 'עוגת בננות מקמח כוסמין, עסיסית וקלה להכנה, הכל בקערה אחת, בריאה יותר ושווה בטירוף!

כל מי שמכיר אותי יודע שעוגת בננות היא העוגה המועדפת עלי, אין מצב שאני אראה בננות בשלות בבית ולא אעשה מהן עוגה. עוגת בננות מהירה וקלה להכנה, בקערה אחת.

עוגת בננות זאת עוגה שתמיד מתאימה לי ליד הקפה של הבוקר או של אחר הצהריים. זאת עוגה שתחזרו להכין ושוב ושוב.. משהו בקלות ובפשטות שלה, בריח שהיא עושה בבית הופכים אותה לממכרת. מכירים את זה שרואים בבית בננות שחורות או כהות שממש חבל לזרוק ? זה הסימן שלי להכין עוגה ב 5 דקות, קערה אחת ויש לכם בבית ריח של עוגת בננות שמוכנה לסוף שבוע.

בעיקרון מה שאני גם אוהבת בעוגה הזאת, זה שהיא ממש בסיסית ואני כל פעם מגוונת בתוספות לפי מה שמתחשק או מה שיש זמין, לפעמים מתחשק לי להוסיף שוקולד מריר, לפעמים שוקולד לבן ולפעמים בא לי להוסיף לה אגוזי מלך או פקאן. אבל לפעמים גם לא מתחשק לי להוסיף כלום והיא טעימה גם ככה, נקייה. (*ערכים תזונתיים רשומים בסוף העמוד)', '[{"kind":"item","text":"2 בננות בשלות"},{"kind":"item","text":"2 ביצים L או 3 ביצים M"},{"kind":"item","text":"4\\1 כוס תחליף סוכר \\ סוכר חום \\ סוכר רגיל"},{"kind":"item","text":"3\\1 כוס משקה שקדים \\ סויה \\ חלב"},{"kind":"item","text":"1 כפית תמצית וניל"},{"kind":"item","text":"180 גרם (כוס וחצי) קמח כוסמין\\ אחר"},{"kind":"item","text":"1 שקית אבקת אפיה (10 גרם)"},{"kind":"item","text":"2\\1 כפית קינמון"},{"kind":"sublabel","text":"לתוספות:"},{"kind":"item","text":"שוקולד מריר קצוץ\\ שוקולד צ''יפס\\ אגוזי מלך\\ פקאן או מה שאתם אוהבים."}]'::jsonb, '["מחממים תנור ל180 מעלות.","מועכים היטב את הבננות הבשלות בקערה, מוסיפים את הביצים, סוכר, חלב, תמצית וניל וטורפים היטב.","מוסיפים את הרכיבים היבשים (קמח, אבקת אפיה וקינמון) ומערבבים לבלילה אחידה.","מוסיפים תוספות ומערבבים לאיחוד.","מעבירים לתבנית משומנת.","מכניסים לאפיה של 30 דקות או עד שמכניסים קיסם והוא יוצא יבש."]'::jsonb, '', '### ערכים תזונתיים לפרוסה מתוך 12 (עם תחליף סוכר סוויטאנגו ושוקולד צ''יפס מריר):

אנרגיה (קלוריות) - 104 קק"ל.
שומן - 2.3 גרם.
חלבון- 3.7 גרם.
פחמימה- 22.4 גרם.

### ערכים תזונתיים לפרוסה מתוך 12 (עם סוכר רגיל ושוקולד צ''יפס מריר):

אנרגיה (קלוריות) - 120 קק"ל.
שומן - 2.3 גרם.
חלבון- 3.7 גרם.
פחמימה- 22.4 גרם.', '{"ingredients":"רכיבים","steps":"אופן הכנה","tip":"טיפ"}'::jsonb, 'published'::public.content_status, '2026-01-25T00:00:00Z'::timestamptz)
on conflict (id) do update set
  legacy_slug = excluded.legacy_slug,
  title = excluded.title,
  description = excluded.description,
  date = excluded.date,
  category = excluded.category,
  tags = excluded.tags,
  prep_time_text = excluded.prep_time_text,
  prep_minutes = excluded.prep_minutes,
  servings = excluded.servings,
  image_id = excluded.image_id,
  image_path = excluded.image_path,
  image_alt = excluded.image_alt,
  intro = excluded.intro,
  ingredients = excluded.ingredients,
  steps = excluded.steps,
  tip = excluded.tip,
  extra = excluded.extra,
  headings = excluded.headings;
insert into public.recipes (id, slug, legacy_slug, title, description, date, category, tags, prep_time_text, prep_minutes, servings, image_id, image_path, image_alt, intro, ingredients, steps, tip, extra, headings, status, published_at)
values ('a92a592c-973f-5162-8ed0-a43886f1cb58', 'spinach-cheese-bourekas', 'בורקס-גבינה-ותרד-מבצק-יוגורט', 'בורקס גבינה ותרד מבצק יוגורט', 'בורקס גבינה ותרד מבצק יוגורט של 3 רכיבים בלבד, קל ומהיר להכנה, תוספת טעימה לארוחת ערב מאוזנת או לשלוח עם הילדים לבית הספר.', '2026-01-21'::date, 'מאפים', array['קל ומהיר', 'עתיר חלבון']::text[], 'לא צוין', null, '12 בורקיטסים', 'a0a4672e-ef6c-5975-843e-235b1039284d', '/media/client/recipes/spinach-cheese-bourekas.jpg', 'בורקס גבינה ותרד מבצק יוגורט', 'בורקס גבינה ותרד מבצק יוגורט של 3 רכיבים בלבד!

קל ומהיר להכנה, טעים ואחלה תוספת לארוחת ערב מאוזנת או אפילו לשלוח עם הילדים לבית הספר

אחד המתכונים הקלילים והאהובים עליי, שבא לי ארוחה מגוונת וטעימה אבל גם קלילה ומאוזנת או כנשנוש מלוח המתכון הזה הוא לגמרי הפתרון שלי, מומלץ לאכול ליד סלט, ביצה קשה וסגרתם פינה!

(ערכים תזונתיים רשומים בסוף העמוד)', '[{"kind":"note","text":"(עבור 12 בורקיטסים)"},{"kind":"sublabel","text":"לבצק:"},{"kind":"item","text":"100 גרם (כוס) קמח לבן \\ כוסמין לבן"},{"kind":"item","text":"200 גרם (גביע) יוגורט לבחירתכם - אני השתמשתי ביוגורט פרו חלבון טבעי"},{"kind":"item","text":"1 כפית אבקת אפיה"},{"kind":"item","text":"מעט מלח"},{"kind":"sublabel","text":"למילוי:"},{"kind":"item","text":"2 כוסות תרד (100 גרם)"},{"kind":"item","text":"2 שיני שום"},{"kind":"item","text":"1 כף שמן זית"},{"kind":"item","text":"50 גרם פטה\\ בולגרית 5%"},{"kind":"item","text":"1 כף קוטג׳"},{"kind":"item","text":"חופן גבינה קשה מגורדת לבחירתכם (צהובה\\ מוצרלה \\ פרמז''ן)"},{"kind":"sublabel","text":"להברשה:"},{"kind":"item","text":"ביצה"},{"kind":"item","text":"שומשום"}]'::jsonb, '["מחממים תנור מראש ל180 מעלות.","לבצק: מערבבים בקערה את הרכיבים של הבצק ולשים עד לקבלת בצק אחיד.","מקמחים משטח ומרדדים את הבצק בעזרת מערוך (שלא יהיה דק מידי כי לא נרצה שיקרע).","בעזרת כוס נחרוץ בבצק צורות עיגולים ומניחים אותם על תבנית עם ניר אפיה.","למילוי: מחממים שמן זית במחבת ומטגנים מעט את התרד והשום עד שהתרד מצטמצם.","בקערה מערבבים את כל רכיבי המילוי ומוסיפים אליה את התרד והשום, מערבבים.","לוקחים בכל פעם כפית מהמילוי ומניחים במרכז כל עיגול מהבצק שחרצנו.","סוגרים לחצי עיגול ומהדקים קצוות.","נבריש בביצה ונפזר מעט שומשום.","אופים כ20 דקות עד שהבורקסים זהובים גם בתחתית. בתיאבון!"]'::jsonb, '', '### ערכים תזונתיים עבור כל הכמות:

אנרגיה (קלוריות) - 721 קק"ל.
שומן - 18.6 גרם.
חלבון- 53 גרם.
פחמימה- 78.3 גרם.', '{"ingredients":"רכיבים","steps":"אופן הכנה","tip":"טיפ"}'::jsonb, 'published'::public.content_status, '2026-01-21T00:00:00Z'::timestamptz)
on conflict (id) do update set
  legacy_slug = excluded.legacy_slug,
  title = excluded.title,
  description = excluded.description,
  date = excluded.date,
  category = excluded.category,
  tags = excluded.tags,
  prep_time_text = excluded.prep_time_text,
  prep_minutes = excluded.prep_minutes,
  servings = excluded.servings,
  image_id = excluded.image_id,
  image_path = excluded.image_path,
  image_alt = excluded.image_alt,
  intro = excluded.intro,
  ingredients = excluded.ingredients,
  steps = excluded.steps,
  tip = excluded.tip,
  extra = excluded.extra,
  headings = excluded.headings;
insert into public.recipes (id, slug, legacy_slug, title, description, date, category, tags, prep_time_text, prep_minutes, servings, image_id, image_path, image_alt, intro, ingredients, steps, tip, extra, headings, status, published_at)
values ('241e4b2b-145f-5f69-8ffb-a795fd948f57', 'spinach-cheese-pie', 'פשטידת-תרד-וגבינות-רזות', 'פשטידת תרד וגבינות רזות', 'פשטידת תרד וגבינות דלת קלוריות ועשירה בחלבון, קלה להכנה ומתאימה כארוחת ערב קלילה, ארוחת בוקר או אירוח, כולל ערכים תזונתיים.', '2026-01-21'::date, 'מאפים', array['דל קלוריות', 'עתיר חלבון', 'צמחוני', 'קל ומהיר']::text[], 'לא צוין', null, null, '93b6e7cb-e51a-5313-8b38-85dd1ffbcfa6', '/media/client/recipes/spinach-cheese-pie.jpg', 'פשטידת תרד וגבינות רזות', 'פשטידת תרד וגבינות דלת קלוריות ועשירה בחלבון!
קלה להכנה והתוספת המדויקת לארוחה שלכם.

בא לכם ארוחת ערב קלילה? ארוחת בוקר מפנקת? רעיון לאורחים שבדרך? נמאס לכם מסלט וחביתה?

קבלו את הפשטידה הבריאה והטעימה הזו שתמיד באה בול!
וגם תמיד תקבלו עליה מחמאות.

(ערכים תזונתיים רשומים בסוף העמוד)', '[{"kind":"item","text":"200 גרם יוגורט עד 3%"},{"kind":"item","text":"250 גרם (גביע) קוטג'' 5%"},{"kind":"item","text":"100 גרם גבינת פטה\\בולגרית 5%"},{"kind":"item","text":"2 ביצים"},{"kind":"item","text":"3 כפות קמח כוסמין\\ אחר (אופציה ללא גלוטן קמח שקדים)"},{"kind":"item","text":"1 כפית אבקת אפיה"},{"kind":"item","text":"2\\1 מלח, מעט פלפל שחור, 4\\1 כפית אבקת שום, 4\\1 כפית אגוז מוסקט טחון"},{"kind":"item","text":"1 כף שמן זית"},{"kind":"item","text":"3 כוסות דחוסות עלי תרד"},{"kind":"item","text":"1 בצל לבן שלם"},{"kind":"item","text":"2-3 שיני שום"},{"kind":"item","text":"2 כפות פרמז׳ן (לפיזור מעל הפשטידה)"}]'::jsonb, '["מחממים תנור ל180 מעלות.","מחממים שמן זית במחבת ומטגנים את הבצל, השום והתרד עד שהבצל מתרכך והתרד מצטמצם.","בקערה מערבבים את שאר הרכיבים (חוץ מהפרמזן'') לתערובת גבינות אחידה עם הביצים, הקמח והתבלינים ומוסיפים את התרד, הבצל והשום.","מערבבים הכל טוב יחד ומעבירים לתבנית משומנת.","מפזרים מעל את הפרמזן- מוסיף מאוד לצבע בסוף.","מכניסים לתנור ל30 דקות, עד שהפשטידה מזהיבה ומקבלת צבע יפה ושמכניסים קיסם הוא לא יוצא רטוב."]'::jsonb, '', '### ערכים תזונתיים עבור כל הפשטידה:

אנרגיה (קלוריות) - 1,129 קק"ל.
שומן - 51.8 גרם.
חלבון- 87.7 גרם.
פחמימה- 79.2 גרם.', '{"ingredients":"רכיבים","steps":"אופן הכנה","tip":"טיפ"}'::jsonb, 'published'::public.content_status, '2026-01-21T00:00:00Z'::timestamptz)
on conflict (id) do update set
  legacy_slug = excluded.legacy_slug,
  title = excluded.title,
  description = excluded.description,
  date = excluded.date,
  category = excluded.category,
  tags = excluded.tags,
  prep_time_text = excluded.prep_time_text,
  prep_minutes = excluded.prep_minutes,
  servings = excluded.servings,
  image_id = excluded.image_id,
  image_path = excluded.image_path,
  image_alt = excluded.image_alt,
  intro = excluded.intro,
  ingredients = excluded.ingredients,
  steps = excluded.steps,
  tip = excluded.tip,
  extra = excluded.extra,
  headings = excluded.headings;
insert into public.recipes (id, slug, legacy_slug, title, description, date, category, tags, prep_time_text, prep_minutes, servings, image_id, image_path, image_alt, intro, ingredients, steps, tip, extra, headings, status, published_at)
values ('909e8611-5f44-5bdf-8647-4f8cbc5e90f7', 'sweet-and-sour-tofu', 'טופו-חמוץ-מתוק', 'טופו חמוץ מתוק', 'טופו חמוץ מתוק כמו במסעדות האסיאתיות, מוכן בבית באפס מאמץ ובריא יותר. מוגש על אורז לארוחה עשירה בחלבון, טבעונית וללא גלוטן.', '2026-01-25'::date, 'צהריים', array['עתיר חלבון', 'טבעוני', 'ללא גלוטן', 'קל ומהיר']::text[], 'לא צוין', null, null, '021cc574-181c-5188-828d-b6d26d2cf956', '/media/client/recipes/sweet-and-sour-tofu.jpg', 'טופו חמוץ מתוק', 'מנת טופו חמוץ מתוק כמו במסעדות האסיאתיות רק בבית, באפס מאמץ ואפילו בריא יותר!

מומלץ להגיש על אורז וקיבלנו ארוחה שהיא גם עשירה בחלבון, גם טבעונית וגם ללא גלוטן בקלות

המתכון הזה הוא בול למי שעוד לא ניסה טופו מימיו ורוצה להתנסות או שקצת חושש מטופו ופשוט לא טעם את האחד הנכון, מבטיחה לכם שלא תתחרטו! ותתכוננו להתמכר לארוחת צהריים הבאה שלכם', '[{"kind":"sublabel","text":"לטופו:"},{"kind":"item","text":"1 חבילת טופו טבעי (300 גרם)"},{"kind":"item","text":"2 כפות קורנפלור"},{"kind":"item","text":"1 כפית אבקת שום גבישי (לא חובה אבל מוסיף)"},{"kind":"item","text":"מעט מלח"},{"kind":"item","text":"תרסיס שמן זית"},{"kind":"sublabel","text":"לרוטב:"},{"kind":"item","text":"4 כפות סויה"},{"kind":"item","text":"3 כפות מייפל טבעי / סילאן"},{"kind":"item","text":"מיץ לימון מ1/2 לימון שלם"},{"kind":"item","text":"2 שיני שום כתושות"},{"kind":"item","text":"1 כף קורנפלור"},{"kind":"item","text":"1/2 כפית צ’ילי גרוס"},{"kind":"item","text":"גרידת ג’ינג’ר"},{"kind":"item","text":"1/4 כוס מים פושרים"},{"kind":"item","text":"1 כפית שמן זית"},{"kind":"note","text":"מומלץ לפזר שומשום ובצל ירוק ולהגיש על אורז חם"}]'::jsonb, '["מחממים תנור ל190 מעלות.","חותכים את הטופו לקוביות ומייבשים בעזרת נייר סופג/ מגבת.","מעבירים את הטופו לקערה, מוסיפים את הקורנפלור, האבקת שום ומעט מלח ומערבבים טוב שכל הטופו יהיה מצופה בקורנפלור.","מעבירים את קוביות הטופו לתבנית עם נייר אפיה, מרססים בשמן זית ומכניסים לתנור ל15-20 דקות עד שהוא מתקשה ומשחים מעט.","בינתיים לרוטב: מערבבים בקערה את כל מרכיבי הרוטב.","מחממים שמן זית במחבת ושופכים אליו את הרוטב, נותנים לרוטב להתחמם ולהצטמצם כמה דקות.","מוציאים את הטופו מהתנור ומכניסים אותו אל תוך המחבת עם הרוטב החם, מוסיפים שומשום ומערבבים טוב שכל הטופו עטוף ברוטב."]'::jsonb, '', 'אני אכלתי על אורז והוספתי בצל ירוק ויוצא מעדן!', '{"ingredients":"רכיבים","steps":"אופן הכנה","tip":"טיפ"}'::jsonb, 'published'::public.content_status, '2026-01-25T00:00:00Z'::timestamptz)
on conflict (id) do update set
  legacy_slug = excluded.legacy_slug,
  title = excluded.title,
  description = excluded.description,
  date = excluded.date,
  category = excluded.category,
  tags = excluded.tags,
  prep_time_text = excluded.prep_time_text,
  prep_minutes = excluded.prep_minutes,
  servings = excluded.servings,
  image_id = excluded.image_id,
  image_path = excluded.image_path,
  image_alt = excluded.image_alt,
  intro = excluded.intro,
  ingredients = excluded.ingredients,
  steps = excluded.steps,
  tip = excluded.tip,
  extra = excluded.extra,
  headings = excluded.headings;
insert into public.recipes (id, slug, legacy_slug, title, description, date, category, tags, prep_time_text, prep_minutes, servings, image_id, image_path, image_alt, intro, ingredients, steps, tip, extra, headings, status, published_at)
values ('2f8fd271-2524-5e70-86ec-aab3acab617e', 'three-ingredient-date-balls', 'כדורי-תמרים-מ3-מרכיבים', 'כדורי תמרים מ3 מרכיבים', 'כדורי אנרגיה מתמרים בטעם שוקולד משלושה מרכיבים בלבד: טבעוניים, ללא גלוטן, 10 דקות הכנה ונשמרים במקפיא למתוק זריז ליד הקפה או לפני אימון.', '2026-01-25'::date, 'מתוקים', array['טבעוני', 'ללא גלוטן', 'קל ומהיר']::text[], '10 דקות', 10, '14 כדורים', '793cc894-88de-5ead-8ac6-37915d2440ca', '/media/client/recipes/three-ingredient-date-balls.jpg', 'כדורי תמרים מ3 מרכיבים', '**כדורי אנרגיה מתמרים בטעם של שוקולד מ3 מרכיבים!**

**הכדורים הכי פשוטים וקלים להכנה, טבעוניים, ללא גלוטן**

אז הכדורים האלו נמצאים לי באופן קבוע במקפיא ואני גם קוראת להם כדורי הרגעה... ככה כל פעם שבא לי איזה מתוק זריז שייתן לי בוסט אנרגיה לפני אימון או ליד הקפה, אני פשוט שולפת לי אותם מהמקפיא.

עכשיו מה שאני אוהבת פה שזה באמת לוקח 10 דקות של הכנה ואני מסודרת לשבועיים הקרובים (אלא אם כן מסיימים לי אותם).

כמובן שהשתמשתי בתמרים העסיסיים של שרית שלדעתי הם מה שעושה את הכדורים האלה לכל כך שווים, רכים, טעימים ומתוקים.

בנוסף זה אחלה של רעיון להכין עם הילדים ולתת להם להתנסות וסמכו עליי - קצת סוכריות לציפוי והם יעופו על זה!

(ערכים תזונתיים בסוף העמוד)', '[{"kind":"item","text":"10 תמרי מג’הול עסיסיים (280 גרם)"},{"kind":"item","text":"2 כפות גדושות אבקת קקאו / שוקולית"},{"kind":"item","text":"3 כפות שיבולת שועל דקה"},{"kind":"sublabel","text":"לציפוי:"},{"kind":"item","text":"סוכריות"},{"kind":"item","text":"או 1 כף תחליף סוכר + 1 כפית קינמון מעורבבים"}]'::jsonb, '["מוציאים את הגלעינים מהתמרים ומכניסים למעבד מזון. (אם השתמשתם בתמרי מג’הול רגילים ולא הקפואים של שרית, שימו אותם 10 דקות במים רותחים לריכוך).","מוסיפים את האבקת קקאו והשיבולת שועל וטוחנים עד לבלילה אחידה.","מכדררים לכדורים ומגלגלים בסוכריות/בסוכר עם הקינמון.","מכניסים למקפיא להתייצבות 15 דקות. תיהנו!"]'::jsonb, '', '## ערכים תזונתיים לכדור מתוך 14

אנרגיה (קלוריות) - 69 קק"ל.

שומן - 0.3 גרם.

חלבון- 1 גרם.

פחמימה- 16.5 גרם.', '{"ingredients":"רכיבים","steps":"אופן הכנה","tip":"טיפ"}'::jsonb, 'published'::public.content_status, '2026-01-25T00:00:00Z'::timestamptz)
on conflict (id) do update set
  legacy_slug = excluded.legacy_slug,
  title = excluded.title,
  description = excluded.description,
  date = excluded.date,
  category = excluded.category,
  tags = excluded.tags,
  prep_time_text = excluded.prep_time_text,
  prep_minutes = excluded.prep_minutes,
  servings = excluded.servings,
  image_id = excluded.image_id,
  image_path = excluded.image_path,
  image_alt = excluded.image_alt,
  intro = excluded.intro,
  ingredients = excluded.ingredients,
  steps = excluded.steps,
  tip = excluded.tip,
  extra = excluded.extra,
  headings = excluded.headings;
insert into public.recipes (id, slug, legacy_slug, title, description, date, category, tags, prep_time_text, prep_minutes, servings, image_id, image_path, image_alt, intro, ingredients, steps, tip, extra, headings, status, published_at)
values ('65f8e407-5a36-5cb6-81ad-444bde491f0b', 'tofu-honey-mustard', 'טופו-ברוטב-חרדל-שום-ודבש', 'טופו ברוטב חרדל שום ודבש', 'קוביות טופו פריכות ברוטב חרדל, שום ודבש שמרגיש כמו מסעדה. מנה קלילה וטעימה שמוגשת על מצע אורז, עם אפשרות להחליף את הדבש לגרסה טבעונית.', '2026-01-25'::date, 'ערב', array['צמחוני', 'טבעוני']::text[], 'לא צוין', null, null, null, null, null, 'קוביות טופו פריכות ברוטב חרדל שום ודבש , הטופו הכי טעים שהכנתי! המתכון שגרם לאנשים להתאהב בטופו

ניתן להחליף את הדבש ולקבל מנה טבעונית לגמרי

כל מי שלא ניסה עוד טופו אני ממש ממליצה לכם על המתכון הזה

הוא קליל וטעים, מרגיש כמו מסעדה והולך לככב אצלכם במטבח אחרי שתנסו אותו.

על מצע של אורז זו פשוט המנה המושלמת.

יש לציין שמאז שהכנתי אותו בפעם הראשונה , הבן זוג שלי (שמאוד אוהב בשר), כל הזמן מבקש ממני להכין לו את המתכון הזה.', '[{"kind":"sublabel","text":"לטופו:"},{"kind":"item","text":"חבילת טופו (300 גרם)"},{"kind":"item","text":"2 כפות קורנפלור"},{"kind":"item","text":"1 כף שמן זית"},{"kind":"sublabel","text":"לרוטב:"},{"kind":"item","text":"1 כפית שמן זית"},{"kind":"item","text":"2.5 כפות דבש - לטבעוני ניתן להחליף בסילאן \\ מייפל"},{"kind":"item","text":"1 כפית חרדל דיז’ון"},{"kind":"item","text":"4 שיני שום קצוץ דק"},{"kind":"item","text":"2-3 כפות מיץ לימון"},{"kind":"item","text":"2 כפות חלב שקדים \\ חלב צמחי אחר"},{"kind":"item","text":"מעט מלח ופלפל"},{"kind":"note","text":"מומלץ להגיש על אורז ולהוסיף שומשום ובצל ירוק!"}]'::jsonb, '["חותכים את הטופו לקוביות ומייבשים בעזרת מגבת \\ נייר סופג.","מעבירים את קוביות הטופו לקערה ומערבבים עם הקורנפלור שכל הטופו מצופה בקורנפלור.","מחממים שמן זית במחבת ושופכים אליה את הטופו עם הקורנפלור , מקפיצים כמה דקות עד שהטופו משחים.","מוציאים את הטופו מהמחבת ומניחים מצד.","בינתיים מערבבים את כל הרכיבים של הרוטב ושופכים את הרוטב למחבת עד שהוא מתחמם ומצטמצם.","מחזירים את הטופו למחבת עם הרוטב החם, מערבבים ומקפיצים עד שהטופו כולו עטוף ברוטב והרוטב ממש נדבק אליו , לוקח כמה דקות.","ומוכן ! מומלץ להגיש על אורז חם עם בצל ירוק \\ כוסברה \\ בוטנים \\ שומשום."]'::jsonb, '', '', '{"ingredients":"רכיבים","steps":"אופן הכנה","tip":"טיפ"}'::jsonb, 'published'::public.content_status, '2026-01-25T00:00:00Z'::timestamptz)
on conflict (id) do update set
  legacy_slug = excluded.legacy_slug,
  title = excluded.title,
  description = excluded.description,
  date = excluded.date,
  category = excluded.category,
  tags = excluded.tags,
  prep_time_text = excluded.prep_time_text,
  prep_minutes = excluded.prep_minutes,
  servings = excluded.servings,
  image_id = excluded.image_id,
  image_path = excluded.image_path,
  image_alt = excluded.image_alt,
  intro = excluded.intro,
  ingredients = excluded.ingredients,
  steps = excluded.steps,
  tip = excluded.tip,
  extra = excluded.extra,
  headings = excluded.headings;
insert into public.recipes (id, slug, legacy_slug, title, description, date, category, tags, prep_time_text, prep_minutes, servings, image_id, image_path, image_alt, intro, ingredients, steps, tip, extra, headings, status, published_at)
values ('7076176f-6818-5eba-852c-9053e676318d', 'tofu-shawarma', 'שווארמה-טופו', 'שווארמה טופו', 'שווארמה מטופו עם כרובית ופטריות שמכינים בבית ב-10 דקות: מנה קלה, טבעונית, דלת שומן ומלאה בחלבון מהצומח.', '2026-01-25'::date, 'ערב', array['טבעוני', 'עתיר חלבון', 'קל ומהיר']::text[], '10 דקות', 10, null, 'bdcd4084-32ab-5b02-80bb-f686ef4770a4', '/media/client/recipes/tofu-shawarma.jpg', 'שווארמה טופו', 'שווארמה טופו היסטרית עם כרובית ופטריות ללא מאמץ שמכינים בבית ב10 דקות וקיבלתם מנה טעימה, קלה, טבעונית, דלת שומן ומלאה בחלבון!

אני אקדים ואספר לכם שכשאבא שלי טעם את זה, הוא חשב שזה מחזה עוף! ואז עדכנתי אותו שזה מטופו. בקיצור, מדובר באחלה של פתרון לארוחה קלה, זריזה, בריאה ועשירה בחלבון, בלי קשר אם אתם צמחוניים או לא - שילוב של חלבון מהצומח פעמיים בשבוע זה מצויין!', '[{"kind":"item","text":"2 כפות שמן זית"},{"kind":"item","text":"1 חבילת טופו טבעי (300 גרם)"},{"kind":"item","text":"1 בצל שלם פרוס"},{"kind":"item","text":"2 שיני שום כתושות"},{"kind":"item","text":"1 כרובית קטנה \\ 2\\1 כרובית בינונית חתוכה לפרחים קטנים"},{"kind":"item","text":"5-6 פטריות שמפיניון"},{"kind":"item","text":"חופן כוסברה"},{"kind":"sublabel","text":"לתיבול שווארמה:"},{"kind":"item","text":"2\\1 כפית תבלין שווארמה"},{"kind":"item","text":"1 כף שמן זית"},{"kind":"sublabel","text":"או לחילופין הכנת תיבול שווארמה ביתי:"},{"kind":"item","text":"1/2 כפית כמון"},{"kind":"item","text":"1/2 כפית פפריקה מתוקה"},{"kind":"item","text":"1/4 כפית כורכום"},{"kind":"item","text":"1/4 כפית מלח"},{"kind":"item","text":"1/2 כפית אבקת שום"},{"kind":"item","text":"1/4 כפית ראס אל חנות (לא חובה)/תיבול גריל"},{"kind":"item","text":"1 כף שמן זית"}]'::jsonb, '["פרוסים את הטופו לרצועות דקות ומעבירים לקערה/ קופסה.","מתבלים את הטופו בשמן זית ובתבלינים ומערבבים טוב טוב שכל הטופו עטוף בתבלינים ומניחים בצד \\ במקרר.","בינתיים חותכים את הבצל והשום לרצועות, את פרחי הכרובית לפרחים קטנים ואת הפטריות לפרוסות.","מטגנים את הבצל והשום בשמן זית ומוסיפים את הכרובית והפטריות ומקפיצים יחד עד השחמה.","מוסיפים את הטופו וממשיכים לערבב ולהקפיץ עד שהטופו משחים וזהוב.","כמובן שמגישים עם כוסברה, טחינה, סלט ירקות קצוץ ומה שעולה על דעתכם!"]'::jsonb, '', 'הצעת הגשה- לאכול בפיתה כוסמין עם טחינה וסלט ירקות או לאכול ככה מהמחבת!', '{"ingredients":"רכיבים","steps":"אופן הכנה","tip":"טיפ"}'::jsonb, 'published'::public.content_status, '2026-01-25T00:00:00Z'::timestamptz)
on conflict (id) do update set
  legacy_slug = excluded.legacy_slug,
  title = excluded.title,
  description = excluded.description,
  date = excluded.date,
  category = excluded.category,
  tags = excluded.tags,
  prep_time_text = excluded.prep_time_text,
  prep_minutes = excluded.prep_minutes,
  servings = excluded.servings,
  image_id = excluded.image_id,
  image_path = excluded.image_path,
  image_alt = excluded.image_alt,
  intro = excluded.intro,
  ingredients = excluded.ingredients,
  steps = excluded.steps,
  tip = excluded.tip,
  extra = excluded.extra,
  headings = excluded.headings;
insert into public.recipes (id, slug, legacy_slug, title, description, date, category, tags, prep_time_text, prep_minutes, servings, image_id, image_path, image_alt, intro, ingredients, steps, tip, extra, headings, status, published_at)
values ('e6d04cbb-7617-5eaa-8a20-e4ae6233c9c7', 'tuna-shawarma', 'שווארמה-טונה', 'שווארמה טונה', 'שווארמה טונה עשירה בחלבון בשתי דקות הכנה. מנה בריאה, מזינה וקלה במיוחד, מומלץ להגיש בטורטיה מקמח מלא עם טחינה וסלט עגבניות חריף.', '2026-01-07'::date, 'צהריים', array['עתיר חלבון', 'קל ומהיר']::text[], '2 דקות', 2, '3 מנות', '56bafe81-9063-5968-83da-28e2b1fe888b', '/media/client/recipes/tuna-shawarma.jpg', 'שווארמה טונה', 'שווארמה טונה מפוצצת בחלבון!!
2 דקות הכנה וקיבלתם ארוחה בריאה, מזינה וטעימה.

אז מדובר במנה קלה ברמות להכנה ומלאת חלבון שבאה בול גם לעצלנים במטבח או לאלה שאין להם הרבה זמן להתעסק אבל בא להם משהו בריא וטעים.

מומלץ לאכול בטורטיה מקמח מלא/ פיתה כוסמין/או אפילו ככה עם תוספות וסלטים בצד.

אני אכלתי אותה בתוך טורטיה מקמח מלא, עם טחינה ביתית וסלט עגבניות חריףףףף וזה היה מעדן!

(ערכים תזונתיים רשומים בסוף העמוד)', '[{"kind":"note","text":"(עבור 3 מנות)"},{"kind":"sublabel","text":"מצרכים לשווארמה:"},{"kind":"item","text":"1 בצל לבן חתוך לרצועות"},{"kind":"item","text":"2 שיני שום"},{"kind":"item","text":"2 קופסאות טונה במים"},{"kind":"item","text":"1 כפית תבלין שווארמה/תבלין חוויאג''"},{"kind":"item","text":"1/2 כפית פפריקה"},{"kind":"item","text":"מעט מלח, פלפל שחור"},{"kind":"item","text":"תרסיס שמן זית"},{"kind":"sublabel","text":"סלט עגבניות חריף:"},{"kind":"item","text":"15 עגבניות שרי"},{"kind":"item","text":"1/2 פלפל ירוק חריף"},{"kind":"item","text":"2 שיני שום"},{"kind":"item","text":"1/4 צריר כוסברה"},{"kind":"item","text":"1 כף שמן זית, מיץ לימון מלימון שלם, 1/2 כפית מלח"}]'::jsonb, '["קולפים וחותכים דק את הבצל והשום.","מחממים את המחבת ומרססים בשמן זית.","מוסיפים את רצועות הבצל, מטגנים עד שמשחים ומוסיפים את השום.","בינתיים לשווארמה- מסננים את הטונה מהמים, מעבירים לקערה, מוסיפים את התבלינים ומערבבים.","מוסיפים את הטונה למחבת עם הבצל והשום ומקפיצים הכל יחד 4 דקות בערך עד שמשחים.","מכינים את הסלט עגבניות החריף.","מגישים- מרכיבים לנו מנה מפנקת ונהנים מהארוחה!"]'::jsonb, '', '### ערכים תזונתיים לשווארמה: (לכל הכמות ללא התוספות)

אנרגיה (קלוריות) - 343 קק"ל.

שומן -6.1 גרם.

חלבון- 57.7 גרם.

פחמימה- 18.9 גרם.', '{"ingredients":"רכיבים","steps":"אופן הכנה","tip":"טיפ"}'::jsonb, 'published'::public.content_status, '2026-01-07T00:00:00Z'::timestamptz)
on conflict (id) do update set
  legacy_slug = excluded.legacy_slug,
  title = excluded.title,
  description = excluded.description,
  date = excluded.date,
  category = excluded.category,
  tags = excluded.tags,
  prep_time_text = excluded.prep_time_text,
  prep_minutes = excluded.prep_minutes,
  servings = excluded.servings,
  image_id = excluded.image_id,
  image_path = excluded.image_path,
  image_alt = excluded.image_alt,
  intro = excluded.intro,
  ingredients = excluded.ingredients,
  steps = excluded.steps,
  tip = excluded.tip,
  extra = excluded.extra,
  headings = excluded.headings;
insert into public.recipes (id, slug, legacy_slug, title, description, date, category, tags, prep_time_text, prep_minutes, servings, image_id, image_path, image_alt, intro, ingredients, steps, tip, extra, headings, status, published_at)
values ('88d47e8c-9f33-560c-8242-c15d9ab8753a', 'zucchini-feta-salad', 'סלט-זוקיני-חי-עם-פטה-ושקדים', 'סלט זוקיני חי עם פטה ושקדים', 'סלט זוקיני חי עם פטה, נענע, בזיליקום ושקדים קלויים ברוטב לימוני. מוכן ב-10 דקות, קל ומרענן, ומתאים לאירוח או לצד כל ארוחה.', '2026-01-21'::date, 'סלטים', array['צמחוני', 'קל ומהיר']::text[], '10 דקות', 10, null, 'f4f3dac2-0e7b-5fdd-86d6-79fc58c66999', '/media/client/recipes/zucchini-feta-salad.jpg', 'סלט זוקיני חי עם פטה ושקדים', 'סלט זוקיני חי עם פטה ושקדים קלויים, סלט קל ופשוט אבל כל כך טעים ומרענן שהולך לסגור לכם את הפינה

״זה כולה סלט עם זוקיני״ - אבל עד שלא תכינו אותו לא תבינו ממה אני מתלהבת..

עכשיו הקטע של הסלט הזה, זה שהוא לוקח 10 דקות הכנה והוא הולך לסדר אתכם ולסגור את הפינה שאין לכם מה להכין לאורחים או להביא למארחת ברגע האחרון וגם על הדרך לסחוט ים של מחמאות…

בקיצור מדובר על מתכון שחובה לשמור .', '[{"kind":"note","text":"(מומלץ להכפיל כמות אם רוצים כמות גדולה)"},{"kind":"item","text":"3 זוקיני טריים גדולים"},{"kind":"item","text":"חופן נענע"},{"kind":"item","text":"חופן בזיליקום"},{"kind":"item","text":"צרור בצל ירוק קצוץ"},{"kind":"item","text":"100 גרם פטה (ממליצה פטה עזים)"},{"kind":"item","text":"1/4 כוס שקדים מולבנים פרוסים"},{"kind":"sublabel","text":"לרוטב:"},{"kind":"item","text":"3 כפות שמן זית"},{"kind":"item","text":"מיץ לימון מחצי לימון"},{"kind":"item","text":"1 שן שום"},{"kind":"item","text":"1/2 כפית מלח"},{"kind":"item","text":"1/4 כפית פלפל שחור"}]'::jsonb, '["שוטפים את הזוקיני ומסירים את הקליפה.","מגלפים רצועות דקות מהזוקיני ומעבירים לקערה.","מוסיפים לקערה את הבזיליקום, הנענע והבצל הירוק .","מועכים את הפטה עם מזלג ואז מוסיפים לקערה.","מערבבים את כל רכיבי הרוטב, שופכים מעל הסלט ומערבבים היטב.","קולים את השקדים ומוסיפים על הסלט בהגשה. תיהנו!!"]'::jsonb, '', '', '{"ingredients":"רכיבים","steps":"אופן הכנה","tip":"טיפ"}'::jsonb, 'published'::public.content_status, '2026-01-21T00:00:00Z'::timestamptz)
on conflict (id) do update set
  legacy_slug = excluded.legacy_slug,
  title = excluded.title,
  description = excluded.description,
  date = excluded.date,
  category = excluded.category,
  tags = excluded.tags,
  prep_time_text = excluded.prep_time_text,
  prep_minutes = excluded.prep_minutes,
  servings = excluded.servings,
  image_id = excluded.image_id,
  image_path = excluded.image_path,
  image_alt = excluded.image_alt,
  intro = excluded.intro,
  ingredients = excluded.ingredients,
  steps = excluded.steps,
  tip = excluded.tip,
  extra = excluded.extra,
  headings = excluded.headings;

-- ── the published edges of the media reference graph ───────────────────────
-- publish_entity maintains these from here on; the migration seeds them so the
-- delete guard in the media library is not empty on day one, which fails in the
-- unsafe direction (an asset with no edges looks free to delete).
insert into public.media_refs (media_id, ref_kind, entity_type, entity_id, field)
select r.image_id, 'published', 'recipe', r.id, 'image_id'
  from public.recipes r
 where r.image_id is not null
on conflict do nothing;


-- ═══════════════ seed-pages.sql ═══════════════
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
        '[{"id":"hero","type":"home-hero","schema_version":1,"visible":true,"payload":{"kicker":"תזונת נשים · ליווי אישי","title":"את כבר יודעת מה לאכול.\nמה שחסר זה לא עוד תפריט.","titleAccent":"לא עוד תפריט","lede":"אלא דרך שנבנית סביב השבוע האמיתי שלך, בלי לוותר על האוכל שאת אוהבת. כדי שסוף-סוף יהיה שקט בראש, והתוצאה תישאר.","ctaPrimary":"בואי נדבר","ctaSub":"שיחת היכרות חינם","trustToken":"דיאטנית קלינית מוסמכת · R.D.","trustTokenLicense":" · רישיון משרד הבריאות","ctaRecipes":"עוד לא מוכנה לשיחה? המתכונים שלי כאן","poster":"/media/generated/01-hero-film-poster.jpg","filmWebm":"/media/generated/01-hero-film.webm","filmMp4":"/media/generated/01-hero-film.mp4"}},{"id":"guide","type":"home-guide","schema_version":1,"visible":true,"payload":{"kicker":"נעים להכיר","title":"אני מכירה את הבלבול הזה","empathy":"גם אני עמדתי מול הבלגן הזה. בשלב מסוים כבר לא ידעתי מה נכון ומה לא נכון. בדיוק בגלל זה הלכתי ללמוד, כדי להבין מה באמת קורה בגוף שלנו.","name":"אלונה אקרלינג","role":"דיאטנית קלינית מוסמכת · R.D.","cta":"בואי לראות איך עובדים יחד ←","titleAccent":"מכירה","credentials":["דיאטנית קלינית מוסמכת · R.D.","רישיון משרד הבריאות 204526-11","B.Sc במדעי התזונה","התמחות קלינית · איכילוב"],"mechanism":["דיאטנית שמבשלת","נבנה סביב השבוע שלך","מדע עדכני","ליווי אחת-על-אחת"]}},{"id":"plan","type":"home-plan","schema_version":1,"visible":true,"payload":{"kicker":"איך זה עובד","title":"שלושה צעדים, בשפה שלך","lead":"תפריטים כבר יש לך. הדרך צריכה להיבנות סביב השבוע שלך.","cta":"רוצה לראות איך זה נראה בפועל? הצצה למטבח שלי ←","titleAccent":"בשפה שלך","steps":[{"n":"01","t":"שיחת היכרות","d":"שיחה קצרה, בחינם ובלי שום התחייבות. את מספרת לי מה עובר עלייך עכשיו, מה כבר ניסית, ומה הכי מעייף אותך סביב האוכל, ואני בעיקר מקשיבה. בסוף השיחה נבין ביחד אם אני האדם הנכון ללוות אותך, ואם התשובה היא לא, אגיד לך את זה בכנות. זו שיחה, לא שיחת מכירה, ואת לא צריכה להגיע אליה מוכנה."},{"n":"02","t":"פגישה עמוקה + תוכנית אישית","d":"פגישה של 60 עד 75 דקות שיושבת לעומק: מה את אוהבת לאכול, איך נראה היום שלך באמת, מה כבר ניסית ומה נשבר בדרך, ובדיקות דם אם רלוונטי. אין כאן שיפוט ואין רשימת איסורים, יש הקשבה למה שבאמת קורה אצלך בשבוע. מהפגישה את יוצאת עם תוכנית אישית שנבנית סביב החיים שלך ולא במקומם, והאוכל שאת אוהבת נשאר בפנים. התוכנית נשארת אצלך, ולא נעלמת ברגע שיצאת מהחדר."},{"n":"03","t":"ליווי שנשאר","d":"אני לא נעלמת אחרי הפגישה, וזה בדיוק החלק שרוב הדיאטות מפספסות. בחבילות הליווי אני איתך בוואטסאפ בין המפגשים, לשאלות הקטנות שצצות באמצע היום ולרגעים שבהם מתחשק לוותר, ויש גם פידבק על יומן האכילה ומפגשי מעקב לאורך הדרך. ככה הדברים מפסיקים להיות רעיון יפה ונכנסים לשגרה, גם בשבועות העמוסים. המטרה שלי היא שלא תישארי לבד מול האתגרים של היום יום, ושבסוף הדרך יישאר לך משהו שהוא כבר שלך. לא עוד דיאטה שנגמרת."}]}},{"id":"proof","type":"home-proof","schema_version":1,"visible":true,"payload":{"kicker":"תראי בעצמך","title":"היא באמת מבשלת","body":"לא עוד תמונה יפה. אוכל אמיתי שאני מבשלת, מתוך שבוע רגיל ועמוס.","countChip":"בערך 30 מתכונים · מתכון חדש כל שבוע","darkTestimonial":"המלצות אמיתיות יופיעו כאן ברגע שיהיו. אני לא ממציאה סיפור שלא קרה.","darkLogos":"שיתופי פעולה ומדיה יתווספו עם האישור.","cta":"לכל המתכונים ←","titleAccent":"באמת"}},{"id":"stakes","type":"home-stakes","schema_version":1,"visible":true,"payload":{"kicker":"נמאס מהסבב הזה?","title":"עוד שנה רועשת, או דרך שסוף-סוף שקטה","cue":"הדרך שאני ממליצה עליה","band":"במקום עוד שנה כזאת, בואי נדבר. שיחת היכרות בלי עלות ובלי התחייבות.","bandCta":"בואי נדבר ←","bandSecondary":"או קחי בינתיים הצצה למתכונים","titleAccent":"שקטה","quiet":{"label":"הדרך השקטה","note":"פעם אחת, בליווי, והאוכל שאת אוהבת נשאר על השולחן","points":["דרך שנבנית סביב השבוע האמיתי שלך","שקט. לאכול בלי לספור ובלי להתנצל","משהו שנשאר איתך, כי זו לא עוד דיאטה","אחת-על-אחת, גם בין הפגישות"]},"noisy":{"label":"עוד שנה רועשת","note":"עוד דיאטה שמתחילה ביום ראשון ונשברת ברביעי","points":["תפריט חדש שאת כבר יודעת שלא יחזיק","רעש בראש סביב כל ארוחה, ואשמה אחריה","\"הפעם זה יחזיק\", שכבר אמרת לעצמך","לבד מול עוד ניסיון"]}}},{"id":"success","type":"home-success","schema_version":1,"visible":true,"payload":{"kicker":"ככה זה יכול להרגיש","lines":"בפעם הראשונה, אני לא בדיאטה.\nאכלתי בחוץ, נהניתי, ובלי אשמה.\nיש לי אנרגיה, ובראש שקט.","bridge":"וזה מתחיל בשיחה אחת, בלי לחץ. ←"}},{"id":"cta","type":"home-cta","schema_version":1,"visible":true,"payload":{"title":"בואי נדבר.\nהצעד הראשון קטן, וחינם.","body":"שיחת היכרות קצרה, בלי התחייבות. נכיר, ונבין יחד אם אני האדם הנכון ללוות אותך אל השקט הזה.","packages":"הליווי נמכר בחבילות שמתאימות לחיים שלך. על זה בדיוק נדבר בשיחה, בלי הפתעות ובלי מחיר שקופץ מהמסך.","promise":"אני חוזרת אלייך אישית, עד 4 ימי עסקים.","trustToken":"דיאטנית קלינית מוסמכת · R.D.","trustTokenLicense":" · רישיון משרד הבריאות"}}]'::jsonb,
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

-- The FULL documents — hidden sections included — go to drafts, which has no
-- anon policy at all. The pages rows above hold only the visible projection,
-- so without these rows a section hidden at migration time would exist
-- NOWHERE in the database, and the desk could never show or unhide it again.
-- The desk reads drafts-first for exactly this reason.
insert into public.drafts (entity_type, entity_id, payload)
values ('page', '105b8030-6649-53c5-805a-b2a3fcb1f9c7', '{"slug":"about","title":"עליי","sections":[{"id":"hero","type":"about-hero","schema_version":1,"visible":true,"payload":{"crumbLabel":"עליי","kicker":"נעים להכיר","title":"אלונה אקרלינג","lede":"דיאטנית קלינית מוסמכת שמלווה נשים אל שקט סביב האוכל, בגובה העיניים, בלי דיאטות ובלי אשמה. הנה מי שעומדת מאחורי כל מילה כאן.","licenseChip":"דיאטנית קלינית מוסמכת · R.D. · רישיון משרד הבריאות 204526-11","ctaPrimary":"בואי נדבר","ctaPrimarySub":"שיחת היכרות בלי עלות","ctaMicro":"תראי בעצמך אם זה מתאים · בלי התחייבות","ctaSecondary":"קראי את הסיפור שלי ↓","portraitLabel":"אלונה אקרלינג, דיאטנית קלינית מוסמכת, פורטרט","portraitSignature":"אלונה","portraitRole":"דיאטנית קלינית מוסמכת · R.D."}},{"id":"story","type":"about-story","schema_version":1,"visible":true,"payload":{"kicker":"הסיפור שלי","title":"לפני שהייתי דיאטנית,\nהייתי בדיוק במקום שלך","p1":"הכל התחיל אצלי בתקופת הקורונה, כשגיליתי את הבישול הבריא והתחלתי לשתף באינסטגרם.","p2":"ואז טבעתי במיתוסים: בשלב מסוים כבר לא ידעתי מה נכון ומה לא נכון. בדיוק בגלל זה הלכתי ללמוד, כדי להבין מה באמת קורה בגוף שלנו.","credo1":"אני מאמינה שאוכל בריא לא צריך להיות משעמם. להפך: הוא יכול להיות עשיר, מגוון, טעים וצבעוני, ולא מסובך בכלל.","credo2":"אין מאכלים אסורים, אין אשמה. רק איזון חכם שמאפשר ליהנות מהכל.","credo2Accent":"ליהנות","signOff":"זמינה בשבילך לכל שאלה,","signature":"אלונה","image":"/media/client/recipes/moroccan-fish.jpg","imageAlt":"דגים מרוקאים של שישי, מנה אמיתית מהמטבח של אלונה"}},{"id":"age","type":"about-age","schema_version":1,"visible":true,"payload":{"kicker":"על הגיל, בלי להתחמק","quote":"כן, אני צעירה.\nוזה בדיוק מה שמאפשר לי\nלהחזיק את המדע הכי עדכני,\nולדבר איתך בגובה העיניים, לא מלמעלה.","quoteAccent":"בדיוק","support":"אני מגיעה עם אנרגיה, סקרנות ורצון ללמוד ולהתפתח.","signature":"אלונה"}},{"id":"credentials","type":"about-credentials","schema_version":1,"visible":true,"payload":{"kicker":"הרקע, בגילוי מלא","title":"הרקע אמיתי, ואפשר לבדוק אותו","titleAccent":"אמיתי","anchorTitle":"דיאטנית קלינית מוסמכת · R.D.","anchorLine":"רישיון משרד הבריאות 204526-11","anchorVerify":"בדקי אותי במאגר משרד הבריאות","anchorVerifyHref":"https://practitioners.health.gov.il","bscTitle":"B.Sc במדעי התזונה","bscLine":"המרכז האקדמי פרס, 2024","internTitle":"התמחות קלינית · בית החולים איכילוב","internLine":"חצי שנה, 2025","craftTitle":"דיאטנית שמבשלת","craftLine":"לא רק אומרת לך מה לאכול. יודעת בדיוק איך זה נראה במטבח האמיתי.","craftLink":"אל המתכונים ←","craftMicro":"בערך 30 מתכונים, מתעדכן מדי שבוע","craftImage":"/media/client/recipes/quinoa-citrus-salad.jpg","craftImageAlt":"סלט קינואה והדרים, מנה אמיתית מהמטבח של אלונה","bridge":"אז אם השאלה היא \"אינפלואנסרית או דיאטנית אמיתית?\", הנה הרקע, גלוי לבדיקה.","teamLink":"לעמוד ההסמכות המלא ←"}},{"id":"press","type":"about-press","schema_version":1,"visible":true,"payload":{"reserved":"שיתופי פעולה ומדיה יתווספו כאן עם האישור. אני לא מציגה לוגו שלא אושר."}},{"id":"cta","type":"about-cta","schema_version":1,"visible":true,"payload":{"kicker":"הצעד שלך","title":"עכשיו כשאת מכירה אותי,\nבשיחת היכרות בלי עלות, תראי בעצמך אם זה מתאים.","body":"עכשיו את כבר יודעת מאיפה אני מגיעה ומה הרקע שלי. מה שנשאר זה לשמוע אותך: שיחה קצרה, בלי עלות ובלי התחייבות, בגובה העיניים, ונראה אם הדרך שלי מתאימה לך. האוכל שאת אוהבת נשאר בפנים.","recipes":"ורוצה קודם פשוט לראות מה אני מבשלת? המתכונים כאן ←","trustToken":"דיאטנית קלינית מוסמכת · R.D. · רישיון משרד הבריאות 204526-11","button":"בואי נדבר, שיחת היכרות חינם","signature":"אלונה","promise":"אני חוזרת אלייך אישית, עד 4 ימי עסקים."}}],"baseline_order":[{"id":"hero","type":"about-hero"},{"id":"story","type":"about-story"},{"id":"age","type":"about-age"},{"id":"credentials","type":"about-credentials"},{"id":"press","type":"about-press"},{"id":"cta","type":"about-cta"}]}'::jsonb)
on conflict (entity_type, entity_id) do update set
  payload = excluded.payload,
  updated_at = now();
insert into public.drafts (entity_type, entity_id, payload)
values ('page', '3ee8653c-e193-569e-83ce-1c7d03fb0ef9', '{"slug":"coaching","title":"איך עובדים איתי","sections":[{"id":"meta","type":"page-meta","schema_version":1,"visible":true,"payload":{"title":"איך עובדים איתי","serviceName":"ליווי תזונתי אישי","serviceType":"ליווי תזונתי אישי"}},{"id":"hero","type":"coaching-hero","schema_version":1,"visible":true,"payload":{"breadcrumb":"איך עובדים איתי","kicker":"ליווי אחת-על-אחת","title":"ככה נעבוד ביחד","body":"את כבר יודעת מה לאכול. הדרך צריכה להיבנות סביב השבוע שלך, בלי לוותר על האוכל שאת אוהבת, כדי שסוף-סוף יהיה שקט בראש והתוצאה תישאר.","trustToken":"דיאטנית קלינית מוסמכת · R.D. · רישיון משרד הבריאות 204526-11","ctaPrimary":"בואי נדבר","ctaSub":"שיחת היכרות חינם","ctaWhatsapp":"אפשר גם לכתוב לי בוואטסאפ","micro":"בלי התחייבות · מענה עד 4 ימי עסקים · על החבילות נדבר בשיחה"}},{"id":"problem","type":"coaching-problem","schema_version":1,"visible":true,"payload":{"kicker":"למה דווקא ליווי","title":"את כבר יודעת מה לאכול","titleAccent":"יודעת","lead":"מה שחסר זה לא עוד ידע.","body1":"שמרת את הפוסטים, קראת את התפריטים, התחלת ביום ראשון. ולבד, שוב, זה לא החזיק, וזה לא כי טעית או לא ניסית מספיק.","quote":"הפער הוא לא במה לאכול. הפער הוא לעשות את זה לבד.","quoteAccent":"לבד","body2":"הידע כבר אצלך; מה שאף מדריך לא נתן לך זה מישהי לצדך, בתוך השבוע האמיתי שלך.","cta":"אז ככה זה עובד כשלא לבד ←"}},{"id":"method","type":"coaching-method","schema_version":1,"visible":true,"payload":{"kicker":"שיטה, לא קסם","title":"ארבעה דברים שהופכים ידע לתוצאה שנשארת","titleAccent":"שנשארת","pillars":[{"title":"נבנה סביב השבוע האמיתי שלך","body":"לא תפריט גנרי שנלחם בחיים שלך, אלא דרך שנבנית סביב מה שבאמת קורה אצלך בשבוע: העבודה, הילדים, האירועים, והערב שבו אין כוח לבשל. בגלל זה זה מחזיק."},{"title":"בלי לוותר על האוכל שאת אוהבת","body":"אנחנו לא מוחקות מאכלים ולא עושות רשימות אסור. לומדות איך לשלב את מה שאת אוהבת בתוך משהו שעובד, בלי אשמה, כדי שיהיה שקט בראש."},{"title":"החלטות על סמך מדע עדכני","body":"כל החלטה נשענת על מה שידוע היום על הגוף, לא על הדיאטה הבאה שכולם מדברים עליה. זה ההבדל בין ניחוש לבין שיטה."},{"title":"ליווי צמוד גם בין הפגישות","body":"אני איתך בין הפגישות, לא רק בחדר: כדי שהידע יהפוך להרגל, ושלא תישארי לבד באמצע הדרך."}],"cta":"ככה זה נראה בפועל, הנה החבילות ←"}},{"id":"packages","type":"coaching-packages","schema_version":1,"visible":true,"payload":{"kicker":"שלוש דרכים להיכנס","title":"בחרי את הליווי שמתאים לך","titleAccent":"שמתאים לך","lead":"אותה שיטה, בשלוש רמות של ליווי. בלי מחיר קשיח: נבחר ביחד את מה שמתאים לחיים שלך, בשיחת היכרות בלי התחייבות.","facts":["60 עד 75 דקות","ליווי בסיס · 60 יום","ליווי מורחב · 120 יום","מענה עד 4 ימי עסקים"],"fitLabel":"למי זה מתאים:","includedLabel":"מה כלול:","cardCta":"בואי נדבר","sharedLine":"על החבילה והמחיר נדבר בשיחה. נתאים אותם אלייך, בלי התחייבות.","packages":[{"slug":"single-session","name":"פגישת עומק · חד-פעמית","chip":"60 עד 75 דקות","fit":"לרגע שבו את רוצה כיוון מקצועי אחד, נקי: פגישה עמוקה ותוכנית אישית שנשארת איתך.","included":["אבחון מעמיק בפגישה של 60 עד 75 דקות","תוכנית אישית שנבנית סביב השבוע שלך","קובץ מפורט עם כלים, טיפים והנחיות להתנהלות עצמאית"],"highlight":false},{"slug":"coaching-60","name":"ליווי בסיס · 60 יום","chip":"","fit":"כשאת רוצה לא רק לדעת מה נכון, אלא שמישהי תלווה אותך עד שזה נכנס לשגרה.","included":["פגישת אבחון מעמיקה + 4 מפגשי מעקב (אחת לשבועיים)","וואטסאפ ביני לבינך בין המפגשים","פידבק על יומן האכילה","צירוף לקבוצת הוואטסאפ + גישה לאפליקציה ותכנים מקצועיים"],"highlight":false},{"slug":"coaching-120","name":"ליווי מורחב · 120 יום","chip":"","fit":"מתאים כשהדפוס ותיק וניסית כבר הכל, וחשוב לך שהפעם זה יישאר.","included":["כל מה שבליווי הבסיס","ליווי לאורך כ-120 יום, לעומק ולאורך זמן","4 מפגשי מעקב + ליווי צמוד בוואטסאפ ובאפליקציה"],"highlight":true}]}},{"id":"process","type":"coaching-process","schema_version":1,"visible":true,"payload":{"kicker":"שלב אחרי שלב","title":"מה קורה בכל שלב","lead":"בחרת כיוון? הנה מה שקורה בפועל, בלי הפתעות: אותה דרך חמה, אחת-על-אחת, שנבנית סביב השבוע שלך.","steps":[{"t":"שיחת היכרות","d":"בחינם ובלי התחייבות. נכיר, תספרי לי מה עובר עלייך, ונבין ביחד אם אני האדם הנכון ללוות אותך. שיחה, לא שיחת מכירה."},{"t":"פגישה עמוקה + תוכנית אישית","d":"60 עד 75 דקות שיושבות לעומק: מה את אוהבת לאכול, איך נראה היום שלך, מה כבר ניסית, ובדיקות דם אם רלוונטי. את יוצאת עם תוכנית שנבנית סביב החיים שלך, לא במקומם."},{"t":"ליווי שנשאר","d":"כאן זה לא נגמר. בין המפגשים אני איתך בוואטסאפ, עם פידבק על יומן האכילה, ובחבילות גם אפליקציית ליווי, כדי שהדברים ייכנסו לשגרה ויישארו. לא עוד דיאטה שנגמרת ואת נשארת לבד איתה."}],"cta":"מרגישה שזה מדבר אלייך? בואי נדבר ←"}},{"id":"proof","type":"coaching-proof","schema_version":1,"visible":true,"payload":{"kicker":"תראי בעצמך","title":"מהמטבח של אלונה","titleAccent":"אלונה","lead":"אוכל שאני באמת מבשלת, בתוך שבוע רגיל, בלי למחוק את מה שאת אוהבת.","photo":"/media/client/recipes/green-shakshuka.jpg","photoAlt":"שקשוקה ירוקה - שקשוקת תרד חלומית","tiles":[{"src":"/media/client/recipes/one-pot-bulgur-stew.jpg","alt":"תבשיל בורגול בסיר אחד"},{"src":"/media/client/recipes/roasted-tomato-soup.jpg","alt":"מרק עגבניות צלויות"}],"testimonialEmpty":"המלצות אמיתיות יופיעו כאן ברגע שיהיו. אני לא ממציאה סיפור שלא קרה.","cta":"הצצה למטבח שלי ←"}},{"id":"faq","type":"coaching-faq","schema_version":1,"visible":true,"payload":{"kicker":"לפני שנדבר","title":"כל מה שאת שואלת את עצמך עכשיו","lead":"ריכזתי כאן את השאלות שחוזרות אליי הכי הרבה, בכנות, בלי מכירה. אם נשאר לך עוד משהו, בדיוק בשביל זה יש שיחת היכרות בלי התחייבות.","items":[{"q":"אני כבר יודעת מה לאכול. אז מה ליווי בכלל ייתן לי?","a":"רוב הנשים שמגיעות אליי יודעות בדיוק מה נכון. הפער אף פעם לא היה בידע, הוא בלעשות את זה לבד, בתוך שבוע עמוס. הליווי הוא לא עוד מידע: הוא דרך שנבנית סביב השבוע האמיתי שלך, ומישהי אחת שנשארת איתך עד שזה נכנס לשגרה."},{"q":"ניסיתי כבר הכל. למה שדווקא זה יעבוד?","a":"כי זה לא עוד דיאטה ולא עוד תפריט. אין אצלי קיצורי דרך, טרנדים והבטחות קסם: בונות דרך סביב החיים שלך, בלי לוותר על האוכל שאת אוהבת, בקצב שאפשר להתמיד בו."},{"q":"אני לא רוצה עוד תפריט נוקשה שאי אפשר לעמוד בו.","a":"ואני לא עובדת ככה. אין תפריט אחיד ואין רשימת איסורים: יש התאמה לשבוע שלך, לטעמים שלך ולקצב שלך, וגמישות כשהחיים משתנים."},{"q":"יש לי כל הזמן רעש ואשמה בראש סביב אוכל. זה יכול להשתנות?","a":"זה בדיוק הלב של העבודה שלי. המטרה היא שקט: פחות התלבטות, פחות אשמה, יותר ראש נקי. בלי שיפוט ובלי \"נפלת\"."},{"q":"אני אוכלת הרבה מתוך לחץ או רגש. את מתייחסת גם לזה?","a":"כן, זה חלק מרכזי בליווי. מסתכלות יחד על הדפוסים בעדינות, בלי שיפוט, ובונות במקומם הרגלים שקטים יותר ומערכת יחסים טובה יותר עם אוכל."},{"q":"איך אני יודעת שהפעם זה יישאר ולא יחזור כמו תמיד?","a":"כי אנחנו לא רודפות אחרי תוצאה מהירה שנעלמת. בונות הרגלים באמת, בקצב שנכון לך, כך שאפשר להתמיד לאורך זמן. הליווי המורחב קיים בדיוק בשביל זה."},{"q":"מה קורה אחרי שהליווי נגמר? אני חוזרת לאותו מקום?","a":"המטרה שלי הפוכה מתלות: שתצאי עם דרך שהיא כבר שלך. תוכנית שנשארת בידיים שלך, הרגלים שהפכו טבעיים, וכלים שיישארו גם הרבה אחרי שהליווי יסתיים."},{"q":"אני מרגישה שאני מתמודדת עם זה לבד. איך הליווי עוזר בזה?","a":"בזה שאני באמת שם. יש פגישות אחת-על-אחת, ובחבילות הליווי גם וואטסאפ ביני לבינך בין המפגשים, עם פידבק על יומן האכילה. המטרה היא שלא תישארי לבד מול האתגרים של היום יום."},{"q":"את בת 26. יש לך מספיק ניסיון, או שאת עוד אינפלואנסרית?","a":"שאלה הוגנת. אני דיאטנית קלינית מוסמכת, רישיון משרד הבריאות 204526-11 (אפשר לבדוק במאגר משרד הבריאות), עם B.Sc במדעי התזונה והתמחות קלינית בבית החולים איכילוב. ואני דווקא חושבת שהגיל הוא יתרון: אני מגיעה עם אנרגיה, סקרנות ורצון ללמוד ולהתפתח. את כל הסיפור תמצאי בעמוד \"עליי\"."},{"q":"אין לי זמן וכוח לעוד פרויקט גדול. איך זה משתלב בחיים?","a":"זה בכוונה לא פרויקט ענק. בונים את התהליך סביב החיים האמיתיים: גם אם את עובדת שעות ארוכות, אוכלת בחוץ או כמעט לא מבשלת, נמצא יחד מה שעובד אצלך. ויש גם פגישת עומק חד-פעמית, למי שרוצה כיוון בלי התחייבות ארוכה."},{"q":"אינסטגרם מלא בתוכן חינם. למה בכלל לשלם על ליווי?","a":"תוכן חינם הוא נהדר, אבל הוא כללי ומיועד לכולם, ולכן קל לדעת ולא לעשות. ליווי נותן ארבעה דברים שפוסט לא ייתן: התאמה אישית, מבנה, מישהי שבאמת חוזרת אלייך, וקהילה של בנות באותה דרך. המידע חינם; מה שמחזיק לאורך זמן זה הליווי."}],"closeLine":"נשאר לך \"כן, אבל\" שלא מופיע כאן? בשיחת היכרות בלי עלות ובלי התחייבות נענה עליו יחד.","closeCta":"בואי נדבר ←","magnet":"עדיין לא בטוחה? הצצה למטבח שלי."}},{"id":"cta","type":"coaching-cta","schema_version":1,"visible":true,"payload":{"title":"הגעת עד לפה.\nנשאר רק להכיר. בואי נדבר.","body":"שיחת היכרות קצרה, בלי התחייבות. נכיר, ונבין יחד אם אני האדם הנכון ללוות אותך, בלי לוותר על האוכל שאת אוהבת, כדי שסוף-סוף יהיה שקט בראש.","packagesLine":"הליווי נמכר בחבילות שמתאימות לחיים שלך. על זה נדבר בשיחה, בלי הפתעות ובלי מחיר שקופץ מהמסך.","promise":"אני חוזרת אלייך אישית, עד 4 ימי עסקים.","trustToken":"דיאטנית קלינית מוסמכת · R.D. · רישיון משרד הבריאות 204526-11","aboutPointer":"רוצה קודם להכיר אותי? הסיפור שלי בעמוד עליי ←","formHeading":"בואי נדבר, שיחת היכרות חינם"}}],"baseline_order":[{"id":"meta","type":"page-meta"},{"id":"hero","type":"coaching-hero"},{"id":"problem","type":"coaching-problem"},{"id":"method","type":"coaching-method"},{"id":"packages","type":"coaching-packages"},{"id":"process","type":"coaching-process"},{"id":"proof","type":"coaching-proof"},{"id":"faq","type":"coaching-faq"},{"id":"cta","type":"coaching-cta"}]}'::jsonb)
on conflict (entity_type, entity_id) do update set
  payload = excluded.payload,
  updated_at = now();
insert into public.drafts (entity_type, entity_id, payload)
values ('page', 'e99e9eca-8d71-517e-8456-1c385339da0a', '{"slug":"contact","title":"צור קשר","sections":[{"id":"door","type":"contact-door","schema_version":1,"visible":true,"payload":{"crumb":"צור קשר","kicker":"הדלת פתוחה","title":"בואי נדבר.","body":"אם הגעת עד לפה, כנראה משהו כבר מדבר אלייך. אין צורך להחליט על כלום עכשיו: נתחיל בשיחת היכרות קצרה, בלי התחייבות ובלי לחץ. אספר לך איך אני עובדת, את תספרי לי מה קורה אצלך, ומשם נחליט ביחד.","bodyAccent":"בלי התחייבות","cta":"בואי נדבר","ctaSub":"שיחת היכרות חינם","promise":"אני חוזרת אלייך אישית, עד 4 ימי עסקים.","place":"ברעננה, ואונליין מכל מקום בארץ.","trustToken":"דיאטנית קלינית מוסמכת · R.D. · רישיון משרד הבריאות"}},{"id":"lead","type":"contact-lead","schema_version":1,"visible":true,"payload":{"title":"הצעד הראשון הוא רק שיחה.","titleAccent":"רק שיחה.","body":"כמו שאמרתי למעלה: שיחה אחת קצרה, בלי התחייבות ובלי לחץ. משם נחליט ביחד, בלי למחוק שום דבר שאת אוהבת לאכול.","packages":"הליווי נמכר בחבילות שמתאימות לחיים שלך. איזו חבילה מתאימה לך וכמה היא עולה, אלה דברים שאני אומרת לך בשיחה עצמה, בפשטות.","nameLabel":"שם","phoneLabel":"טלפון / וואטסאפ","messageLabel":"מה הכי מעסיק אותך עכשיו? (לא חובה)","emailLabel":"אימייל","consentLabel":"אני מאשרת שאלונה תחזור אליי בטלפון / וואטסאפ / מייל","submitLabel":"בואי נדבר, שיחת היכרות חינם","submittingLabel":"שולח…","whatsappLabel":"מעדיפה לכתוב? דברי איתי ישירות בוואטסאפ","thanks":"קיבלתי את הפנייה שלך. אני חוזרת אלייך אישית, עד 4 ימי עסקים, בערוץ שבחרת. עד אז, את מוזמנת להציץ במתכונים ולנשום קצת.","thanksLink":"להציץ במתכונים","promise":"אני חוזרת אלייך אישית, עד 4 ימי עסקים.","place":"קליניקה ברעננה · ליווי אונליין בכל הארץ","trustToken":"דיאטנית קלינית מוסמכת · R.D. · רישיון משרד הבריאות"}},{"id":"where","type":"contact-where","schema_version":1,"visible":true,"payload":{"kicker":"איפה נפגשות","title":"איפה שנוח לך:\nאונליין בכל הארץ, או בקליניקה ברעננה","body":"רוב הליווי מתקיים אונליין, מכל מקום בארץ, בלי לצאת מהבית ובלי לאבד זמן על נסיעות. ואם נוח לך פנים-אל-פנים, יש קליניקה ברעננה. נמצא יחד את הדרך שמתאימה לחיים שלך.","items":[{"title":"ליווי אונליין בכל הארץ","body":"מהסלון שלך, מתי שמתאים. הכול מרחוק."},{"title":"קליניקה ברעננה","body":"מעדיפה פנים-אל-פנים? יש גם מקום לשבת בו."},{"title":"וואטסאפ בין הפגישות","body":"לא נעלמת. ערוץ אמיתי לשאלות קטנות בדרך, בחבילות הליווי."}],"chip":"אני חוזרת אלייך אישית, עד 4 ימי עסקים."}}],"baseline_order":[{"id":"door","type":"contact-door"},{"id":"lead","type":"contact-lead"},{"id":"where","type":"contact-where"}]}'::jsonb)
on conflict (entity_type, entity_id) do update set
  payload = excluded.payload,
  updated_at = now();
insert into public.drafts (entity_type, entity_id, payload)
values ('page', '70ea7ea5-1bde-5d4a-84e8-a6714860615c', '{"slug":"","title":"אלונה אקרלינג","sections":[{"id":"hero","type":"home-hero","schema_version":1,"visible":true,"payload":{"kicker":"תזונת נשים · ליווי אישי","title":"את כבר יודעת מה לאכול.\nמה שחסר זה לא עוד תפריט.","titleAccent":"לא עוד תפריט","lede":"אלא דרך שנבנית סביב השבוע האמיתי שלך, בלי לוותר על האוכל שאת אוהבת. כדי שסוף-סוף יהיה שקט בראש, והתוצאה תישאר.","ctaPrimary":"בואי נדבר","ctaSub":"שיחת היכרות חינם","trustToken":"דיאטנית קלינית מוסמכת · R.D.","trustTokenLicense":" · רישיון משרד הבריאות","ctaRecipes":"עוד לא מוכנה לשיחה? המתכונים שלי כאן","poster":"/media/generated/01-hero-film-poster.jpg","filmWebm":"/media/generated/01-hero-film.webm","filmMp4":"/media/generated/01-hero-film.mp4"}},{"id":"film","type":"home-film","schema_version":1,"visible":false,"payload":{"kicker":"מוכר לך? · צלחת אחת, ערב אחד","staticKicker":"מוכר לך?","staticHeading":"ניסית כבר הכל, והאוכל עדיין מרגיש כמו מלחמה.","staticBody":"את יודעת בדיוק מה נכון לאכול, אבל לבד זה לא מחזיק. כל ביס מגיע עם חשבון בראש, וביס אחד \"לא נכון\" הופך מהר ל\"היום כבר נהרס\". ארוחה אמיתית, בלי חשבון ובלי אשמה, אפשרית, ואת לא צריכה להגיע לזה לבד.","finalAlt":"צלחת מאוזנת ומלאה, ערוכה ומוכנה","chips":["אוקיי, סלט. בטוח.","רגע, קינואה זה פחמימה?","בטטה בערב?!","כמה קלוריות זה כבר?","טחינה זה שמן... אבל אני אוהבת."],"captions":[{"big":"ארוחת ערב. כמה קשה זה כבר יכול להיות?"},{"big":"שומעת את הרעש הזה?","small":"זה לא רעב. זו כל דיאטה שנשארה לך בראש."},{"big":"ארוחה אמיתית. בלי חשבון, בלי אשמה."},{"big":"ואת לא צריכה להגיע לזה לבד.","small":"בדיוק בשביל זה יש ליווי."}]}},{"id":"guide","type":"home-guide","schema_version":1,"visible":true,"payload":{"kicker":"נעים להכיר","title":"אני מכירה את הבלבול הזה","empathy":"גם אני עמדתי מול הבלגן הזה. בשלב מסוים כבר לא ידעתי מה נכון ומה לא נכון. בדיוק בגלל זה הלכתי ללמוד, כדי להבין מה באמת קורה בגוף שלנו.","name":"אלונה אקרלינג","role":"דיאטנית קלינית מוסמכת · R.D.","cta":"בואי לראות איך עובדים יחד ←","titleAccent":"מכירה","credentials":["דיאטנית קלינית מוסמכת · R.D.","רישיון משרד הבריאות 204526-11","B.Sc במדעי התזונה","התמחות קלינית · איכילוב"],"mechanism":["דיאטנית שמבשלת","נבנה סביב השבוע שלך","מדע עדכני","ליווי אחת-על-אחת"]}},{"id":"plan","type":"home-plan","schema_version":1,"visible":true,"payload":{"kicker":"איך זה עובד","title":"שלושה צעדים, בשפה שלך","lead":"תפריטים כבר יש לך. הדרך צריכה להיבנות סביב השבוע שלך.","cta":"רוצה לראות איך זה נראה בפועל? הצצה למטבח שלי ←","titleAccent":"בשפה שלך","steps":[{"n":"01","t":"שיחת היכרות","d":"שיחה קצרה, בחינם ובלי שום התחייבות. את מספרת לי מה עובר עלייך עכשיו, מה כבר ניסית, ומה הכי מעייף אותך סביב האוכל, ואני בעיקר מקשיבה. בסוף השיחה נבין ביחד אם אני האדם הנכון ללוות אותך, ואם התשובה היא לא, אגיד לך את זה בכנות. זו שיחה, לא שיחת מכירה, ואת לא צריכה להגיע אליה מוכנה."},{"n":"02","t":"פגישה עמוקה + תוכנית אישית","d":"פגישה של 60 עד 75 דקות שיושבת לעומק: מה את אוהבת לאכול, איך נראה היום שלך באמת, מה כבר ניסית ומה נשבר בדרך, ובדיקות דם אם רלוונטי. אין כאן שיפוט ואין רשימת איסורים, יש הקשבה למה שבאמת קורה אצלך בשבוע. מהפגישה את יוצאת עם תוכנית אישית שנבנית סביב החיים שלך ולא במקומם, והאוכל שאת אוהבת נשאר בפנים. התוכנית נשארת אצלך, ולא נעלמת ברגע שיצאת מהחדר."},{"n":"03","t":"ליווי שנשאר","d":"אני לא נעלמת אחרי הפגישה, וזה בדיוק החלק שרוב הדיאטות מפספסות. בחבילות הליווי אני איתך בוואטסאפ בין המפגשים, לשאלות הקטנות שצצות באמצע היום ולרגעים שבהם מתחשק לוותר, ויש גם פידבק על יומן האכילה ומפגשי מעקב לאורך הדרך. ככה הדברים מפסיקים להיות רעיון יפה ונכנסים לשגרה, גם בשבועות העמוסים. המטרה שלי היא שלא תישארי לבד מול האתגרים של היום יום, ושבסוף הדרך יישאר לך משהו שהוא כבר שלך. לא עוד דיאטה שנגמרת."}]}},{"id":"proof","type":"home-proof","schema_version":1,"visible":true,"payload":{"kicker":"תראי בעצמך","title":"היא באמת מבשלת","body":"לא עוד תמונה יפה. אוכל אמיתי שאני מבשלת, מתוך שבוע רגיל ועמוס.","countChip":"בערך 30 מתכונים · מתכון חדש כל שבוע","darkTestimonial":"המלצות אמיתיות יופיעו כאן ברגע שיהיו. אני לא ממציאה סיפור שלא קרה.","darkLogos":"שיתופי פעולה ומדיה יתווספו עם האישור.","cta":"לכל המתכונים ←","titleAccent":"באמת"}},{"id":"stakes","type":"home-stakes","schema_version":1,"visible":true,"payload":{"kicker":"נמאס מהסבב הזה?","title":"עוד שנה רועשת, או דרך שסוף-סוף שקטה","cue":"הדרך שאני ממליצה עליה","band":"במקום עוד שנה כזאת, בואי נדבר. שיחת היכרות בלי עלות ובלי התחייבות.","bandCta":"בואי נדבר ←","bandSecondary":"או קחי בינתיים הצצה למתכונים","titleAccent":"שקטה","quiet":{"label":"הדרך השקטה","note":"פעם אחת, בליווי, והאוכל שאת אוהבת נשאר על השולחן","points":["דרך שנבנית סביב השבוע האמיתי שלך","שקט. לאכול בלי לספור ובלי להתנצל","משהו שנשאר איתך, כי זו לא עוד דיאטה","אחת-על-אחת, גם בין הפגישות"]},"noisy":{"label":"עוד שנה רועשת","note":"עוד דיאטה שמתחילה ביום ראשון ונשברת ברביעי","points":["תפריט חדש שאת כבר יודעת שלא יחזיק","רעש בראש סביב כל ארוחה, ואשמה אחריה","\"הפעם זה יחזיק\", שכבר אמרת לעצמך","לבד מול עוד ניסיון"]}}},{"id":"success","type":"home-success","schema_version":1,"visible":true,"payload":{"kicker":"ככה זה יכול להרגיש","lines":"בפעם הראשונה, אני לא בדיאטה.\nאכלתי בחוץ, נהניתי, ובלי אשמה.\nיש לי אנרגיה, ובראש שקט.","bridge":"וזה מתחיל בשיחה אחת, בלי לחץ. ←"}},{"id":"cta","type":"home-cta","schema_version":1,"visible":true,"payload":{"title":"בואי נדבר.\nהצעד הראשון קטן, וחינם.","body":"שיחת היכרות קצרה, בלי התחייבות. נכיר, ונבין יחד אם אני האדם הנכון ללוות אותך אל השקט הזה.","packages":"הליווי נמכר בחבילות שמתאימות לחיים שלך. על זה בדיוק נדבר בשיחה, בלי הפתעות ובלי מחיר שקופץ מהמסך.","promise":"אני חוזרת אלייך אישית, עד 4 ימי עסקים.","trustToken":"דיאטנית קלינית מוסמכת · R.D.","trustTokenLicense":" · רישיון משרד הבריאות"}}],"baseline_order":[{"id":"hero","type":"home-hero"},{"id":"film","type":"home-film"},{"id":"guide","type":"home-guide"},{"id":"plan","type":"home-plan"},{"id":"proof","type":"home-proof"},{"id":"stakes","type":"home-stakes"},{"id":"success","type":"home-success"},{"id":"cta","type":"home-cta"}]}'::jsonb)
on conflict (entity_type, entity_id) do update set
  payload = excluded.payload,
  updated_at = now();
insert into public.drafts (entity_type, entity_id, payload)
values ('page', '94fcc1ec-cf68-53b9-8c27-96725e169abd', '{"slug":"testimonials","title":"המלצות","sections":[{"id":"hero","type":"testimonials-hero","schema_version":1,"visible":true,"payload":{"kicker":"רק אמיתי","title":"המלצות אמיתיות, כשיהיו","body":"כאן יופיעו סיפורים של נשים שליוויתי, במילים שלהן ובאישור שלהן. עוד אין לי כאלה להראות לך, ואני מעדיפה להשאיר את המקום הזה ריק מאשר להמציא סיפור שלא קרה.","bridge":"עד אז, מה שכן אפשר לראות באמת: המתכונים שאני מבשלת, הרישיון והלימודים שלי, ושיחת היכרות שבה תתרשמי בעצמך.","invite":"ואם בא לך, את מוזמנת להיות אחת הראשונות שמספרות.","cta":"בואי נדבר ←"}},{"id":"grid","type":"testimonials-grid","schema_version":1,"visible":true,"payload":{"title":"המלצות אמיתיות בלבד","emptyLead":"עוד לא פרסמתי המלצות. אעדכן כאן ברגע שיהיו.","emptyBody":"אני לא ממציאה סיפור שלא קרה. כשיגיעו המלצות אמיתיות, של נשים אמיתיות, הן יופיעו כאן, במילים שלהן ובאישורן.","redirectIntro":"בינתיים, הנה מה שאפשר לבדוק כבר עכשיו:","redirects":["המתכונים שאני באמת מבשלת ←","הרישיון והלימודים שלי ←"],"reciprocity":"עבדנו יחד? אשמח אם תשתפי, רק באישורך המלא ←"}},{"id":"cta","type":"testimonials-cta","schema_version":1,"visible":true,"payload":{"title":"לא תמצאי כאן סיפור שלא קרה.\nבואי נכתוב אחד אמיתי, יחד.","body":"המלצות אמיתיות יופיעו כאן עם שם ואישור פרסום, ולא רגע לפני. הכנות הזאת היא בדיוק מה שתקבלי גם בליווי עצמו. בינתיים, הדבר האמיתי ביותר שאני יכולה להציע לך הוא שיחת היכרות קצרה, בלי עלות ובלי התחייבות.","packages":"הליווי נמכר בחבילות שמתאימות לחיים שלך. על החבילה והמחיר נדבר בשיחה עצמה, בגובה העיניים.","promise":"אני חוזרת אלייך אישית, עד 4 ימי עסקים.","trustToken":"דיאטנית קלינית מוסמכת · R.D. · רישיון משרד הבריאות 204526-11","ctaPrimary":"בואי נדבר, שיחת היכרות חינם","ctaRecipes":"משהו לבדוק בעצמך עכשיו: המתכונים כאן ←"}}],"baseline_order":[{"id":"hero","type":"testimonials-hero"},{"id":"grid","type":"testimonials-grid"},{"id":"cta","type":"testimonials-cta"}]}'::jsonb)
on conflict (entity_type, entity_id) do update set
  payload = excluded.payload,
  updated_at = now();


-- ═══════════════ ledger — so `supabase db push` never re-runs these ═══════════════
create schema if not exists supabase_migrations;
create table if not exists supabase_migrations.schema_migrations (
  version text primary key,
  statements text[],
  name text
);
insert into supabase_migrations.schema_migrations (version, name, statements)
values
  ('20260729000001', 'schema',  array['pre-applied; recorded by apply-all']),
  ('20260729000002', 'rls',     array['applied via dashboard SQL editor']),
  ('20260729000003', 'publish', array['applied via dashboard SQL editor'])
on conflict (version) do nothing;

-- ═══════════════ באנר הצלחה — התוצאה שהעורך מציג היא של המשפט האחרון ═══════════════
-- storage_policies: 3 = הפוליסות נוצרו (פרויקט לא מוקשח), 0 = הפלטפורמה מנהלת
-- את storage והפוליסות ייווצרו דרך ה־Storage API בשלב ההעלאות. שני הערכים
-- תקינים היום; החשוב הוא שהמספר גלוי, כי הדשבורד לא מציג RAISE NOTICE.
select
  'apply-all הצליח' as status,
  (select count(*) from public.pages)        as pages,
  (select count(*) from public.drafts where entity_type = 'page') as page_drafts,
  (select count(*) from public.recipes)      as recipes,
  (select count(*) from public.media_assets) as media,
  (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('save_draft','publish_entity','rename_slug')) as functions,
  (select count(*) from pg_policies
    where policyname in ('media_bucket_editor_insert',
                         'media_bucket_editor_update',
                         'media_bucket_admin_all')) as storage_policies;
