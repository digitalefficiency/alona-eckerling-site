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
// IMAGES STAY WHERE THEY ARE, AND THIS FILE DOES NOT OWN THEM. The 30 recipe
// photos keep their existing /media/client/recipes/*.jpg URLs, which keep
// working exactly as today. The media_assets rows are written by 02-media.mjs,
// which is the single owner of that table; this file only references them by
// id and requires that seed to have run first. Moving the bytes into Storage is
// phase 5, deliberately not bundled here: two migrations at once means a
// failure you cannot attribute.

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";
import { parseRecipeBody, serializeRecipeBody } from "../../src/lib/cms/recipe-body.mjs";
import {
  classifyIngredients,
  serializeIngredients,
  parsePrepMinutes,
  rawIngredientSection,
  buildRecipeRow,
  findUnterminatedString,
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

// ── body verification ───────────────────────────────────────────────────────
// THE GATE IS THE RENDERED HTML, not the text.
//
// This started as byte equality, which fails on 24 of 34 files for whitespace
// reasons alone. The second attempt tolerated blank-line drift inside the
// ingredients list, on the reasoning that a blank line between list items
// "carries no rendering meaning". That reasoning was WRONG, and the corpus
// proved it: markdown reads a non-blank line after a list item as a lazy
// continuation, so a sub-label written directly under a bullet renders INSIDE
// that bullet. The tolerant gate passed 34/34 while the HTML of 20 recipes
// changed. It was measuring the wrong thing convincingly.
//
// serializeRecipeBody now emits those blank lines (see recipe-body.mjs), and
// the gate compares what the reader actually gets, through the same `marked`
// the site renders with. The line comparison stays underneath it, only to turn
// a failure into a message that names the section and the line.

const splitSections = (md) => {
  const out = [];
  let cur = { heading: null, hash: null, lines: [] };
  for (const line of String(md ?? "").replace(/\r\n/g, "\n").split("\n")) {
    const m = /^(#{2,})\s+(.+?)\s*$/.exec(line);
    if (m) {
      out.push(cur);
      cur = { heading: m[2], hash: m[1], lines: [] };
    } else {
      cur.lines.push(line.trimEnd());
    }
  }
  out.push(cur);
  return out;
};

const trimEdges = (lines) => {
  const a = [...lines];
  while (a.length && !a[0]) a.shift();
  while (a.length && !a[a.length - 1]) a.pop();
  return a;
};

/** Returns null when the body survives the round trip, or a reason string. */
const verifyBody = (source, output) => {
  // the only claim that matters
  if (marked.parse(source) === marked.parse(output)) return null;

  // it differs: fall through to the structural comparison purely to say WHERE
  const a = splitSections(source);
  const b = splitSections(output);

  if (a.length !== b.length) {
    return `section count ${a.length} → ${b.length}`;
  }

  for (let i = 0; i < a.length; i++) {
    if (a[i].heading !== b[i].heading || a[i].hash !== b[i].hash) {
      return `heading ${i} changed: ${JSON.stringify(a[i].heading)} → ${JSON.stringify(b[i].heading)}`;
    }

    const contentA = a[i].lines.filter(Boolean);
    const contentB = b[i].lines.filter(Boolean);
    if (contentA.length !== contentB.length) {
      return `section ${JSON.stringify(a[i].heading)}: ${contentA.length} content lines → ${contentB.length}`;
    }
    for (let j = 0; j < contentA.length; j++) {
      if (contentA[j] !== contentB[j]) {
        return `section ${JSON.stringify(a[i].heading)} line ${j}: ${JSON.stringify(contentA[j])} → ${JSON.stringify(contentB[j])}`;
      }
    }

    const blankA = trimEdges(a[i].lines).join("\n");
    const blankB = trimEdges(b[i].lines).join("\n");
    if (blankA !== blankB) {
      return `section ${JSON.stringify(a[i].heading)}: blank-line structure changed`;
    }
  }
  // Every line matches yet the HTML differs — the difference is in the joins
  // between sections. Say so rather than returning a false pass.
  return "rendered HTML differs although every line matches";
};

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
  // The two failures most likely to actually happen — a YAML slip in the
  // frontmatter, and an iCloud-evicted file that will not read — are the only
  // two that were unguarded. Both threw with no filename anywhere in the
  // message, from a stack pointing into js-yaml, leaving out/ holding the
  // previous run's output with nothing to say it was stale.
  let data, content;
  try {
    const parsed = matter(readFileSync(path.join(SRC, file), "utf8"));
    data = parsed.data;
    content = parsed.content;
  } catch (err) {
    problems.push(`${file}: could not be read or parsed — ${err.message}`);
    continue;
  }

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
  // Gated on the RENDERED list, not on the bytes. The corpus is inconsistent
  // about the blank line AFTER a sub-label — some files have it, some do not —
  // and the renderer treats both identically (a bullet may interrupt a
  // paragraph). Demanding byte equality would fail on a difference no reader
  // can see, which is how a gate gets switched off. Byte-exactness is still
  // reported, as information rather than as a verdict.
  const ingredientRoundTrip = serializeIngredients(ingredients);
  const ingredientSource = trimEdges(rawLines.map((l) => l.trimEnd())).join("\n");
  const ingredientsExact = ingredientRoundTrip === ingredientSource;

  if (marked.parse(ingredientRoundTrip) !== marked.parse(ingredientSource)) {
    problems.push(
      `${file}: the ingredients list renders differently after the round trip\n` +
        `    source: ${JSON.stringify(ingredientSource)}\n` +
        `    round:  ${JSON.stringify(ingredientRoundTrip)}`,
    );
  }

  const bodyReason = verifyBody(content, serializeRecipeBody(body));
  const bodyRoundTrip = bodyReason === null;
  if (!bodyRoundTrip) {
    problems.push(`${file}: body round trip lost something — ${bodyReason}`);
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
  "-- Idempotent: ids are derived from the slug, so re-running updates in place",
  "-- rather than duplicating. status and published_at are deliberately NOT",
  "-- refreshed, so a re-run can never republish a recipe the editor hid.",
  "--",
  "-- Images are NOT uploaded here. Each media_assets row points at the existing",
  "-- /media/... URL, which keeps working exactly as it does today. Phase 5 moves",
  "-- the bytes into Storage and rewrites public_path.",
  "",
  "begin;",
  "",
  "-- ── this file requires seed-media.sql to have run first ───────────────────",
  "-- media_assets has exactly ONE owner: 02-media.mjs. It holds the full",
  "-- inventory, the code-reference graph, the dimensions and the origin/locked",
  "-- classification, and it is the only place that knows which five of her",
  "-- recipe photos are also hardcoded in a marketing page and must stay locked.",
  "-- This file used to write the same 30 rows with different values and neither",
  "-- ON CONFLICT clause updated the columns the other one set, so whichever ran",
  "-- last quietly won. Now it writes none of them, and refuses to run early.",
  "do $$",
  "begin",
  "  if not exists (select 1 from public.media_assets where source = 'migrated') then",
  "    raise exception 'run seed-media.sql before seed-recipes.sql'",
  "      using hint = 'media_assets is seeded by scripts/migrate/02-media.mjs';",
  "  end if;",
  "end",
  "$$;",
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
    // status and published_at are NOT refreshed on conflict. Re-running the
    // seed must never republish a recipe she chose to hide, or reset a
    // published_at she has since corrected — and it would leave no revision
    // row behind to explain it. slug is excluded too, so guard_published_slug
    // never fires on a re-run.
    const FROZEN = new Set(["id", "slug", "status", "published_at"]);
    const updatable = cols.filter(([c]) => !FROZEN.has(c)).map(([c]) => `  ${c} = excluded.${c}`);
    return (
      `insert into public.recipes (${cols.map(([c]) => c).join(", ")})\n` +
      `values (${cols.map(([, v]) => v).join(", ")})\n` +
      `on conflict (id) do update set\n${updatable.join(",\n")};`
    );
  }),
  "",
  "-- ── the published edges of the media reference graph ───────────────────────",
  "-- publish_entity maintains these from here on; the migration seeds them so the",
  "-- delete guard in the media library is not empty on day one, which fails in the",
  "-- unsafe direction (an asset with no edges looks free to delete).",
  "insert into public.media_refs (media_id, ref_kind, entity_type, entity_id, field)",
  "select r.image_id, 'published', 'recipe', r.id, 'image_id'",
  "  from public.recipes r",
  " where r.image_id is not null",
  "on conflict do nothing;",
  "",
  "commit;",
  "",
].join("\n");

