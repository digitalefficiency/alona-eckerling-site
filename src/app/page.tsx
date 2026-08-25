import Link from "next/link";
import Image, { getImageProps } from "next/image";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { SeamShape } from "@/components/layout/SeamShape";
import { SectionHeading } from "@/components/SectionHeading";
import { MOrchestrate, MItem } from "@/components/motion/MOrchestrate";
import { MStagger } from "@/components/motion/MStagger";
import { MScrollScene } from "@/components/motion/MScrollScene";
import { DrawnRule } from "@/components/motion/DrawnRule";
import { ProofRecipes } from "@/components/ProofRecipes";
import { RevealHeading } from "@/components/motion/RevealHeading";
import { irisDiamond, slideIn } from "@/lib/motion-variants";
import { MMagnetic } from "@/components/motion/MMagnetic";
import { SplitText } from "@/components/motion/SplitText";
import { StickyScroll } from "@/components/motion/StickyScroll";
import { Comparison } from "@/components/section/Comparison";
import { DishRibbon } from "@/components/section/DishRibbon";
import { ResponsePromise } from "@/components/trust/ResponsePromise";
import { ContactLeadForm } from "@/components/ContactLeadForm";
import { JsonLd } from "@/components/JsonLd";
import { professionalService } from "@/lib/schema-presets";
import { site, services } from "@/lib/site";
import { socialWall } from "@/lib/settings";
import { SocialLinks } from "@/components/SocialLinks";
import { listDocs, type CollectionEntry } from "@/lib/collections";
import { getPublishedPageRequiring, sectionPayload } from "@/lib/sections/source";
import type {
  HomeHeroPayload, HomeGuidePayload, HomeRibbonPayload, HomePlanPayload,
  HomeProofPayload, HomeStakesPayload, HomeArticlesPayload, HomeSuccessPayload,
  HomeCtaPayload,
} from "@/lib/sections/payloads";

// ============================================================================
// בית — composed from plan/sections/01..08 (beats: HOOK→TENSION→GUIDE→PLAN→
// PROOF→STAKES→SUCCESS→RESOLUTION). Every visible string is read from the
// page's section document (content/pages/home.json or Supabase) and edited
// from the desk, with NO hardcoded fallback — every section below asserts the
// same document, so a missing document takes the whole page down regardless,
// and a copy fallback would just be a second source of truth drifting from
// desk edits. What stays in this file is only what the editor must not own:
// the room stills, the rung media, the scroll choreography.
// ============================================================================

// COPY: ### סקשן 1 · ImageHero + MOrchestrate
// The hero photograph — Alona herself, standing in her own clinic (Rom,
// 2026-08-24, approved on screen): a PIXEL-TRUE composite, her real studio
// cutout over her real clinic photo (both her own, materials/drop), assembled
// in PIL — the wall extended rightward from a sampled clean column, and NO AI
// re-rendering of her face or the room (an earlier nano-banana take was
// rejected for exactly that). It returns the hero to a full-bleed room with
// the words on the logical-side scrim, replacing the split-band pancakes
// frame (cl-115, which stays in the library). The PATH is art direction and
// stays here; the photograph's description (imageAlt) is hers, in the document.
// The `-real` suffix is deliberate: the file replaced an earlier AI take under
// the old name, and the image optimizer caches by URL — the same name would
// keep serving the stale pixels.
// Width/a11y facts that survive: the trust line's license clause is
// `hidden sm:inline` (shown by width, never reworded); the «שיחת היכרות חינם»
// sub-line and the «גללי» cue stay retired (fields left the document
// 2026-08-12).
const HERO_IMAGE = "/media/generated/01-hero-clinic-real.jpg";
// The phone stage (Rom, 2026-08-24, two calls: «תכווץ את התמונה כדי שנראה
// יותר», then «זום אאוט»): a 2:3 SIBLING composite from the same two masters,
// zoomed OUT — the clinic photo at near-native scale, FULL height (lace lamp
// to floor: window, desk, diplomas, body-composition scale), she stands
// smaller at the left third. Art-directed via <picture>, not object-position:
// a wide 16:9 frame simply does not hold a full room in a phone-width slice.
// -full: round 6 (Rom: «בוא נכניס שהתמונה תתפוס את הכל») — TRUE full-bleed:
// the clinic photo COVERS the whole frame, every pixel real (no wall/floor
// extensions), she stands full-height at the left, shin-crop at the frame
// edge. The frame is banded so the words land on the room's own quiet
// surfaces: H1 on the white wall, lede+CTA over the smooth grey floor — the
// room itself is the contrast layer, and the mobile scrim is UNMOUNTED.
// The name versions with the composition: the optimizer caches by URL.
const HERO_IMAGE_TALL = "/media/generated/01-hero-clinic-full.jpg";

// COPY: ### סקשן 3 · FeatureRow + BioCard + CredentialStrip
// §03 room background — the desk the dossier spreads on (generated per plan
// layer 8: top-down desk, blank notebook, palette-locked linens, faceless).
const GUIDE_BG = "/media/generated/03-guide-desk.jpg";
// REAL portrait — never a generated face, never stock. Swapped 2026-08-24
// (Rom: «תשתמש בתמונה הזאת במקום התמונה שרשום אלונה אקרלינג»): the kitchen
// bowl frame (cl-101, stays registered) gave way to her Stanley-tumbler
// selfie (cl-117) — face-forward, present-day, the everyday-hydration beat.
const GUIDE_PORTRAIT = "/media/client/alona/alona-stanley.jpg";

