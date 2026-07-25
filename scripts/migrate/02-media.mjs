#!/usr/bin/env node
// 02-media.mjs — the media inventory, the reference graph, and the seed.
//
// This script exists because of one specific failure. The plan lets the media
// library delete an asset once its reference count reaches zero. media_refs is
// built from database content. But most of the files under public/media are
// referenced ONLY from string literals inside src/**, which no database query
// can see. After migration every one of them would show "0 uses, safe to
// delete", and the first tidy-up would take out the 14 frames of the homepage
// scroll film. (Current split: see MEDIA-REPORT.md — a number frozen in a
// comment goes stale on the next asset added.)
//
// So the reference graph has to include the code, and something has to keep it
// honest as the code changes. This script does both:
//
//   node scripts/migrate/02-media.mjs           inventory + seed + report
//   node scripts/migrate/02-media.mjs --check   the CI gate, no writes
//
// In --check mode it fails the build when a /media/ literal in src/** does not
// resolve to a file on disk. That is the check that actually catches a
// dangerous deletion; a reference count only catches it if somebody reads the
// number.
//
// FIRST RUN IS SLOW. This repository lives in an iCloud folder that evicts file
// contents, so hashing 64 images pulls them back down (~90s). Subsequent runs
// are instant.

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { imageDimensions, mimeFor } from "../../src/lib/cms/image-dimensions.mjs";
import { findUnterminatedString } from "../../src/lib/cms/recipe-migrate.mjs";
import { shippedFiles, stripComments } from "../lib-graph.mjs";
import matter from "gray-matter";

const ROOT = path.resolve(import.meta.dirname, "../..");
const OUT = path.join(ROOT, "scripts/migrate/out");
const CHECK_ONLY = process.argv.includes("--check");

// WHICH FILES COUNT: the ones actually reachable from a Next.js entry point.
//
// The first version of this script carried a hardcoded regex of component names
// to exempt. That is the wrong shape of answer twice over: a component that
// later gets composed keeps its exemption and its broken asset ships, and a new
// uncomposed component fails the gate for no reason. shippedGraph already
// answers the real question, and lint-legal and lint-lead already trust it.
const SHIPPED = new Set(shippedFiles(ROOT));

/** A literal that is a template, an ellipsis in a message, or a regex fragment. */
const isPlaceholder = (p) =>
  p.includes("${") || p.includes("<") || p.includes("…") || p.endsWith("\\") || /\/media\/x\.jpg$/.test(p);

// A literal that is provably unreachable because a config flag is off. Derived
// from the config rather than hardcoded, so flipping the flag makes the gate
// start demanding the files instead of silently continuing to excuse them.
const brandConfig = readFileSync(path.join(ROOT, "src/brand.config.ts"), "utf8");
const logoSupplied = !/logo:\s*\{\s*supplied:\s*false\s*\}/.test(brandConfig);
const GUARDED = new Map(
  logoSupplied
    ? []
    : [
        ["/media/logo.png", "brand.config.ts sets logo.supplied=false, so BrandLogo renders the wordmark and never requests this"],
        ["/media/logo-dark.png", "brand.config.ts sets logo.supplied=false, so BrandLogo renders the wordmark and never requests this"],
      ],
);

const lit = (v) => (v === null || v === undefined ? "null" : `'${String(v).replace(/'/g, "''")}'`);
const num = (v) => (v === null || v === undefined ? "null" : String(v));

// ── 1. what is on disk ──────────────────────────────────────────────────────

// Sorted at every source point. readdirSync returns filesystem order, which
// differs between machines and between checkouts, and everything downstream
// inherits it: the Map, the SQL statement order, the report table. Generated
// output must depend on content alone or every regeneration is a noisy diff
// nobody reads.
const byName = (a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0);

const walk = (dir, acc = []) => {
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort(byName)) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (!entry.name.startsWith(".") && !entry.name.endsWith(".md")) acc.push(full);
  }
  return acc;
};

