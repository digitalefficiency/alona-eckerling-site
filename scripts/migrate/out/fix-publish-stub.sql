-- fix-publish-stub.sql — הדבקה אחת בעורך ה-SQL של הדשבורד.
--
-- מה זה מתקן: visible_sections של פרסום (0003) מחקה סקשן מוסתר לגמרי,
-- בעוד savePage באפליקציה מפרסם אותו כ-stub ריק
-- ({id, type, schema_version, visible:false, payload:{}}).
-- בלי ה-stub, הרנדר לא מבחין בין "הוסתר בכוונה" לבין "מסמך ישן מהקוד",
-- וסקשן שהוסתר בדסק חוזר לעמוד החי מתוך קובץ הגיבוי.
-- ההדבקה הזו מיישרת את פונקציית ה-SQL לאותו חוזה בדיוק.
--
-- בטוח להרצה חוזרת (create or replace); לא נוגע בנתונים, רק בפונקציה.
-- הצלחה = שורה אחרונה עם הסטטוס: fix-publish-stub הצליח

create or replace function public.visible_sections(p_sections jsonb)
  returns jsonb
  language sql
  immutable
  security invoker
  set search_path = ''
as $$
  select coalesce(
    (
      select jsonb_agg(
               case
                 -- default to VISIBLE when the flag is absent or is not a JSON
                 -- boolean. A section with no usable flag is one the editor
                 -- never touched, and silently hiding it is worse than showing
                 -- it. Reading it as (s ->> 'visible')::boolean would raise
                 -- 22P02 on any non-boolean value and abort the whole publish.
                 when coalesce(
                        case when jsonb_typeof(s -> 'visible') = 'boolean'
                             then (s -> 'visible')::text::boolean end,
                        true)
                 then s
                 -- deliberate hide → stub. schema_version is appended only when
                 -- the key exists, because JSON.stringify drops an undefined
                 -- value on the app side and the two writers must agree byte
                 -- for byte.
                 else jsonb_build_object(
                        'id',      s -> 'id',
                        'type',    s -> 'type',
                        'visible', false,
                        'payload', '{}'::jsonb)
                      || case when s ? 'schema_version'
                              then jsonb_build_object('schema_version', s -> 'schema_version')
                              else '{}'::jsonb end
               end
               order by ord)
        from jsonb_array_elements(
               case when jsonb_typeof(p_sections) = 'array' then p_sections else '[]'::jsonb end
             ) with ordinality as t(s, ord)
    ),
    '[]'::jsonb
  )
$$;

-- הוכחה שהגרסה החדשה פעילה: קלט עם סקשן מוסתר חייב לחזור כ-stub, לא להיעלם.
select case
         when public.visible_sections(
                '[{"id":"a","type":"hero","schema_version":1,"visible":false,"payload":{"heading":"x"}}]'::jsonb
              ) = '[{"id":"a","type":"hero","schema_version":1,"visible":false,"payload":{}}]'::jsonb
         then 'fix-publish-stub הצליח'
         else 'fix-publish-stub נכשל: הפונקציה עדיין מוחקת סקשנים מוסתרים'
       end as status;
