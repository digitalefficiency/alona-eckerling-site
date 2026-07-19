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
import { SpotlightCard } from "@/components/section/SpotlightCard";
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
  ctaLead: "רוצה להתחיל בבית?",
  cta: "הכירי את חוברת «הקול השפוי» ←",
  ctaHref: "/sane-voice",
};

// COPY: ### סקשן 24 · BentoGrid masonry (CMS) + צ'יפי-סינון
// (the honest count chip is section 23's «צ'יפ-ספירה כנה», repeated here by the
//  section-24 kicker rule; chip sets themselves derive from the CMS fields)
const ARCHIVE = {
  countChip: "בערך 30 מתכונים · מתכון חדש כל שבוע",
  all: "הכול",
  empty: "עוד מתכונים בקטגוריה הזו בדרך. מתכון חדש כל שבוע.",
};

// COPY: ### סקשן 25 · SpotlightCard (מגנט → החוברת)
const MAGNET = {
  eyebrow: "החוברת",
  title: "קחי את המטבח הזה הביתה",
  body: "כל מה שגללת פה הוא רק טעימה. «הקול השפוי» היא חוברת המתכונים המלאה שלי: אוכל אמיתי, בלי חוקים מיותרים, בדרך שמתאימה לחיים שלך.",
  community: "ועם הרשימה השפויה את בפנים: מתכון חדש, טיפ שקט, וקהילה של בנות שמדברות אותך.",
  primary: "קבלי את חוברת המתכונים",
  price: "149 ₪",
  primaryHref: "/sane-voice",
  secondary: "הצטרפי לרשימה השפויה, חינם",
  secondaryHref: "/contact",
  // the booklet's real name + its role line, reused for the typographic cover
  // (the REAL printed cover is a pending client asset — until it arrives the
  // card shows this honest typographic edition, never a fabricated photo)
  coverName: "הקול השפוי",
  coverSub: "חוברת המתכונים",
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
          ctas={[{ label: HERO.cta, href: HERO.ctaHref, variant: "ghost", dataCta: "recipes-hero-booklet" }]}
          ctaNote={HERO.ctaLead}
        />
      ) : (
        // honest no-raster twin: the warm sand cover, no broken src ever
        <Section tone="sand" border containerClassName="pt-28 md:pt-32">
          <div className="mb-6">
            <Breadcrumbs items={[{ label: HERO.crumb, href: "/recipes" }]} />
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-[0.7rem] leading-none text-gold" aria-hidden>◆</span>
            <span className="text-xs font-bold tracking-[.2em] text-gold-ink">{HERO.eyebrow}</span>
          </div>
          <SplitText
            as="h1"
            text={HERO.title}
            className="mt-5 font-serif font-black leading-[1.05] text-navy"
            style={{ fontSize: "var(--text-hero)" }}
          />
          <p className="mt-6 max-w-[52ch] text-lg leading-relaxed text-muted">{HERO.lead}</p>
          <p className="mt-8 text-sm text-muted">{HERO.ctaLead}</p>
          <Link
            href={HERO.ctaHref}
            data-cta="recipes-hero-booklet"
            className="btn-chamfer mt-3 inline-flex items-center rounded-[6px] border border-navy/20 px-7 py-3.5 text-[0.95rem] font-bold text-navy-700 transition hover:border-gold hover:text-gold-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-sand"
          >
            {HERO.cta}
          </Link>
        </Section>
      )}

      {/* ── סקשן 24 · PROOF — bento-grid (the CMS archive + sage filter chips) ──
          Warm-paper band, minimum chrome: the food carries the section. */}
      <section id="archive" className="scroll-mt-28 bg-bg">
        <Container width="wide" className="py-14 sm:py-16 md:py-24">
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

      {/* ── סקשן 25 · RESOLUTION — spotlight-card (the blush booklet magnet) ── */}
      <section className="relative overflow-hidden bg-blush">
        <div aria-hidden className="grain-overlay" />
        <Container width="standard" className="relative py-16 sm:py-20 md:py-28">
          <SpotlightCard className="!border-line !bg-sand !text-ink shadow-[var(--elevation-2)]">
            <MOrchestrate className="grid items-center gap-10 md:grid-cols-[1fr_minmax(0,280px)]">
              <div>
                <MItem as="p" className="flex items-center gap-2.5">
                  <span className="text-[0.65rem] leading-none text-gold" aria-hidden>◆</span>
                  <span className="text-xs font-bold tracking-[.18em] text-gold-ink">{MAGNET.eyebrow}</span>
                </MItem>
                <MItem>
                  <RevealHeading
                    as="h2"
                    text={MAGNET.title}
                    className="mt-4 font-serif font-black leading-[1.1] text-navy"
                    style={{ fontSize: "clamp(1.9rem, 4vw, 2.9rem)" }}
                  />
                </MItem>
                <MItem as="p" className="mt-4 max-w-[62ch] text-[1.05rem] leading-relaxed text-muted">
                  {MAGNET.body}
                </MItem>
                <MItem as="p" className="mt-3 max-w-[62ch] text-[0.95rem] leading-relaxed text-muted">
                  {MAGNET.community}
                </MItem>
                <MItem className="mt-7 flex flex-wrap items-center gap-3">
                  <Link
                    href={MAGNET.primaryHref}
                    data-cta="recipes-magnet-booklet"
                    className="inline-flex items-center gap-2.5 btn-chamfer rounded-[6px] bg-gold px-7 py-3.5 text-[0.95rem] font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-sand"
                  >
                    {MAGNET.primary}
                    {/* the price as a chip-skew, not a pill — one geometry per button */}
                    <span className="chip-skew inline-block rounded-[4px] bg-white/20 px-2.5 py-0.5 text-[0.8rem] font-bold">
                      <span>{MAGNET.price}</span>
                    </span>
                  </Link>
                  <Link
                    href={MAGNET.secondaryHref}
                    data-cta="recipes-magnet-list"
                    className="btn-chamfer inline-flex items-center rounded-[6px] border border-navy/20 px-6 py-3.5 text-[0.95rem] font-bold text-navy-700 transition hover:border-gold hover:text-gold-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-sand"
                  >
                    {MAGNET.secondary}
                  </Link>
                </MItem>
              </div>

              {/* the honest typographic booklet cover (real printed cover =
                  pending client asset; a cover photo is never fabricated) —
                  the generated booklet-OBJECT still sits behind it as a quiet
                  aria-hidden backdrop under a blush veil, never as the cover */}
              <MItem variants={scaleSoft} className="mx-auto w-full max-w-[260px]">
                <div
                  className="-rotate-2 rounded-[14px] border border-line bg-card p-5 shadow-[var(--elevation-2)]"
                  style={{ aspectRatio: "var(--aspect-portrait)" }}
                >
                  <div className="relative flex h-full flex-col items-center justify-center gap-3 overflow-hidden rounded-[10px] px-4 text-center">
                    <div aria-hidden className="absolute inset-0">
                      <Image
                        src="/media/generated/26-booklet-object.jpg"
                        alt=""
                        fill
                        sizes="260px"
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-blush/85" />
                    </div>
                    <span className="relative text-[0.7rem] font-bold tracking-[.22em] text-muted">{MAGNET.coverSub}</span>
                    <span className="relative font-serif text-3xl font-black leading-tight text-navy">{MAGNET.coverName}</span>
                    <span aria-hidden className="relative h-[3px] w-12 rounded-full bg-rose" />
                  </div>
                </div>
              </MItem>
            </MOrchestrate>
          </SpotlightCard>
        </Container>
      </section>
    </>
  );
}
