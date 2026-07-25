import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Solitreo } from "next/font/google";
import { site } from "@/lib/site";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { SeamShape } from "@/components/layout/SeamShape";
import { SectionSeam } from "@/components/layout/SectionSeam";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Reveal } from "@/components/Reveal";
import { MStagger } from "@/components/motion/MStagger";
import { MOrchestrate, MItem } from "@/components/motion/MOrchestrate";
import { slideIn, maskReveal } from "@/lib/motion-variants";
import { SplitText } from "@/components/motion/SplitText";
import { DrawnRule } from "@/components/motion/DrawnRule";
import { RevealHeading } from "@/components/motion/RevealHeading";
import { SectionHeading } from "@/components/SectionHeading";
import { SpotlightCard } from "@/components/section/SpotlightCard";
import { ResponsePromise } from "@/components/trust/ResponsePromise";
import { JsonLd } from "@/components/JsonLd";
import { personFromBio } from "@/lib/schema-presets";

// The Hebrew signature-script hand accent (DESIGN-DIRECTION: reserved strictly
// for her-voice moments on this page - the age answer seal + her signed name).
// Loaded page-locally; evidently a webfont, never a forged autograph.
const signatureScript = Solitreo({
  subsets: ["hebrew", "latin"],
  weight: "400",
  display: "swap",
});

/* ============================== COPY (pasted) ==============================
   Every visible string below is pasted verbatim from COPY.md, "עמוד: עליי".
   Studio verification stamps from COPY.md are metadata and are NOT rendered. */

// COPY: ### סקשן 17 · SplitHero + Portrait 4:5
const HERO = {
  crumbLabel: "עליי",
  kicker: "נעים להכיר",
  title: "אלונה אקרלינג", // איות מחייב: אקרלינג, לא אקרלינק
  lede: "דיאטנית קלינית מוסמכת שמלווה נשים אל שקט סביב האוכל, בגובה העיניים, בלי דיאטות ובלי אשמה. הנה מי שעומדת מאחורי כל מילה כאן.",
  licenseChip: "דיאטנית קלינית מוסמכת · R.D. · רישיון משרד הבריאות 204526-11",
  // תווית-הכפתור והשורה-הקטנה שמתחתיה — פיצול משפחת-ההירו של הבית (בלי נקודה-אמצעית בתוך כפתור)
  ctaPrimary: "בואי נדבר",
  ctaPrimarySub: "שיחת היכרות בלי עלות",
  ctaMicro: "תראי בעצמך אם זה מתאים · בלי התחייבות",
  ctaSecondary: "קראי את הסיפור שלי ↓",
  // שורת ה-alt מ-COPY משמשת כתווית מצב-הריק של משבצת הפורטרט (פורטרט אמיתי בלבד, טרם נמסר)
  portraitLabel: "אלונה אקרלינג, דיאטנית קלינית מוסמכת, פורטרט",
} as const;

// COPY: ### סקשן 18 · Section width=prose (סיפור-המקור)
const STORY = {
  kicker: "הסיפור שלי",
  title: "לפני שהייתי דיאטנית,\nהייתי בדיוק במקום שלך",
  p1: "הכל התחיל אצלי בתקופת הקורונה, כשגיליתי את הבישול הבריא והתחלתי לשתף באינסטגרם.",
  p2: "ואז טבעתי במיתוסים: בשלב מסוים כבר לא ידעתי מה נכון ומה לא נכון. בדיוק בגלל זה הלכתי ללמוד, כדי להבין מה באמת קורה בגוף שלנו.",
  credo1: "אני מאמינה שאוכל בריא לא צריך להיות משעמם. להפך: הוא יכול להיות עשיר, מגוון, טעים וצבעוני, ולא מסובך בכלל.",
  // הקרדו השני מפוצל סביב מילת-ההדגשה «ליהנות» (קו-יד ורוד) - אותו משפט, אחד-לאחד
  credo2a: "אין מאכלים אסורים, אין אשמה. רק איזון חכם שמאפשר ",
  credo2Mark: "ליהנות",
  credo2b: " מהכל.",
  signOff: "זמינה בשבילך לכל שאלה,",
  signature: "אלונה",
} as const;

