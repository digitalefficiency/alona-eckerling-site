import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { SectionSeam } from "@/components/layout/SectionSeam";
import { ShapedSection } from "@/components/layout/ShapedSection";
import { SectionHeading } from "@/components/SectionHeading";
import { MOrchestrate, MItem } from "@/components/motion/MOrchestrate";
import { MStagger } from "@/components/motion/MStagger";
import { RevealHeading } from "@/components/motion/RevealHeading";
import { SplitText } from "@/components/motion/SplitText";
import { StickyScroll } from "@/components/motion/StickyScroll";
import { SequenceFilm, type FilmChip, type FilmCaption } from "@/components/SequenceFilm";
import { BackgroundArt } from "@/components/media/BackgroundArt";
import { Comparison } from "@/components/section/Comparison";
import { RecognitionBadges } from "@/components/trust/RecognitionBadges";
import { ResponsePromise } from "@/components/trust/ResponsePromise";
import { ContactLeadForm } from "@/components/ContactLeadForm";
import { JsonLd } from "@/components/JsonLd";
import { professionalService } from "@/lib/schema-presets";
import { site, services } from "@/lib/site";
import { listDocs, type CollectionEntry } from "@/lib/collections";

// ============================================================================
// בית — composed from plan/sections/01..08 (beats: HOOK→TENSION→GUIDE→PLAN→
// PROOF→STAKES→SUCCESS→RESOLUTION). Every visible string below is pasted from
// COPY.md « עמוד: בית » — studio [לאימות]/[חסר] annotations are NOT rendered.
// ============================================================================

// COPY: ### סקשן 1 · ImageHero + MOrchestrate
const HERO = {
  kicker: "תזונת נשים · ליווי אישי",
  title: "את כבר יודעת מה לאכול.\nמה שחסר זה לא עוד תפריט.",
  lede: "אלא דרך שנבנית סביב השבוע האמיתי שלך, בלי לוותר על האוכל שאת אוהבת. כדי שסוף-סוף יהיה שקט בראש, והתוצאה תישאר.",
  ctaPrimary: "בואי נדבר",
  ctaSub: "שיחת היכרות חינם",
  trustToken: "דיאטנית קלינית מוסמכת · R.D. · רישיון משרד הבריאות",
  ctaRecipes: "עוד לא מוכנה לשיחה? המתכונים שלי כאן",
} as const;

// COPY: ### סקשן 2 · סרט-גלילה «בניית המנה» (צ'יפים + כיתובי-תחנה)
const FILM = {
  kicker: "מוכר לך? · צלחת אחת, ערב אחד",
  staticKicker: "מוכר לך?",
  staticHeading: "ניסית כבר הכל, והאוכל עדיין מרגיש כמו מלחמה.",
  staticBody:
    'את יודעת בדיוק מה נכון לאכול, אבל לבד זה לא מחזיק. כל ביס מגיע עם חשבון בראש, וביס אחד "לא נכון" הופך מהר ל"היום כבר נהרס". ארוחה אמיתית, בלי חשבון ובלי אשמה, אפשרית, ואת לא צריכה להגיע לזה לבד.',
  finalAlt: "צלחת מאוזנת ומלאה, ערוכה ומוכנה",
} as const;

// 14 verified frames — the plate builds step by step while the noise-chips pile up.
const FILM_FRAMES = [
  "/media/generated/02-problem-s01.jpg",
  "/media/generated/02-problem-s02.jpg",
  "/media/generated/02-problem-s03.jpg",
  "/media/generated/02-problem-s04.jpg",
  "/media/generated/02-problem-s05.jpg",
  "/media/generated/02-problem-s06.jpg",
  "/media/generated/02-problem-s07.jpg",
  "/media/generated/02-problem-s08.jpg",
  "/media/generated/02-problem-s09.jpg",
  "/media/generated/02-problem-s10.jpg",
  "/media/generated/02-problem-s11.jpg",
  "/media/generated/02-problem-s12.jpg",
  "/media/generated/02-problem-s13.jpg",
  "/media/generated/02-problem-s14.jpg",
] as const;

