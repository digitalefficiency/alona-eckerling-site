import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { site } from "@/lib/site";
import { collections, getCollection } from "@/lib/cms/config";
import { listDocs } from "@/lib/collections";
import { defaultLocale, pageAlternates, type Locale } from "@/lib/i18n";
import { PageHero } from "@/components/PageHero";
import { Section } from "@/components/layout/Section";
import { BlogCardGrid } from "@/components/BlogCardGrid";

// ============================================================================
// COLLECTION INDEX — the generic listing route of the CMS substrate.
// DORMANT by construction: generateStaticParams reads content/cms/collections.json;
// an empty config emits ZERO paths and dynamicParams=false 404s everything else,
// so a site without collections ships this file as dead weight only. Static
// routes (/services, /about…) always win over this root dynamic segment.
// ============================================================================

export const dynamicParams = false;

type Params = { params: Promise<{ collection: string }> };

export function generateStaticParams() {
  return collections.map((c) => ({ collection: c.id }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { collection } = await params;
  const c = getCollection(collection);
  if (!c) return {};
  const title = c.label;
  const description = c.description ?? `${c.label} — ${site.name}`;
  // A collection index with no published entries (e.g. /blog before its first
  // article) is thin content on a YMYL domain — noindex it until it has posts,
  // mirroring its exclusion from sitemap.ts. Self-heals when content lands.
  const isEmpty = listDocs(c.id).length === 0;
  return {
    title,
    description,
    alternates: pageAlternates(`/${c.id}`, defaultLocale as Locale),
    openGraph: { title, description, url: `/${c.id}` },
    ...(isEmpty ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function CollectionIndexPage({ params }: Params) {
  const { collection } = await params;
  const c = getCollection(collection);
  if (!c) notFound();

  const posts = listDocs(c.id).map((e) => ({
    slug: e.slug,
    file: e.file,
    data: {
      title: e.title,
      meta_description: e.description,
      featured_image: e.image,
      featured_alt: e.imageAlt,
    },
    readingMinutes: e.readingMinutes,
  }));

  return (
    <>
      <PageHero
        crumbs={[{ label: c.label, href: `/${c.id}` }]}
        eyebrow={site.name}
        title={c.label}
        lead={c.description}
      />
      {posts.length > 0 && (
        <Section tone="white" border>
          <BlogCardGrid posts={posts} base={`/${c.id}`} />
        </Section>
      )}
    </>
  );
}
