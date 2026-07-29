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

  // Recipes get true Recipe JSON-LD (Google rich results — the "כרטיס מידע"
  // the proposal promised per recipe); every other collection stays Article.
  const isRecipe = collection === "recipes";

  // Parse the structured lists from the raw markdown body:
  // bullets under "## רכיבים" → recipeIngredient; numbered lines under
  // "## אופן הכנה" → HowToStep. Sections missing → fields omitted (never invented).
  // Terminator is `#{2,}` — ANY heading of level 2 or deeper closes a section.
  // With the old `\n##\s` a `### ערכים תזונתיים` heading did NOT terminate
  // (after `##` comes `#`, not whitespace), so in the 9 recipes that use one,
  // the whole nutrition block was swallowed into «אופן הכנה» and published as
  // recipeInstructions — Google was served "step 6: אנרגיה (קלוריות) 367 קק״ל".
  const sectionOf = (heading: string): string => {
    const m = doc.raw.match(new RegExp(`##\\s*${heading}\\s*\\n([\\s\\S]*?)(?=\\n#{2,}\\s|$)`));
    return m ? m[1] : "";
  };
  // Only actual list items become ingredients. Without the marker test, prose
  // lines inside the section («(עבור 13 פנקייקים)», a bold sub-label like
  // «**לרוטב:**») were emitted as recipeIngredient in 24 of 34 recipes.
  const ingredients = sectionOf("רכיבים")
    .split("\n")
    .filter((l) => /^\s*[-*]\s+/.test(l))
    .map((l) => l.replace(/^\s*[-*]\s*/, "").trim())
    .filter(Boolean);
  // Same discipline for steps: numbered lines only.
  const steps = sectionOf("אופן הכנה")
    .split("\n")
    .filter((l) => /^\s*\d+[.)]\s+/.test(l))
    .map((l) => l.replace(/^\s*\d+[.)]\s*/, "").trim())
    .filter(Boolean);

  // The nutrition block freed by the terminator fix becomes real structured
  // data instead of fake steps. Values are read verbatim from the client's own
  // markdown — nothing is computed or inferred (YMYL: we never invent a number).
  const nutritionRaw = doc.raw.match(/###\s*ערכים תזונתיים[^\n]*\n([\s\S]*?)(?=\n#{2,}\s|$)/)?.[1] ?? "";
  const nutritionField = (labels: string[]): string | undefined => {
    for (const line of nutritionRaw.split("\n")) {
      const t = line.trim();
      if (!t || !labels.some((l) => t.startsWith(l))) continue;
      // «חלבון- 32.9 גרם.» → «32.9 גרם» (schema.org wants value + unit)
      const v = t.split(/[-–:]/).slice(1).join("-").trim().replace(/\.$/, "");
      if (v) return v;
    }
    return undefined;
  };
  const nutrition = {
    ...(nutritionField(["אנרגיה", "קלוריות"]) ? { calories: nutritionField(["אנרגיה", "קלוריות"]) } : {}),
    ...(nutritionField(["שומן"]) ? { fatContent: nutritionField(["שומן"]) } : {}),
    ...(nutritionField(["חלבון"]) ? { proteinContent: nutritionField(["חלבון"]) } : {}),
    ...(nutritionField(["פחמימה", "פחמימות"]) ? { carbohydrateContent: nutritionField(["פחמימה", "פחמימות"]) } : {}),
  };
  // "20 דקות" → PT20M · "שעה" → PT1H (ISO-8601 duration; unparseable → omitted)
  const prepRaw = String(doc.data.prepTime ?? "");
  const prepMin = /(\d+)\s*דקות/.exec(prepRaw)?.[1];
  const prepHr = /(\d+)?\s*שע(?:ה|ות)/.exec(prepRaw)?.[1] ?? (/שעה/.test(prepRaw) ? "1" : undefined);
  const prepIso = prepMin ? `PT${prepMin}M` : prepHr ? `PT${prepHr}H` : undefined;

  const entrySchema = isRecipe
    ? {
        "@context": "https://schema.org",
        "@type": "Recipe",
        name: doc.title,
        description: doc.description,
        datePublished: doc.date,
        dateModified: String(doc.data.last_updated ?? doc.date),
        inLanguage: htmlLang[defaultLocale],
        mainEntityOfPage: `${site.url}/${collection}/${slug}`,
        // Reference the ONE canonical Person node (defined on /team/alona) by @id,
        // instead of a second lookalike at /about — the entity-resolution fix.
        // canonical Person node moved to /about when /team/alona was removed
        // (2026-07-29) — this @id MUST match personFromBio's on /about or the
        // recipes start referencing an entity that no longer resolves
        author: { "@type": "Person", "@id": `${site.url}/about#person`, name: site.name, url: `${site.url}/about` },
        ...(doc.image ? { image: `${site.url}${doc.image}` } : {}),
        ...(doc.data.category ? { recipeCategory: String(doc.data.category) } : {}),
        ...(Array.isArray(doc.data.tags) && doc.data.tags.length
          ? { keywords: (doc.data.tags as string[]).join(", ") }
          : {}),
        ...(doc.data.servings ? { recipeYield: String(doc.data.servings) } : {}),
        ...(prepIso ? { prepTime: prepIso } : {}),
        ...(ingredients.length ? { recipeIngredient: ingredients } : {}),
        ...(steps.length
          ? { recipeInstructions: steps.map((s) => ({ "@type": "HowToStep", text: s })) }
          : {}),
        // Real NutritionInformation, transcribed verbatim from the client's own
        // «### ערכים תזונתיים» block. Omitted entirely when the recipe has none.
        ...(Object.keys(nutrition).length
          ? { nutrition: { "@type": "NutritionInformation", ...nutrition } }
          : {}),
      }
    : {
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
      <JsonLd data={entrySchema} />
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
            <span className="text-xs font-bold tracking-eyebrow text-gold-ink">
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