// COPY: ### סקשן 2 — צ'יפי-מחשבות (5, הרעש בקולה); accumulate to the noise peak,
// then clear together at the turn (positions/windows are art direction, layer 6).
const FILM_CHIPS: readonly FilmChip[] = [
  { text: "אוקיי, סלט. בטוח.", from: 0.13, to: 0.55, position: { top: "18%", insetInlineStart: "8%" }, tilt: -2 },
  { text: "רגע, קינואה זה פחמימה?", from: 0.21, to: 0.55, position: { top: "32%", insetInlineEnd: "7%" }, tilt: 2 },
  { text: "בטטה בערב?!", from: 0.29, to: 0.55, position: { top: "52%", insetInlineStart: "12%" }, tilt: -1.5 },
  { text: "כמה קלוריות זה כבר?", from: 0.37, to: 0.55, position: { top: "24%", insetInlineStart: "34%" }, tilt: 1.5 },
  { text: "טחינה זה שמן... אבל אני אוהבת.", from: 0.45, to: 0.55, position: { top: "62%", insetInlineEnd: "12%" }, tilt: -2.5 },
];

// COPY: ### סקשן 2 — כיתובי-תחנה (4): פתיחה → תפנית → שיא → סיום
const FILM_CAPTIONS: readonly FilmCaption[] = [
  { big: "ארוחת ערב. כמה קשה זה כבר יכול להיות?", from: 0, to: 0.12 },
  { big: "שומעת את הרעש הזה?", small: "זה לא רעב. זו כל דיאטה שנשארה לך בראש.", tone: "turn", from: 0.56, to: 0.7 },
  { big: "ארוחה אמיתית. בלי חשבון, בלי אשמה.", from: 0.72, to: 0.85 },
  { big: "ואת לא צריכה להגיע לזה לבד.", small: "בדיוק בשביל זה יש ליווי.", from: 0.86, to: 0.985 },
];

// COPY: ### סקשן 3 · FeatureRow + BioCard + CredentialStrip
const GUIDE = {
  kicker: "נעים להכיר",
  title: "אני מכירה את הבלבול הזה",
  empathy:
    "גם אני עמדתי מול הבלגן הזה. בשלב מסוים כבר לא ידעתי מה נכון ומה לא נכון. בדיוק בגלל זה הלכתי ללמוד, כדי להבין מה באמת קורה בגוף שלנו.",
  ageLine:
    "כן, אני צעירה. וזה בדיוק מה שמאפשר לי להחזיק את המדע הכי עדכני, ולדבר איתך בגובה העיניים, לא מלמעלה.",
  name: "אלונה אקרלינג",
  role: "דיאטנית קלינית מוסמכת · R.D.",
  credentials: [
    "דיאטנית קלינית מוסמכת · R.D.",
    "רישיון משרד הבריאות 204526-11",
    "B.Sc במדעי התזונה",
    "התמחות קלינית · איכילוב",
  ],
  mechanism: ["דיאטנית שמבשלת", "נבנה סביב השבוע שלך", "מדע עדכני", "ליווי אחת-על-אחת"],
  cta: "בואי לראות איך עובדים יחד ←",
} as const;

// COPY: ### סקשן 4 · ProcessTimeline (3 שלבים)
const PLAN = {
  kicker: "איך זה עובד",
  title: "שלושה צעדים, בשפה שלך",
  lead: "מה שחסר זה לא עוד תפריט, אלא דרך שנבנית סביב השבוע שלך.",
  steps: [
    {
      n: "01",
      t: "שיחת היכרות",
      d: "בחינם, בלי התחייבות. נכיר, ונבין ביחד אם אני האדם הנכון ללוות אותך.",
    },
    {
      n: "02",
      t: "פגישה עמוקה + תוכנית אישית",
      d: "60 עד 75 דקות שיושבות לעומק: מה את אוהבת לאכול ואיך נראה היום שלך. יוצאות עם תוכנית שנבנית סביב החיים שלך, בלי לוותר על האוכל שאת אוהבת.",
    },
    {
      n: "03",
      t: "ליווי שנשאר",
      d: "אני לא נעלמת אחרי הפגישה. בין המפגשים אני איתך בוואטסאפ, עם פידבק על יומן האכילה, כדי שהדברים ייכנסו לשגרה ויישארו. לא עוד דיאטה שנגמרת.",
    },
  ],
  cta: "רוצה לראות איך זה נראה בפועל? הצצה למטבח שלי ←",
} as const;