const mediaRoot = path.join(ROOT, "public/media");
const onDisk = new Map();
for (const full of walk(mediaRoot)) {
  const publicPath = "/" + path.relative(path.join(ROOT, "public"), full).split(path.sep).join("/");
  const bytes = statSync(full).size;
  const buf = readFileSync(full);
  const dims = imageDimensions(buf);
  onDisk.set(publicPath, {
    publicPath,
    file: path.relative(ROOT, full),
    bytes,
    sha256: createHash("sha256").update(buf).digest("hex"),
    width: dims?.width ?? null,
    height: dims?.height ?? null,
    mime: dims?.mime ?? mimeFor(full),
    basename: path.basename(full),
  });
}

// ── 2. who references it ────────────────────────────────────────────────────

const scan = (dir, exts, acc, kind) => {
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort(byName)) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scan(full, exts, acc, kind);
      continue;
    }
    if (!exts.some((e) => entry.name.endsWith(e))) continue;
    const rel = path.relative(ROOT, full);
    const raw = readFileSync(full, "utf8");
    // Comments are stripped for code, because a JSDoc usage example naming an
    // asset from the source design system is documentation, not a reference,
    // and treating it as one sends a real reviewer chasing a file that was
    // never meant to exist here.
    const lines = (kind === "code" ? stripComments(raw) : raw).split("\n");
    lines.forEach((line, i) => {
      const re = kind === "code" ? /["'`(](\/media\/[^"'`\s)]+)["'`)]/g : /(\/media\/[^"'`\s)\]]+)/g;
      for (const m of line.matchAll(re)) {
        const p = m[1];
        if (isPlaceholder(p)) continue;
        acc.push({
          path: p,
          source: `${rel}:${i + 1}`,
          // not reachable from any page: an uncomposed design-reference
          // component, a test, or a script
          referenceOnly: kind === "code" && !SHIPPED.has(full),
          guarded: GUARDED.has(p),
        });
      }
    });
  }
};

const codeRefs = [];
scan(path.join(ROOT, "src"), [".ts", ".tsx", ".mjs", ".js", ".css"], codeRefs, "code");
const contentRefs = [];
scan(path.join(ROOT, "content"), [".md"], contentRefs, "content");

const codeByPath = new Map();
const guardedRefs = [];
for (const r of codeRefs) {
  if (r.referenceOnly) continue; // not reachable from any page
  if (r.guarded) {
    guardedRefs.push(r);
    continue;
  }
  if (!codeByPath.has(r.path)) codeByPath.set(r.path, []);
  codeByPath.get(r.path).push(r.source);
}
const contentByPath = new Map();
for (const r of contentRefs) {
  if (!contentByPath.has(r.path)) contentByPath.set(r.path, []);
  contentByPath.get(r.path).push(r.source);
}

// ── 2b. the alt text the content already carries ────────────────────────────
// Seeding alt='' would put 56 empty alt fields in front of the editor and make
// resolve_section_media publish empty alt into every section image. The corpus
// already has the answer: every recipe with a photo carries an `imageAlt`, and
// lint-content requires it. Take it.
//
// Where the same file is used with DIFFERENT alt text per context (about/page
// uses moroccan-fish once decoratively and once described), the asset row holds
// the recipe's alt as the default and the per-usage override lives in the
// section payload — which is why resolve_section_media prefers the payload.
const altByPath = new Map();
for (const entry of readdirSync(path.join(ROOT, "content/recipes"), { withFileTypes: true }).sort(byName)) {
  if (!entry.name.endsWith(".md")) continue;
  try {
    const { data } = matter(readFileSync(path.join(ROOT, "content/recipes", entry.name), "utf8"));
    if (typeof data.image === "string" && data.image && typeof data.imageAlt === "string" && data.imageAlt) {
      if (!altByPath.has(data.image)) altByPath.set(data.image, data.imageAlt);
    }
  } catch {
    // a broken file is 01-recipes.mjs's problem to report, not this one's
  }
}

