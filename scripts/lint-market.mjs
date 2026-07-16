#!/usr/bin/env node
// lint-market.mjs — the bilingual safety net. On an ENGLISH / LTR build (brand.config direction="ltr"
// or lang="en"), the ~7 chrome components must NOT still carry Hebrew VISIBLE strings — the #1 way a
// bilingual site leaks its Hebrew origin (rtl-ltr-and-brand.md documents the exact list). Self-contained,
// runs IN the dest. Tolerant: an RTL/Hebrew build (or no brand.config) → skip (exit 0). Only Hebrew
// inside string literals is flagged (developer comments in Hebrew are ignored).
//   node scripts/lint-market.mjs
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const cfg = resolve("src/brand.config.ts");
if (!existsSync(cfg)) { console.log("• lint-market: no brand.config.ts (skipped)"); process.exit(0); }
const cfgTxt = readFileSync(cfg, "utf8");
const isLtr = /direction:\s*["']ltr["']/.test(cfgTxt) || /\blang:\s*["']en["']/.test(cfgTxt);
if (!isLtr) { console.log("• lint-market: RTL/Hebrew build (skipped — the sniff is direction=rtl / lang=he)"); process.exit(0); }

// the ~7 chrome surfaces that carry hardcoded visible strings (rtl-ltr-and-brand.md §UI strings)
const CHROME = [
  "src/components/Header.tsx", "src/components/Footer.tsx", "src/components/AccessibilityMenu.tsx",
  "src/components/CookieConsent.tsx", "src/components/CookiePrefsButton.tsx", "src/components/ContactLeadForm.tsx",
  "src/components/StickyContactBar.tsx", "src/lib/site.ts",
];
// Any Hebrew glyph in a VISIBLE position (JSX text like `מאז {year}`, quoted strings, aria-labels) — but not
// in comments (dev comments in Hebrew are ignored: skip full-comment lines + strip trailing `// …`).
const HEB = /[֐-׿]/;

const leaks = [];
for (const rel of CHROME) {
  const p = resolve(rel);
  if (!existsSync(p)) continue;
  const lines = readFileSync(p, "utf8").split("\n");
  lines.forEach((line, i) => {
    const t = line.trim();
    if (t.startsWith("//") || t.startsWith("*") || t.startsWith("/*")) return; // skip comment lines
    const code = line.replace(/\/\/.*$/, ""); // strip a trailing line-comment
    if (HEB.test(code)) leaks.push(`${rel}:${i + 1}  ${t.slice(0, 80)}`);
  });
}

if (leaks.length) {
  console.error("✗ lint-market: English/LTR build still has Hebrew chrome strings —");
  for (const x of leaks.slice(0, 30)) console.error("   " + x);
  if (leaks.length > 30) console.error(`   …and ${leaks.length - 30} more`);
  console.error("Translate the ~7 chrome surfaces' visible strings for the target market (rtl-ltr-and-brand.md · market-and-language.md D0.5).");
  process.exit(1);
}
console.log("✓ lint-market: English/LTR build — no leftover Hebrew chrome strings");
process.exit(0);
