import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { site } from "@/lib/site";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { SeamShape } from "@/components/layout/SeamShape";
import { SectionSeam } from "@/components/layout/SectionSeam";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Reveal } from "@/components/Reveal";
import { MStagger } from "@/components/motion/MStagger";
import { slideIn } from "@/lib/motion-variants";
import { SplitText } from "@/components/motion/SplitText";
import { RevealHeading } from "@/components/motion/RevealHeading";
import { SectionHeading } from "@/components/SectionHeading";
import { SpotlightCard } from "@/components/section/SpotlightCard";
import { ResponsePromise } from "@/components/trust/ResponsePromise";
import { SocialLinks } from "@/components/SocialLinks";
import { JsonLd } from "@/components/JsonLd";
import { personFromBio } from "@/lib/schema-presets";
import { getPublishedPageRequiring, sectionPayload } from "@/lib/sections/source";
import type {
  AboutHeroPayload, AboutStoryPayload, AboutStandardPayload,
  AboutRoadPayload, AboutCtaPayload,
} from "@/lib/sections/payloads";

// The Solitreo signature-script hand was retired from this page on 2026-07-26
// (Rom's call) together with the age-quote section it anchored. Her name still
// signs the story and the closing card, now set in the house serif — one
// typographic voice on the page instead of a second, decorative one.

/* ============================== COPY (pasted) ==============================
   Every visible string below is pasted verbatim from COPY.md, "עמוד: עליי".
   Studio verification stamps from COPY.md are metadata and are NOT rendered. */

// COPY: ### סקשן 17 · SplitHero + Portrait 4:5
// REAL portrait (cl-102, MEDIA-PLAN §3) — never a generated face, never stock.
const HERO_PORTRAIT = "/media/client/alona/alona-goldenhour.jpg";

// COPY: ### סקשן 18 · Section width=prose (סיפור-המקור)

// §19 was the giant age-quote («כן, אני צעירה») with its handwritten seal.
// Retired 2026-07-26 (Rom's call) and replaced by the professional standard
// below — the argument moves from persona to method. The retired copy survives
// in the studio record at clients/alona-eckerling/sections/19-about-age-quote.md.

// COPY: ### סקשן 20 · הדרך לכאן — כתיבה אישית + סרגל הרשומות
// (2026-08-12, Rom: the old «הרקע, בגילוי מלא» ledger duplicated the standard's
// argument — «תשאיר את הסטנדרט, והרקע תחליף לכתיבה אישית של אלונה: איך זה
// הגיע, מה הוביל לשם, ולמה בחרה במקצוע»). Every sentence below is woven ONLY
// from approved sources — STORY p1/p2 (Corona → cooking → Instagram → myths →
// studying), the standard's own facts (degree, Ichilov internship, license),
// Q14 («בגובה העיניים») and the credo («טעים», «ליהנות») — zero new biography.
// The checkable records did NOT leave the page: they close the essay as a
// quiet ruled ledger, with the real MOH registry link preserved.

// COPY: ### סקשן 19 · הסטנדרט המקצועי + תחומי ליווי
// Rom's call 2026-07-26. The message is Alona's: the field is wide open, and the
// hours of reading behind her answers are the difference. It lands on /about
// because this page belongs to avatar C (שירה, 39, the sceptic) whose first
// question is "is she even qualified".
// Tone rule held: it names the REGULATORY reality (in Israel "דיאטן" is a
// protected title but "יועץ תזונה" is not), never a competitor, and every
// stakes line is welded to what she does instead.

// §21's reserved media/collab line is retired 2026-07-26 (Rom's call). The live
// Marquee still returns here if the names + logos are ever approved (Q21).

// COPY: ### סקשן 22 · SpotlightCard + Person JSON-LD

// The words come from the document — the same read the page body does.
const getAboutPage = () => getPublishedPageRequiring("about", ["hero", "story", "standard", "road", "cta"]);