// COPY: ### סקשן 19 · PullQuote ענק + כתב-יד (שאלת הגיל)
// The pivot word carries the ONE rose hand-underline (plan 19 layer 5).
const AGE_PIVOT = "בדיוק";
const AGE = {
  kicker: "על הגיל, בלי להתחמק",
  quote:
    "כן, אני צעירה.\nוזה בדיוק מה שמאפשר לי\nלהחזיק את המדע הכי עדכני,\nולדבר איתך בגובה העיניים, לא מלמעלה.",
  support: "אני מגיעה עם אנרגיה, סקרנות ורצון ללמוד ולהתפתח.",
  signature: "אלונה",
} as const;

// COPY: ### סקשן 20 · BentoGrid (קיר הקרדנציאלים)
const CREDENTIALS = {
  kicker: "הרקע, בגילוי מלא",
  title: "הרקע אמיתי, ואפשר לבדוק אותו",
  anchor: {
    title: "דיאטנית קלינית מוסמכת · R.D.",
    line: "רישיון משרד הבריאות 204526-11",
    verify: "בדקי אותי במאגר משרד הבריאות",
  },
  bsc: { title: "B.Sc במדעי התזונה", line: "המרכז האקדמי פרס, 2024" },
  intern: { title: "התמחות קלינית · בית החולים איכילוב", line: "חצי שנה, 2025" },
  craft: {
    title: "דיאטנית שמבשלת",
    line: "לא רק אומרת לך מה לאכול. יודעת בדיוק איך זה נראה במטבח האמיתי.",
    link: "אל המתכונים ←",
    micro: "בערך 30 מתכונים, מתעדכן מדי שבוע",
  },
  bridge: 'אז אם השאלה היא "אינפלואנסרית או דיאטנית אמיתית?", הנה הרקע, גלוי לבדיקה.',
} as const;

// COPY: ### סקשן 21 · Marquee (מדיה ושת"פים) · כהה עד אישור
const PRESS = {
  reserved: "שיתופי פעולה ומדיה יתווספו כאן עם האישור. אני לא מציגה לוגו שלא אושר.",
} as const;

// COPY: ### סקשן 22 · SpotlightCard + Person JSON-LD
const CLOSE = {
  kicker: "הצעד שלך",
  title: "עכשיו כשאת מכירה אותי,\nבשיחת היכרות בלי עלות, תראי בעצמך אם זה מתאים.",
  body: "עכשיו את כבר יודעת מאיפה אני מגיעה ומה הרקע שלי. מה שנשאר זה לשמוע אותך: שיחה קצרה, בלי עלות ובלי התחייבות, בגובה העיניים, ונראה אם הדרך שלי מתאימה לך. האוכל שאת אוהבת נשאר בפנים.",
  recipes: "ורוצה קודם פשוט לראות מה אני מבשלת? המתכונים כאן ←",
  trustToken: "דיאטנית קלינית מוסמכת · R.D. · רישיון משרד הבריאות 204526-11",
  promise: "אני חוזרת אלייך אישית, עד 4 ימי עסקים.",
  button: "בואי נדבר, שיחת היכרות חינם",
  signature: "אלונה",
} as const;

export const metadata: Metadata = {
  title: "עליי",
  description: HERO.lede,
  alternates: { canonical: "/about" },
  openGraph: { url: "/about" },
};

// Person JSON-LD (סקשן 22) - real, stated credentials only; no ratings/reviews.
const personSchema = personFromBio(
  {
    name: "אלונה אקרלינג",
    role: "דיאטנית קלינית מוסמכת (R.D.)",
    credentials: [
      "דיאטנית קלינית מוסמכת · R.D. · רישיון משרד הבריאות 204526-11",
      "B.Sc במדעי התזונה · המרכז האקדמי פרס, 2024",
      "התמחות קלינית · בית החולים איכילוב · חצי שנה, 2025",
    ],
    // Canonical Person node lives at /team/alona — use that href here too so the
    // /about Person carries the SAME @id, not a competing /about#person entity.
    href: "/team/alona",
  },
  site,
);