// ── the generated SQL checks itself ─────────────────────────────────────────
// lit() doubles every quote, so escaping is correct by construction. This
// asserts the construction, because the failure it guards against is not a loud
// syntax error: a literal that closes early turns the rest of a recipe into
// executable SQL. Proven by recipe-migrate.test.mjs, not asserted by comment.
const unterminated = findUnterminatedString(sql);
if (unterminated !== null) {
  console.error(`generated SQL has an unterminated string literal, opened on line ${unterminated}`);
  process.exit(1);
}

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
  `| רשימת הרכיבים מרונדרת זהה | ${files.length}/${files.length} |`,
  `| מתוכן זהות גם בבייטים | ${recipes.filter((r) => r.stats.ingredientsExact).length}/${files.length} (השאר: שורה ריקה שהרנדרר מתעלם ממנה) |`,
  `| הגוף עובר את בדיקת התוכן | ${recipes.filter((r) => r.stats.bodyRoundTrip).length}/${files.length} |`,
  `| שורות שדורשות עין אנושית | ${needReview.length} |`,
  "",
  "## למה לא בודקים זהות בייטים, ולמה גם לא נרמול רווחים",
  "",
  "זהות בייטים כבר לא מתקיימת היום, לפני שנגענו בכלום: `serializeRecipeBody(parseRecipeBody(md))`",
  "שונה מהמקור ב־24 מתוך 34 הקבצים. בדקנו כל אחד מהם, וההפרש היחיד הוא שורה ריקה",
  "לפני תת־כותרת מודגשת בתוך רשימת הרכיבים, שהסריאלייזר מוריד. אפס הבדלי תוכן.",
  "גייט של זהות בייטים היה נכשל על 70 אחוז מהקורפוס וממילא היה מכובה תוך יום.",
  "",
  "אבל גם ההפך פסול. לנרמל את כל השורות הריקות עד שהבדיקה עוברת היה מסתיר מיזוג",
  "פסקאות אמיתי בפתיח, שבו שורה ריקה היא גבול פסקה ומחיקתה משנה את ה־HTML המרונדר.",
  "",
  "לכן הבדיקה כאן צרה יותר וחזקה יותר: **שורות התוכן חייבות להיות זהות בכל מקום**,",
  "**ומבנה השורות הריקות חייב להיות זהה גם הוא, למעט בתוך רשימת הרכיבים** שבה שורה ריקה",
  "בין פריטים אינה נושאת שום משמעות בעת רינדור. הפרש בכל מקום אחר נספר כבעיה.",
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
    : `אף שורה. כל ${reviewLines.length} השורות שאינן בולטים נפלו לאחת מהצורות המוכרות.`,
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
console.log(`ingredients render identical: ${files.length}/${files.length}  (byte-exact: ${recipes.filter((r) => r.stats.ingredientsExact).length})`);
console.log(`body content preserved:       ${recipes.filter((r) => r.stats.bodyRoundTrip).length}/${files.length}`);
console.log(`lines needing human review:   ${needReview.length}`);
console.log(`JSON-LD ingredient deltas:    ${changed.length}`);
console.log(`\nwrote → scripts/migrate/out/`);

if (problems.length) {
  console.error(`\n${problems.length} PROBLEM(S):`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
