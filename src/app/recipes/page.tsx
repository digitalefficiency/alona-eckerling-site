import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { site } from "@/lib/site";
import { listDocs } from "@/lib/collections";
import { getCollection } from "@/lib/cms/config";
import { scaleSoft } from "@/lib/motion-variants";
import { ImageHero } from "@/components/media/ImageHero";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { MOrchestrate, MItem } from "@/components/motion/MOrchestrate";
import { RevealHeading } from "@/components/motion/RevealHeading";
import { SplitText } from "@/components/motion/SplitText";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { RecipesArchive, type RecipeTile } from "@/components/RecipesArchive";

// ============================================================================
// מתכונים — the bespoke SIGNATURE page (proof-of-craft archive → avatar B).
// This static route deliberately overrides the generic app/[collection] index:
// full-bleed appetite hero → filterable cookbook bento (real CMS entries via
// listDocs) → the blush booklet-magnet close. Every visible string is pasted
// from COPY.md «עמוד: מתכונים» or arrives as CMS data; the count line stays
// honest (~30, never rounded up).
// ============================================================================

// COPY: ### סקשן 23 · ImageHero (צילום-אוכל בהיר)
const HERO = {
  crumb: "מתכונים", // «בית / מתכונים» — Breadcrumbs prepends בית
  eyebrow: "בלי חוקים מיותרים",
  title: "המטבח של אלונה",
  lead: "מתכונים פשוטים שאני באמת מבשלת: אוכל אמיתי, בלי דיאטה ובלי לוותר על מה שאת אוהבת. מתכון חדש כל שבוע.",
  // one pasted COPY sentence, split STRUCTURALLY (no rewording): the question
  // is a micro line above the button, the button carries only the action —
  // a 46-char sentence-button wraps to a framed paragraph at 375px.
};

// COPY: ### סקשן 24 · BentoGrid masonry (CMS) + צ'יפי-סינון
// (the honest count chip is section 23's «צ'יפ-ספירה כנה», repeated here by the
//  section-24 kicker rule; chip sets themselves derive from the CMS fields)
const ARCHIVE = {
  countChip: "בערך 30 מתכונים · מתכון חדש כל שבוע",
  all: "הכול",
  empty: "עוד מתכונים בקטגוריה הזו בדרך. מתכון חדש כל שבוע.",
};

// COPY: ### סקשן 25 · CTA סוגר → ליווי אישי
// The booklet product was retired from the site (Rom 2026-07-21), and with
// it the branded mailing list. The archive now closes on the honest next step:
// the free intro call. Every claim here already exists and is verified —
// free, no commitment, built around her week, keeps the food she loves.
const CLOSING = {
  eyebrow: "הצעד הבא",
  title: "אהבת את המטבח הזה?",
  body: "המתכונים כאן הם איך שאני מבשלת. הליווי האישי הוא איך שבונים סביב זה דרך שמתאימה לשבוע שלך, בלי לוותר על האוכל שאת אוהבת.",
  primary: "בואי נדבר",
  primaryHref: "/coaching",
  note: "שיחת היכרות חינם, בלי התחייבות.",
};

export const metadata: Metadata = {
  title: HERO.crumb,
  description: HERO.lead,
  alternates: { canonical: "/recipes" },
  openGraph: { title: HERO.crumb, description: HERO.lead, url: "/recipes" },
};

