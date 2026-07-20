import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { SectionSeam } from "@/components/layout/SectionSeam";
import { ShapedSection } from "@/components/layout/ShapedSection";
import { SectionHeading } from "@/components/SectionHeading";
import { MOrchestrate, MItem } from "@/components/motion/MOrchestrate";
import { MStagger } from "@/components/motion/MStagger";
import { MScrollScene } from "@/components/motion/MScrollScene";
import { DiagramReveal } from "@/components/motion/DiagramReveal";
import { DrawnRule } from "@/components/motion/DrawnRule";
import { HeroFilm } from "@/components/media/HeroFilm";
import { StoryBridge } from "@/components/section/StoryBridge";
import { ProofRecipes } from "@/components/ProofRecipes";
import { MChapter } from "@/components/motion/MChapter";
import { RevealHeading } from "@/components/motion/RevealHeading";
import { fadeUp, irisDiamond, slideIn, scaleSoft } from "@/lib/motion-variants";
import { MMagnetic } from "@/components/motion/MMagnetic";
import { SplitText } from "@/components/motion/SplitText";
import { StickyScroll } from "@/components/motion/StickyScroll";
import { SequenceFilm, type FilmChip, type FilmCaption } from "@/components/SequenceFilm";
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
// The hero room's poster — first frame of the ring-loop film (K1 overhead:
// empty plate surrounded by abundance). ALSO the LCP. When production lands,
// HeroFilm gains webm/mp4 props pointing at 01-hero-film.{webm,mp4}.
const HERO_POSTER = "/media/generated/01-hero-film-poster.jpg";

const HERO = {
  kicker: "תזונת נשים · ליווי אישי",
  title: "את כבר יודעת מה לאכול.\nמה שחסר זה לא עוד תפריט.",
  lede: "אלא דרך שנבנית סביב השבוע האמיתי שלך, בלי לוותר על האוכל שאת אוהבת. כדי שסוף-סוף יהיה שקט בראש, והתוצאה תישאר.",
  ctaPrimary: "בואי נדבר",
  ctaSub: "שיחת היכרות חינם",
  // ONE trust line, split for the pill's sake: on <sm the license clause hides so
  // the pill stays a single-line pill (the full license lives in GUIDE.credentials
  // and /about); nothing is added or reworded — only shown by width.
  trustToken: "דיאטנית קלינית מוסמכת · R.D.",
  trustTokenLicense: " · רישיון משרד הבריאות",
  ctaRecipes: "עוד לא מוכנה לשיחה? המתכונים שלי כאן",
} as const;