/** No match returns the text whole: a drifted highlight costs an underline, never a paragraph. */
function splitAccent(text: string, accent: string): [string, string, string] {
  const at = accent ? text.indexOf(accent) : -1;
  if (at === -1) return [text, "", ""];
  return [text.slice(0, at), accent, text.slice(at + accent.length)];
}

export async function generateMetadata(): Promise<Metadata> {
  const page = await getAboutPage();
  const hero = sectionPayload<AboutHeroPayload>(page, "hero");
  return {
    title: page?.title ?? "עליי",
    description: hero?.lede,
    alternates: { canonical: "/about" },
    openGraph: { url: "/about" },
  };
}

// Person JSON-LD (סקשן 22) - real, stated credentials only; no ratings/reviews.
const personSchema = personFromBio(
  {
    name: "אלונה אקרלינג",
    role: "דיאטנית קלינית מוסמכת (R.D.)",
    credentials: [
      "דיאטנית קלינית מוסמכת · R.D. · רישיון משרד הבריאות 204526-11",
      "B.Sc במדעי התזונה · המרכז האקדמי פרס, 2024",
      "התמחות קלינית · בית החולים איכילוב · חצי שנה, 2025",
      // no institution/year here on purpose — the other three rows carry them
      // because they are verified, and inventing them for this one would put a
      // fabricated fact into structured data, which is the worst place for it
      "קורס בתזונת הריון",
    ],
    // Canonical Person node lives at /team/alona — use that href here too so the
    // /about Person carries the SAME @id, not a competing /about#person entity.
    // /about IS the bio page now — the standalone /team/alona credentials route
    // was removed 2026-07-29 (Rom's call), so the canonical Person node moves
    // here. Every Recipe author @id points at this same URL, so the entity stays
    // ONE node rather than splitting into two lookalikes.
    href: "/about",
  },
  site,
);