export default function AboutPage() {
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

          {/* Portrait slot - REAL Alona portraits only (YMYL). Until the photo
              lands this renders a DESIGNED calling-card empty-state: sage wash,
              her hand-script signature, name + role. Never a generated face,
              never a stock image, no developer-dashed frame. When the real 4:5
              portrait arrives it mounts here with alt={HERO.portraitLabel}. */}
          <Reveal className="md:order-first">
            {/* flagship double frame — the geometric signature's calling card */}
            <div
              className="frame-double relative mx-auto w-full max-w-[20rem] rounded-[16px] bg-gold-soft/70 md:max-w-none"
              style={{ aspectRatio: "4 / 5", "--frame-gap": "7px", "--frame-color": "var(--color-gold)" } as React.CSSProperties}
            >
              <div aria-hidden className="grain-overlay" />
              <div className="relative flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
                <span className={`${signatureScript.className} text-6xl text-navy`}>
                  {STORY.signature}
                </span>
                <span aria-hidden className="flex items-center gap-3">
                  <span className="h-px w-12 bg-gold/60" />
                  <span className="text-[0.55rem] leading-none text-gold">◆</span>
                  <span className="h-px w-12 bg-gold/60" />
                </span>
                <p className="font-serif text-xl font-black leading-snug text-navy">
                  {HERO.title}
                </p>
                <p className="text-sm font-semibold text-muted">{CREDENTIALS.anchor.title}</p>
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
              house pattern rather than on a single page. The source is 177KB at
              1330x2110 and was being served whole into a 375x250 mobile band. */}
          <Image
            src="/media/client/recipes/moroccan-fish.jpg"
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
            src="/media/client/recipes/moroccan-fish.jpg"
            alt="דגים מרוקאים של שישי, מנה אמיתית מהמטבח של אלונה"
            fill
            sizes="(max-width: 768px) 100vw, 0px"
            className="object-cover"
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
                <p className={`${signatureScript.className} mt-2 text-4xl text-navy`}>
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

      {/* ===== 19 · GUIDE - giant-quote, rebuilt as a composed object: four masked
           serif lines STEP DOWN from "מלמעלה" to eye level (the reframe drawn in
           layout), landing on her handwritten seal at the letter's closing edge;
           a giant script א rests behind as a pressed watermark. Typography is
           still the art - now composed, not floating. Zero raster.
           COPY: ### סקשן 19 ===== */}
      <section className="relative overflow-hidden">
        <Container width="wide" className="relative py-16 sm:py-20 md:py-32">
          <SectionSeam className="mb-10 md:mb-14" />
          {/* pressed watermark - her hand resting beneath the words (decorative) */}
          <span
            aria-hidden
            className={`${signatureScript.className} pointer-events-none absolute top-1/2 hidden -translate-y-1/2 select-none leading-none text-navy/[0.06] md:block`}
            style={{ insetInlineEnd: "-0.08em", fontSize: "min(30rem, 32vw)" }}
          >
            א
          </span>
          <MOrchestrate className="relative">
            <MItem className="flex items-center gap-2.5">
              <span className="text-[0.65rem] leading-none text-gold" aria-hidden>
                ◆
              </span>
              <span className="text-xs font-bold tracking-eyebrow text-rose-ink">{AGE.kicker}</span>
            </MItem>
            <figure>
              <blockquote className="mt-10">
                <p
                  className="font-serif font-black leading-[1.3] text-navy"
                  style={{ fontSize: "clamp(1.9rem, 3.6vw, 3.4rem)" }}
                >
                  {AGE.quote.split("\n").map((line, i, all) => (
                    /* each line in its own mask; the stairs descend to indent 0 -
                       "לא מלמעלה" lands flush, at eye level. The stair indent is
                       md+ only: at 375px it would eat ~30% of the measure and
                       shred the composition, so mobile reads flush-start. */
                    <span
                      key={line}
                      className="block overflow-hidden md:[padding-inline-start:var(--stair)]"
                      style={{ "--stair": `${(all.length - 1 - i) * 1.1}em` } as React.CSSProperties}
                    >
                      <MItem as="span" className="block pb-[0.12em]" variants={maskReveal}>
                        {line.includes(AGE_PIVOT) ? (
                          <>
                            {line.slice(0, line.indexOf(AGE_PIVOT))}
                            <span className="underline decoration-rose decoration-[4px] underline-offset-[10px]">
                              {AGE_PIVOT}
                            </span>
                            {line.slice(line.indexOf(AGE_PIVOT) + AGE_PIVOT.length)}
                          </>
                        ) : (
                          line
                        )}
                      </MItem>
                    </span>
                  ))}
                </p>
              </blockquote>
              {/* the letter closes where Hebrew letters close - the inline-end edge */}
              <figcaption className="mt-10 flex flex-col items-start gap-4 md:mt-12 md:items-end">
                <MItem variants={slideIn("inline-end", 32)}>
                  <p className="max-w-[38ch] text-lg leading-relaxed text-muted md:text-end">
                    {AGE.support}
                  </p>
                </MItem>
                <MItem className="flex flex-col items-start gap-2 md:items-end">
                  <span className={`${signatureScript.className} text-5xl text-navy md:text-6xl`}>
                    {AGE.signature}
                  </span>
                  <DrawnRule className="h-[3px] w-24 rounded-full bg-rose/70" />
                </MItem>
              </figcaption>
            </figure>
          </MOrchestrate>
        </Container>
      </section>

      {/* ===== 20 · GUIDE - credentials rebuilt (Rom: 'לבנות אחרת'): the bento's
           dead-air tiles become a VERIFICATION LEDGER - the license as a
           gold-double-framed navy certificate with a chamfered verify button,
           two stamped record rows beneath (diamond markers, gold hairlines) -
           and beside it the human counterpoint: the dietitian who COOKS, a real
           dish from her kitchen. Checkable facts only, no logos, no metrics,
           no testimonials. COPY: ### סקשן 20 ===== */}
      <Section tone="sand" seam>
        <SectionHeading eyebrow={CREDENTIALS.kicker} title={CREDENTIALS.title} accent="אמיתי" />
        <div className="mt-12 grid items-stretch gap-10 md:grid-cols-[1.12fr_0.88fr] md:gap-12">
          {/* ── the official ledger: certificate + stamped rows ── */}
          <MStagger variants={slideIn("inline-start", 40)} className="flex flex-col">
            {/* the license certificate - the one navy cell, double-framed in gold */}
            <article
              className="frame-double relative rounded-[16px] bg-navy p-7 text-white md:p-9"
              style={{ "--frame-gap": "8px", "--frame-color": "var(--color-gold-soft)" } as React.CSSProperties}
            >
              <div className="flex items-start justify-between gap-5">
                <div>
                  {/* explicit white — the global h3 rule paints navy, invisible on navy */}
                  <h3 className="font-serif text-2xl font-black leading-snug text-white md:text-[1.65rem]">
                    {CREDENTIALS.anchor.title}
                  </h3>
                  <p className="mt-3 text-lg font-semibold tracking-wide text-gold-soft">
                    {CREDENTIALS.anchor.line}
                  </p>
                </div>
                <span aria-hidden className="grid h-11 w-11 shrink-0 rotate-45 place-items-center border border-gold-soft/60">
                  <span className="-rotate-45 text-[0.7rem] leading-none text-gold-soft">◆</span>
                </span>
              </div>
              {/* the checkability promise is a REAL link: the MOH practitioners registry */}
              <a
                href="https://practitioners.health.gov.il"
                target="_blank"
                rel="noopener noreferrer"
                data-cta="about-credentials-verify"
                className="btn-chamfer mt-7 inline-flex items-center gap-2.5 rounded-[6px] border border-gold-soft/50 px-5 py-3 text-sm font-bold text-gold-soft transition hover:border-gold-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-soft focus-visible:ring-offset-2 focus-visible:ring-offset-navy"
              >
                <span className="text-[0.6rem] leading-none" aria-hidden>◆</span>
                {CREDENTIALS.anchor.verify}
              </a>
            </article>
            {/* record row - the degree */}
            <div className="mt-8 flex items-center gap-5 border-b border-gold/35 pb-7">
              <span aria-hidden className="grid h-11 w-11 shrink-0 rotate-45 place-items-center border border-gold/60 bg-card">
                <span className="-rotate-45 text-[0.6rem] leading-none text-gold">◆</span>
              </span>
              <div>
                <h3 className="font-serif text-xl font-black leading-snug text-navy">
                  {CREDENTIALS.bsc.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">{CREDENTIALS.bsc.line}</p>
              </div>
            </div>
            {/* record row - the clinical internship */}
            <div className="mt-7 flex items-center gap-5 border-b border-gold/35 pb-7">
              <span aria-hidden className="grid h-11 w-11 shrink-0 rotate-45 place-items-center border border-gold/60 bg-card">
                <span className="-rotate-45 text-[0.6rem] leading-none text-gold">◆</span>
              </span>
              <div>
                <h3 className="font-serif text-xl font-black leading-snug text-navy">
                  {CREDENTIALS.intern.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">{CREDENTIALS.intern.line}</p>
              </div>
            </div>
          </MStagger>
          {/* ── the human counterpoint: the dietitian who cooks (real dish) ── */}
          <MStagger variants={slideIn("inline-end", 48)} className="flex" itemClassName="flex w-full">
            <article className="flex w-full flex-col overflow-hidden rounded-[16px] border border-line bg-card shadow-[var(--elevation-1)]">
              <div className="relative aspect-[3/2]">
                <Image
                  src="/media/client/recipes/quinoa-citrus-salad.jpg"
                  alt="סלט קינואה והדרים, מנה אמיתית מהמטבח של אלונה"
                  fill
                  sizes="(min-width: 768px) 38vw, 92vw"
                  className="object-cover"
                />
              </div>
              <div className="flex grow flex-col bg-gold-soft p-7 md:p-8">
                <h3 className="font-serif text-2xl font-black leading-snug text-navy">
                  {CREDENTIALS.craft.title}
                </h3>
                <p className="mt-3 grow text-base leading-relaxed text-ink">{CREDENTIALS.craft.line}</p>
                <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
                  <Link
                    href="/recipes"
                    data-cta="about-credentials-recipes"
                    className="inline-block py-1.5 font-bold text-gold-ink underline decoration-gold/40 underline-offset-4 transition hover:decoration-gold"
                  >
                    {CREDENTIALS.craft.link}
                  </Link>
                  <span className="text-sm text-muted">{CREDENTIALS.craft.micro}</span>
                </div>
              </div>
            </article>
          </MStagger>
        </div>
        <Reveal delay={220}>
          <p className="mt-10 max-w-[62ch] text-base leading-relaxed text-muted">
            {CREDENTIALS.bridge}
          </p>
          {/* the full credentials page (/team/alona) gets its one quiet inbound door
              (mt-2.5 + py-1.5 keeps the same visual gap while padding the tap area) */}
          <p className="mt-2.5">
            <Link
              href="/team/alona"
              data-cta="about-credentials-team"
              className="inline-block py-1.5 text-sm font-bold text-gold-ink underline decoration-gold/40 underline-offset-4 transition hover:decoration-gold"
            >
              לעמוד ההסמכות המלא ←
            </Link>
          </p>
        </Reveal>
        {/* ===== 21 · PROOF - media/collab line, structurally DARK until approval:
             folded in as a footnote of the ledger (a full standalone band read as
             an unbuilt section at 1512 and cut the momentum before the close).
             When the names+logos are approved, the live Marquee returns as its
             own Section here. COPY: ### סקשן 21 ===== */}
        <p className="mx-auto mt-14 max-w-[52ch] text-center text-sm text-muted">
          {PRESS.reserved}
        </p>
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
                  <p className={`${signatureScript.className} text-4xl text-blush`}>
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