// COPY: ### סקשן 1ב · StoryBridge (גשר-סיפור, 3 ביטים)
const BRIDGE_BEATS = [
  {
    src: "/media/generated/01b-bridge-s01.jpg",
    alt: "מטבח ביתי בשעת ערב, דלת מקרר פתוחה שופכת אור רך",
    side: "inline-start",
    big: "שבע בערב. היום הסתיים, והמקרר פתוח.",
    small: "עכשיו מגיע הרגע שכולן מכירות.",
  },
  {
    src: "/media/generated/01b-bridge-s02.jpg",
    alt: "משטח עץ עם רכיבים טריים שעוד לא הפכו לארוחה",
    side: "inline-end",
    big: "יש בבית הכל. ועדיין אין ארוחה.",
    small: "הפער הזה, בין לדעת לבין לעשות, הוא כל הסיפור.",
  },
  {
    src: "/media/generated/01b-bridge-s03.jpg",
    alt: "צלחת ריקה על שולחן מטבח מואר, מפית ומזלג לצידה",
    side: "center",
    big: "אז בואי נתחיל מצלחת אחת.",
    small: "ערב אחד. רק את והצלחת.",
  },
] as const;

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
// §03 room background — the desk the dossier spreads on (generated per plan
// layer 8: top-down desk, blank notebook, palette-locked linens, faceless).
const GUIDE_BG = "/media/generated/03-guide-desk.jpg";

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
  // the "לא X אלא Y" flip is the hero's line and stays THERE alone (it read as a
  // pasted twin here); the plan states the same thing plainly, in her own voice.
  lead: "תפריטים כבר יש לך. הדרך צריכה להיבנות סביב השבוע שלך.",
  steps: [
    {
      n: "01",
      t: "שיחת היכרות",
      d: "שיחה קצרה, בחינם ובלי שום התחייבות. את מספרת לי מה עובר עלייך עכשיו, מה כבר ניסית, ומה הכי מעייף אותך סביב האוכל, ואני בעיקר מקשיבה. בסוף השיחה נבין ביחד אם אני האדם הנכון ללוות אותך, ואם התשובה היא לא, אגיד לך את זה בכנות. זו שיחה, לא שיחת מכירה, ואת לא צריכה להגיע אליה מוכנה.",
    },
    {
      n: "02",
      t: "פגישה עמוקה + תוכנית אישית",
      d: "פגישה של 60 עד 75 דקות שיושבת לעומק: מה את אוהבת לאכול, איך נראה היום שלך באמת, מה כבר ניסית ומה נשבר בדרך, ובדיקות דם אם רלוונטי. אין כאן שיפוט ואין רשימת איסורים, יש הקשבה למה שבאמת קורה אצלך בשבוע. מהפגישה את יוצאת עם תוכנית אישית שנבנית סביב החיים שלך ולא במקומם, והאוכל שאת אוהבת נשאר בפנים. התוכנית נשארת אצלך, ולא נעלמת ברגע שיצאת מהחדר.",
    },
    {
      n: "03",
      t: "ליווי שנשאר",
      d: "אני לא נעלמת אחרי הפגישה, וזה בדיוק החלק שרוב הדיאטות מפספסות. בחבילות הליווי אני איתך בוואטסאפ בין המפגשים, לשאלות הקטנות שצצות באמצע היום ולרגעים שבהם מתחשק לוותר, ויש גם פידבק על יומן האכילה ומפגשי מעקב לאורך הדרך. ככה הדברים מפסיקים להיות רעיון יפה ונכנסים לשגרה, גם בשבועות העמוסים. המטרה שלי היא שלא תישארי לבד מול האתגרים של היום יום, ושבסוף הדרך יישאר לך משהו שהוא כבר שלך. לא עוד דיאטה שנגמרת.",
    },
  ],
  cta: "רוצה לראות איך זה נראה בפועל? הצצה למטבח שלי ←",
} as const;

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

