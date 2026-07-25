#!/usr/bin/env node
// 01-recipes.mjs — the one-time migration of content/recipes/*.md into the
// Supabase `recipes` table.
//
// It DOES NOT TALK TO THE NETWORK. It reads the corpus, classifies it, verifies
// it against the current behaviour of the live site, and writes four artifacts
// to scripts/migrate/out/:
//
//   seed-recipes.sql      the insert, idempotent, safe to re-run
//   REPORT.md             the verification: what matches, what changes, why
//   REVIEW-ingredients.md every non-bulleted line and how it was classified
//   recipes.json          the rows, for diffing between runs
//
// Producing SQL rather than pushing rows keeps the migration reviewable before
// it is irreversible, adds no dependency, and works today with no project.
//
//   node scripts/migrate/01-recipes.mjs
//
// IMAGES STAY WHERE THEY ARE. The 30 recipe photos keep their existing
// /media/client/recipes/*.jpg URLs, which keep working exactly as today; the
// media_assets rows are created pointing at them. Moving the bytes into Storage
// is phase 5 of the plan, deliberately not bundled with this one: two
// migrations at once means a failure you cannot attribute.

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import matter from "gray-matter";
import { parseRecipeBody, serializeRecipeBody } from "../../src/lib/cms/recipe-body.mjs";
import {
  classifyIngredients,
  serializeIngredients,
  parsePrepMinutes,
  rawIngredientSection,
  buildRecipeRow,
} from "../../src/lib/cms/recipe-migrate.mjs";

const ROOT = path.resolve(import.meta.dirname, "../..");
const SRC = path.join(ROOT, "content/recipes");
const OUT = path.join(ROOT, "scripts/migrate/out");

// ── helpers ─────────────────────────────────────────────────────────────────

/** Deterministic id from a stable key, so re-running updates instead of duplicating. */
const idFor = (kind, key) => {
  const h = createHash("sha256").update(`${kind}:${key}`).digest("hex");
  return [h.slice(0, 8), h.slice(8, 12), `5${h.slice(13, 16)}`, `8${h.slice(17, 20)}`, h.slice(20, 32)].join("-");
};

const lit = (v) =>
  v === null || v === undefined ? "null" : `'${String(v).replace(/'/g, "''")}'`;
const jlit = (v) => `${lit(JSON.stringify(v))}::jsonb`;
const alit = (a) => (a?.length ? `array[${a.map(lit).join(", ")}]::text[]` : `'{}'::text[]`);
const num = (v) => (v === null || v === undefined ? "null" : String(v));