// ── 3. classify ─────────────────────────────────────────────────────────────
//
//   code    referenced from src/**. Locked: media_refs cannot see a TSX literal,
//           so nothing in the desk may delete or replace it.
//   dual    referenced from BOTH. Locked too, and the more dangerous case: the
//           editor thinks it is her recipe photo, but two marketing pages point
//           at the path directly and would keep the old image after a replace.
//   cms     content only. Hers.
//   orphan  on disk, referenced nowhere. NOT seeded — a row for a file nothing
//           uses is noise in the one screen that has to stay trustworthy.

const assets = [];
const orphans = [];
for (const asset of onDisk.values()) {
  const code = codeByPath.get(asset.publicPath) ?? [];
  const content = contentByPath.get(asset.publicPath) ?? [];

  if (!code.length && !content.length) {
    orphans.push(asset);
    continue;
  }

  const kind = code.length && content.length ? "dual" : code.length ? "code" : "cms";
  assets.push({
    ...asset,
    alt: altByPath.get(asset.publicPath) ?? "",
    kind,
    origin: kind === "cms" ? "cms" : "code",
    locked: kind !== "cms",
    codeRefs: code,
    contentRefs: content,
    // where the bytes end up. Only content-only assets move to Storage, and
    // only in phase 5; everything the code names stays in the repo where nginx
    // serves it and where a redeploy cannot lose it.
    plan:
      kind === "cms"
        ? "phase5-upload"
        : kind === "dual"
          ? "blocked-until-sections-are-extracted"
          : "stays-in-repo",
  });
}

assets.sort((a, b) => (a.publicPath < b.publicPath ? -1 : a.publicPath > b.publicPath ? 1 : 0));
orphans.sort((a, b) => (a.publicPath < b.publicPath ? -1 : a.publicPath > b.publicPath ? 1 : 0));
for (const a of assets) {
  a.codeRefs.sort();
  a.contentRefs.sort();
}

// ── 4. broken references ────────────────────────────────────────────────────

const broken = [];
for (const [p, sources] of codeByPath) {
  if (!onDisk.has(p)) broken.push({ path: p, sources, from: "code" });
}
for (const [p, sources] of contentByPath) {
  if (!onDisk.has(p)) broken.push({ path: p, sources, from: "content" });
}

// ── 5. licence provenance ───────────────────────────────────────────────────
// assets-manifest.json records a sha256 and a licence basis for every photo the
// client supplied. Migrating an image whose bytes no longer match its manifest
// row means publishing a photo nobody has cleared, on a site whose whole trust
// story is that nothing is invented.

const manifestPath = path.join(ROOT, "assets-manifest.json");
const licence = { checked: 0, ok: 0, mismatched: [], unlisted: [], missing: false };
const clientAssets = assets.filter((a) => a.publicPath.startsWith("/media/client/"));

if (!existsSync(manifestPath)) {
  // Absence must FAIL, not quietly skip. Half a gate that reports "ok" is worse
  // than no gate: the property stops being checked and nothing says so.
  licence.missing = clientAssets.length > 0;
} else {
  const raw = JSON.parse(readFileSync(manifestPath, "utf8"));
  // Named explicitly rather than "the first array-valued property", which
  // happens to work today and would keep happening to work until it did not.
  const rows = Array.isArray(raw) ? raw : raw.assets;
  if (!Array.isArray(rows)) {
    console.error(`assets-manifest.json has no \`assets\` array`);
    process.exit(1);
  }
  const byPath = new Map(rows.map((r) => [r.installPath, r]));
  for (const a of clientAssets) {
    licence.checked++;
    const row = byPath.get(a.publicPath);
    const want = row?.optimized?.sha256;
    // No row, no hash, or a licence that is not confirmed are all the same
    // answer: nobody has cleared these bytes for publication.
    if (!row || !want || row.license?.status !== "client-confirmed") {
      licence.unlisted.push(a.publicPath);
      continue;
    }
    if (want !== a.sha256) licence.mismatched.push({ path: a.publicPath, want, got: a.sha256 });
    else licence.ok++;
  }
}