// COPY: ### סקשן 3 — the dossier's words live in the page document. Round 2
// (Rom, 2026-08-12): her voice moved under the title as the standfirst
// («תכניס את הפסקה מתחת לכותרת, כתת כותרת»), and the four mechanism labels
// became one first-person hello («כמה משפטים בגוף ראשון, משהו כמו היי אני
// אלונה») — same approved content (דיאטנית שמבשלת · נבנה סביב השבוע שלך ·
// מדע עדכני · ליווי אחת-על-אחת · בגובה העיניים), woven into her voice instead
// of an index; the mechanism field left the document with the tabs. What stays
// here is the desk still and the portrait path — art direction, not her words.

// COPY: ### סקשן 4 · ProcessTimeline (3 שלבים) — the ladder's words live in
// the page document; the rung stills below are art direction and stay.

// Rung media (rungs 01–02 only; rung 03 keeps the designed sage panel so the ladder
// ends on the site's own calm). 01 stays the generated still — decorative, alt="".
// 02 is now a REAL dish from her kitchen (one pot for the week IS that rung's story),
// so it earns a real alt: informative, factual, straight off the recipe's own card.
const PLAN_MEDIA: readonly { src: string; alt: string }[] = [
  // one still per rung, each showing that rung's own moment (Rom 2026-07-20:
  // "תמונות אחרות שמתאימות לכרטיסיות"): the first conversation · the page the
  // plan gets written on · the message away, beside a real weeknight dinner.
  { src: "/media/generated/04-rung-01-first-call.jpg", alt: "" },
  { src: "/media/generated/04-rung-02-plan-page.jpg", alt: "" },
  { src: "/media/generated/04-rung-03-message-away.jpg", alt: "" },
];

// COPY: ### סקשן 5 · RecipeCard grid — first person (Rom, 2026-08-12): the
// section speaks in her voice, like the hello above it — «אני», not «היא».
// The honest dark slots (testimonials + media logos) came off 2026-08-12
// (Rom: «במקום המקום של ההמלצות תעשה מקום ל-3 מאמרים») — replaced by the
// articles study, and their fields left the document with them. The INTEGRITY
// rule is untouched: no invented testimonials, and the testimonial capability
// (consent gate) stays intact for another page when real quotes exist.

// COPY: ### סקשן 6b — אינדקס המאמרים (2026-08-12): שלושה סלוטים, נמשכים חיים
// מאוסף המאמרים (כותרת + תקציר מה-frontmatter שלהם) — כשיש פחות משלושה,
// מוצגים רק האמיתיים; הסלוט השלישי מופיע כשמאמר שלישי מתפרסם. אפס המצאה.
// The strip's own words (masthead, lead, the two links) live in the document.

// COPY: ### סקשן 5 — רצועת המנות (הרחבה של ביט ה-PROOF, 2026-07-26)
// המנות אמיתיות ומצולמות על ידה; נבחרו לעוצמה ויזואלית באריח אחיד (MEDIA-PLAN §2)
// — פריימים דהויים (מרק בקערת זכוכית, כוסות פרפה על שיש אפור) נפסלו בכוונה.
// The band's words AND its default tile set live in the page document (the
// social wall in settings still takes the strip over when the desk fills it).

// COPY: ### סקשן 6 · Comparison + צעד חינם צמוד

// COPY: ### סקשן 7 · חצי-קומפוזיציה: still-ערב + PullQuote (רעש→שקט)

// COPY: ### סקשן 8 · ContactLeadForm (פאנל נייבי #lead)

// One neutral meta line at most (mirrors the archive's tileMeta): a real prep
// time, then the first diet tag — never invented numbers (YMYL).
function recipeMeta(e: CollectionEntry): string | undefined {
  const parts: string[] = [];
  const prep = e.data.prepTime ? String(e.data.prepTime) : "";
  if (/\d/.test(prep)) parts.push(prep);
  if (e.tags[0]) parts.push(e.tags[0]);
  return parts.length ? parts.slice(0, 2).join(" · ") : undefined;
}