/** Whitespace-normalised comparison: blank-line differences are not content differences. */
const norm = (s) =>
  String(s ?? "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.trimEnd())
    .join("\n")
    .replace(/\n{2,}/g, "\n\n")
    .trim();

/** What the LIVE site currently emits as recipeIngredient, so the delta is measurable. */
const currentJsonLdIngredients = (raw) => {
  const m = raw.match(new RegExp(`##\\s*רכיבים\\s*\\n([\\s\\S]*?)(?=\\n#{2,}\\s|$)`));
  return (m ? m[1] : "")
    .split("\n")
    .filter((l) => /^\s*[-*]\s+/.test(l))
    .map((l) => l.replace(/^\s*[-*]\s*/, "").trim())
    .filter(Boolean);
};

// ── read ────────────────────────────────────────────────────────────────────

const files = readdirSync(SRC).filter((f) => f.endsWith(".md")).sort();
if (!files.length) {
  console.error(`no .md files in ${SRC}`);
  process.exit(1);
}

const recipes = [];
const mediaByPath = new Map();
const reviewLines = [];
const problems = [];
const notes = [];

for (const file of files) {
  const slug = file.replace(/\.md$/, "");
  const rawFile = readFileSync(path.join(SRC, file), "utf8");
  const { data, content } = matter(rawFile);

  const body = parseRecipeBody(content);
  const rawLines = rawIngredientSection(content);
  const ingredients = classifyIngredients(rawLines);

  // ── media ────────────────────────────────────────────────────────────────
  if (typeof data.image === "string" && data.image) {
    const onDisk = path.join(ROOT, "public", data.image.replace(/^\//, ""));
    if (!existsSync(onDisk)) {
      problems.push(`${file}: image ${data.image} does not exist on disk`);
    }
    if (!mediaByPath.has(data.image)) {
      const base = path.basename(data.image);
      mediaByPath.set(data.image, {
        id: idFor("media", data.image),
        bucket: "media",
        // the key the bytes will get in phase 5; nothing is uploaded now
        storagePath: `recipes/${base}`,
        publicPath: data.image,
        alt: data.imageAlt ?? "",
        mime: base.endsWith(".png") ? "image/png" : base.endsWith(".webp") ? "image/webp" : "image/jpeg",
        originalName: base,
        usedBy: [],
      });
    }
    mediaByPath.get(data.image).usedBy.push(slug);
    if (!data.imageAlt) problems.push(`${file}: has an image with no imageAlt`);
  }

  // ── the review report: every line a human should look at once ────────────
  for (const line of rawLines.map((l) => l.trim()).filter(Boolean)) {
    if (/^[-*•▪◦]\s+/.test(line)) continue;
    const classified = classifyIngredients([line]);
    reviewLines.push({
      file,
      line,
      as: classified.map((c) => `${c.kind}${c.split ? " (split)" : ""}: ${c.text}`),
      needsReview: classified.some((c) => c.needsReview),
    });
  }

  // ── verification, per recipe ─────────────────────────────────────────────
  const ingredientRoundTrip = serializeIngredients(ingredients);
  const ingredientSource = rawLines.map((l) => l.trim()).filter(Boolean).join("\n");
  const ingredientsExact = ingredientRoundTrip === ingredientSource;
  const splitCount = ingredients.filter((i) => i.split).length;

  if (!ingredientsExact && splitCount === 0) {
    // Anything that changes shape WITHOUT being the known split case is a real
    // finding, not an accepted difference.
    problems.push(
      `${file}: ingredient round trip differs and it is not the split case\n` +
        `    source: ${JSON.stringify(ingredientSource)}\n` +
        `    round:  ${JSON.stringify(ingredientRoundTrip)}`,
    );
  }

  const bodyRoundTrip = norm(serializeRecipeBody(body)) === norm(content);
  if (!bodyRoundTrip) {
    problems.push(`${file}: body round trip differs even after whitespace normalisation`);
  }

  const prep = parsePrepMinutes(data.prepTime);
  if (prep === null && data.prepTime && data.prepTime !== "לא צוין") {
    problems.push(`${file}: prepTime ${JSON.stringify(data.prepTime)} did not parse — check the shape`);
  }

  const before = currentJsonLdIngredients(content);
  const after = ingredients.filter((i) => i.kind === "item").map((i) => i.text);
  if (before.length !== after.length) {
    notes.push(
      `${file}: JSON-LD ingredients ${before.length} → ${after.length}` +
        (splitCount ? "  (the **label:** items line, now counted)" : ""),
    );
  }

  for (const key of ["title", "description", "date", "category"]) {
    if (!data[key]) problems.push(`${file}: missing required frontmatter ${key}`);
  }

  recipes.push({
    file,
    row: buildRecipeRow({
      slug,
      data,
      body,
      rawIngredientLines: rawLines,
      imagePathToId: new Map([...mediaByPath].map(([p, m]) => [p, m.id])),
    }),
    stats: {
      items: after.length,
      sublabels: ingredients.filter((i) => i.kind === "sublabel").length,
      recipeNotes: ingredients.filter((i) => i.kind === "note").length,
      steps: body.steps.length,
      extraBytes: Buffer.byteLength(body.extra, "utf8"),
      jsonLdBefore: before.length,
      jsonLdAfter: after.length,
      ingredientsExact,
      bodyRoundTrip,
    },
  });
}

// ── SQL ─────────────────────────────────────────────────────────────────────

const media = [...mediaByPath.values()];

const sql = [
  "-- seed-recipes.sql — generated by scripts/migrate/01-recipes.mjs. Do not edit by hand.",
  `-- ${files.length} recipes, ${media.length} images.`,
  "--",
  "-- Idempotent: ids are derived from the slug and the image path, so re-running",
  "-- updates in place rather than duplicating. Safe to run against a database",
  "-- that already holds an earlier attempt.",
  "--",
  "-- Images are NOT uploaded here. Each media_assets row points at the existing",
  "-- /media/... URL, which keeps working exactly as it does today. Phase 5 moves",
  "-- the bytes into Storage and rewrites public_path.",
  "",
  "begin;",
  "",
  "-- ── media ──────────────────────────────────────────────────────────────────",
  ...media.map(
    (m) =>
      `insert into public.media_assets (id, bucket, path, public_path, origin, locked, alt, mime, original_name)\n` +
      `values (${lit(m.id)}, 'media', ${lit(m.storagePath)}, ${lit(m.publicPath)}, 'cms', false, ${lit(m.alt)}, ${lit(m.mime)}, ${lit(m.originalName)})\n` +
      `on conflict (id) do update set\n` +
      `  path = excluded.path, public_path = excluded.public_path,\n` +
      `  alt = excluded.alt, mime = excluded.mime, original_name = excluded.original_name;`,
  ),
  "",
  "-- ── recipes ────────────────────────────────────────────────────────────────",
  ...recipes.map(({ row }) => {
    const id = idFor("recipe", row.slug);
    const cols = [
      ["id", lit(id)],
      ["slug", lit(row.slug)],
      ["legacy_slug", lit(row.legacy_slug)],
      ["title", lit(row.title)],
      ["description", lit(row.description)],
      ["date", `${lit(row.date)}::date`],
      ["category", lit(row.category)],
      ["tags", alit(row.tags)],
      ["prep_time_text", lit(row.prep_time_text)],
      ["prep_minutes", num(row.prep_minutes)],
      ["servings", lit(row.servings)],
      ["image_id", row.image_id ? lit(row.image_id) : "null"],
      ["image_path", lit(row.image_path)],
      ["image_alt", lit(row.image_alt)],
      ["intro", lit(row.intro)],
      ["ingredients", jlit(row.ingredients)],
      ["steps", jlit(row.steps)],
      ["tip", lit(row.tip)],
      ["extra", lit(row.extra)],
      ["headings", jlit(row.headings)],
      ["status", `${lit(row.status)}::public.content_status`],
      ["published_at", row.published_at ? `${lit(row.published_at)}::timestamptz` : "null"],
    ];
    const updatable = cols.filter(([c]) => c !== "id" && c !== "slug").map(([c]) => `  ${c} = excluded.${c}`);
    return (
      `insert into public.recipes (${cols.map(([c]) => c).join(", ")})\n` +
      `values (${cols.map(([, v]) => v).join(", ")})\n` +
      `on conflict (id) do update set\n${updatable.join(",\n")};`
    );
  }),
  "",
  "-- ── the published edges of the media reference graph ───────────────────────",
  "-- publish_entity maintains these from here on; the migration seeds them so the",
  "-- library's delete guard is not empty on day one, which fails in the unsafe",
  "-- direction (an asset with no edges looks free to delete).",
  "insert into public.media_refs (media_id, ref_kind, entity_type, entity_id, field)",
  "select r.image_id, 'published', 'recipe', r.id, 'image_id'",
  "  from public.recipes r",
  " where r.image_id is not null",
  "on conflict do nothing;",
  "",
  "commit;",
  "",
].join("\n");

// ── report ──────────────────────────────────────────────────────────────────

const needReview = reviewLines.filter((r) => r.needsReview);
const changed = recipes.filter((r) => r.stats.jsonLdBefore !== r.stats.jsonLdAfter);

const report = [
  "# דוח מיגרציית מתכונים",
  "",
  `נוצר על ידי \`scripts/migrate/01-recipes.mjs\`. ${files.length} מתכונים, ${media.length} תמונות.`,
  "",
  "## מה נבדק",
  "",
  "| בדיקה | תוצאה |",
  "| --- | --- |",
  `| מתכונים שנקראו | ${files.length} |`,
  `| שדות חובה בכל הקבצים | ${problems.filter((p) => p.includes("missing required")).length === 0 ? "תקין" : "יש חוסרים"} |`,
  `| כל התמונות קיימות בדיסק | ${problems.filter((p) => p.includes("does not exist")).length === 0 ? "תקין" : "חסרות תמונות"} |`,
  `| הרכיבים חוזרים לצורתם המקורית | ${recipes.filter((r) => r.stats.ingredientsExact).length}/${files.length} |`,
  `| הגוף חוזר לצורתו (אחרי נרמול רווחים) | ${recipes.filter((r) => r.stats.bodyRoundTrip).length}/${files.length} |`,
  `| שורות שדורשות עין אנושית | ${needReview.length} |`,
  "",
  "## למה לא בודקים זהות בייטים",
  "",
  "כי היא כבר לא מתקיימת היום. `serializeRecipeBody(parseRecipeBody(md))` שונה מהמקור",
  "ב־24 מתוך 34 הקבצים, כולם בשורות ריקות סביב תת־כותרות ובאף אחד מהם לא בתוכן.",
  "גייט של זהות בייטים היה נכשל על 70 אחוז מהקורפוס וממילא היה מכובה תוך יום.",
  "הבדיקות כאן הן שוויון טקסט מנורמל, ספירת רכיבים ושלבים, ואורך `extra`.",
  "",
  "## מה משתנה בכוונה",
  "",
  changed.length
    ? [
        "המספר של רכיבים ב־JSON-LD משתנה במתכונים הבאים:",
        "",
        ...changed.map(
          (r) => `- \`${r.file}\`: ${r.stats.jsonLdBefore} → ${r.stats.jsonLdAfter}`,
        ),
        "",
        "הסיבה: שורה מהצורה `**להגשה:** בצל ירוק, כוסברה, בוטנים גרוסים` נושאת גם תת־כותרת",
        "וגם רכיבים אמיתיים. הפילטר הנוכחי באתר הוא `^\\s*[-*]\\s+`, שדורש רווח אחרי הכוכבית,",
        "ולכן השורה הזו **מסוננת החוצה היום** ולא מגיעה בכלל לנתונים המובנים. הפיצול לתת־כותרת",
        "ולרכיב מחזיר אותה פנימה. זו תוספת, לא אובדן.",
      ].join("\n")
    : "אין הפרשים בין מה שהאתר פולט היום לבין מה שייפלט מהמסד.",
  "",
  "## מה שדורש הכרעה אנושית",
  "",
  needReview.length
    ? needReview.map((r) => `- \`${r.file}\`: ${JSON.stringify(r.line)}`).join("\n")
    : "אף שורה. כל 48 השורות שאינן בולטים נפלו לאחת מהצורות המוכרות.",
  "",
  "## בעיות",
  "",
  problems.length ? problems.map((p) => `- ${p}`).join("\n") : "אין.",
  "",
  "## הערות",
  "",
  notes.length ? notes.map((n) => `- ${n}`).join("\n") : "אין.",
  "",
  "## פירוט לפי מתכון",
  "",
  "| קובץ | רכיבים | תת־כותרות | הערות | שלבים | extra (bytes) | זמן הכנה |",
  "| --- | --- | --- | --- | --- | --- | --- |",
  ...recipes.map(
    ({ file, row, stats }) =>
      `| ${file} | ${stats.items} | ${stats.sublabels} | ${stats.recipeNotes} | ${stats.steps} | ${stats.extraBytes} | ${row.prep_minutes ?? "לא צוין"} |`,
  ),
  "",
].join("\n");

const review = [
  "# סקירת שורות הרכיבים",
  "",
  "כל שורה בתוך `## רכיבים` שאינה מתחילה בסימן בולט, ואיך היא סווגה.",
  "המעבר הזה נעשה פעם אחת. אחרי שהוא מאושר, הסיווג קבוע במסד ואף ביטוי רגולרי",
  "לא צריך לנחש אותו שוב.",
  "",
  `סך הכל ${reviewLines.length} שורות, מתוכן ${needReview.length} לא זוהו.`,
  "",
  "| קובץ | השורה במקור | סווגה כ |",
  "| --- | --- | --- |",
  ...reviewLines.map(
    (r) =>
      `| ${r.file} | \`${r.line.replace(/\|/g, "\\|")}\` | ${r.as.join(" + ").replace(/\|/g, "\\|")}${r.needsReview ? " **← לבדיקה**" : ""} |`,
  ),
  "",
].join("\n");

// ── write ───────────────────────────────────────────────────────────────────

mkdirSync(OUT, { recursive: true });
writeFileSync(path.join(OUT, "seed-recipes.sql"), sql, "utf8");
writeFileSync(path.join(OUT, "REPORT.md"), report, "utf8");
writeFileSync(path.join(OUT, "REVIEW-ingredients.md"), review, "utf8");
writeFileSync(
  path.join(OUT, "recipes.json"),
  JSON.stringify({ recipes: recipes.map((r) => r.row), media }, null, 2),
  "utf8",
);

console.log(`${files.length} recipes, ${media.length} images`);
console.log(`ingredient round trip exact: ${recipes.filter((r) => r.stats.ingredientsExact).length}/${files.length}`);
console.log(`body round trip (normalised): ${recipes.filter((r) => r.stats.bodyRoundTrip).length}/${files.length}`);
console.log(`lines needing human review:   ${needReview.length}`);
console.log(`JSON-LD ingredient deltas:    ${changed.length}`);
console.log(`\nwrote → scripts/migrate/out/`);

if (problems.length) {
  console.error(`\n${problems.length} PROBLEM(S):`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