// ── 6. the gate ─────────────────────────────────────────────────────────────

const failures = [];
if (broken.length) {
  for (const b of broken) {
    failures.push(`referenced but missing on disk: ${b.path}  (${b.sources.slice(0, 3).join(", ")})`);
  }
}
for (const m of licence.mismatched) {
  failures.push(`licence hash mismatch: ${m.path}\n    manifest ${m.want}\n    on disk  ${m.got}`);
}
for (const p of licence.unlisted) {
  failures.push(`client photo with no confirmed licence row in assets-manifest.json: ${p}`);
}
if (licence.missing) {
  failures.push(
    `assets-manifest.json not found at ${path.relative(ROOT, manifestPath)} — ` +
      `the licence check cannot run, and ${clientAssets.length} client photo(s) would migrate uncleared`,
  );
}

if (CHECK_ONLY) {
  if (failures.length) {
    console.error(`media check FAILED (${failures.length})`);
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }
  console.log(`media check ok — ${assets.length} assets, ${orphans.length} orphan(s), 0 broken references`);
  process.exit(0);
}

// ── 7. SQL ──────────────────────────────────────────────────────────────────

const idFor = (publicPath) => {
  const h = createHash("sha256").update(`media:${publicPath}`).digest("hex");
  return [h.slice(0, 8), h.slice(8, 12), `5${h.slice(13, 16)}`, `8${h.slice(17, 20)}`, h.slice(20, 32)].join("-");
};

const sql = [
  "-- seed-media.sql — generated by scripts/migrate/02-media.mjs. Do not edit by hand.",
  `-- ${assets.length} assets (${assets.filter((a) => a.origin === "code").length} code-owned, ${assets.filter((a) => a.origin === "cms").length} hers).`,
  `-- ${orphans.length} orphan file(s) on disk are deliberately NOT seeded; see MEDIA-REPORT.md.`,
  "--",
  "-- Nothing is uploaded. Every row points at the /media/ URL that serves the",
  "-- file today, so the site keeps rendering exactly as it does now. Phase 5",
  "-- moves the content images into Storage and rewrites public_path.",
  "--",
  "-- The ref_kind='code' rows are the point of this file. They are what stops",
  "-- the media library from offering a Delete button on the 14 frames of the",
  "-- homepage film, whose only references are string literals in page.tsx.",
  "",
  "begin;",
  "",
  ...assets.map((a) => {
    const id = idFor(a.publicPath);
    const storageKey = a.origin === "cms" ? `recipes/${a.basename}` : `system/${a.basename}`;
    return (
      `insert into public.media_assets\n` +
      `  (id, bucket, path, public_path, origin, locked, alt, width, height, bytes, mime, original_name, source)\n` +
      `values (${lit(id)}, 'media', ${lit(storageKey)}, ${lit(a.publicPath)}, ${lit(a.origin)}::public.media_origin, ${a.locked}, ${lit(a.alt)}, ${num(a.width)}, ${num(a.height)}, ${num(a.bytes)}, ${lit(a.mime)}, ${lit(a.basename)}, 'migrated')\n` +
      `on conflict (id) do update set\n` +
      `  path = excluded.path, public_path = excluded.public_path,\n` +
      `  origin = excluded.origin, locked = excluded.locked, source = excluded.source,\n` +
      `  alt = case when public.media_assets.alt = '' then excluded.alt else public.media_assets.alt end,\n` +
      `  width = excluded.width, height = excluded.height,\n` +
      `  bytes = excluded.bytes, mime = excluded.mime, original_name = excluded.original_name;`
    );
  }),
  "",
  "-- ── the code edges ─────────────────────────────────────────────────────────",
  "-- Rebuilt wholesale on every run, because a stale edge is worse than none: it",
  "-- protects a file the code stopped using while the real reference goes",
  "-- uncounted.",
  "delete from public.media_refs where ref_kind = 'code';",
  ...assets
    .filter((a) => a.codeRefs.length)
    .flatMap((a) =>
      a.codeRefs.map(
        (src) =>
          `insert into public.media_refs (media_id, ref_kind, source)\n` +
          `values (${lit(idFor(a.publicPath))}, 'code', ${lit(src)})\n` +
          `on conflict do nothing;`,
      ),
    ),
  "",
  "commit;",
  "",
].join("\n");