export default async function AboutPage() {
  const page = await getAboutPage();
  const HERO = sectionPayload<AboutHeroPayload>(page, "hero")!;
  const STORY_DOC = sectionPayload<AboutStoryPayload>(page, "story")!;
  const STANDARD = sectionPayload<AboutStandardPayload>(page, "standard")!;
  const ROAD = sectionPayload<AboutRoadPayload>(page, "road")!;
  const CLOSE = sectionPayload<AboutCtaPayload>(page, "cta")!;

  // the credo's rose underline: stored joined, split around the accent — the
  // exact serialisation the desk's mark field edits
  const [credo2a, credo2Mark, credo2b] = splitAccent(STORY_DOC.credo2, STORY_DOC.credo2Accent);
  const STORY = { ...STORY_DOC, credo2a, credo2Mark, credo2b };

  return (
    <>
      <JsonLd data={personSchema} />

      {/* ===== 17 · HOOK - asymmetric-split hero on warm paper: real-portrait slot
           (designed empty-state, face never generated) bleeding to the reading edge,
           name + license chip + free-call CTA. COPY: ### סקשן 17 ===== */}
      <section className="border-b border-line">
        {/* house vertical rhythm (py-16 sm:py-20 md:py-32). The ONE deviation is the
            mobile top pad: the header is `fixed`, so a light hero has to clear it —
            pt-28 stays below md, and from md the house py-32 already exceeds it. */}
        <Container className="grid grid-cols-1 items-center gap-10 pt-28 pb-16 sm:pb-20 md:grid-cols-2 md:gap-14 md:py-32">
          {/* Text column FIRST in DOM: on mobile the h1 + license + CTA open the
              page instead of the portrait empty-state card; on md+ the portrait
              Reveal below carries md:order-first, so the desktop layout is
              unchanged (portrait at inline-start). */}
          <div>
            <div className="mb-6">
              <Breadcrumbs items={[{ label: HERO.crumbLabel, href: "/about" }]} />
            </div>
            <Reveal className="flex items-center gap-2.5">
              <span className="text-[0.7rem] leading-none text-gold" aria-hidden>
                ◆
              </span>
              <span className="text-xs font-bold tracking-eyebrow text-gold-ink">{HERO.kicker}</span>
            </Reveal>
            <SplitText
              as="h1"
              text={HERO.title}
              autoplay
              baseDelay={120}
              className="mt-4 font-serif font-black leading-[1.05] text-navy"
              style={{ fontSize: "var(--text-hero)" }}
            />
            <Reveal delay={120}>
              <p className="mt-5 max-w-[52ch] text-lg leading-relaxed text-muted">{HERO.lede}</p>
            </Reveal>
            <Reveal delay={160}>
              <p className="mt-6 inline-flex items-center gap-2.5 rounded-[8px] bg-navy px-4 py-2.5 text-sm font-bold text-white">
                <span className="text-[0.6rem] leading-none text-gold-soft" aria-hidden>
                  ◆
                </span>
                {HERO.licenseChip}
              </p>
            </Reveal>
            <Reveal delay={200}>
              <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-4">
                <Link
                  href="/contact"
                  data-cta="about-hero-call"
                  className="btn-chamfer rounded-[6px] bg-gold px-7 py-3.5 text-[0.95rem] font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
                >
                  {HERO.ctaPrimary}
                </Link>
                <Link
                  href="#story"
                  data-cta="about-hero-story"
                  className="py-3.5 text-[0.95rem] font-bold text-gold-ink underline decoration-gold/40 underline-offset-4 transition hover:decoration-gold"
                >
                  {HERO.ctaSecondary}
                </Link>
              </div>
              {/* ONE micro line: ctaPrimarySub + ctaMicro joined verbatim (·),
                  instead of two near-identical whisper lines crowding the button */}
              <p className="mt-3 text-sm text-muted">
                {HERO.ctaPrimarySub} · {HERO.ctaMicro}
              </p>
            </Reveal>
          </div>

          {/* Portrait slot - REAL Alona portraits only (YMYL). FILLED 2026-07-25
              (MEDIA-PLAN §3, asset cl-102): her own golden-hour photo, supplied
              to the project Drive on 2026-07-23 in answer to the MATERIALS.md
              request for source portraits. Never a generated face, never stock.
              The flagship double frame and the hand-script signature survive —
              the signature now sits on an OPAQUE ivory foot strip so it keeps AA
              over the photograph instead of floating on it. */}
          <Reveal className="md:order-first">
            {/* flagship double frame — the geometric signature's calling card */}
            <div
              className="frame-double relative mx-auto w-full max-w-[20rem] overflow-hidden rounded-[16px] bg-gold-soft/70 md:max-w-none"
              style={{ aspectRatio: "4 / 5", "--frame-gap": "7px", "--frame-color": "var(--color-gold)" } as React.CSSProperties}
            >
              <Image
                src={HERO_PORTRAIT}
                alt={HERO.portraitLabel}
                fill
                priority
                sizes="(max-width: 768px) 80vw, 32rem"
                className="object-cover"
              />
              <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "var(--grade-tint)" }} />
              <div aria-hidden className="grain-overlay" />
              <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-2 bg-bg/94 px-6 py-5 text-center">
                <span className="font-serif text-3xl font-black leading-none text-navy">
                  {STORY.signature}
                </span>
                <span aria-hidden className="flex items-center gap-3">
                  <span className="h-px w-12 bg-gold/60" />
                  <span className="text-[0.55rem] leading-none text-gold">◆</span>
                  <span className="h-px w-12 bg-gold/60" />
                </span>
                <p className="text-sm font-semibold text-muted">{ROAD.roleLine}</p>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* ===== 18 · GUIDE - centered-prose origin story: a signed personal letter.
           No credential claims here (they live in section 20). COPY: ### סקשן 18 ===== */}
      {/* the "half-bg + card" pattern (#2, mirror of coaching's): her real dish photo
          bleeds the inline-START half and stops at a HARD edge; the origin story arrives
          as a SIGNED LETTER on an OPAQUE ivory card that leans in from the inline-end and
          overlaps that edge — the overlap IS the boundary, no melt, no frosted glass
          (paper-and-frames, not glassmorphism). Mobile: photo band on top, letter below. */}
      {/* border-t only: the bottom hairline retired when the soft curve moved in —
          a ruled line 1px under the crest reads as two seams stacked. */}
      <section id="story" className="relative overflow-hidden border-t border-line bg-card scroll-mt-24">
        <div aria-hidden className="absolute inset-y-0 start-0 hidden w-[52%] md:block">
          {/* next/image — same fix as the /coaching proof band, applied as one
              house pattern rather than on a single page: the source is a full-size
              dish photo and was being served whole into a 375x250 mobile band. */}
          <Image
            src={STORY.image}
            alt=""
            fill
            sizes="(max-width: 768px) 0px, 52vw"
            className="object-cover"
          />
          <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "var(--grade-tint)" }} />
          {/* house room-edge: the photo dissolves in from the hero above instead of
              opening on a hard cut (the inline edge stays hard — that overlap IS
              this section's pattern; only the block-start edge softens) */}
          <div aria-hidden className="room-edges-top" />
        </div>
        {/* wide-viewport bookend (audit D1): past the container on the letter's side
            the bare paper margin read dead next to the busy photo — a quiet sand
            band with a hairline turns it into a designed margin. xl+ only. */}
        <div
          aria-hidden
          className="absolute inset-y-0 end-0 hidden w-[calc((100vw-var(--container-wide))/2)] border-s border-line bg-sand/70 xl:block"
        />
        <div className="relative aspect-[3/2] md:hidden">
          <Image
            src={STORY.image}
            alt={STORY.imageAlt}
            fill
            sizes="(max-width: 768px) 100vw, 0px"
            className="object-cover object-[50%_62%]"
          />
          <div aria-hidden className="grain-overlay" />
          {/* same room-edge on the mobile band */}
          <div aria-hidden className="room-edges-top" />
        </div>
        <div className="relative mx-auto max-w-[var(--container-wide)] px-4 py-16 sm:px-6 sm:py-20 md:py-32">
          {/* md tablets get 58% (readable ~46ch measure; the overlap over the photo
              edge IS the pattern, it just grows a little) — back to 52% from lg */}
          <div className="md:ms-auto md:w-[58%] lg:w-[52%]">
            <MStagger variants={slideIn("inline-end", 48)}>
              <div className="rounded-[16px] border border-line bg-card p-7 shadow-[var(--elevation-2)] lg:p-10">
                <div className="flex items-center gap-2.5">
                  <span className="text-[0.65rem] leading-none text-gold" aria-hidden>
                    ◆
                  </span>
                  <span className="text-xs font-bold tracking-eyebrow text-gold-ink">{STORY.kicker}</span>
                </div>
                <RevealHeading
                  as="h2"
                  text={STORY.title}
                  className="mt-4 font-serif font-black leading-[1.12] text-navy"
                  style={{ fontSize: "clamp(1.9rem, 4vw, 2.9rem)" }}
                />
                <p className="mt-8 text-lg leading-[1.7] text-ink">{STORY.p1}</p>
                <p className="mt-5 text-lg leading-[1.7] text-ink">{STORY.p2}</p>
                <div className="my-10 rounded-[16px] bg-blush/40 px-6 py-8 sm:px-9">
                  <p className="font-serif text-xl font-bold leading-snug text-navy sm:text-2xl">
                    {STORY.credo1}
                  </p>
                  <p className="mt-4 font-serif text-xl font-bold leading-snug text-navy sm:text-2xl">
                    {STORY.credo2a}
                    <span className="underline decoration-rose decoration-[3px] underline-offset-[6px]">
                      {STORY.credo2Mark}
                    </span>
                    {STORY.credo2b}
                  </p>
                </div>
                <p className="text-lg leading-relaxed text-ink">{STORY.signOff}</p>
                <p className="mt-2 font-serif text-3xl font-black text-navy">
                  {STORY.signature}
                </p>
              </div>
            </MStagger>
          </div>
        </div>
        {/* the page's ONE photo room hands off with the house soft curve — a crest
            (the quote room's ground rises into the dish photo). Alternation has
            nothing to alternate with here: this is the only image seam on /about. */}
        <SeamShape variant="curve-up" />
      </section>

      {/* ===== 19 · GUIDE - the professional standard (Rom's call 2026-07-26,
           replacing the giant age-quote). The age answer was the page's argument
           from PERSONA; this is the argument from METHOD, which is the sceptic
           avatar's real question. It also sits where the reader most needs it:
           straight after the origin story, before the ledger proves it.
           archetype=card-grid — deliberately NOT centered-prose, because §18
           above it already is one and two prose columns back to back read as one
           long undifferentiated wall (and lint-variety forbids the adjacency).
           The three principles are peers, so a row of three cards states that
           better than a stacked list anyway. COPY: ### סקשן 19 ===== */}
      <Section tone="white" border>
        {/* the argument stays at prose measure; the evidence widens out */}
        <div className="mx-auto max-w-[760px]">
          <SectionHeading eyebrow={STANDARD.kicker} title={STANDARD.title} accent={STANDARD.titleAccent} />
          <Reveal delay={80}>
            <p className="mt-7 text-lg leading-[1.75] text-ink">{STANDARD.body}</p>
          </Reveal>
        </div>
        <MStagger as="ul" className="mx-auto mt-12 grid max-w-[1000px] gap-5 sm:grid-cols-3" variants={slideIn("inline-start", 32)}>
          {STANDARD.principles.map((p) => (
            <li key={p.t} className="flex flex-col rounded-[16px] border border-line bg-card p-6 shadow-[var(--elevation-1)]">
              <span aria-hidden className="grid h-9 w-9 rotate-45 place-items-center border border-gold/60">
                <span className="-rotate-45 text-[0.55rem] leading-none text-gold">◆</span>
              </span>
              <h3 className="mt-5 font-serif text-lg font-black leading-snug text-navy">{p.t}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-muted">{p.d}</p>
            </li>
          ))}
        </MStagger>
        <Reveal delay={160}>
          <div className="mx-auto mt-10 max-w-[1000px] rounded-[16px] bg-sand p-7">
            <p className="flex items-center gap-2 text-[13px] font-bold tracking-eyebrow text-gold-ink">
              <span className="text-[0.6rem] leading-none" aria-hidden>◆</span>
              {STANDARD.areasLabel}
            </p>
            <ul className="mt-4 flex flex-wrap gap-x-2.5 gap-y-2">
              {STANDARD.areas.map((a) => (
                <li key={a} className="rounded-full border border-line bg-card px-4 py-2 text-sm font-semibold text-navy">
                  {a}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </Section>

      {/* ===== 20 · GUIDE - «הדרך לכאן» (2026-08-12, Rom's call): the old
           credentials wall duplicated the standard's argument, so it retired.
           In its place: Alona's personal writing — how it started, what led
           here, why this profession — at prose measure, in her voice, woven
           only from approved sources. The checkable records stay as a quiet
           ruled ledger at the essay's foot, with the REAL MOH registry link.
           archetype=centered-prose — adjacent to §19 card-grid and §22
           spotlight-card, both distinct. COPY: ### סקשן 20 ===== */}
      <Section tone="sand" seam>
        <div className="mx-auto max-w-[760px]">
          <SectionHeading eyebrow={ROAD.kicker} title={ROAD.title} accent={ROAD.titleAccent} />
          <Reveal delay={80}>
            <p className="mt-7 text-lg leading-[1.75] text-ink">{ROAD.p1}</p>
          </Reveal>
          <Reveal delay={140}>
            <p className="mt-5 text-lg leading-[1.75] text-ink">{ROAD.p2}</p>
          </Reveal>
          <Reveal delay={200}>
            <p className="mt-5 text-lg leading-[1.75] text-ink">{ROAD.p3}</p>
          </Reveal>
          {/* the records — the same checkable facts, folded to a ruled ledger */}
          <Reveal delay={260}>
            <div className="mt-12">
              <p className="flex items-center gap-2 text-xs font-bold tracking-eyebrow text-gold-ink">
                <span className="text-[0.6rem] leading-none" aria-hidden>◆</span>
                {ROAD.recordsLabel}
              </p>
              <ul className="mt-3">
                {ROAD.records.map((r) => (
                  <li
                    key={r}
                    className="flex items-center gap-3 border-b border-line/70 py-2.5 text-[13px] font-bold tracking-eyebrow text-muted last:border-0"
                  >
                    <span aria-hidden className="h-[3px] w-3 shrink-0 rounded-full bg-rose" />
                    {r}
                  </li>
                ))}
              </ul>
              {/* the close drives action (Rom, 2026-08-12): her thinking about
                  the process, then the approved free-call ask — the registry
                  link retired (the license number above stays checkable, and
                  the standard still names the public registry) */}
              <p className="mt-8 max-w-[58ch] text-lg leading-[1.75] text-ink">{ROAD.bridge}</p>
              <Link
                href="/contact"
                data-cta="about-road-cta"
                className="mt-5 inline-block font-bold text-gold-ink underline decoration-rose decoration-2 underline-offset-4 transition hover:text-navy"
              >
                {ROAD.bridgeCta}
              </Link>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ===== 22 · RESOLUTION - one elevated spotlight-card: the no-pressure
           invitation to see for herself + recipes side-door + Person JSON-LD.
           COPY: ### סקשן 22 ===== */}
      <section className="overflow-hidden">
        <Container width="standard" className="py-16 sm:py-20 md:py-32">
          <SectionSeam className="mb-10 md:mb-14" />
          <div className="mx-auto max-w-[880px]">
            <SpotlightCard>
              <div className="flex items-center gap-2.5">
                <span className="text-[0.65rem] leading-none text-gold" aria-hidden>
                  ◆
                </span>
                <span className="text-xs font-bold tracking-eyebrow text-gold-soft">
                  {CLOSE.kicker}
                </span>
              </div>
              <RevealHeading
                as="h2"
                text={CLOSE.title}
                className="mt-5 font-serif font-black leading-[1.22] text-white"
                style={{ fontSize: "clamp(1.7rem, 3.6vw, 2.6rem)" }}
              />
              <Reveal delay={80}>
                <p className="mt-6 max-w-[62ch] text-lg leading-[1.7] text-on-navy">
                  {CLOSE.body}
                </p>
              </Reveal>
              <Reveal delay={120}>
                <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                  <Link
                    href="/contact"
                    data-cta="about-cta-call"
                    className="btn-chamfer rounded-[6px] bg-gold-soft px-8 py-4 text-[0.95rem] font-bold text-navy transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy"
                  >
                    {CLOSE.button}
                  </Link>
                  <Link
                    href="/recipes"
                    data-cta="about-cta-recipes"
                    className="text-[0.95rem] font-semibold text-gold-soft underline decoration-gold-soft/40 underline-offset-4 transition hover:decoration-gold-soft"
                  >
                    {CLOSE.recipes}
                  </Link>
                </div>
              </Reveal>
              {/* the skeptic's off-ramp (avatar C): /about exists to answer
                  "is she even qualified", and some readers want to watch a while
                  before they talk. Give them somewhere to go that isn't away. */}
              <Reveal delay={140}>
                <SocialLinks tone="dark" label={CLOSE.socialLabel} showHandle className="mt-9" />
              </Reveal>
              <Reveal delay={160}>
                <div className="mt-10 flex flex-col gap-5 border-t border-white/15 pt-6 sm:flex-row sm:items-end sm:justify-between">
                  <div className="flex flex-col gap-3">
                    <p className="flex items-center gap-2.5 text-sm font-semibold text-white/85">
                      <span className="text-[0.6rem] leading-none text-gold-soft" aria-hidden>
                        ◆
                      </span>
                      {CLOSE.trustToken}
                    </p>
                    <ResponsePromise promise={CLOSE.promise} tone="dark" />
                  </div>
                  <p className="font-serif text-3xl font-black text-blush">
                    {CLOSE.signature}
                  </p>
                </div>
              </Reveal>
            </SpotlightCard>
          </div>
        </Container>
      </section>
    </>
  );
}