// COPY: ### סקשן 5 · RecipeCard grid + ResultCard
const PROOF = {
  kicker: "תראי בעצמך",
  title: "היא באמת מבשלת",
  body: "לא עוד תמונה יפה. אוכל אמיתי שאני מבשלת, בנוי סביב שבוע אמיתי, בלי לוותר על מה שאת אוהבת.",
  countChip: "בערך 30 מתכונים · מתכון חדש כל שבוע",
  darkTestimonial: "המלצות אמיתיות יופיעו כאן ברגע שיהיו. אני לא ממציאה סיפור שלא קרה.",
  darkLogos: "שיתופי פעולה ומדיה יתווספו עם האישור.",
  cta: "לכל המתכונים ←",
} as const;

// COPY: ### סקשן 6 · Comparison + צעד חינם צמוד
const STAKES = {
  kicker: "נמאס מהסבב הזה?",
  title: "עוד שנה רועשת, או דרך שסוף-סוף שקטה",
  cue: "הדרך שאני ממליצה עליה",
  quiet: {
    label: "הדרך השקטה",
    note: "פעם אחת, בליווי, בלי לוותר על האוכל שאת אוהבת",
    points: [
      "דרך שנבנית סביב השבוע האמיתי שלך",
      "שקט. לאכול בלי לספור ובלי להתנצל",
      "משהו שנשאר איתך, כי זו לא עוד דיאטה",
      "אחת-על-אחת, גם בין הפגישות",
    ],
  },
  noisy: {
    label: "עוד שנה רועשת",
    note: "עוד דיאטה שמתחילה ביום ראשון ונשברת ברביעי",
    points: [
      "תפריט חדש שאת כבר יודעת שלא יחזיק",
      "רעש בראש סביב כל ארוחה, ואשמה אחריה",
      '"הפעם זה יחזיק", שכבר אמרת לעצמך',
      "לבד מול עוד ניסיון",
    ],
  },
  band: "במקום עוד שנה כזאת, בואי נדבר. שיחת היכרות בלי עלות ובלי התחייבות.",
  bandCta: "בואי נדבר ←",
  bandSecondary: "או קחי בינתיים הצצה למתכונים",
} as const;

// COPY: ### סקשן 7 · BackgroundArt + PullQuote (רעש→שקט)
const SUCCESS = {
  kicker: "ככה זה יכול להרגיש",
  lines: "בפעם הראשונה, אני לא בדיאטה.\nאכלתי בחוץ, נהניתי, ובלי אשמה.\nיש לי אנרגיה, ובראש שקט.",
  bridge: "וזה מתחיל בשיחה אחת, בלי לחץ. ←",
} as const;

// COPY: ### סקשן 7 — the settled noise: the SAME thought-chips from סקשן 2,
// resting faint and thinning downward (decorative, aria-hidden — the motif resolves).
const SETTLED_NOISE = [
  { text: "אוקיי, סלט. בטוח.", top: "8%", side: "start" as const, offset: "10%", opacity: 0.15, tilt: -2 },
  { text: "רגע, קינואה זה פחמימה?", top: "24%", side: "end" as const, offset: "8%", opacity: 0.12, tilt: 1.5 },
  { text: "בטטה בערב?!", top: "44%", side: "start" as const, offset: "16%", opacity: 0.09, tilt: -1 },
  { text: "כמה קלוריות זה כבר?", top: "63%", side: "end" as const, offset: "18%", opacity: 0.06, tilt: 1 },
  { text: "טחינה זה שמן... אבל אני אוהבת.", top: "82%", side: "start" as const, offset: "24%", opacity: 0.04, tilt: -1.5 },
];

// COPY: ### סקשן 8 · ContactLeadForm (פאנל נייבי #lead)
const CTA = {
  title: "בואי נדבר.\nהצעד הראשון קטן, וחינם.",
  body: "שיחת היכרות קצרה, בלי התחייבות. נכיר, ונבין יחד אם אני האדם הנכון ללוות אותך אל השקט הזה, בלי לוותר על האוכל שאת אוהבת.",
  packages:
    "הליווי נמכר בחבילות שמתאימות לחיים שלך. על זה בדיוק נדבר בשיחה, בלי הפתעות ובלי מחיר שקופץ מהמסך.",
  promise: "אני חוזרת אלייך אישית, עד 4 ימי עסקים.",
  trustToken: "דיאטנית קלינית מוסמכת · R.D. · רישיון משרד הבריאות",
  magnet: "עוד לא מוכנה לשיחה? הצטרפי לרשימה השפויה וקבלי ממני מתכון וטיפ שקט למייל",
} as const;