const unterminated = findUnterminatedString(sql);
if (unterminated !== null) {
  console.error(`generated SQL has an unterminated string literal, opened on line ${unterminated}`);
  process.exit(1);
}

// ── 8. report ───────────────────────────────────────────────────────────────

const dual = assets.filter((a) => a.kind === "dual");
const code = assets.filter((a) => a.kind === "code");
const cms = assets.filter((a) => a.kind === "cms");
const noDims = assets.filter((a) => a.width === null && a.mime.startsWith("image/"));

const report = [
  "# דוח מדיה",
  "",
  `נוצר על ידי \`scripts/migrate/02-media.mjs\`. ${onDisk.size} קבצים על הדיסק.`,
  "",
  "## החלוקה",
  "",
  "| סוג | כמה | מה זה אומר |",
  "| --- | --- | --- |",
  `| נכסי קוד | ${code.length} | מופנים ממחרוזת בתוך \`src/**\`. נעולים. אלונה לא רואה כפתור מחיקה או החלפה |`,
  `| שלה | ${cms.length} | מופנים רק מתוכן. ניתנים להחלפה ולמחיקה כשאין הפניות |`,
  `| כפולים | ${dual.length} | מופנים משניהם. **הסכנה האמיתית**, ראו למטה |`,
  `| יתומים | ${orphans.length} | על הדיסק, אף אחד לא מפנה אליהם. לא נכנסים למסד |`,
  "",
  "## הכפולים, והסיבה שהם נעולים",
  "",
  dual.length
    ? [
        "התמונות האלה הן גם צילומי מתכון שאלונה יכולה להחליף, וגם מחרוזות קשיחות בתוך",
        "עמודי שיווק. אם היא תחליף אותן דרך הדסק, שורת המתכון תתעדכן והעמוד השני ימשיך",
        "להציג את הקובץ הישן, כי הוא מפנה לנתיב ולא לשורה במסד. אין דרך לכתוב מחדש",
        "מחרוזת בתוך TSX מתוך המסד.",
        "",
        "לכן הן נעולות עד שלב 3ב, שבו עמודי `about` ו־`coaching` מחולצים לסקשנים ואז",
        "ההפניה עוברת למסד וההחלפה עובדת בכל המקומות.",
        "",
        ...dual.map((a) => `- \`${a.publicPath}\`\n  - בקוד: ${a.codeRefs.join(", ")}\n  - בתוכן: ${a.contentRefs.join(", ")}`),
      ].join("\n")
    : "אין.",
  "",
  "## יתומים",
  "",
  orphans.length
    ? [
        "קבצים על הדיסק שאף אחד לא מפנה אליהם. הם נשארו מסבבי עיצוב וביצועים קודמים,",
        "והם קיימים בהיסטוריית ה־git, כך שמחיקה שלהם הפיכה. הם לא נכנסים למסד: שורה",
        "לקובץ שאף אחד לא משתמש בו היא רעש במסך שחייב להישאר אמין.",
        "",
        "ההחלטה אם למחוק אותם היא של רום, לא של המיגרציה.",
        "",
        ...orphans.map((o) => `- \`${o.publicPath}\` (${(o.bytes / 1024).toFixed(0)}KB)`),
      ].join("\n")
    : "אין.",
  "",
  "## בדיקת רישוי",
  "",
  licence.checked
    ? `${licence.ok} מתוך ${licence.checked} צילומי הלקוחה תואמים ב־sha256 את השורה שלהם ב־\`assets-manifest.json\`, וכולם מסומנים \`client-confirmed\`. תמונה שהבייטים שלה לא תואמים היא תמונה שאיש לא אישר, ובאתר שכל סיפור האמון שלו הוא שכלום לא מומצא זו לא הערת שוליים.`
    : "לא נמצא `assets-manifest.json`.",
  licence.mismatched.length ? `\n**${licence.mismatched.length} אי־התאמות:**\n` + licence.mismatched.map((m) => `- ${m.path}`).join("\n") : "",
  "",
  "## הפניות שבורות",
  "",
  broken.length
    ? broken.map((b) => `- \`${b.path}\` ← ${b.sources.slice(0, 3).join(", ")}`).join("\n")
    : `אין. כל מחרוזת \`/media/\` בקוד שנטען מעמוד (${SHIPPED.size} קבצים) ובתוכן מצביעה על קובץ קיים.`,
  "",
  "## מידות שלא נקראו",
  "",
  noDims.length ? noDims.map((a) => `- \`${a.publicPath}\``).join("\n") : "אין. לכל התמונות יש רוחב וגובה.",
  "",
  "## תוכנית ההעלאה לשלב 5",
  "",
  "| יעד | כמה |",
  "| --- | --- |",
  `| עולים ל־Storage | ${assets.filter((a) => a.plan === "phase5-upload").length} |`,
  `| נשארים בריפו | ${assets.filter((a) => a.plan === "stays-in-repo").length} |`,
  `| חסומים עד חילוץ הסקשנים | ${assets.filter((a) => a.plan === "blocked-until-sections-are-extracted").length} |`,
  "",
  "## הגייט",
  "",
  "```bash",
  "node scripts/migrate/02-media.mjs --check",
  "```",
  "",
  "נכשל אם מחרוזת `/media/` כלשהי ב־`src/**` לא מצביעה על קובץ קיים, או אם צילום לקוחה",
  "לא תואם את המניפסט. זו הבדיקה שבאמת תופסת מחיקה מסוכנת. מונה הפניות תופס אותה רק אם",
  "מישהו קורא את המספר.",
  "",
  "## פירוט מלא",
  "",
  "| קובץ | סוג | מידות | KB | הפניות |",
  "| --- | --- | --- | --- | --- |",
  ...assets.map(
    (a) =>
      `| \`${a.publicPath}\` | ${a.kind} | ${a.width ? `${a.width}×${a.height}` : "—"} | ${(a.bytes / 1024).toFixed(0)} | ${a.codeRefs.length + a.contentRefs.length} |`,
  ),
  "",
].join("\n");

// ── 9. write ────────────────────────────────────────────────────────────────

mkdirSync(OUT, { recursive: true });
writeFileSync(path.join(OUT, "seed-media.sql"), sql, "utf8");
writeFileSync(path.join(OUT, "MEDIA-REPORT.md"), report, "utf8");
writeFileSync(path.join(OUT, "media.json"), JSON.stringify({ assets, orphans, broken, licence }, null, 2), "utf8");

console.log(`${onDisk.size} files on disk`);
console.log(`  code-owned (locked):  ${code.length}`);
console.log(`  hers (replaceable):   ${cms.length}`);
console.log(`  dual (locked, risky): ${dual.length}`);
console.log(`  orphans (not seeded): ${orphans.length}`);
console.log(`licence hashes matched: ${licence.ok}/${licence.checked}`);
console.log(`broken references:      ${broken.length}`);
console.log(`\nwrote → scripts/migrate/out/`);

if (failures.length) {
  console.error(`\n${failures.length} PROBLEM(S):`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