export default async function HomePage() {
  // ONE read for the whole page. Every section below takes its words from here;
  // what stays in this file is only what the editor must not own — the room
  // stills, the rung media, the scroll choreography.
  const page = await getPublishedPageRequiring("", ["hero", "guide", "ribbon", "plan", "articles", "proof", "stakes", "success", "cta"]);
  const HERO = sectionPayload<HomeHeroPayload>(page, "hero");
  const GUIDE = sectionPayload<HomeGuidePayload>(page, "guide");
  const RIBBON = sectionPayload<HomeRibbonPayload>(page, "ribbon");
  const PLAN = sectionPayload<HomePlanPayload>(page, "plan");
  const PROOF = sectionPayload<HomeProofPayload>(page, "proof");
  const STAKES = sectionPayload<HomeStakesPayload>(page, "stakes");
  const ARTICLES = sectionPayload<HomeArticlesPayload>(page, "articles");
  const SUCCESS = sectionPayload<HomeSuccessPayload>(page, "success");
  const CTA = sectionPayload<HomeCtaPayload>(page, "cta");

  // The ribbon's tiles: client-edited set when she has filled one from /admin,
  // otherwise the authored default. An empty settings file therefore renders the
  // page exactly as designed rather than an empty band, so she can take the strip
  // over whenever she likes without being required to.
  //
  // A tile without its own post URL links to the PROFILE, never to a guessed
  // permalink — we do not have per-post links yet and inventing them would send
  // readers to 404s under her name.
  const instagram = site.socials.find((s) => s.network === "instagram")?.url;
  const ribbonTiles = (socialWall.length
    ? socialWall.map((t) => ({ src: t.image, alt: t.imageAlt ?? "", href: t.href || instagram }))
    : (RIBBON?.tiles ?? []).map((t) => ({ ...t, href: instagram })));
  // Real recipe cards from the CMS (proof-of-craft) — real client photography
  // only. The FULL pool goes to the client grid, which shows a random trio per
  // visit (Rom's call 2026-07-19: no "newest" highlight, fresh three each time).
  const recipesPool = listDocs("recipes")
    .filter((e): e is CollectionEntry & { image: string } => typeof e.image === "string" && e.image.length > 0)
    .map((e) => ({
      slug: e.slug,
      title: e.title,
      image: e.image,
      imageAlt: e.imageAlt || e.title,
      meta: recipeMeta(e),
      category:
        typeof e.data.category === "string" && e.data.category.length > 0
          ? e.data.category
          : undefined,
    }));

  // Up to three real articles for the §05 index — title + its own frontmatter
  // description, nothing invented; the strip renders only when at least one
  // article exists, and the third slot fills itself on publish.
  const articlesPool = listDocs("articles").slice(0, 3).map((e) => ({
    slug: e.slug,
    title: e.title,
    description: e.description,
    tag: e.tags[0],
  }));

  return (
    <>
      {/* structured identity for the front door (GEO/SEO) — same builder as /contact */}
      <JsonLd data={professionalService(site, services)} />
      {/* ── 01 · HOOK — «הקליניקה» (full-bleed still, Rom's call 2026-08-24,
             approved on screen): Alona standing in her own clinic IS the room —
             a pixel-true full-bleed still (see HERO_IMAGE above), the words
             keeping their block-axis choreography on the logical-side scrim
             (paper solid under the text column, opening into the room). The H1
             keeps the split-hero's re-fit cap (3.3rem): over a photograph the
             display lock's 4.75rem wraps the two written lines into four. The
             image is the LCP: eager + fetchPriority, and deliberately NOT
             `priority` — a priority preload rides the RSC payload and replays
             cross-route (the measured trap; HeroFilm's contract, kept here).
             The «שיחת היכרות חינם» sub-line and the «גללי» cue stay retired
             (their fields left the document 2026-08-12). Header safety is
             DEFAULT-ON: the white nav treatment requires an explicit
             [data-dark-hero], so this light hero can never ship an invisible
             nav. ── */}
      {HERO && (
      <section className="relative isolate flex min-h-[92svh] items-end overflow-hidden bg-bg lg:items-center" style={{ "--grade-tint": "var(--hour-morning)" } as React.CSSProperties}>
        {/* the room — her clinic, graded by the one-camera system (tint + grain).
            TWO frames of the same room, art-directed with <picture> (the safe
            pattern for eager hero pixels — no preload hint to leak cross-route):
            lg+ gets the wide 16:9 spread, phones get the 2:3 stage where she is
            smaller and the whole room shows. Each frame keeps ONE objectPosition
            number (35% tall / 5% wide) — a drifted crop is corrected there,
            never by regenerating. sizes are per-frame: the wide one covers the
            section HEIGHT on desktop (100vw is enough there), the tall one runs
            ~1.5x the phone viewport width for the same reason, so neither ever
            upscales a small variant into mush again. Both eager + fetchpriority
            high, deliberately NOT `priority` (the RSC preload-replay trap). */}
        <div className="absolute inset-0">
          {(() => {
            const { props: wide } = getImageProps({
              src: HERO_IMAGE, alt: "", width: 2400, height: 1350, sizes: "100vw",
            });
            const { props: tall } = getImageProps({
              src: HERO_IMAGE_TALL, alt: "", width: 1400, height: 2100, sizes: "150vw",
            });
            return (
              <picture>
                <source media="(min-width: 1024px)" srcSet={wide.srcSet} sizes={wide.sizes} />
                {/* eslint-disable-next-line jsx-a11y/alt-text -- alt spread from tall props below */}
                <img
                  {...tall}
                  alt={HERO.imageAlt}
                  loading="eager"
                  fetchPriority="high"
                  className="absolute inset-0 h-full w-full object-cover [object-position:35%_center] lg:[object-position:5%_center]"
                />
              </picture>
            );
          })()}
          <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "var(--grade-tint)" }} />
          <div aria-hidden className="grain-overlay" style={{ "--grain-opacity": "0.05" } as React.CSSProperties} />
        </div>
        {/* the scrim is a DESKTOP instrument now — below lg the photo owns the
            whole stage (round 6) and the words read off the room's own quiet
            surfaces; no veil, no seam. */}
        <div aria-hidden className="hidden lg:block hero-scrim" />
        {/* soft-curve seam — the cream ground crests up into the clinic, a
            shaped hand-off into the dossier, not a hard photo cut */}
        <SeamShape variant="curve-up" />
        <Container width="wide" className="relative z-10 w-full pb-16 pt-44 sm:pt-56 md:pb-24 lg:py-24 lg:pb-32">
          {/* ONE orchestrator, same word choreography as ever — block-axis steps */}
          <MOrchestrate className="max-w-[620px]">
            {/* below lg the eyebrow rides the photo (wall/diploma edge) — the
                gold-ink weight carries it there; lg+ returns to muted on paper */}
            <MItem as="p" className="flex items-center gap-2.5 text-[13px] font-bold tracking-eyebrow text-gold-ink lg:text-muted">
              <span className="text-[0.65rem] leading-none text-gold" aria-hidden>◆</span>
              {HERO.kicker}
            </MItem>
            {/* autoplay (LCP): the H1's masked rise runs as pure CSS from first
                paint — hydration/IO arming was measured pushing LCP by seconds */}
            <RevealHeading
              as="h1"
              text={HERO.title}
              autoplay
              // the rose ANSWERS the question — a hand-drawn rule under the
              // promise, after the line lands («חוט ואור» move 4)
              accentText={HERO.titleAccent}
              className="mt-5 font-serif font-black leading-[1.12] text-navy"
              style={{ fontSize: "clamp(2.1rem, 5vw, 3.3rem)" }}
            />
            {/* below lg the lede+CTA cluster rides ONE opaque sheet (the §03
                sheet language: one radius, zero blur) — the full-bleed room
                stays untouched around it and no veil ever crosses the photo.
                lg+ the sheet dissolves: the side scrim already owns contrast. */}
            <div className="mt-6 rounded-2xl bg-bg p-5 pt-1 lg:mt-0 lg:rounded-none lg:bg-transparent lg:p-0">
            <MItem as="p" className="mt-4 max-w-[54ch] text-lg leading-[1.7] text-ink lg:mt-7">
              {HERO.lede}
            </MItem>
            <MItem className="mt-8 lg:mt-10">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-4">
                {/* magnet 1 of the page's pair («חוט ואור» move 6; ≤2 budget enforced by MMagnetic) */}
                <MMagnetic>
                <Link
                  href="#lead"
                  data-cta="hero-primary"
                  className="btn-chamfer rounded-[6px] bg-gold px-8 py-4 text-base font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
                >
                  {HERO.ctaPrimary}
                </Link>
                </MMagnetic>
                <Link
                  href="/about"
                  data-cta="hero-credential"
                  className="inline-flex items-center rounded-full border border-line bg-sand px-4 py-2.5 text-sm font-semibold text-navy transition hover:border-gold/60"
                >
                  {/* one span = one flex item, so the inline separator keeps its space */}
                  <span>
                    {HERO.trustToken}
                    <span className="hidden sm:inline">{HERO.trustTokenLicense}</span>
                  </span>
                </Link>
              </div>
            </MItem>
            <MItem className="mt-7">
              <Link
                href="/recipes"
                data-cta="hero-recipes"
                className="text-[0.95rem] font-medium text-muted underline decoration-rose decoration-2 underline-offset-4 transition hover:text-navy"
              >
                {HERO.ctaRecipes}
              </Link>
            </MItem>
            </div>
          </MOrchestrate>
        </Container>
      </section>
      )}

      {/* ── 02 · TENSION — THE FILM IS GONE (Rom, 2026-08-11: «תוריד את הסקשן של
             סרט הגלילה»). The pinned «בניית המנה» scroll-film (SequenceFilm, 14
             frames, noise-chips → turn → gold-frame quiet) came off the page with
             its 420vh runway. Its copy stays in COPY.md §2 and the frames stay in
             /media/generated should it ever return; the component itself remains
             in components/ as reference, unmounted. The hero's curve-up seam now
             hands straight into the dossier, whose room-edges-top fade was already
             built for a soft entry. ── */}

      {/* ── 03 · GUIDE — «הדוסייה על השולחן», re-set as an editorial spread
             (2026-08-11, the design-language pass): hierarchy from typography,
             hairlines and space — «כמעט בלי קופסאות». The desk-photo room stays
             (md+ via MScrollScene); the five boxed surfaces that used to stack in
             the text column (heading strip, empathy card, credentials card, tab
             chips, areas slip — three foreign radii, five backdrop-blurs)
             collapsed into ONE opaque sheet, md+ only: on mobile there is no
             photo behind, so the type sits straight on the page paper with no
             box at all. Inside the sheet: a serif pull-quote opening in her
             voice, one ruled mechanism band, a hairline credentials ledger and a
             two-column areas list — one radius (16), one elevation, zero inner
             chrome, zero blur. The portrait dropped its scrapbook dress (tilt,
             ◆ pin, gold double-frame, overlaid caption strip): it stands
             straight in a hairline frame and carries authority by size and
             stillness, with a magazine figcaption BELOW the pixels — so the AA
             text-never-on-photo rule is satisfied by construction.
             id="guide" stays as an in-page anchor (it was the retired film's
             escape-hatch target); the
             global scroll-padding-top of 6rem clears the fixed header, so no
             per-section scroll-mt is needed here. ── */}
      {GUIDE && (
      <section id="guide" className="relative">
        <MScrollScene
          amplitude={4}
          mediaClassName="hidden md:block"
          media={
            <>
              {/* quality 85, was 60 — this is a full-bleed room photo, and 60 was
                  visibly soft on the wood grain and the notebook paper. */}
              <Image src={GUIDE_BG} alt="" fill sizes="100vw" quality={85} className="object-cover" />
              <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "var(--grade-tint)" }} />
              {/* mid-page material diet */}
              <div aria-hidden className="grain-overlay" style={{ "--grain-opacity": "0.035" } as React.CSSProperties} />
              {/* no paper wash over the room (Rom, 2026-07-29) — the ONE sheet
                  below pays the whole AA budget; --grade-tint deepens (10% navy),
                  grain stays 0.035 */}
              {/* top fade only — the seam shape carries the bottom hand-off */}
              <div aria-hidden className="room-edges-top" />
            </>
          }
        >
          <Container width="wide" className="py-16 sm:py-20 md:py-32">
            {/* ONE sheet over the room — the only surface in the section. Its
                bg-bg/95 carries the entire AA budget over the desk photo;
                nothing inside it wears its own border-box. On mobile (no photo
                behind, mediaClassName hides the room) there is no box at all. */}
            <MOrchestrate className="md:rounded-[16px] md:bg-bg/95 md:p-10 md:shadow-[var(--elevation-1)] lg:p-14">
              <MItem>
                {/* centered masthead (Rom, 2026-08-12) — her voice is the
                    subtitle, set as a SplitText so the rose rule can DRAW
                    itself under «להבין מה באמת קורה בגוף שלנו» (base state
                    drawn — the same static-twin contract as every accent) */}
                <SectionHeading eyebrow={GUIDE.kicker} title={GUIDE.title} accent={GUIDE.titleAccent} align="center" />
                <SplitText
                  as="p"
                  text={GUIDE.empathy}
                  accentText={GUIDE.empathyAccent}
                  className="mx-auto mt-4 max-w-[60ch] text-center text-[1.08rem] leading-relaxed text-muted"
                />
              </MItem>
              <div className="mt-12 grid items-start gap-x-12 gap-y-10 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-x-16">
              {/* the portrait — an editorial figure on the reading edge (RTL
                  inline-start = right), asymmetric against the wider text plate.
                  Real photo (2026-07-25, MEDIA-PLAN §3, cl-101), straightened:
                  the tilt, the ◆ pin, the gold double-frame and the overlaid
                  caption strip all retired with the design-language pass — the
                  photo carries authority by size and stillness, and the caption
                  sits BELOW the pixels as a ruled magazine figcaption. */}
              <MItem className="mx-auto w-full max-w-[440px] md:max-w-none md:self-center">
                <figure>
                  <div
                    className="frame-double relative aspect-[4/5] overflow-hidden rounded-[16px] bg-sand"
                    style={{ "--frame-gap": "7px" } as React.CSSProperties}
                  >
                    <Image
                      src={GUIDE_PORTRAIT}
                      alt={GUIDE.portraitAlt}
                      fill
                      sizes="(max-width: 768px) 88vw, 40vw"
                      className="object-cover"
                    />
                    <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "var(--grade-tint)" }} />
                    <div aria-hidden className="grain-overlay" style={{ "--grain-opacity": "0.035" } as React.CSSProperties} />
                  </div>
                  <figcaption className="mt-4 border-t border-line pt-3">
                    <div className="font-serif text-2xl font-bold text-navy">{GUIDE.name}</div>
                    <div className="mt-1 text-xs font-bold tracking-eyebrow text-muted">{GUIDE.role}</div>
                  </figcaption>
                </figure>
              </MItem>
              {/* the record — authority AFTER her voice (which now leads the
                  heading); one entrance verb for the whole room (block-axis
                  settle) */}
              <div className="flex flex-col">
                {/* her hello — first person, one breath, inside the ruled band
                    (Rom, 2026-08-12: sentences instead of the mechanism index;
                    the four labels live on inside the sentences) */}
                <MItem>
                  <div className="border-y border-line py-6">
                    <p className="max-w-[58ch] text-lg leading-[1.75] text-ink">
                      <span className="font-serif text-xl font-bold text-navy">{GUIDE.introHello} </span>
                      {GUIDE.intro}
                    </p>
                  </div>
                </MItem>
                {/* the record — a hairline ledger, each row a quiet fact
                    (RecognitionBadges chips retired from this room) */}
                <MItem className="mt-8">
                  <ul>
                    {GUIDE.credentials.map((c) => (
                      <li
                        key={c}
                        className="flex items-center gap-3 border-b border-line/70 py-2.5 text-[13px] font-bold tracking-eyebrow text-muted last:border-0"
                      >
                        <span aria-hidden className="h-[3px] w-3 rounded-full bg-rose" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </MItem>
                {/* areas of care — quiet reference in a two-column list; the
                    YMYL note under it is a guardrail, not decoration */}
                <MItem className="mt-8">
                  <p className="flex items-center gap-2 text-xs font-bold tracking-eyebrow text-gold-ink">
                    <span className="text-[0.6rem] leading-none" aria-hidden>◆</span>
                    {GUIDE.areasLabel}
                  </p>
                  <ul className="mt-3 grid gap-x-8 gap-y-2 sm:grid-cols-2">
                    {GUIDE.areas.map((a) => (
                      <li key={a} className="flex items-center gap-3 text-sm font-semibold text-navy">
                        <span aria-hidden className="h-[3px] w-3 rounded-full bg-rose" />
                        {a}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3.5 max-w-[58ch] text-sm leading-relaxed text-muted">{GUIDE.areasNote}</p>
                </MItem>
                <MItem className="mt-9">
                  <Link
                    href="/coaching"
                    data-cta="guide-to-coaching"
                    className="font-bold text-gold-ink underline-offset-4 transition hover:underline"
                  >
                    {GUIDE.cta}
                  </Link>
                </MItem>
              </div>
              </div>
            </MOrchestrate>
          </Container>
        </MScrollScene>
        {/* soft-curve seam into the plan (crest — opposite the film's trough) */}
        <SeamShape variant="curve-up" />
      </section>
      )}

      {/* ── 03b · the dish ribbon — an EXTENSION of §03's GUIDE beat, not a new section.
             §03 answers "who is she"; the ribbon answers it in her own material —
             "a dietitian who really cooks" stops being a claim in a credential chip
             and becomes a wall of the food she actually made. Placed here (rather
             than beside the recipe grid at §05) so the proof-of-craft lands while
             the reader is still meeting her. The narrative chain is untouched: no
             new beat, no arrives/leaves contract rewritten. Archetype: marquee —
             adjacent to overlap-layered (§03) and sticky-scroll (§04), both
             distinct, and §21 holds marquee on /about where the rule is per-page. ── */}
      {RIBBON && (
      <div className="border-y border-line bg-card py-16 sm:py-20 md:py-24">
        <Container width="wide">
          <p className="mb-7 flex items-center justify-center gap-2.5 text-center">
            <span className="text-[0.7rem] leading-none text-gold" aria-hidden>◆</span>
            <span className="text-xs font-bold tracking-eyebrow text-gold-ink">{RIBBON.kicker}</span>
          </p>
        </Container>
        <DishRibbon tiles={ribbonTiles} linkHint={RIBBON.linkHint} />
        <Container width="wide">
          <p className="mt-7 text-center text-sm text-muted">{RIBBON.note}</p>
          <p className="mx-auto mt-3 max-w-[56ch] text-center text-sm leading-relaxed text-muted">
            {RIBBON.follow}
          </p>
          {/* the follow ask sits with the proof, where she has just earned it */}
          <div className="mt-7 flex justify-center">
            <SocialLinks showHandle />
          </div>
        </Container>
      </div>
      )}

      {/* ── 04 · PLAN — sticky-scroll ladder: three named rungs climb from a free call
             to the support that stays. Rungs 01–02 carry the generated stills (the
             conversation · the weekly plan, plan layer 8); rung 03 keeps the designed
             sage panel so the ladder ends on the site's own calm. ── */}
      {PLAN && (
      <div className="relative bg-bg">
        {/* «חדר התכנון»: the weekly-plan still becomes the room behind the ladder
            (desktop only — mobile keeps clean sand, saving decode where we measure).
            A heavy sand scrim keeps the room a whisper; the arc above stays solid,
            blended by the top strip. */}
        <MScrollScene
          amplitude={5}
          mediaClassName="hidden md:block"
          media={
            <>
              <Image src="/media/generated/04-plan-week.jpg" alt="" fill sizes="100vw" quality={60} className="object-cover" />
              <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "var(--grade-tint)" }} />
              <div aria-hidden className="grain-overlay" style={{ "--grain-opacity": "0.035" } as React.CSSProperties} />
              <div aria-hidden className="absolute inset-0 bg-bg/82" />
              <div aria-hidden className="room-edges-top" />
            </>
          }
        >
        <Container width="wide" className="py-16 sm:py-20 md:py-32">
          <SectionHeading eyebrow={PLAN.kicker} title={PLAN.title} lead={PLAN.lead} accent={PLAN.titleAccent} />
          <StickyScroll
            className="mt-14"
            mediaSide="start"
            steps={PLAN.steps.map((s, i) => {
              const m = PLAN_MEDIA[i];
              return {
              media: (
                // The step number lives ONCE, in the card's diamond marker — the media
                // stays a clean framed still (no corner diamond doubling the count or
                // overhanging the screen edge on small viewports). Rung 03's designed
                // sage panel is a note for the DESKTOP ladder only: shown inline on
                // mobile it reads as an image that failed to load, so it sits out there.
                <div
                  className={`relative flex aspect-[3/2] items-center justify-center overflow-hidden rounded-[16px] border border-line ${
                    m ? "bg-card" : "bg-gold-soft max-md:hidden"
                  }`}
                >
                  {m ? (
                    <Image
                      src={m.src}
                      alt={m.alt}
                      fill
                      sizes="(min-width: 768px) 40vw, 92vw"
                      className="object-cover"
                    />
                  ) : (
                    /* rung 03 — the site's own calm: a sage field carrying the rose thread */
                    <span aria-hidden className="h-[3px] w-16 rounded-full bg-rose" />
                  )}
                </div>
              ),
              content: (
                // the owner-requested upgrade: each rung is a real PROCESS CARD that
                // LEANS IN from the inline-end toward the sticky media — "המחשבה
                // מגיעה לצד התמונה". Diamond step-marker = the ◆ signature grown up.
                <MStagger variants={slideIn("inline-end", 48)} itemClassName="h-full">
                  <div className="rounded-[16px] border border-line bg-card p-7 shadow-[var(--elevation-1)] md:bg-card/85 md:backdrop-blur-md">
                    {/* pen-loop medallion (Rom 2026-07-20: "משהו עדין ונעים יותר"):
                        the rotated diamond sent four hard corners into the card's
                        calm. A ring has none — and the second, fainter loop sitting
                        a pixel high is the gesture of a hand circling a number twice
                        in pen. Rose, so the ladder's markers belong to the thread.
                        The ◆ stays what it always was: a STRUCTURE mark (kickers,
                        seams, the dossier pin), never a numeral. */}
                    <span
                      aria-hidden
                      className="relative grid h-11 w-11 place-items-center rounded-full border border-rose/70 bg-gold-soft/50"
                    >
                      <span className="pointer-events-none absolute -inset-[3px] -translate-y-px rounded-full border border-rose/30" />
                      <span className="font-serif text-base font-bold leading-none text-gold-ink">{s.n}</span>
                    </span>
                    <h3 className="mt-5 font-serif text-2xl font-bold text-navy">{s.t}</h3>
                    {/* the thread's stitch at each rung — draws itself (DrawnRule) */}
                    <DrawnRule className="mt-2.5 h-[2px] w-12 bg-rose" />
                    <p className="mt-3 max-w-[52ch] text-lg leading-[1.7] text-muted">{s.d}</p>
                  </div>
                </MStagger>
              ),
              };
            })}
          />
          <div className="mt-6 text-center">
            <Link
              href="#proof"
              data-cta="plan-to-proof"
              className="font-bold text-gold-ink underline-offset-4 transition hover:underline"
            >
              {PLAN.cta}
            </Link>
          </div>
        </Container>
        </MScrollScene>
        {/* mirror-curve seam into the proof — trough, opposite the dossier's crest */}
        <SeamShape variant="curve-down" />
      </div>
      )}

      {/* ── 05 · PROOF — card-grid: a random trio of real CMS recipes per visit;
             testimonial + media-logo slots stay honestly DARK until real. ── */}
      {PROOF && (
      <Section tone="white" border id="proof">
        <SectionHeading eyebrow={PROOF.kicker} title={PROOF.title} lead={PROOF.body} accent={PROOF.titleAccent} />
        <div className="mt-6">
          <span className="inline-block rounded-full bg-gold-soft px-4 py-1.5 text-sm font-semibold text-gold-ink">
            {PROOF.countChip}
          </span>
        </div>
        {/* random trio per visit — pool from the CMS, pick client-side (ProofRecipes) */}
        <ProofRecipes pool={recipesPool} />
        <div className="mt-12 text-center">
          <Link
            href="/recipes"
            data-cta="proof-all-recipes"
            className="font-bold text-gold-ink underline-offset-4 transition hover:underline"
          >
            {PROOF.cta}
          </Link>
        </div>
        {/* the articles index moved BELOW the stakes fork (Rom, 2026-08-12:
            «תחליף בין סקשן המאמרים לבין סקשן נמאס מהסבב הזה») — it now reads
            as the quiet study after the fork, right before the evening peak. */}
      </Section>
      )}

      {/* ── 06 · STAKES — comparison: another noisy year vs the quiet way, the cost
             priced in noise and guilt (never kilos), the easy free step welded beneath.
             THE FORK: the two futures approach from OPPOSITE inline sides (Comparison
             fork mode); the block overlaps up out of the proof band ("the choice rises
             out of the proof"); the sage wash at the bottom flows seamlessly into the
             Success field — no drawn seam before the emotional peak. ── */}
      {STAKES && (
      <section className="relative" style={{ "--grade-tint": "var(--hour-golden)" } as React.CSSProperties}>
        <Container width="wide" className="pb-32 pt-4 sm:pb-36 md:pb-44 md:pt-6">
          <div className="relative z-10 rounded-[16px] border border-line bg-bg p-7 shadow-[var(--elevation-2)] md:p-10">
            <SectionHeading eyebrow={STAKES.kicker} title={STAKES.title} accent={STAKES.titleAccent} />
            <p className="mt-8 font-serif text-lg italic text-rose-ink">{STAKES.cue}</p>
            <Comparison
              className="mt-5"
              fork
              // fork ghosts: the noisy year gets the chaos peak, the quiet way the
              // finished plate — stills born from the retired §02 film's frames
              // (s07/s14), which outlived it here as the fork's two futures
              left={{ label: STAKES.quiet.label, note: STAKES.quiet.note, points: [...STAKES.quiet.points], highlight: true, ghost: "/media/generated/06-fork-quiet.jpg" }}
              right={{ label: STAKES.noisy.label, note: STAKES.noisy.note, points: [...STAKES.noisy.points], noisy: true, ghost: "/media/generated/06-fork-noisy.jpg" }}
            />
          </div>
          <div className="mt-8 flex flex-col items-center justify-between gap-6 rounded-[16px] bg-blush p-7 md:flex-row md:p-9">
            <p className="max-w-[52ch] text-lg font-medium leading-relaxed text-navy">{STAKES.band}</p>
            <div className="flex shrink-0 flex-col items-center gap-3 sm:flex-row sm:gap-5">
              {/* magnet 2 of 2 — the fork's exit; no third magnet, ever */}
              <MMagnetic>
              <Link
                href="#lead"
                data-cta="stakes-to-cta"
                className="btn-chamfer rounded-[6px] bg-gold px-7 py-3.5 font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
              >
                {STAKES.bandCta}
              </Link>
              </MMagnetic>
              <Link
                href="/recipes"
                data-cta="stakes-recipes"
                className="text-sm font-semibold text-navy underline decoration-rose decoration-2 underline-offset-4 transition hover:text-navy-700"
              >
                {STAKES.bandSecondary}
              </Link>
            </div>
          </div>
        </Container>
      </section>
      )}

      {/* ── 06b · the articles study — up to three REAL articles from the
             collection (title + its own frontmatter description, family-wash
             cards), placed after the fork (Rom, 2026-08-12) as the calm
             reading room before the evening peak; renders only when articles
             exist, the third slot fills itself on publish. ── */}
      {ARTICLES && articlesPool.length > 0 && (
        <Section tone="white" border>
          {/* a centered masthead — kicker, serif title with the rose rule
              resting under «כתוב כאן» (base state drawn), quiet standfirst */}
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center gap-2.5">
              <span className="text-[0.65rem] leading-none text-gold" aria-hidden>◆</span>
              <span className="text-xs font-bold tracking-eyebrow text-gold-ink">{ARTICLES.kicker}</span>
            </div>
            <h3
              className="mt-4 font-serif font-black leading-[1.15] text-navy"
              style={{ fontSize: "clamp(1.5rem, 2.8vw, 2.2rem)" }}
            >
              {ARTICLES.titleA}
              <span className="u-rose-draw">{ARTICLES.titleAccent}</span>
            </h3>
            <p className="mt-3 max-w-[60ch] text-[1.08rem] leading-relaxed text-muted">{ARTICLES.lead}</p>
          </div>
          {/* the three slots wear the family washes (sage-soft / blush / sand)
              — color and life from the sanctioned palette, body text in ink
              (never muted) so every wash pays AA */}
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {articlesPool.map((a, i) => (
              <article
                key={a.slug}
                className={`flex flex-col rounded-[16px] p-7 ${["bg-gold-soft", "bg-blush", "bg-sand"][i % 3]}`}
              >
                <span className="flex items-center gap-2 text-xs font-bold tracking-eyebrow text-gold-ink">
                  <span className="text-[0.6rem] leading-none text-gold" aria-hidden>◆</span>
                  {a.tag ?? ARTICLES.kicker}
                </span>
                <h4 className="mt-4 font-serif text-2xl font-bold leading-snug text-navy">
                  <Link
                    href={`/articles/${a.slug}`}
                    data-cta="articles-item"
                    className="transition hover:text-gold-ink"
                  >
                    {a.title}
                  </Link>
                </h4>
                <p className="mt-3 grow text-[0.95rem] leading-relaxed text-ink">{a.description}</p>
                <Link
                  href={`/articles/${a.slug}`}
                  data-cta="articles-read"
                  className="mt-6 text-sm font-bold text-gold-ink underline decoration-rose decoration-2 underline-offset-4 transition hover:text-navy"
                >
                  {ARTICLES.itemCta}
                </Link>
              </article>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/articles"
              data-cta="articles-all"
              className="text-sm font-bold text-gold-ink underline-offset-4 transition hover:underline"
            >
              {ARTICLES.allCta}
            </Link>
          </div>
        </Section>
      )}

      {/* ── 07 · SUCCESS — «חדר שעת הזהב» (background-art): the peak goes full-bleed.
             The golden-hour restaurant IS the room now (wide still via MScrollScene);
             the whole scene uncovers through the growing ◆ (irisDiamond on the media
             layer — the glyph that was a picture's shutter becomes the evening's).
             One milky ivory card carries the felt-lines. Zero grain — the material
             diet's clean end. A dusk gradient hands the evening to §08's navy night, where the
             gold ◆ of the form is the light that stays. ── */}
      {SUCCESS && (
      <section className="relative">
        <MScrollScene
          amplitude={5}
          media={
            <MStagger variants={irisDiamond} className="h-full" itemClassName="h-full">
              <div className="relative h-full w-full">
                <Image
                  src="/media/generated/07-success-evening-wide.jpg"
                  alt=""
                  fill
                  sizes="100vw"
                  className="object-cover"
                />
                <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "var(--grade-tint)" }} />
                {/* a soft warm wash keeps the card floating, never fighting the room */}
                <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-blush/35 via-transparent to-gold-soft/25" />
                {/* the evening dissolves in from the golden stakes above */}
                <div aria-hidden className="room-edges-top" />
              </div>
            </MStagger>
          }
        >
          <Container width="wide" className="py-16 sm:py-20 md:py-32">
            <MOrchestrate className="md:max-w-[660px]">
              {/* her own voice arrives from the reading edge, on ivory paper */}
              <MItem variants={slideIn("inline-start", 48)}>
                <div className="relative rounded-[16px] border border-line bg-bg/95 p-8 shadow-[var(--elevation-2)] md:bg-bg/85 md:p-10 md:backdrop-blur-md">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[0.65rem] leading-none text-gold" aria-hidden>◆</span>
                    <p className="font-serif text-[1.2rem] font-medium leading-snug text-navy">{SUCCESS.kicker}:</p>
                  </div>
                  <RevealHeading
                    as="h2"
                    text={SUCCESS.lines}
                    className="mt-6 font-serif font-bold leading-[1.5] text-navy"
                    style={{ fontSize: "clamp(1.5rem, 2.9vw, 2.3rem)" }}
                    lastLineClass="relative w-fit after:absolute after:inset-x-0 after:bottom-[0.02em] after:h-[3px] after:rounded-full after:bg-rose after:origin-[100%_50%] after:transition-transform after:duration-[var(--dur-rule)] after:ease-[var(--ease-signature)] after:delay-[calc(var(--dur-reveal)_+_2*var(--dur-stagger))] motion-reduce:after:transition-none [.is-masked_&]:after:scale-x-0"
                  />
                  <MItem className="mt-9">
                    <Link
                      href="#lead"
                      data-cta="success-to-lead"
                      className="btn-chamfer inline-block rounded-[6px] border-2 border-navy/30 bg-bg/70 px-7 py-3.5 text-lg font-semibold text-navy transition hover:border-navy/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
                    >
                      {SUCCESS.bridge}
                    </Link>
                  </MItem>
                  {/* the settled-noise chips were removed here (Rom 2026-07-21:
                      "תוריד את הפיצרים הקטנים האלו על התמונה"), and the film that
                      carried the chip arc followed on 2026-08-11 — the chips are
                      fully retired. The evening room stays a clean photograph
                      with one ivory card. */}
                </div>
              </MItem>
            </MOrchestrate>
          </Container>
          {/* dusk wash — the golden hour darkens toward night… */}
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-navy md:h-28" />
          {/* …and THE accent seam (Rom's pick): a clean half-circle where the navy
              night rises into the evening, right before the form. One arch on the
              whole page — the shaped moment that earns its keep. */}
          <SeamShape variant="arch" fill="var(--color-navy)" height={88} />
        </MScrollScene>
      </section>
      )}

      {/* ── 08 · RESOLUTION — the navy #lead: calm asymmetric split, the small free
             step made safe (no price, a human answer, a dignified soft magnet). ── */}
      {CTA && (
      <Section tone="navy" id="lead" seam>
        <div className="grid items-start gap-12 md:grid-cols-[1.05fr_0.95fr]">
          <div>
            <SplitText
              as="h2"
              text={CTA.title}
              className="font-serif font-black leading-[1.15] text-white"
              style={{ fontSize: "clamp(2rem, 4.5vw, 3.2rem)" }}
            />
            <p className="mt-6 max-w-[62ch] text-lg leading-[1.7] text-on-navy">{CTA.body}</p>
            <p className="mt-4 max-w-[62ch] text-[0.95rem] leading-relaxed text-on-navy-muted">{CTA.packages}</p>
            <div className="mt-8">
              <ResponsePromise tone="dark" promise={CTA.promise} />
            </div>
            <div className="mt-7">
              <Link
                href="/about"
                data-cta="lead-credential"
                className="inline-flex items-center rounded-full bg-sand px-4 py-2.5 text-sm font-semibold text-navy transition hover:bg-card"
              >
                <span>
                  {CTA.trustToken}
                  <span className="hidden sm:inline">{CTA.trustTokenLicense}</span>
                </span>
              </Link>
            </div>
          </div>
          {/* the mailing-list magnet card was removed with the «שפוי» brand
              (Rom 2026-07-21) — the form is the page's single, honest ask */}
          <div>
            <ContactLeadForm />
          </div>
        </div>
      </Section>
      )}
    </>
  );
}
