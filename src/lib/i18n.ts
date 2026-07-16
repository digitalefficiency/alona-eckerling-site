// lib/i18n.ts — the bilingual ROUTING substrate (OPT-IN, config-driven from site.i18n).
//
// A single-locale site (i18n.locales === ["he"]) gets NO-OP helpers: localized() returns the path
// as-is, altPath() is null, pageAlternates() is a bare self-canonical, and middleware.ts is inert.
// A bilingual site (["he","en"]) gets: the default locale at the root, every other locale /<code>-
// prefixed, a language toggle (altPath), rel=alternate hreflang (pageAlternates), and geo-middleware.
//
// Pages are written IDENTICALLY either way — `alternates: pageAlternates("/services", locale)` — so
// going bilingual is a config flip + adding the locale route tree, never a page rewrite. The register /
// compliance / pain DECISION lives in references/market-and-language.md; this file owns only the URLs
// and the <link rel> tags. See references/i18n-substrate.md for the go-bilingual recipe.
import { i18n } from "./site";

export const locales = i18n.locales;
export type Locale = (typeof i18n.locales)[number];
export const defaultLocale = i18n.defaultLocale as Locale;
export const isBilingual = locales.length > 1;
// the FIRST non-default locale (the one that carries a URL prefix); undefined on a single-locale site
export const altLocale = (locales as readonly string[]).find((l) => l !== defaultLocale) as Locale | undefined;

export const dir = i18n.dir as Record<string, "rtl" | "ltr">;
export const htmlLang = i18n.htmlLang as Record<string, string>;
export const hreflangTag = i18n.hreflang as Record<string, string>;

// Root-relative path → its localized URL. The default locale lives at the root; any other locale is
// prefixed with its code. Single-locale sites always return the root path (locale === defaultLocale).
export function localized(path: string, locale: Locale): string {
  const clean = path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;
  return locale === defaultLocale ? clean || "/" : `/${locale}${clean}`;
}

// Strip any known non-default locale prefix from a path → the root-relative path.
export function stripLocale(path: string): string {
  const prefixed = (locales as readonly string[]).filter((l) => l !== defaultLocale);
  if (!prefixed.length) return path || "/";
  const re = new RegExp(`^/(?:${prefixed.join("|")})(?=/|$)`);
  return path.replace(re, "") || "/";
}

// The OTHER locale's URL for the same page — drives the language toggle. Null on a single-locale site.
export function altPath(path: string, current: Locale): { locale: Locale; href: string } | null {
  if (!isBilingual || !altLocale) return null;
  const other = current === defaultLocale ? altLocale : defaultLocale;
  return { locale: other, href: localized(stripLocale(path), other) };
}

// Per-page canonical + hreflang alternates — spread into each page's `metadata.alternates` so the page
// SELF-canonicalizes (lint-seo) and declares its locale twins. Single-locale → just the self-canonical
// (no `languages`, so lint-seo passes and no stray hreflang ships). `path` is root-relative ("/services").
export function pageAlternates(
  path: string,
  locale: Locale
): { canonical: string; languages?: Record<string, string> } {
  const self = localized(stripLocale(path), locale);
  if (!isBilingual) return { canonical: self };
  const languages: Record<string, string> = {};
  for (const l of locales) languages[hreflangTag[l]] = localized(stripLocale(path), l as Locale);
  languages["x-default"] = localized(stripLocale(path), defaultLocale);
  return { canonical: self, languages };
}
