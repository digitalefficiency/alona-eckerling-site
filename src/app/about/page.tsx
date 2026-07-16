import type { Metadata } from "next";
import Link from "next/link";
import { Solitreo } from "next/font/google";
import { site } from "@/lib/site";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { SectionSeam } from "@/components/layout/SectionSeam";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Reveal } from "@/components/Reveal";
import { SplitText } from "@/components/motion/SplitText";
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
  ctaPrimary: "בואי נדבר · שיחת היכרות בלי עלות",
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
  reserved: "שיתופי פעולה ומדיה יתווספו כאן עם האישור. אנחנו לא מציגים לוגו שלא אושר.",
} as const;

// COPY: ### סקשן 22 · SpotlightCard + Person JSON-LD
const CLOSE = {
  kicker: "הצעד שלך",
  title: "עכשיו כשאת מכירה אותי,\nבשיחת היכרות בלי עלות, תראי בעצמך אם זה מתאים.",
  body: "שיחה קצרה, בלי עלות ובלי התחייבות. נכיר, ונבין יחד, בגובה העיניים, אם אני האדם הנכון ללוות אותך אל השקט הזה, בלי לוותר על האוכל שאת אוהבת.",
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
    href: "/about",
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
      <section data-light-hero className="border-b border-line">
        <Container className="grid grid-cols-1 items-center gap-10 py-14 md:grid-cols-2 md:gap-14 md:py-24">
          {/* Portrait slot - REAL Alona portraits only (YMYL). Until the photo
              lands this renders the designed empty-state: dashed warm frame +
              the COPY line. Never a generated face, never a stock image. */}
          <Reveal>
            <div
              className="relative mx-auto w-full max-w-[26rem] overflow-hidden rounded-[16px] border-2 border-dashed border-rose/60 bg-blush/25 md:max-w-none"
              style={{ aspectRatio: "4 / 5" }}
            >
              <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
                <span className="text-[0.7rem] leading-none text-gold" aria-hidden>
                  ◆
                </span>
                <p className="max-w-[24ch] text-sm font-semibold leading-relaxed text-muted">
                  {HERO.portraitLabel}
                </p>
              </div>
            </div>
          </Reveal>

          <div>
            <div className="mb-6">
              <Breadcrumbs items={[{ label: HERO.crumbLabel, href: "/about" }]} />
            </div>
            <Reveal className="flex items-center gap-2.5">
              <span className="text-[0.7rem] leading-none text-gold" aria-hidden>
                ◆
              </span>
              <span className="text-xs font-bold tracking-[.2em] text-gold-ink">{HERO.kicker}</span>
            </Reveal>
            <SplitText
              as="h1"
              text={HERO.title}
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
              <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
                <Link
                  href="/contact"
                  data-cta="about-hero-call"
                  className="rounded-full bg-gold px-7 py-3.5 text-[0.95rem] font-bold text-white transition hover:bg-gold-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
                >
                  {HERO.ctaPrimary}
                </Link>
                <Link
                  href="#story"
                  data-cta="about-hero-story"
                  className="text-[0.95rem] font-bold text-gold-ink underline decoration-gold/40 underline-offset-4 transition hover:decoration-gold"
                >
                  {HERO.ctaSecondary}
                </Link>
              </div>
              <p className="mt-3 text-sm text-muted">{HERO.ctaMicro}</p>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* ===== 18 · GUIDE - centered-prose origin story: a signed personal letter.
           No credential claims here (they live in section 20). COPY: ### סקשן 18 ===== */}
      <Section tone="white" width="prose" border id="story" className="scroll-mt-24">
        <div className="flex items-center gap-2.5">
          <span className="text-[0.65rem] leading-none text-gold" aria-hidden>
            ◆
          </span>
          <span className="text-xs font-bold tracking-[.18em] text-gold-ink">{STORY.kicker}</span>
        </div>
        <RevealHeading
          as="h2"
          text={STORY.title}
          className="mt-4 font-serif font-black leading-[1.12] text-navy"
          style={{ fontSize: "clamp(1.9rem, 4vw, 2.9rem)" }}
        />
        <Reveal delay={80}>
          <p className="mt-8 text-lg leading-[1.7] text-ink">{STORY.p1}</p>
        </Reveal>
        <Reveal delay={120}>
          <p className="mt-5 text-lg leading-[1.7] text-ink">{STORY.p2}</p>
        </Reveal>
        <Reveal delay={140}>
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
        </Reveal>
        <Reveal delay={160}>
          <p className="text-lg leading-relaxed text-ink">{STORY.signOff}</p>
          <p className={`${signatureScript.className} mt-2 text-4xl text-navy`}>
            {STORY.signature}
          </p>
        </Reveal>
      </Section>

      {/* ===== 19 · GUIDE - giant-quote: the age question answered in her voice.
           The page's signature moment - typographic scale + her hand, zero raster.
           COPY: ### סקשן 19 ===== */}
      <section>
        <Container width="standard" className="py-24 md:py-40">
          <SectionSeam className="mb-14" />
          <figure className="mx-auto max-w-[46ch]">
            <div className="flex items-center gap-2.5">
              <span className="text-[0.65rem] leading-none text-gold" aria-hidden>
                ◆
              </span>
              <span className="text-xs font-bold tracking-[.18em] text-rose-ink">{AGE.kicker}</span>
            </div>
            <blockquote className="mt-8">
              <RevealHeading
                as="p"
                text={AGE.quote}
                className="font-serif font-black leading-[1.18] text-navy"
                style={{ fontSize: "clamp(2.4rem, 7vw, 5rem)" }}
              />
            </blockquote>
            <Reveal delay={120}>
              <p className="mt-8 max-w-[52ch] text-lg leading-relaxed text-muted">{AGE.support}</p>
            </Reveal>
            <Reveal delay={160}>
              <figcaption className="mt-10">
                <span className={`${signatureScript.className} text-5xl text-navy`}>
                  {AGE.signature}
                </span>
                <span aria-hidden className="mt-3 block h-[3px] w-20 rounded-full bg-rose/70" />
              </figcaption>
            </Reveal>
          </figure>
        </Container>
      </section>

      {/* ===== 20 · GUIDE - bento-grid credential wall: checkable facts in trust
           order (license anchor first). No logos, no metrics, no testimonials.
           COPY: ### סקשן 20 ===== */}
      <Section tone="sand" seam>
        <SectionHeading eyebrow={CREDENTIALS.kicker} title={CREDENTIALS.title} />
        <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Anchor tile - the one navy cell: the verifiable government license */}
          <Reveal className="md:col-span-2">
            <article className="flex h-full flex-col justify-between rounded-[16px] bg-navy p-7 text-white md:p-8">
              <div>
                <h3 className="font-serif text-2xl font-black leading-snug">
                  {CREDENTIALS.anchor.title}
                </h3>
                <p className="mt-3 text-lg font-semibold tracking-wide">{CREDENTIALS.anchor.line}</p>
              </div>
              <p className="mt-6 flex items-center gap-2.5 text-sm font-semibold text-gold-soft">
                <span className="text-[0.6rem] leading-none" aria-hidden>
                  ◆
                </span>
                {CREDENTIALS.anchor.verify}
              </p>
            </article>
          </Reveal>
          <Reveal delay={60}>
            <article className="flex h-full flex-col rounded-[16px] border border-line bg-card p-7">
              <h3 className="font-serif text-xl font-black leading-snug text-navy">
                {CREDENTIALS.bsc.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{CREDENTIALS.bsc.line}</p>
            </article>
          </Reveal>
          <Reveal delay={120}>
            <article className="flex h-full flex-col rounded-[16px] border border-line bg-card p-7">
              <h3 className="font-serif text-xl font-black leading-snug text-navy">
                {CREDENTIALS.intern.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{CREDENTIALS.intern.line}</p>
            </article>
          </Reveal>
          {/* Craft tile - sage wash, the "dietitian who cooks" proof-of-craft */}
          <Reveal delay={180} className="md:col-span-2">
            <article className="flex h-full flex-col rounded-[16px] bg-gold-soft p-7 md:p-8">
              <h3 className="font-serif text-2xl font-black leading-snug text-navy">
                {CREDENTIALS.craft.title}
              </h3>
              <p className="mt-3 grow text-base leading-relaxed text-ink">{CREDENTIALS.craft.line}</p>
              <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
                <Link
                  href="/recipes"
                  data-cta="about-credentials-recipes"
                  className="font-bold text-gold-ink underline decoration-gold/40 underline-offset-4 transition hover:decoration-gold"
                >
                  {CREDENTIALS.craft.link}
                </Link>
                <span className="text-sm text-muted">{CREDENTIALS.craft.micro}</span>
              </div>
            </article>
          </Reveal>
        </div>
        <Reveal delay={220}>
          <p className="mt-10 max-w-[62ch] text-base leading-relaxed text-muted">
            {CREDENTIALS.bridge}
          </p>
        </Reveal>
      </Section>

      {/* ===== 21 · PROOF - media/collab strip, structurally DARK until approval:
           the honest reserved line only, no logos, no fake marks. The live Marquee
           mounts here only after the names+logos are approved. COPY: ### סקשן 21 ===== */}
      <Section tone="white" pad="tight" border>
        <Reveal>
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="text-[0.6rem] leading-none text-gold" aria-hidden>
              ◆
            </span>
            <p className="max-w-[52ch] text-sm leading-relaxed text-muted">{PRESS.reserved}</p>
          </div>
        </Reveal>
      </Section>

      {/* ===== 22 · RESOLUTION - one elevated spotlight-card: the no-pressure
           invitation to see for herself + recipes side-door + Person JSON-LD.
           COPY: ### סקשן 22 ===== */}
      <section className="overflow-hidden">
        <Container width="standard" className="py-20 md:py-32">
          <SectionSeam className="mb-14" />
          <div className="mx-auto max-w-[880px]">
            <SpotlightCard>
              <div className="flex items-center gap-2.5">
                <span className="text-[0.65rem] leading-none text-gold" aria-hidden>
                  ◆
                </span>
                <span className="text-xs font-bold tracking-[.18em] text-gold-soft">
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
                <p className="mt-6 max-w-[62ch] text-lg leading-[1.7] text-slate-200">
                  {CLOSE.body}
                </p>
              </Reveal>
              <Reveal delay={120}>
                <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                  <Link
                    href="/contact"
                    data-cta="about-cta-call"
                    className="rounded-full bg-gold px-8 py-4 text-[0.95rem] font-bold text-white transition hover:bg-gold-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-soft focus-visible:ring-offset-2 focus-visible:ring-offset-navy"
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
