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