// One neutral meta line at most (mirrors the archive's tileMeta): a real prep
// time, then the first diet tag — never invented numbers (YMYL).
function recipeMeta(e: CollectionEntry): string | undefined {
  const parts: string[] = [];
  const prep = e.data.prepTime ? String(e.data.prepTime) : "";
  if (/\d/.test(prep)) parts.push(prep);
  if (e.tags[0]) parts.push(e.tags[0]);
  return parts.length ? parts.slice(0, 2).join(" · ") : undefined;
}

export default function HomePage() {
  // 3 real recipe cards from the CMS (proof-of-craft) — real client photography only.
  const recipes = listDocs("recipes")
    .filter((e): e is CollectionEntry & { image: string } => typeof e.image === "string" && e.image.length > 0)
    .slice(0, 3);

  return (
    <>
      {/* structured identity for the front door (GEO/SEO) — same builder as /contact */}
      <JsonLd data={professionalService(site, services)} />
      {/* ── 01 · HOOK — full-bleed-hero: the generated kitchen still (plan layer 8,
             faceless hands preparing produce) under a warm paper veil; text lives on
             the veiled inline-start side, the scene breathes on the far side.
             data-light-hero: the floating header must take its dark-ink treatment
             here (light wash, not a dark hero). isolate + -z-10 keep the media stack
             strictly UNDER the static text at every paint. ── */}
      <section data-light-hero className="relative isolate overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/media/generated/01-hero-kitchen.jpg"
            alt=""
            fetchPriority="high"
            loading="eager"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover object-[30%_center]"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-bg via-bg/85 to-bg/15" />
          <div className="absolute -top-24 -start-24 h-[420px] w-[420px] rounded-full bg-gold-soft opacity-50 blur-3xl" />
          <div className="absolute -bottom-36 -end-28 h-[480px] w-[480px] rounded-full bg-blush opacity-40 blur-3xl" />
        </div>
        <div aria-hidden className="grain-overlay" />
        <Container width="wide" className="flex min-h-[72vh] flex-col justify-center py-20 pb-32 md:py-28 md:pb-40">
          <MOrchestrate className="max-w-[760px]">
            <MItem as="p" className="flex items-center gap-2.5 text-[13px] font-bold tracking-[0.14em] text-muted">
              <span className="text-[0.65rem] leading-none text-gold" aria-hidden>◆</span>
              {HERO.kicker}
            </MItem>
            <MItem>
              <RevealHeading
                as="h1"
                text={HERO.title}
                className="mt-5 font-serif font-black leading-[1.12] text-navy"
                style={{ fontSize: "clamp(2.6rem, 6vw, 4.75rem)" }}
              />
            </MItem>
            <MItem as="p" className="mt-7 max-w-[62ch] text-lg leading-[1.7] text-muted">
              {HERO.lede}
            </MItem>
            <MItem className="mt-10">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-4">
                <div className="flex flex-col items-center gap-1.5">
                  <Link
                    href="#lead"
                    data-cta="hero-primary"
                    className="rounded-full bg-gold px-8 py-4 text-base font-bold text-white transition hover:bg-gold-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
                  >
                    {HERO.ctaPrimary}
                  </Link>
                  <span className="text-xs font-semibold text-muted">{HERO.ctaSub}</span>
                </div>
                <Link
                  href="/about"
                  data-cta="hero-credential"
                  className="inline-flex items-center gap-2 rounded-full border border-line bg-sand px-4 py-2.5 text-sm font-semibold text-navy transition hover:border-gold/60"
                >
                  <span className="text-[0.6rem] leading-none text-gold" aria-hidden>◆</span>
                  {HERO.trustToken}
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
          </MOrchestrate>
        </Container>
      </section>

      {/* ── 02 · TENSION — the site's ONE signature moment: the pinned «בניית המנה»
             scroll-film (14 frames), noise-chips pile up → the turn → quiet on the
             gold frame. Static twin (reduced-motion / no-JS): final frame + PAS prose.
             The ShapedSection arc (sand — the film's own stage tone) is the soft-arc
             seam the direction mandates between the psychological beats: the hero
             exhales into the film instead of a hard photographic cut. ── */}
      <ShapedSection tone="sand" shape="arc" edge="top">
        <SequenceFilm
          frames={FILM_FRAMES}
          kicker={FILM.kicker}
          chips={FILM_CHIPS}
          captions={FILM_CAPTIONS}
          staticKicker={FILM.staticKicker}
          staticHeading={FILM.staticHeading}
          staticBody={FILM.staticBody}
          finalAlt={FILM.finalAlt}
        />
      </ShapedSection>

      {/* ── 03 · GUIDE — asymmetric-split: empathy → checkable credentials → the age
             answer in her voice → the mechanism. Portrait slot = honest empty-state
             (real Alona photo pending — never a generated face), styled as a designed
             calling card (sage wash + ◆ + serif name), never a dashed wireframe. ── */}
      <section className="relative">
        <Container width="wide" className="py-16 sm:py-20 md:py-32">
          <SectionSeam className="mb-12" />
          <SectionHeading eyebrow={GUIDE.kicker} title={GUIDE.title} />
          <div className="mt-12 grid items-start gap-12 md:grid-cols-[0.85fr_1.15fr]">
            {/* portrait column — RTL inline-start (right): the real-photo slot, kept honest */}
            <div className="mx-auto w-full max-w-[420px]">
              <div className="relative flex aspect-[4/5] flex-col items-center justify-center gap-3 overflow-hidden rounded-[16px] border border-line bg-gold-soft p-8 text-center">
                <div aria-hidden className="grain-overlay" />
                <span className="relative text-[0.65rem] leading-none text-gold" aria-hidden>◆</span>
                <div className="relative font-serif text-3xl font-bold text-navy">{GUIDE.name}</div>
                <span aria-hidden className="relative h-[3px] w-10 rounded-full bg-rose" />
                <div className="relative font-serif text-base font-semibold text-navy-700">{GUIDE.role}</div>
              </div>
              <figure className="mt-7 border-s-4 border-rose ps-5">
                <blockquote className="font-serif text-lg italic leading-relaxed text-navy">
                  {GUIDE.ageLine}
                </blockquote>
              </figure>
            </div>
            {/* argument column — empathy strictly before authority */}
            <div>
              <p className="max-w-[62ch] text-lg leading-[1.7] text-muted">{GUIDE.empathy}</p>
              <div className="mt-8">
                <RecognitionBadges badges={[...GUIDE.credentials]} />
              </div>
              <MStagger as="ul" className="mt-9 grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
                {GUIDE.mechanism.map((m) => (
                  <span key={m} className="inline-block self-start border-b-2 border-rose pb-1.5 font-serif text-lg font-bold text-navy">
                    {m}
                  </span>
                ))}
              </MStagger>
              <div className="mt-10">
                <Link
                  href="/coaching"
                  data-cta="guide-to-coaching"
                  className="font-bold text-gold-ink underline-offset-4 transition hover:underline"
                >
                  {GUIDE.cta}
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ── 04 · PLAN — sticky-scroll ladder: three named rungs climb from a free call
             to the support that stays. Rungs 01–02 carry the generated stills (the
             conversation · the weekly plan, plan layer 8); rung 03 keeps the designed
             sage panel so the ladder ends on the site's own calm. ── */}
      <ShapedSection tone="sand" shape="arc" edge="top">
        <Container width="wide" className="py-16 sm:py-20 md:py-32">
          <SectionHeading eyebrow={PLAN.kicker} title={PLAN.title} lead={PLAN.lead} />
          <StickyScroll
            className="mt-14"
            mediaSide="start"
            steps={PLAN.steps.map((s, i) => ({
              media: (
                <div
                  className={`relative flex aspect-[3/2] items-center justify-center overflow-hidden rounded-[16px] border border-line ${
                    i === PLAN.steps.length - 1 ? "bg-gold-soft" : "bg-card"
                  }`}
                >
                  {i < 2 && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={i === 0 ? "/media/generated/11-method-two-cups.jpg" : "/media/generated/04-plan-week.jpg"}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  )}
                  {i < 2 && <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-navy/25 to-transparent" />}
                  <span
                    aria-hidden
                    className={`relative font-serif text-[6rem] font-black leading-none md:text-[8rem] ${
                      i < 2 ? "text-white/50" : "text-gold-ink/15"
                    }`}
                  >
                    {s.n}
                  </span>
                </div>
              ),
              content: (
                <div>
                  <span className="grid h-11 w-11 place-items-center rounded-full border border-gold/60 bg-card font-serif text-base font-bold text-gold-ink">
                    {s.n}
                  </span>
                  <h3 className="mt-4 font-serif text-2xl font-bold text-navy">{s.t}</h3>
                  <p className="mt-3 max-w-[52ch] text-lg leading-[1.7] text-muted">{s.d}</p>
                </div>
              ),
            }))}
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
      </ShapedSection>

      {/* ── 05 · PROOF — card-grid: 3 real recipes from the CMS as proof-of-craft;
             testimonial + media-logo slots stay honestly DARK until real. ── */}
      <Section tone="white" border id="proof">
        <SectionHeading eyebrow={PROOF.kicker} title={PROOF.title} lead={PROOF.body} />
        <div className="mt-6">
          <span className="inline-block rounded-full bg-gold-soft px-4 py-1.5 text-sm font-semibold text-gold-ink">
            {PROOF.countChip}
          </span>
        </div>
        <MStagger className="mt-12 grid gap-6 md:grid-cols-3">
          {recipes.map((e) => {
            const meta = recipeMeta(e);
            const category =
              typeof e.data.category === "string" && e.data.category.length > 0
                ? e.data.category
                : undefined;
            return (
              <Link
                key={e.slug}
                href={`/recipes/${e.slug}`}
                data-cta={`proof-recipe-${e.slug}`}
                className="group block h-full overflow-hidden rounded-2xl border border-line bg-card transition duration-300 ease-[var(--ease-out)] hover:-translate-y-1 hover:border-gold/60 hover:shadow-[var(--elevation-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
              >
                <div className="relative aspect-[3/2] overflow-hidden">
                  <Image
                    src={e.image}
                    alt={e.imageAlt || e.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 380px"
                    className="object-cover transition duration-700 ease-[var(--ease-out)] group-hover:scale-[1.02]"
                  />
                  {/* the ONE shared image grade (archive continuity) */}
                  <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "var(--grade-tint)" }} />
                  <div aria-hidden className="grain-overlay" />
                  {category && (
                    <span className="absolute top-3 start-3 rounded-full border border-line bg-bg/90 px-3 py-1 text-xs font-semibold text-gold-ink">
                      {category}
                    </span>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-serif text-lg font-bold leading-snug text-navy transition-colors group-hover:text-gold-ink">
                    {e.title}
                  </h3>
                  {meta && <p className="mt-1.5 text-[0.8rem] font-medium text-muted">{meta}</p>}
                </div>
              </Link>
            );
          })}
        </MStagger>
        <div className="mt-12 text-center">
          <Link
            href="/recipes"
            data-cta="proof-all-recipes"
            className="font-bold text-gold-ink underline-offset-4 transition hover:underline"
          >
            {PROOF.cta}
          </Link>
        </div>
        {/* the honest dark slots — ONE quiet wash band, structurally dark until real
            proof lands (soft wash + ◆, never card-sized ghosts, never dashed chrome) */}
        <div className="mt-10 rounded-[16px] bg-bg2 px-6 py-4 text-center">
          <p className="text-sm leading-relaxed text-muted">
            <span className="text-[0.6rem] leading-none text-gold" aria-hidden>◆ </span>
            {PROOF.darkTestimonial}
            <span className="mx-2.5 text-[0.6rem] leading-none text-gold" aria-hidden>◆</span>
            {PROOF.darkLogos}
          </p>
        </div>
      </Section>

      {/* ── 06 · STAKES — comparison: another noisy year vs the quiet way, the cost
             priced in noise and guilt (never kilos), the easy free step welded beneath. ── */}
      <section className="relative">
        <Container width="wide" className="py-16 sm:py-20 md:py-32">
          <SectionHeading eyebrow={STAKES.kicker} title={STAKES.title} />
          <p className="mt-8 font-serif text-lg italic text-rose-ink">{STAKES.cue}</p>
          <Comparison
            className="mt-5"
            left={{ label: STAKES.quiet.label, note: STAKES.quiet.note, points: [...STAKES.quiet.points], highlight: true }}
            right={{ label: STAKES.noisy.label, note: STAKES.noisy.note, points: [...STAKES.noisy.points] }}
          />
          <div className="mt-8 flex flex-col items-center justify-between gap-6 rounded-[16px] bg-blush p-7 md:flex-row md:p-9">
            <p className="max-w-[52ch] text-lg font-medium leading-relaxed text-navy">{STAKES.band}</p>
            <div className="flex shrink-0 flex-col items-center gap-3 sm:flex-row sm:gap-5">
              <Link
                href="#lead"
                data-cta="stakes-to-cta"
                className="rounded-full bg-gold px-7 py-3.5 font-bold text-white transition hover:bg-gold-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
              >
                {STAKES.bandCta}
              </Link>
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

      {/* ── 07 · SUCCESS — background-art peak-end: the sage→blush quiet field; the
             same thought-chips from the film rest settled and fading (the motif
             resolves to stillness). First-person felt-lines, framed as the possible
             future — never a testimonial. ── */}
      <section
        className="relative"
        style={{ background: "linear-gradient(180deg, var(--color-gold-soft) 0%, var(--color-blush) 100%)" }}
      >
        <BackgroundArt
          amplitude={4}
          art={
            <div aria-hidden className="relative h-full w-full">
              {SETTLED_NOISE.map((w) => (
                <span
                  key={w.text}
                  className="absolute whitespace-nowrap font-serif italic text-navy"
                  style={{
                    top: w.top,
                    ...(w.side === "start" ? { insetInlineStart: w.offset } : { insetInlineEnd: w.offset }),
                    opacity: w.opacity,
                    transform: `rotate(${w.tilt}deg)`,
                    fontSize: "clamp(0.85rem, 1.6vw, 1.15rem)",
                  }}
                >
                  {w.text}
                </span>
              ))}
            </div>
          }
        >
          <Container width="prose" className="py-28 text-center md:py-44">
            <div className="flex items-center justify-center gap-2.5">
              <span className="text-[0.65rem] leading-none text-gold" aria-hidden>◆</span>
              <p className="font-serif text-[1.2rem] font-medium leading-snug text-navy">{SUCCESS.kicker}:</p>
            </div>
            <RevealHeading
              as="h2"
              text={SUCCESS.lines}
              className="mt-8 text-center font-serif font-bold leading-[1.45] text-navy"
              style={{ fontSize: "clamp(1.6rem, 3.6vw, 2.6rem)" }}
              lastLineClass="relative mx-auto w-fit after:absolute after:inset-x-0 after:bottom-[0.02em] after:h-[3px] after:rounded-full after:bg-rose after:origin-[100%_50%] after:transition-transform after:duration-[var(--dur-rule)] after:ease-[var(--ease-signature)] after:delay-[calc(var(--dur-reveal)_+_2*var(--dur-stagger))] motion-reduce:after:transition-none [.is-masked_&]:after:scale-x-0"
            />
            <div className="mt-10">
              <Link
                href="#lead"
                data-cta="success-to-lead"
                className="text-lg font-medium text-navy-700 transition hover:text-navy"
              >
                {SUCCESS.bridge}
              </Link>
            </div>
          </Container>
        </BackgroundArt>
      </section>

      {/* ── 08 · RESOLUTION — the navy #lead: calm asymmetric split, the small free
             step made safe (no price, a human answer, a dignified soft magnet). ── */}
      <Section tone="navy" id="lead" seam>
        <div className="grid items-start gap-12 md:grid-cols-[1.05fr_0.95fr]">
          <div>
            <SplitText
              as="h2"
              text={CTA.title}
              className="font-serif font-black leading-[1.15] text-white"
              style={{ fontSize: "clamp(2rem, 4.5vw, 3.2rem)" }}
            />
            <p className="mt-6 max-w-[62ch] text-lg leading-[1.7] text-slate-200">{CTA.body}</p>
            <p className="mt-4 max-w-[62ch] text-[0.95rem] leading-relaxed text-slate-300">{CTA.packages}</p>
            <div className="mt-8">
              <ResponsePromise tone="dark" promise={CTA.promise} />
            </div>
            <div className="mt-7">
              <Link
                href="/about"
                data-cta="lead-credential"
                className="inline-flex items-center gap-2 rounded-full bg-sand px-4 py-2.5 text-sm font-semibold text-navy transition hover:bg-card"
              >
                <span className="text-[0.6rem] leading-none text-gold" aria-hidden>◆</span>
                {CTA.trustToken}
              </Link>
            </div>
          </div>
          <div>
            <ContactLeadForm />
            <Link
              href="/contact"
              data-cta="lead-magnet"
              className="mt-6 block rounded-[16px] bg-blush p-6 text-navy transition hover:opacity-90"
            >
              <span className="text-[0.6rem] leading-none text-rose-ink" aria-hidden>◆ </span>
              <span className="text-[0.95rem] font-medium leading-relaxed">{CTA.magnet}</span>
            </Link>
          </div>
        </div>
      </Section>
    </>
  );
}
