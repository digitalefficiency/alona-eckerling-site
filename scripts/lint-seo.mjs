#!/usr/bin/env node
// lint-seo.mjs — the mechanical SEO gate. The #1 catch: every indexable page must
// SELF-canonicalize. A composed page that omits `alternates.canonical` silently
// inherits the root layout's canonical ("/") — Google then dedupes the WHOLE site
// to the homepage (a real launch-blocking bug that shipped once). Also asserts the
// sitemap + robots routes exist. Self-contained, runs IN the dest. Zero deps.
//   node scripts/lint-seo.mjs
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { resolve, join } from "node:path";

const appDir = resolve("src/app");
if (!existsSync(appDir)) { console.log("• lint-seo: no src/app (skipped)"); process.exit(0); }

// collect every page.tsx (static + dynamic [slug] routes)
const pages = [];
(function walk(dir) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p);
    else if (e === "page.tsx") pages.push(p);
  }
})(appDir);

// canonical may live in `export const metadata` OR `generateMetadata`, either as a
// literal `alternates: { canonical: … }` ([^}]* stops at the first }, which is enough
// because canonical is authored before any nested (languages) object) OR as the i18n
// substrate's `alternates: pageAlternates(path, locale)` — a helper that PROVABLY
// returns a self-canonical (lib/i18n.ts), used by the CMS collection routes.
const HAS_CANONICAL = /alternates\s*:\s*(?:\{[^}]*canonical\s*:|pageAlternates\s*\()/s;

// noindex pages (styleguide, etc.) are out of the index + sitemap → exempt from canonical.
const IS_NOINDEX = /robots\s*:\s*\{[^}]*index\s*:\s*false/s;

const fails = [];
for (const p of pages) {
  const rel = p.replace(appDir + "/", "app/").replace(appDir, "app");
  if (rel === "app/page.tsx") continue; // home inherits the layout's canonical "/" (self-referential, correct)
  const txt = readFileSync(p, "utf8");
  if (IS_NOINDEX.test(txt)) continue; // noindex → not indexed, no canonical needed
  if (!HAS_CANONICAL.test(txt)) {
    fails.push(`${rel} — no self-referential alternates.canonical; it inherits the layout's "/" (duplicate-canonical bug)`);
  }
}
for (const [f, why] of [["src/app/sitemap.ts", "no sitemap.xml"], ["src/app/robots.ts", "no robots.txt"]]) {
  if (!existsSync(resolve(f))) fails.push(`${f} missing — ${why}`);
}

if (fails.length) {
  console.error(`✗ lint-seo — ${fails.length} issue(s):`);
  fails.forEach((f) => console.error("  • " + f));
  console.error('  fix: add `alternates: { canonical: "/<route>" }` to each page\'s metadata (self-referential).');
  process.exit(1);
}
console.log(`• lint-seo: ${pages.length} page(s) self-canonicalize · sitemap + robots present ✓`);
