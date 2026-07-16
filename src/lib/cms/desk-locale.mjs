// desk-locale.mjs — the NODE-ONLY client-language sniff, deliberately isolated from
// strings.mjs. strings.mjs is reachable from client components (via the T() bridge),
// so a top-level `node:fs` there would break the Next client bundle. This file reads
// the filesystem and is imported ONLY by node code (lint-content, the harness) — never
// by a component and never by strings.mjs or desk-strings.ts.
//
// deskLocaleFromSite(root) = site.ts defaultLocale ?? brand.config lang ?? 'he'.
// It REUSES lint-i18n's already-exported comment-stripped readLocales rather than a
// fresh naive regex: a commented `// defaultLocale: "en"` decoy line would otherwise
// shadow the real value (the exact bug lint-i18n's selftest guards).
import fs from "node:fs";
import path from "node:path";
import { readLocales } from "../../../scripts/lint-i18n.mjs";

// Same comment-stripper lint-i18n uses (block + line comments, but not the // in a URL),
// so a commented-out `lang:` line in brand.config cannot shadow the real one.
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");

// The <html lang> declared in brand.config — the fallback when site.ts declares no locale.
export function brandLang(root) {
  for (const rel of ["src/brand.config.ts", "brand.config.ts"]) {
    const p = path.join(root, rel);
    if (!fs.existsSync(p)) continue;
    const s = stripComments(fs.readFileSync(p, "utf8"));
    const m = s.match(/\blang\s*:\s*["'`]([\w-]+)["'`]/);
    if (m) return m[1];
  }
  return null;
}

// The desk's UI/validator language for a given site root.
export function deskLocaleFromSite(root) {
  const info = readLocales(root);
  // readLocales returns { defaultLocale } (a single-locale site still resolves one);
  // `unparsed` or an absent site.ts leaves defaultLocale null → fall to brand lang → he.
  return info.defaultLocale ?? brandLang(root) ?? "he";
}
