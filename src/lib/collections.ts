// ============================================================================
// CONTENT COLLECTIONS — the config-driven loader of the CMS substrate.
// File-based and build-time, like everything else in the foundry: an entry is
// a markdown file in content/<collection-id>/, "publishing IS writing the file"
// (the pattern proven on the first delivered blog). DORMANT until
// content/cms/collections.json declares a collection (see lib/cms/config.ts).
//
// Naming contract:
//   plain collection   →  content/<id>/<slug>.md
//   i18n collection    →  content/<id>/<slug>.<locale>.md   (one slug, N locales)
// Drafts: frontmatter `draft: true` — excluded from lists, params and sitemap,
// so a draft slug 404s publicly (dynamicParams=false) until it is published.
// ============================================================================
import fs from "node:fs";
import path from "node:path";
import { parseFrontmatter, renderDoc, readingTime, type Doc } from "./content";
import { collections, getCollection, type CollectionConfig } from "./cms/config";
import { defaultLocale, locales, localized, type Locale } from "./i18n";

export type CollectionEntry = {
  collection: string;
  slug: string;
  file: string; // actual filename inside content/<collection>/ (slug may be overridden in frontmatter)
  locale: Locale;
  draft: boolean;
  title: string;
  description: string;
  date: string; // ISO yyyy-mm-dd — list order, newest first
  tags: string[];
  image?: string;
  imageAlt?: string;
  gallery: { url: string; alt: string }[]; // paired from the gallery + galleryAlt lists (empty when none)
  readingMinutes: number;
  hasAlternate: boolean; // a matching slug exists in another locale (i18n collections)
  data: Record<string, unknown>; // full frontmatter passthrough (structured fields, e.g. recipe ingredients)
};

// Pair the two parallel lists a gallery field stores, under whatever KEY the
// collection named that field (the field-key is the convention — a recipe may call
// it "shots", a portfolio "work"). We resolve the gallery field-key from the config
// rather than hardcoding one, then read <key> + <key>Alt. Falls back to the literal
// "gallery" key when no gallery field is declared (a hand-authored file). Trailing/
// short alt lists degrade to "" rather than throw — the validator is what refuses to
// publish a mismatch; the reader never crashes.
function galleryKey(c: CollectionConfig): string {
  return c.fields?.find((f) => f.type === "gallery")?.key ?? "gallery";
}
function pairGallery(d: Record<string, unknown>, key: string): { url: string; alt: string }[] {
  const urls = Array.isArray(d[key]) ? (d[key] as unknown[]).map(String) : [];
  const alts = Array.isArray(d[`${key}Alt`]) ? (d[`${key}Alt`] as unknown[]).map(String) : [];
  return urls.map((url, i) => ({ url, alt: alts[i] ?? "" }));
}

export type CollectionDoc = CollectionEntry &
  Pick<Doc, "html" | "headings" | "faq"> & {
    /** raw markdown body (frontmatter stripped) — structured-schema consumers
     *  (e.g. Recipe JSON-LD's ingredient/instruction lists) parse from here. */
    raw: string;
  };

const dirFor = (id: string) => path.join(process.cwd(), "content", id);

function readCollection(c: CollectionConfig): CollectionEntry[] {
  const dir = dirFor(c.id);
  if (!fs.existsSync(dir)) return [];
  const known = locales as readonly string[];
  const entries: CollectionEntry[] = [];
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith(".md")) continue;
    let base = file.replace(/\.md$/, "");
    let locale = defaultLocale as Locale;
    if (c.i18n) {
      const m = /^(.+)\.([a-z]{2})$/.exec(base);
      if (!m || !known.includes(m[2])) continue; // i18n collection: only <slug>.<locale>.md counts
      base = m[1];
      locale = m[2] as Locale;
    }
    const { data, content } = parseFrontmatter(fs.readFileSync(path.join(dir, file), "utf8"));
    const d = data as Record<string, unknown>;
    entries.push({
      collection: c.id,
      slug: String(d.slug ?? base),
      file,
      locale,
      draft: d.draft === true || d.draft === "true",
      title: String(d.title ?? d.h1 ?? base),
      description: String(d.description ?? d.meta_description ?? ""),
      date: String(d.date ?? d.last_updated ?? "1970-01-01"),
      tags: Array.isArray(d.tags) ? d.tags.map(String) : [],
      image: d.image ? String(d.image) : d.featured_image ? String(d.featured_image) : undefined,
      imageAlt: d.imageAlt ? String(d.imageAlt) : d.featured_alt ? String(d.featured_alt) : undefined,
      gallery: pairGallery(d, galleryKey(c)),
      readingMinutes: readingTime(content),
      hasAlternate: false,
      data: d,
    });
  }
  for (const e of entries) {
    e.hasAlternate = entries.some((q) => q.slug === e.slug && q.locale !== e.locale);
  }
  return entries.sort((a, b) => (a.date < b.date ? 1 : -1));
}

// Published entries of one collection in one locale, newest first.
export function listDocs(collectionId: string, locale: Locale = defaultLocale as Locale): CollectionEntry[] {
  const c = getCollection(collectionId);
  if (!c) return [];
  return readCollection(c).filter((e) => e.locale === locale && !e.draft);
}

// One published entry, fully rendered (sanitized HTML + TOC headings + FAQ).
export function getDoc(
  collectionId: string,
  slug: string,
  locale: Locale = defaultLocale as Locale,
): CollectionDoc | undefined {
  const c = getCollection(collectionId);
  if (!c) return undefined;
  const entry = readCollection(c).find((e) => e.slug === slug && e.locale === locale && !e.draft);
  if (!entry) return undefined;
  const rawFile = fs.readFileSync(path.join(dirFor(c.id), entry.file), "utf8");
  const doc = renderDoc(rawFile);
  const { content } = parseFrontmatter(rawFile);
  return { ...entry, html: doc.html, headings: doc.headings, faq: doc.faq, raw: content };
}

// generateStaticParams feeders — app/[collection] + app/[collection]/[slug].
export function collectionParams(): { collection: string }[] {
  return collections.map((c) => ({ collection: c.id }));
}
export function collectionEntryParams(): { collection: string; slug: string }[] {
  return collections.flatMap((c) => listDocs(c.id).map((e) => ({ collection: c.id, slug: e.slug })));
}

// Root-relative sitemap routes for every collection index + published entry.
// Locale-aware: an i18n collection on a bilingual site contributes each locale's
// localized path (lint-i18n: the sitemap iterates locales); a plain collection
// lives only in the default-locale tree. Dormant config → [] → sitemap unchanged.
export function collectionSitemapRoutes(): string[] {
  const routes: string[] = [];
  for (const c of collections) {
    const published = readCollection(c).filter((e) => !e.draft);
    for (const locale of locales as readonly string[]) {
      if (locale !== defaultLocale && !c.i18n) continue;
      routes.push(localized(`/${c.id}`, locale as Locale));
      for (const e of published.filter((p) => p.locale === locale)) {
        routes.push(localized(`/${c.id}/${e.slug}`, locale as Locale));
      }
    }
  }
  return routes;
}