export default function RecipesPage() {
  const c = getCollection("recipes");
  const docs = listDocs("recipes");
  const entries: RecipeTile[] = docs.map((e) => ({
    slug: e.slug,
    title: e.title,
    image: e.image,
    imageAlt: e.imageAlt,
    category: e.data.category ? String(e.data.category) : "",
    tags: e.tags,
    prepTime: e.data.prepTime ? String(e.data.prepTime) : undefined,
  }));

  // Hero raster = a REAL Alona dish photo straight from the CMS data (bright,
  // warm, homemade — the cover of the cookbook). Art-directed pick with a
  // data-driven fallback; no literal media path lives in this file.
  const hero = entries.find((e) => e.slug === "homemade-hummus" && e.image) ?? entries.find((e) => e.image);
  const heroImage = hero?.image;

  // CMS field labels feed the chip-group aria names (trimmed at the hint "(").
  const categoryGroup = (c?.fields.find((f) => f.key === "category")?.label ?? c?.label ?? "").split(" (")[0];
  const tagGroup = (c?.fields.find((f) => f.key === "tags")?.label ?? c?.label ?? "").split(" (")[0];

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: c?.label ?? HERO.crumb,
    description: c?.description,
    numberOfItems: entries.length,
    itemListElement: entries.map((e, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: e.title,
      url: `${site.url}/recipes/${e.slug}`,
    })),
  };

  return (
    <>
      <JsonLd data={itemListSchema} />

      {/* ── סקשן 23 · HOOK — full-bleed-hero (ImageHero, real dish photo) ── */}
      {hero && heroImage ? (
        <ImageHero
          image={heroImage}
          alt={hero.imageAlt || hero.title}
          crumbs={[{ label: HERO.crumb, href: "/recipes" }]}
          eyebrow={HERO.eyebrow}
          title={HERO.title}
          lead={HERO.lead}
        />
      ) : (
        // honest no-raster twin: the warm sand cover, no broken src ever
        <Section tone="sand" border containerClassName="pt-28 md:pt-32">
          <div className="mb-6">
            <Breadcrumbs items={[{ label: HERO.crumb, href: "/recipes" }]} />
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-[0.7rem] leading-none text-gold" aria-hidden>◆</span>
            <span className="text-xs font-bold tracking-eyebrow text-gold-ink">{HERO.eyebrow}</span>
          </div>
          <SplitText
            as="h1"
            autoplay
            text={HERO.title}
            className="mt-5 font-serif font-black leading-[1.05] text-navy"
            style={{ fontSize: "var(--text-hero)" }}
          />
          <p className="mt-6 max-w-[52ch] text-lg leading-relaxed text-muted">{HERO.lead}</p>
        </Section>
      )}

      {/* ── סקשן 24 · PROOF — bento-grid (the CMS archive + sage filter chips) ──
          Warm-paper band, minimum chrome: the food carries the section. */}
      <section id="archive" className="scroll-mt-28 bg-bg">
        <Container width="wide" className="py-16 sm:py-20 md:py-32">
          <RecipesArchive
            entries={entries}
            labels={{
              all: ARCHIVE.all,
              countChip: ARCHIVE.countChip,
              empty: ARCHIVE.empty,
              list: c?.label ?? HERO.crumb,
              categoryGroup,
              tagGroup,
            }}
          />
        </Container>
      </section>

      {/* ── סקשן 25 · RESOLUTION — the archive closes on the free intro call ── */}
      <section className="relative overflow-hidden bg-blush">
        <div aria-hidden className="grain-overlay" />
        <Container width="standard" className="relative py-16 sm:py-20 md:py-32">
          <MOrchestrate className="mx-auto max-w-[680px] text-center">
            <MItem>
              <div className="flex items-center justify-center gap-2.5">
                <span className="text-[0.65rem] leading-none text-gold" aria-hidden>◆</span>
                <span className="tracking-eyebrow text-xs font-bold text-gold-ink">{CLOSING.eyebrow}</span>
              </div>
            </MItem>
            <MItem>
              <SplitText
                as="h2"
                text={CLOSING.title}
                className="mt-5 font-serif font-black leading-[1.1] text-navy"
                style={{ fontSize: "var(--text-section)" }}
              />
            </MItem>
            <MItem as="p" className="mx-auto mt-6 max-w-[54ch] text-lg leading-relaxed text-muted">
              {CLOSING.body}
            </MItem>
            <MItem className="mt-9">
              <Link
                href={CLOSING.primaryHref}
                data-cta="recipes-to-coaching"
                className="btn-chamfer inline-flex items-center rounded-[6px] bg-gold px-8 py-4 text-base font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
              >
                {CLOSING.primary}
              </Link>
              <p className="mt-3 text-sm font-semibold text-muted">{CLOSING.note}</p>
            </MItem>
          </MOrchestrate>
        </Container>
      </section>
    </>
  );
}
