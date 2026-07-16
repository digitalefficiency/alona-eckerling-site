#!/usr/bin/env node
// lint-i18n.mjs — the bilingual ROUTING gate. DORMANT on a single-locale site (locales < 2 → pass),
// so it costs nothing until a site opts into bilingual. When bilingual it asserts the substrate is wired
// so search engines see BOTH locales:
//   1. every indexable page declares hreflang alternates — a page that omits them inherits the layout's
//      root canonical and its locale twin is invisible (the same duplicate-canonical class lint-seo guards);
//   2. each non-default locale has a route tree (app/<code>/) — else that locale has no pages;
//   3. sitemap.ts iterates the locales — else one locale is missing from the sitemap.
// Complements lint-seo (self-canonical) + lint-market (chrome-string glyph leak). Self-contained, runs
// IN the dest. Zero deps.  node scripts/lint-i18n.mjs  [--selftest]
import { readFileSync, existsSync, readdirSync, statSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { resolve, join } from "node:path";
import { tmpdir } from "node:os";

const has = (k) => process.argv.includes("--" + k);
const firstExisting = (root, cands) => cands.map((d) => join(root, d)).find(existsSync);

const HAS_HREFLANG = /alternates\s*:\s*\{[^}]*languages\s*:/s;
const CALLS_ALTS = /pageAlternates\s*\(/;
const IS_NOINDEX = /robots\s*:\s*\{[^}]*index\s*:\s*false/s;

// Strip /* block */ + // line comments (but NOT the // in a URL), so a commented-out config line can't
// shadow the real one and a keyword inside a comment can't satisfy a check.
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");

// Locale set — from the template convention (site.ts `i18n.locales:`) or a hand-rolled lib/i18n.ts
// (`export const locales = [...]`). A site.i18n.locales that is present but NOT a literal array
// (computed via .split(), a spread, an imported const) returns `unparsed` and FAILS loudly rather than
// silently going dormant — a non-literal config must not be able to disable the bilingual gate.
function readLocales(root) {
  const read = (p) => { try { return stripComments(readFileSync(p, "utf8")); } catch { return ""; } };
  const extract = (txt) => { const lm = txt.match(/locales\s*[:=]\s*\[([^\]]*)\]/); return lm ? [...lm[1].matchAll(/["'`]([\w-]+)["'`]/g)].map((x) => x[1]) : []; };
  const defOf = (txt, locales) => { const dm = txt.match(/defaultLocale\s*[:=]\s*["'`]([\w-]+)["'`]/); return dm ? dm[1] : locales[0] || null; };

  const site = firstExisting(root, ["src/lib/site.ts", "lib/site.ts"]);
  if (site) { const s = read(site); if (/\blocales\s*:/.test(s)) {
    const locales = extract(s);
    if (!locales.length) return { unparsed: true, locales: [], defaultLocale: null };
    return { locales, defaultLocale: defOf(s, locales) };
  } }
  const i18nFile = firstExisting(root, ["src/lib/i18n.ts", "lib/i18n.ts"]);
  if (i18nFile) { const s = read(i18nFile); if (/\blocales\s*=\s*\[/.test(s)) {
    const locales = extract(s);
    if (locales.length) return { locales, defaultLocale: defOf(s, locales) };
  } }
  return { locales: [], defaultLocale: null };
}

function checkI18n(root) {
  const appDir = firstExisting(root, ["src/app", "app"]);
  if (!appDir) return { skip: "no src/app", fails: [], locales: [] };
  const info = readLocales(root);
  if (info.unparsed) return { unparsed: true, locales: [], fails: ['could not parse i18n.locales — declare a LITERAL array (e.g. locales: ["he","en"] as const); a computed/imported value would silently disable the bilingual gate'] };
  const { locales, defaultLocale } = info;
  if (locales.length < 2) return { dormant: locales.join(",") || "default", fails: [], locales };

  const altLocales = locales.filter((l) => l !== defaultLocale);
  const fails = [];
  const pages = [];
  (function walk(dir) {
    for (const e of readdirSync(dir)) {
      const p = join(dir, e);
      let st; try { st = statSync(p); } catch { continue; }
      if (st.isDirectory()) walk(p);
      else if (e === "page.tsx") pages.push(p);
    }
  })(appDir);

  // A HOME page — root, a route-group `(he)/`, a locale `en/`, or the `[locale]/` segment — carries its
  // alternates in the LAYOUT, so it's exempt. Strip app/ + a leading group + a leading locale/[locale].
  const localeSeg = new RegExp(`^(?:${locales.join("|")}|\\[locale\\])\\/`);
  for (const p of pages) {
    const rel = p.replace(appDir + "/", "app/").replace(appDir, "app");
    const txt = stripComments(readFileSync(p, "utf8"));
    if (IS_NOINDEX.test(txt)) continue;
    const body = rel.replace(/^app\//, "").replace(/^\([^)]*\)\//, "").replace(localeSeg, "");
    if (body === "page.tsx") continue; // a home twin (root / per-locale / route-group / [locale])
    if (!HAS_HREFLANG.test(txt) && !CALLS_ALTS.test(txt))
      fails.push(`${rel} — no hreflang alternates (spread \`alternates: pageAlternates(path, locale)\`); its locale twin is invisible to search`);
  }
  // Route tree: either a per-locale dir (app/en/) OR the [locale] dynamic segment (app/[locale]/).
  const paramSeg = firstExisting(root, ["src/app/[locale]", "app/[locale]"]);
  for (const alt of altLocales) {
    if (!paramSeg && !firstExisting(root, [`src/app/${alt}`, `app/${alt}`]))
      fails.push(`no /${alt} route tree (app/${alt}/ or app/[locale]/) — the ${alt} locale has no pages`);
  }
  const sm = firstExisting(root, ["src/app/sitemap.ts", "app/sitemap.ts"]);
  if (!sm) fails.push("sitemap.ts missing — a bilingual site needs a sitemap covering every locale");
  else {
    const st = stripComments(readFileSync(sm, "utf8"));
    // require `locales` used as an ITERABLE (or localized()) — a for-loop over something else, or the
    // word `locales` in a comment, must NOT satisfy it.
    const iterates = /\blocales\b\s*\.\s*(?:flatMap|map|forEach)\s*\(/.test(st) || /\bof\s+locales\b/.test(st) || /localized\s*\(/.test(st);
    if (!iterates) fails.push("sitemap.ts does not iterate locales (locales.map/flatMap / for…of locales / localized()) — a locale is missing from the sitemap");
  }
  return { locales, defaultLocale, pages: pages.length, fails };
}

// two ephemeral fixtures: a bilingual dest MISSING hreflang on an interior page fails; a wired one passes.
function selftest() {
  const base = mkdtempSync(join(tmpdir(), "lint-i18n-"));
  const mk = (root, servicesPageBody) => {
    mkdirSync(join(root, "src/app/services"), { recursive: true });
    mkdirSync(join(root, "src/app/en/services"), { recursive: true });
    mkdirSync(join(root, "src/lib"), { recursive: true });
    writeFileSync(join(root, "src/lib/site.ts"), 'export const i18n = { locales: ["he","en"] as const, defaultLocale: "he" as const };');
    writeFileSync(join(root, "src/app/page.tsx"), "export default function P(){ return null; }");
    writeFileSync(join(root, "src/app/services/page.tsx"), servicesPageBody);
    writeFileSync(join(root, "src/app/en/services/page.tsx"), servicesPageBody);
    writeFileSync(join(root, "src/app/sitemap.ts"), "import {locales} from '@/lib/i18n'; export default function s(){ return locales.flatMap(l=>[]); }");
  };
  const bad = join(base, "bad"), good = join(base, "good");
  mk(bad, "export const metadata = { title: 'x' };"); // no hreflang
  mk(good, "import {pageAlternates} from '@/lib/i18n'; export const metadata = { alternates: pageAlternates('/services','he') };");
  const rb = checkI18n(bad), rg = checkI18n(good);
  rmSync(base, { recursive: true, force: true });
  const errs = [];
  if (!rb.fails.some((f) => /hreflang/.test(f))) errs.push("bad fixture: a page missing hreflang must fail");
  if (rg.fails.length) errs.push(`good fixture must pass, got: ${rg.fails.join("; ")}`);
  // a single-locale dest must be dormant
  const solo = mkdtempSync(join(tmpdir(), "lint-i18n-solo-"));
  mkdirSync(join(solo, "src/app"), { recursive: true }); mkdirSync(join(solo, "src/lib"), { recursive: true });
  writeFileSync(join(solo, "src/lib/site.ts"), 'export const i18n = { locales: ["he"] as const, defaultLocale: "he" as const };');
  writeFileSync(join(solo, "src/app/page.tsx"), "export default function P(){ return null; }");
  const rs = checkI18n(solo); rmSync(solo, { recursive: true, force: true });
  if (!rs.dormant) errs.push("single-locale dest must be dormant, not enforced");

  // a COMMENTED-OUT single-locale line above the real bilingual line must NOT disable the gate
  const cmt = mkdtempSync(join(tmpdir(), "lint-i18n-cmt-"));
  mkdirSync(join(cmt, "src/lib"), { recursive: true }); mkdirSync(join(cmt, "src/app"), { recursive: true });
  writeFileSync(join(cmt, "src/lib/site.ts"), 'export const i18n = {\n  // locales: ["he"] as const,\n  locales: ["he","en"] as const,\n  defaultLocale: "he" as const,\n};');
  writeFileSync(join(cmt, "src/app/page.tsx"), "export default function P(){ return null; }");
  const rc = checkI18n(cmt); rmSync(cmt, { recursive: true, force: true });
  if (rc.dormant) errs.push("a commented-out single-locale line must not make a bilingual site dormant");

  // the [locale] dynamic-segment shape must satisfy the route-tree requirement (and its home is exempt)
  const seg = mkdtempSync(join(tmpdir(), "lint-i18n-seg-"));
  mkdirSync(join(seg, "src/lib"), { recursive: true }); mkdirSync(join(seg, "src/app/[locale]/services"), { recursive: true });
  writeFileSync(join(seg, "src/lib/site.ts"), 'export const i18n = { locales: ["he","en"] as const, defaultLocale: "he" as const };');
  writeFileSync(join(seg, "src/app/[locale]/page.tsx"), "import {pageAlternates} from '@/lib/i18n'; export const metadata = { alternates: pageAlternates('/','he') };");
  writeFileSync(join(seg, "src/app/[locale]/services/page.tsx"), "import {pageAlternates} from '@/lib/i18n'; export const metadata = { alternates: pageAlternates('/services','he') };");
  writeFileSync(join(seg, "src/app/sitemap.ts"), "import {locales} from '@/lib/i18n'; export default function s(){ return locales.flatMap(()=>[]); }");
  const rseg = checkI18n(seg); rmSync(seg, { recursive: true, force: true });
  if (rseg.fails.length) errs.push(`[locale] shape must pass, got: ${rseg.fails.join("; ")}`);

  if (errs.length) { console.error("✗ lint-i18n --selftest:", errs.join("; ")); process.exit(1); }
  console.log("✓ lint-i18n --selftest: missing-hreflang fails · wired passes · single dormant · commented-locale not-dormant · [locale] shape passes");
  process.exit(0);
}

function main() {
  if (has("selftest")) return selftest();
  const r = checkI18n(resolve("."));
  if (r.skip) { console.log(`• lint-i18n: ${r.skip} (skipped)`); process.exit(0); }
  if (r.dormant) { console.log(`• lint-i18n: single-locale (${r.dormant}) — bilingual gate dormant ✓`); process.exit(0); }
  if (r.fails.length) {
    console.error(`✗ lint-i18n — ${r.unparsed ? "unparsable i18n config" : r.locales.join("/") + " bilingual"}, ${r.fails.length} issue(s):`);
    r.fails.forEach((f) => console.error("  • " + f));
    console.error("  fix: every indexable page spreads `alternates: pageAlternates(path, locale)`; add each alt-locale route tree (app/<code>/ or app/[locale]/); the sitemap maps over locales. Ref: references/i18n-substrate.md.");
    process.exit(1);
  }
  console.log(`• lint-i18n: ${r.locales.join("/")} bilingual · ${r.pages} page(s) declare hreflang · route trees + sitemap cover every locale ✓`);
  process.exit(0);
}

export { checkI18n, readLocales };
import { fileURLToPath } from "node:url";
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) main();
