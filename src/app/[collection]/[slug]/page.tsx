import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { site } from "@/lib/site";
import { getCollection } from "@/lib/cms/config";
import { collectionEntryParams, getDoc } from "@/lib/collections";
import { defaultLocale, htmlLang, pageAlternates, type Locale } from "@/lib/i18n";
import { Section } from "@/components/layout/Section";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ArticleMeta } from "@/components/ArticleMeta";
import { MediaFrame } from "@/components/media/MediaFrame";
import { Gallery } from "@/components/media/Gallery";
import { Prose } from "@/components/Prose";
import { FaqAccordion } from "@/components/FaqAccordion";
import { SectionHeading } from "@/components/SectionHeading";
import { JsonLd, faqSchema } from "@/components/JsonLd";

// ============================================================================
// COLLECTION ENTRY — the generic article route of the CMS substrate.
// Renders a published markdown entry: sanitized prose, Article JSON-LD,
// self-canonical + hreflang (lint-seo / lint-i18n), FAQ accordion when the
// body carries a "שאלות נפוצות" section. Drafts never reach here — they are
// excluded from generateStaticParams and dynamicParams=false 404s the rest.
// ============================================================================

export const dynamicParams = false;

type Params = { params: Promise<{ collection: string; slug: string }> };

export function generateStaticParams() {
  return collectionEntryParams();
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { collection, slug } = await params;
  const doc = getDoc(collection, slug);
  if (!doc) return {};
  return {
    title: doc.title,
    description: doc.description,
    alternates: pageAlternates(`/${collection}/${slug}`, defaultLocale as Locale),
    openGraph: {
      type: "article",
      title: doc.title,
      description: doc.description,
      url: `/${collection}/${slug}`,
      ...(doc.image ? { images: [{ url: doc.image, alt: doc.imageAlt ?? doc.title }] } : {}),
    },
  };
}

export default async function CollectionEntryPage({ params }: Params) {
  const { collection, slug } = await params;
  const c = getCollection(collection);
  const doc = getDoc(collection, slug);
  if (!c || !doc) notFound();

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: doc.title,
    description: doc.description,
    datePublished: doc.date,
    dateModified: String(doc.data.last_updated ?? doc.date),
    inLanguage: htmlLang[defaultLocale],
    mainEntityOfPage: `${site.url}/${collection}/${slug}`,
    author: { "@type": "Organization", name: site.legalName, url: site.url },
    publisher: { "@type": "Organization", name: site.legalName, url: site.url },
    ...(doc.image ? { image: `${site.url}${doc.image}` } : {}),
  };

  return (
    <>
      <JsonLd data={articleSchema} />
      {doc.faq.length > 0 && <JsonLd data={faqSchema(doc.faq)} />}

      <Section tone="sand" border>
        <div className="max-w-[72ch]">
          <Breadcrumbs
            items={[
              { label: c.label, href: `/${collection}` },
              { label: doc.title, href: `/${collection}/${slug}` },
            ]}
          />
          <div className="mt-6 flex items-center gap-2.5">
            <span className="text-[0.7rem] leading-none text-gold" aria-hidden>◆</span>
            <span className="text-xs font-bold tracking-[.2em] text-gold-ink">
              {c.labelSingular ?? c.label}
            </span>
          </div>
          <h1
            className="mt-4 font-serif font-black leading-[1.08] text-navy"
            style={{ fontSize: "clamp(1.9rem, 4.2vw, 3rem)" }}
          >
            {doc.title}
          </h1>
          <div className="mt-5">
            <ArticleMeta date={String(doc.data.last_updated ?? doc.date)} minutes={doc.readingMinutes} />
          </div>
          {doc.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {doc.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-line bg-card px-3 py-1 text-xs font-semibold text-navy-700"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </Section>

      <Section tone="white" width="prose" border>
        {doc.image && (
          <MediaFrame
            src={doc.image}
            alt={doc.imageAlt ?? doc.title}
            ratio="16/9"
            priority
            className="mb-10"
          />
        )}
        <Prose html={doc.html} />
      </Section>

      {doc.gallery.length > 0 && (
        <Section tone="white" width="wide" border>
          <Gallery items={doc.gallery.map((g) => ({ src: g.url, alt: g.alt }))} />
        </Section>
      )}

      {doc.faq.length > 0 && (
        <Section tone="sand" width="prose" seam>
          <SectionHeading eyebrow="שאלות נפוצות" title="מה שחשוב לדעת" />
          <div className="mt-10">
            <FaqAccordion items={doc.faq} />
          </div>
        </Section>
      )}
    </>
  );
}