// COPY: ### סקשן 5 · RecipeCard grid + ResultCard
const PROOF = {
  kicker: "תראי בעצמך",
  title: "היא באמת מבשלת",
  body: "לא עוד תמונה יפה. אוכל אמיתי שאני מבשלת, מתוך שבוע רגיל ועמוס.",
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
    note: "פעם אחת, בליווי, והאוכל שאת אוהבת נשאר על השולחן",
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

// COPY: ### סקשן 7 · חצי-קומפוזיציה: still-ערב + PullQuote (רעש→שקט)
const SUCCESS = {
  kicker: "ככה זה יכול להרגיש",
  lines: "בפעם הראשונה, אני לא בדיאטה.\nאכלתי בחוץ, נהניתי, ובלי אשמה.\nיש לי אנרגיה, ובראש שקט.",
  bridge: "וזה מתחיל בשיחה אחת, בלי לחץ. ←",
} as const;

// COPY: ### סקשן 7 — the settled noise: three of the film's thought-chips, now
// visibly AT REST — laid down over the frame's edge like notes set aside for
// good (decorative, aria-hidden — the motif resolves in plain sight).
const SETTLED_NOISE = [
  { text: "אוקיי, סלט. בטוח.", tilt: -3, offset: "0rem" },
  { text: "כמה קלוריות זה כבר?", tilt: 2, offset: "1.75rem" },
  { text: "בטטה בערב?!", tilt: -1.5, offset: "0.5rem" },
];

// COPY: ### סקשן 8 · ContactLeadForm (פאנל נייבי #lead)
const CTA = {
  title: "בואי נדבר.\nהצעד הראשון קטן, וחינם.",
  body: "שיחת היכרות קצרה, בלי התחייבות. נכיר, ונבין יחד אם אני האדם הנכון ללוות אותך אל השקט הזה.",
  packages:
    "הליווי נמכר בחבילות שמתאימות לחיים שלך. על זה בדיוק נדבר בשיחה, בלי הפתעות ובלי מחיר שקופץ מהמסך.",
  promise: "אני חוזרת אלייך אישית, עד 4 ימי עסקים.",
  // split like HERO.trustToken: the license clause hides below sm (pill stays one line)
  trustToken: "דיאטנית קלינית מוסמכת · R.D.",
  trustTokenLicense: " · רישיון משרד הבריאות",
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

  return (
    <>
      {/* structured identity for the front door (GEO/SEO) — same builder as /contact */}
      <JsonLd data={professionalService(site, services)} />
      {/* ── 01 · HOOK — «חדר הבוקר» (full-bleed film hero, Rom's call 2026-07-20):
             the kitchen morning IS the room now. HeroFilm mounts the poster as the
             LCP (static, eager, painted on the first frame) and swaps in the
             ring-loop film strictly after window.load — different camera angles
             setting one plate, produced via the scroll-cinema pipeline (webm/mp4
             props land when production does; until then this is a full-bleed
             poster hero). The words keep their exact choreography on a logical
             side scrim (paper solid under the text column, opening into the room);
             the thread is still born from the CTA's chamfered corner. The old
             gold-framed panel retires — its vocabulary lives on in §03/§07.
             The limp hero chip is GONE (Rom's call): the chip arc now opens in
             the film itself (→ §06 echo → §07 rest).
             data-light-hero: the floating header keeps its dark-ink treatment
             (the scrim keeps the top-start corner paper-bright). ── */}
      <section data-light-hero className="relative isolate flex min-h-[92svh] items-end overflow-hidden bg-bg lg:items-center">
        <HeroFilm poster={HERO_POSTER} objectPosition="70% center" />
        <div aria-hidden className="hero-scrim" />
        <Container width="wide" className="relative z-10 w-full pb-16 pt-44 sm:pt-56 md:pb-24 lg:py-24 lg:pb-32">
          {/* ONE orchestrator, same word choreography as ever — block-axis steps */}
          <MOrchestrate className="max-w-[620px]">
            <MItem as="p" className="flex items-center gap-2.5 text-[13px] font-bold tracking-[0.14em] text-muted">
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
              accentText="לא עוד תפריט"
              className="mt-5 font-serif font-black leading-[1.12] text-navy"
              style={{ fontSize: "clamp(2.1rem, 5vw, 3.3rem)" }}
            />
            <MItem as="p" className="mt-7 max-w-[54ch] text-lg leading-[1.7] text-ink">
              {HERO.lede}
            </MItem>
            <MItem className="mt-10">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-4">
                <div className="flex flex-col items-center gap-1.5">
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
                  <span className="text-[13px] font-semibold text-muted">{HERO.ctaSub}</span>
                </div>
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
            {/* «לידת החוט» (move 1, phase 1): a rose thread-tip born from the
                chamfered corner of "בואי נדבר", descending toward the film's
                sand arc. Absolute (zero layout cost), decorative, CSS-drawn;
                the recipes link below steps aside (lg:ps-7) to clear its lane. */}
            <div aria-hidden className="pointer-events-none relative hidden lg:block">
              <svg
                className="thread-birth thread-animate absolute -top-1 start-1 h-64 w-12 overflow-visible"
                viewBox="0 0 48 256"
                fill="none"
              >
                <path
                  d="M42 0C42 64 10 88 22 140C31 178 10 210 16 256"
                  pathLength={1}
                  stroke="var(--color-rose)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <MItem className="mt-7 lg:ps-7">
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

      {/* ── 01ב · STORY BRIDGE — the story-short between the morning room and the
             film («חדרים מצולמים»): three photo beats walk her from the promise's
             morning to the problem's seven-pm; beat 3 is generated against the
             film's opening frame, so the next scroll IS the film — a match-cut,
             not a jump. Non-pinned (MScrollScene) — the page's single pin stays
             the film. Copy from COPY.md « סקשן 1ב ». ── */}
      <StoryBridge beats={BRIDGE_BEATS} />

      {/* ── 02 · TENSION — the site's ONE signature moment: the pinned «בניית המנה»
             scroll-film (14 frames), noise-chips pile up → the turn → quiet on the
             gold frame. Static twin (reduced-motion / no-JS): final frame + PAS prose.
             The ShapedSection arc (sand — the film's own stage tone) is the soft-arc
             seam the direction mandates between the psychological beats: the hero
             exhales into the film instead of a hard photographic cut. ── */}
      {/* outer curve (edge=bottom): the film's sand stage EXHALES into the paper of
          the guide instead of a hard cut — the plan's soft-transitions program. */}
      <ShapedSection tone="sand" shape="curve" edge="bottom">
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
      </ShapedSection>

      {/* ── 03 · GUIDE — «הדוסייה על השולחן» (overlap-layered): the camera looks down at
             her work desk (a photo ROOM via MScrollScene, never a framed object) and
             the section assembles like a professional file spreading open — paper
             pieces arriving from meaningful sides, sewn together by drawn rose
             stitches (the "spec that connects while scrolling"). Portrait slot stays
             the honest empty-state (real Alona photo pending — never a generated
             face), now a waiting frame pinned to the file. Text NEVER sits on the
             bare photo — every piece is an opaque/milky paper card (AA). ── */}
      <section className="relative">
        <MScrollScene
          amplitude={4}
          mediaClassName="hidden md:block"
          media={
            <>
              <Image src={GUIDE_BG} alt="" fill sizes="100vw" quality={60} className="object-cover" />
              <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "var(--grade-tint)" }} />
              {/* mid-page material diet */}
              <div aria-hidden className="grain-overlay" style={{ "--grain-opacity": "0.035" } as React.CSSProperties} />
              {/* paper wash — the room stays present but never fights the pieces */}
              <div aria-hidden className="absolute inset-0 bg-bg/72" />
            </>
          }
        >
          {/* mobile: the room becomes a quiet top band (the coaching §14 pattern) —
              the full-bleed backdrop is desktop-only, saving decode where we measure */}
          <div className="relative aspect-[3/2] overflow-hidden border-b border-line md:hidden">
            <Image src={GUIDE_BG} alt="" fill sizes="100vw" quality={60} className="object-cover" />
            <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "var(--grade-tint)" }} />
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-bg via-bg/25 to-transparent" />
          </div>
          <Container width="wide" className="py-14 sm:py-16 md:py-24">
            <SectionSeam className="mb-10" />
            {/* the heading rides its own paper strip — never bare over the photo */}
            <div className="inline-block rounded-[10px] bg-bg/90 md:px-7 md:py-5 md:backdrop-blur-sm">
              <SectionHeading eyebrow={GUIDE.kicker} title={GUIDE.title} accent="מכירה" />
            </div>
            <MOrchestrate className="relative mt-12 grid items-start gap-x-12 gap-y-9 md:grid-cols-[0.85fr_1.15fr]">
              {/* the drawn stitches — three short rose seams sewing the file together
                  as it opens (decorative; drawn on the DiagramReveal token timing) */}
              <DiagramReveal className="pointer-events-none absolute inset-0 z-10 hidden text-rose md:block">
                <svg
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  aria-hidden
                  className="h-full w-full"
                >
                  <path d="M 42 24 Q 48 20 54 24 T 66 24" vectorEffect="non-scaling-stroke" />
                  <path d="M 44 54 Q 50 58 56 54 T 68 54" vectorEffect="non-scaling-stroke" />
                  <path d="M 26 78 Q 32 82 38 78 T 50 78" vectorEffect="non-scaling-stroke" />
                </svg>
              </DiagramReveal>
              {/* file anchor column — RTL inline-start (right): the calling card,
                  dropped on the desk at a hand-placed tilt, pinned like a photo */}
              <div className="mx-auto w-full max-w-[420px]">
                <MItem variants={scaleSoft}>
                  <div className="relative rotate-[-1.5deg]">
                    {/* the pin — the ◆ glyph holding the card to the file */}
                    <span
                      aria-hidden
                      className="absolute -top-2 start-1/2 z-10 h-4 w-4 translate-x-1/2 rotate-45 border border-gold/60 bg-gold-soft"
                    />
                    <div
                      // a calling card is LANDSCAPE — the portrait ratio was inflating
                      // this column ~190px past the pieces column and opening dead desk
                      // below the file (Rom: "מה שיש מתחת לתמונה אפשר להסיר")
                      className="frame-double relative flex aspect-[7/5] flex-col items-center justify-center gap-2.5 rounded-[16px] bg-gold-soft p-7 text-center"
                      style={{ "--frame-gap": "7px", "--frame-color": "var(--color-gold)" } as React.CSSProperties}
                    >
                      <div aria-hidden className="grain-overlay" style={{ "--grain-opacity": "0.035" } as React.CSSProperties} />
                      <span className="relative text-[0.65rem] leading-none text-gold" aria-hidden>◆</span>
                      <div className="relative font-serif text-3xl font-bold text-navy">{GUIDE.name}</div>
                      <span aria-hidden className="relative h-[3px] w-10 rounded-full bg-rose" />
                      <div className="relative font-serif text-base font-semibold text-navy-700">{GUIDE.role}</div>
                    </div>
                  </div>
                </MItem>
                {/* the age answer — a small note tilted the OTHER way, her voice
                    answering the card in place */}
                <MItem variants={fadeUp} className="mt-8">
                  <figure className="rotate-[1.2deg] rounded-[12px] border border-line border-s-4 border-s-rose bg-card p-5 shadow-[var(--elevation-1)] md:bg-card/90 md:backdrop-blur-md">
                    <blockquote className="font-serif text-lg italic leading-relaxed text-navy">
                      {GUIDE.ageLine}
                    </blockquote>
                  </figure>
                </MItem>
              </div>
              {/* the file's pieces — empathy strictly before authority */}
              <div className="flex flex-col gap-7">
                {/* her voice arrives from the reading edge (inline-start = right) */}
                <MItem variants={slideIn("inline-start", 48)}>
                  <div className="rounded-[12px] border border-line bg-card p-6 shadow-[var(--elevation-1)] md:bg-card/90 md:backdrop-blur-md">
                    <p className="max-w-[62ch] text-lg leading-[1.7] text-ink">{GUIDE.empathy}</p>
                  </div>
                </MItem>
                {/* the official record arrives from the OTHER side — a stamp is not
                    a voice, it comes from the world */}
                <MItem variants={slideIn("inline-end", 48)}>
                  <div className="rounded-[12px] border border-line bg-card p-6 shadow-[var(--elevation-1)] md:bg-card/90 md:backdrop-blur-md">
                    <RecognitionBadges badges={[...GUIDE.credentials]} />
                  </div>
                </MItem>
                {/* index tabs at the file's bottom edge — the mechanism */}
                <ul className="flex flex-wrap gap-2.5">
                  {GUIDE.mechanism.map((m) => (
                    <MItem as="li" key={m}>
                      <span className="inline-block rounded-t-[10px] border border-b-2 border-line border-b-rose bg-card px-4 py-2.5 font-serif text-base font-bold text-navy md:bg-card/90 md:backdrop-blur-md">
                        {m}
                      </span>
                    </MItem>
                  ))}
                </ul>
                <MItem className="mt-2">
                  <Link
                    href="/coaching"
                    data-cta="guide-to-coaching"
                    className="font-bold text-gold-ink underline-offset-4 transition hover:underline"
                  >
                    {GUIDE.cta}
                  </Link>
                </MItem>
              </div>
            </MOrchestrate>
          </Container>
        </MScrollScene>
      </section>

      {/* ── 04 · PLAN — sticky-scroll ladder: three named rungs climb from a free call
             to the support that stays. Rungs 01–02 carry the generated stills (the
             conversation · the weekly plan, plan layer 8); rung 03 keeps the designed
             sage panel so the ladder ends on the site's own calm. ── */}
      <ShapedSection tone="sand" shape="arc" edge="top">
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
              <div aria-hidden className="absolute inset-0 bg-sand/82" />
              <div aria-hidden className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-sand to-transparent" />
            </>
          }
        >
        <Container width="wide" className="py-16 sm:py-20 md:py-32">
          {/* the thread arrives from the dossier — one stitch entering the room */}
          <DiagramReveal className="mx-auto mb-8 hidden h-6 w-28 text-rose md:block">
            <svg viewBox="0 0 112 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" aria-hidden className="h-full w-full">
              <path d="M 6 12 Q 20 5 34 12 T 62 12 T 90 12 L 106 12" vectorEffect="non-scaling-stroke" />
            </svg>
          </DiagramReveal>
          <SectionHeading eyebrow={PLAN.kicker} title={PLAN.title} lead={PLAN.lead} accent="בשפה שלך" />
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
          {/* chapter seam out of the plan — ◆ hairlines hand the story to the proof */}
          <MChapter />
        </Container>
        </MScrollScene>
      </ShapedSection>

      {/* ── 05 · PROOF — card-grid: a random trio of real CMS recipes per visit;
             testimonial + media-logo slots stay honestly DARK until real. ── */}
      <Section tone="white" border id="proof">
        <SectionHeading eyebrow={PROOF.kicker} title={PROOF.title} lead={PROOF.body} accent="באמת" />
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
        {/* the honest dark slots — ONE quiet wash band, structurally dark until real
            proof lands (soft wash + ◆, never card-sized ghosts, never dashed chrome) */}
        {/* two honest notes, separated by the rose thread — the ◆ is a STRUCTURE mark
            (kickers + step markers), never sentence punctuation. */}
        <div className="mt-10 rounded-[16px] bg-bg2 px-6 py-4 text-center">
          <p className="text-sm leading-relaxed text-muted">{PROOF.darkTestimonial}</p>
          <span aria-hidden className="mx-auto my-3 block h-[2px] w-10 rounded-full bg-rose" />
          <p className="text-sm leading-relaxed text-muted">{PROOF.darkLogos}</p>
        </div>
      </Section>

      {/* ── 06 · STAKES — comparison: another noisy year vs the quiet way, the cost
             priced in noise and guilt (never kilos), the easy free step welded beneath.
             THE FORK: the two futures approach from OPPOSITE inline sides (Comparison
             fork mode); the block overlaps up out of the proof band ("the choice rises
             out of the proof"); the sage wash at the bottom flows seamlessly into the
             Success field — no drawn seam before the emotional peak. ── */}
      <section
        className="relative"
        // «חוט ואור» move 3 (material diet): the paper warms INTO §07's golden
        // hour — token-only gradient, no drawn seam before the emotional peak
        style={{ background: "linear-gradient(180deg, var(--color-bg) 0%, var(--color-gold-soft) 100%)" }}
      >
        <Container width="wide" className="pb-32 pt-4 sm:pb-36 md:pb-44 md:pt-6">
          <div className="relative z-10 -mt-10 rounded-[16px] border border-line bg-bg p-7 shadow-[var(--elevation-2)] md:-mt-14 md:p-10">
            <SectionHeading eyebrow={STAKES.kicker} title={STAKES.title} accent="שקטה" />
            <p className="mt-8 font-serif text-lg italic text-rose-ink">{STAKES.cue}</p>
            <Comparison
              className="mt-5"
              fork
              // the film hands each future its own frame: the noisy year gets the
              // chaos peak (s07), the quiet way gets the finished plate (s14) —
              // both already in cache from the film, zero new bytes
              left={{ label: STAKES.quiet.label, note: STAKES.quiet.note, points: [...STAKES.quiet.points], highlight: true, ghost: FILM_FRAMES[13] }}
              right={{ label: STAKES.noisy.label, note: STAKES.noisy.note, points: [...STAKES.noisy.points], noisy: true, echo: FILM_CHIPS[3].text, ghost: FILM_FRAMES[6] }}
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
        {/* the shared sage wash: begins inside the stakes' bottom padding and flows
            into the Success gradient field — the seamless breath before the peak */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-28 md:h-36"
          style={{ background: "linear-gradient(180deg, transparent 0%, var(--color-gold-soft) 100%)" }}
        />
      </section>

      {/* ── 07 · SUCCESS — «חדר שעת הזהב» (background-art): the peak goes full-bleed.
             The golden-hour restaurant IS the room now (wide still via MScrollScene);
             the whole scene uncovers through the growing ◆ (irisDiamond on the media
             layer — the glyph that was a picture's shutter becomes the evening's).
             One milky ivory card carries the felt-lines; the film's noise-chips rest
             on ITS edge, set down for good. Zero grain — the material diet's clean
             end. A dusk gradient hands the evening to §08's navy night, where the
             gold ◆ of the form is the light that stays. ── */}
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
              </div>
            </MStagger>
          }
        >
          <Container width="wide" className="py-24 md:py-40">
            <MOrchestrate className="md:max-w-[660px]">
              {/* her own voice arrives from the reading edge, on ivory paper */}
              <MItem variants={slideIn("inline-start", 32)}>
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
                  <MItem variants={slideIn("inline-start", 32)} className="mt-9">
                    <Link
                      href="#lead"
                      data-cta="success-to-lead"
                      className="btn-chamfer inline-block rounded-[6px] border-2 border-navy/30 bg-bg/70 px-7 py-3.5 text-lg font-semibold text-navy transition hover:border-navy/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
                    >
                      {SUCCESS.bridge}
                    </Link>
                  </MItem>
                  {/* the settled noise — the film's thought-chips, laid down over the
                      card's END edge (the motif resolves in plain sight; the bridge
                      button owns the start side, so the two never collide) */}
                  <div aria-hidden className="absolute -bottom-7 end-6 flex flex-col items-end gap-2 md:end-9">
                    {SETTLED_NOISE.map((w) => (
                      <span
                        key={w.text}
                        className="inline-block whitespace-nowrap rounded-full border border-line bg-bg/90 px-4 py-1.5 font-serif text-[0.95rem] italic text-muted shadow-sm"
                        style={{ transform: `rotate(${w.tilt}deg)`, marginInlineEnd: w.offset }}
                      >
                        {w.text}
                      </span>
                    ))}
                  </div>
                </div>
              </MItem>
            </MOrchestrate>
          </Container>
          {/* dusk — the golden hour darkens into the navy night of §08 */}
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-navy md:h-36" />
        </MScrollScene>
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
                className="inline-flex items-center rounded-full bg-sand px-4 py-2.5 text-sm font-semibold text-navy transition hover:bg-card"
              >
                <span>
                  {CTA.trustToken}
                  <span className="hidden sm:inline">{CTA.trustTokenLicense}</span>
                </span>
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
              <span className="text-[0.95rem] font-medium leading-relaxed">{CTA.magnet}</span>
            </Link>
          </div>
        </div>
      </Section>
    </>
  );
}
