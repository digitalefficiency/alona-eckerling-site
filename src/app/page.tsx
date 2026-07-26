import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { SeamShape } from "@/components/layout/SeamShape";
import { SectionHeading } from "@/components/SectionHeading";
import { MOrchestrate, MItem } from "@/components/motion/MOrchestrate";
import { MStagger } from "@/components/motion/MStagger";
import { MScrollScene } from "@/components/motion/MScrollScene";
import { DrawnRule } from "@/components/motion/DrawnRule";
import { HeroFilm } from "@/components/media/HeroFilm";
import { ProofRecipes } from "@/components/ProofRecipes";
import { RevealHeading } from "@/components/motion/RevealHeading";
import { irisDiamond, slideIn } from "@/lib/motion-variants";
import { MMagnetic } from "@/components/motion/MMagnetic";
import { SplitText } from "@/components/motion/SplitText";
import { StickyScroll } from "@/components/motion/StickyScroll";
import { SequenceFilm, type FilmChip, type FilmCaption } from "@/components/SequenceFilm";
import { Comparison } from "@/components/section/Comparison";
import { DishRibbon } from "@/components/section/DishRibbon";
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
// empty plate surrounded by abundance). ALSO the LCP — the video starts on
// this exact frame, so the swap from poster to film is invisible.
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
  // decorative only (aria-hidden): tells the eye the room continues below the
  // fold. Deliberately NOT phrased as "skip to content" — layout.tsx already
  // ships the WCAG skip-link, and two similar promises confuse a screen reader.
  scrollCue: "גללי",
} as const;

// COPY: ### סקשן 2 · סרט-גלילה «בניית המנה» (צ'יפים + כיתובי-תחנה)
const FILM = {
  kicker: "מוכר לך? · צלחת אחת, ערב אחד",
  staticKicker: "מוכר לך?",
  staticHeading: "ניסית כבר הכל, והאוכל עדיין מרגיש כמו מלחמה.",
  staticBody:
    'את יודעת בדיוק מה נכון לאכול, אבל לבד זה לא מחזיק. כל ביס מגיע עם חשבון בראש, וביס אחד "לא נכון" הופך מהר ל"היום כבר נהרס". ארוחה אמיתית, בלי חשבון ובלי אשמה, אפשרית, ואת לא צריכה להגיע לזה לבד.',
  finalAlt: "צלחת מאוזנת ומלאה, ערוכה ומוכנה",
  // the way out of the 420vh pinned runway (WCAG 2.2 — never trap the reader).
  // It lands on §03, so skipping the problem delivers you to the person holding
  // the way through it, never to a dead end.
  skipLabel: "דלגי קדימה",
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
// REAL portrait (cl-101, MEDIA-PLAN §3) — never a generated face, never stock.
const GUIDE_PORTRAIT = "/media/client/alona/alona-guide.jpg";

const GUIDE = {
  kicker: "נעים להכיר",
  title: "אני מכירה את הבלבול הזה",
  empathy:
    "גם אני עמדתי מול הבלגן הזה. בשלב מסוים כבר לא ידעתי מה נכון ומה לא נכון. בדיוק בגלל זה הלכתי ללמוד, כדי להבין מה באמת קורה בגוף שלנו.",
  ageLine:
    "כן, אני צעירה. וזה בדיוק מה שמאפשר לי להחזיק את המדע הכי עדכני, ולדבר איתך בגובה העיניים, לא מלמעלה.",
  name: "אלונה אקרלינג",
  role: "דיאטנית קלינית מוסמכת · R.D.",
  portraitAlt: "אלונה אקרלינג, דיאטנית קלינית מוסמכת, אוכלת מקערה במטבח שלה",
  credentials: [
    "דיאטנית קלינית מוסמכת · R.D.",
    "רישיון משרד הבריאות 204526-11",
    "B.Sc במדעי התזונה",
    "התמחות קלינית · איכילוב",
  ],
  mechanism: ["דיאטנית שמבשלת", "נבנה סביב השבוע שלך", "מדע עדכני", "ליווי אחת-על-אחת"],
  // COPY: ### סקשן 3 — תחומי ליווי (נוסף 2026-07-26)
  // The dossier metaphor earns this: a file on the desk lists what it covers.
  // The last three arrived from Alona via Rom; the first two were already in the
  // positioning, and pairing them is what makes this read as a list of areas
  // rather than a new announcement. [לאימות מולה: ניסוח במילים שלה]
  areasLabel: "תחומי ליווי",
  areas: [
    "תזונת הריון",
    "שחלות פוליציסטיות (PCOS)",
    "טרום סוכרת ואיזון מדדי דם",
    "ירידה במשקל בלי דיאטה",
    "אכילה רגשית",
  ],
  // The YMYL guardrail, rendered — never a promise to move a lab value.
  areasNote: "בתחומים הרפואיים אני עובדת לצד הרופא או הרופאה שמלווים אותך, לא במקומם.",
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

// COPY: ### סקשן 5 — רצועת המנות (הרחבה של ביט ה-PROOF, 2026-07-26)
// המנות אמיתיות ומצולמות על ידה; נבחרו לעוצמה ויזואלית באריח אחיד (MEDIA-PLAN §2)
// — פריימים דהויים (מרק בקערת זכוכית, כוסות פרפה על שיש אפור) נפסלו בכוונה.
const RIBBON = {
  kicker: "מהמטבח שלי",
  note: "כל מתכון כאן נבדק אצלי בבית לפני שהוא מגיע אלייך. אלה לא צילומי מאגר.",
  tiles: [
    { src: "/media/client/alona/ribbon/kale-chickpea.jpg", alt: "קערת עלים ירוקים עם חומוס קלוי ובצל סגול כבוש" },
    { src: "/media/client/alona/ribbon/pancakes-figs.jpg", alt: "מגדל פנקייקים עם תאנים, בננה ואוכמניות" },
    { src: "/media/client/alona/ribbon/roasted-tray.jpg", alt: "תבנית ירקות שורש צלויים עם רוזמרין ולימון" },
    { src: "/media/client/alona/ribbon/fruit-bowl.jpg", alt: "קערת פירות חתוכים: מלון, אבטיח, קיווי ואוכמניות" },
    { src: "/media/client/alona/ribbon/pepper-salad.jpg", alt: "סלט פלפלים צבעוניים, מלפפון ובצל" },
    { src: "/media/client/alona/ribbon/cauliflower-dip.jpg", alt: "כרובית פריכה בציפוי זהוב לצד רוטב ירוק" },
    { src: "/media/client/alona/ribbon/fritters-tray.jpg", alt: "תבנית אפייה מלאה בלביבות זהובות" },
    { src: "/media/client/alona/ribbon/chickpea-bowl.jpg", alt: "קערה עם חומוס קלוי, עלים ירוקים ובצל כבוש" },
    { src: "/media/client/alona/ribbon/quinoa-platter.jpg", alt: "מגש קינואה עם ירק קצוץ ושקדים" },
    { src: "/media/client/alona/ribbon/lasagna-basil.jpg", alt: "לזניה בתבנית עם עלי בזיליקום טריים" },
    { src: "/media/client/alona/ribbon/green-pasta.jpg", alt: "מחבת פסטה ברוטב ירוק עם גבינה מגוררת" },
    { src: "/media/client/alona/ribbon/focaccia.jpg", alt: "פוקצ'ה ביתית עם שומשום וזיתים" },
    { src: "/media/client/alona/ribbon/rice-pan.jpg", alt: "מחבת אורז צהוב עם ירקות" },
  ],
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
             Header safety is DEFAULT-ON: the white nav treatment requires an
             explicit [data-dark-hero], so a light hero can never ship an
             invisible nav. The old data-light-hero marker was a no-op (nothing
             ever read it) and was removed. ── */}
      <section className="relative isolate flex min-h-[92svh] items-end overflow-hidden bg-bg lg:items-center" style={{ "--grade-tint": "var(--hour-morning)" } as React.CSSProperties}>
        <HeroFilm
          poster={HERO_POSTER}
          webm="/media/generated/01-hero-film.webm"
          mp4="/media/generated/01-hero-film.mp4"
          objectPosition="70% center"
        />
        <div aria-hidden className="hero-scrim" />
        {/* soft-curve seam (Rom 2026-07-20): the cream ground crests up into the
            morning room — a shaped hand-off into the film, not a hard photo cut */}
        <SeamShape variant="curve-up" />
        <Container width="wide" className="relative z-10 w-full pb-16 pt-44 sm:pt-56 md:pb-24 lg:py-24 lg:pb-32">
          {/* ONE orchestrator, same word choreography as ever — block-axis steps */}
          <MOrchestrate className="max-w-[620px]">
            <MItem as="p" className="flex items-center gap-2.5 text-[13px] font-bold tracking-eyebrow text-muted">
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
            {/* the hero thread-birth was removed with the site-wide thread
                (Rom 2026-07-20: "החוט לא קשור לכלום") — the connective tissue is
                now the soft photo dissolves between rooms, not a drawn line. */}
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
        {/* scroll cue — decorative only, and desktop only. On mobile the layout
            is items-end with the CTA already near the fold, so a cue would both
            crowd it and state the obvious; at lg the hero centres and the room
            below genuinely needs announcing. Sits above the seam (z-20). */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-8 z-20 hidden justify-center lg:flex">
          <span className="inline-flex flex-col items-center gap-1 text-[0.7rem] font-bold tracking-eyebrow text-muted">
            {HERO.scrollCue}
            <span className="hero-cue-arrow text-sm leading-none text-gold">↓</span>
          </span>
        </div>
      </section>

      {/* ── 02 · TENSION — the site's ONE signature moment: the pinned «בניית המנה»
             scroll-film (14 frames), noise-chips pile up → the turn → quiet on the
             gold frame. Static twin (reduced-motion / no-JS): final frame + PAS prose.
             No arcs, no curves: the ONE seam of this site is the thread, which
             simply keeps descending behind the stage (2026-07-20 — seven seam
             mechanisms collapsed into one). The film is not an island; it is a
             room the thread passes through. ── */}
      <div className="relative bg-bg">
          {/* fade the film's hard top edge so it dissolves in from the hero's seam */}
          <div aria-hidden className="room-edges-top z-10" />
          <SequenceFilm
            frames={FILM_FRAMES}
            kicker={FILM.kicker}
            chips={FILM_CHIPS}
            captions={FILM_CAPTIONS}
            staticKicker={FILM.staticKicker}
            staticHeading={FILM.staticHeading}
            staticBody={FILM.staticBody}
            finalAlt={FILM.finalAlt}
            skipHref="#guide"
            skipLabel={FILM.skipLabel}
          />
          {/* mirror-curve seam into the dossier — opposite direction to the hero's */}
          <SeamShape variant="curve-down" />
      </div>

      {/* ── 03 · GUIDE — «הדוסייה על השולחן» (overlap-layered): the camera looks down at
             her work desk (a photo ROOM via MScrollScene, never a framed object) and
             the section assembles like a professional file spreading open — paper
             pieces arriving from meaningful sides, sewn together by drawn rose
             stitches (the "spec that connects while scrolling"). Portrait slot stays
             the honest empty-state (real Alona photo pending — never a generated
             face), now a waiting frame pinned to the file. Text NEVER sits on the
             bare photo — every piece is an opaque/milky paper card (AA).
             id="guide" is the film's escape-hatch target (§02 skip control); the
             global scroll-padding-top of 6rem clears the fixed header, so no
             per-section scroll-mt is needed here. ── */}
      <section id="guide" className="relative">
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
              {/* top fade only — the seam shape carries the bottom hand-off */}
              <div aria-hidden className="room-edges-top" />
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
          <Container width="wide" className="py-16 sm:py-20 md:py-32">
            {/* the heading rides its own paper strip — never bare over the photo */}
            <div className="inline-block rounded-[10px] bg-bg/90 md:px-7 md:py-5 md:backdrop-blur-sm">
              <SectionHeading eyebrow={GUIDE.kicker} title={GUIDE.title} accent="מכירה" />
            </div>
            <MOrchestrate className="relative mt-12 grid items-start gap-x-12 gap-y-9 md:grid-cols-[0.85fr_1.15fr]">
              {/* file anchor column — RTL inline-start (right): the calling card,
                  dropped on the desk at a hand-placed tilt, pinned like a photo.
                  Rom 2026-07-20: the age-quote note below it is removed and the
                  card enlarged back to portrait — nothing sits under it now, so
                  the taller ratio balances the pieces column instead of opening
                  dead desk. */}
              <div className="mx-auto w-full max-w-[440px] md:self-center">
                <MItem>
                  <div className="relative rotate-[-1.5deg]">
                    {/* the pin — the ◆ glyph holding the card to the file */}
                    <span
                      aria-hidden
                      className="absolute -top-2 start-1/2 z-10 h-4 w-4 translate-x-1/2 rotate-45 border border-gold/60 bg-gold-soft"
                    />
                    {/* the real portrait (2026-07-25, MEDIA-PLAN §3): the honest
                        empty-state retired — Alona's own photo, supplied to the
                        project Drive on 2026-07-23, now fills the calling card.
                        The name/role stay on an OPAQUE ivory strip at the foot,
                        never over the bare photo (this room's AA rule). */}
                    <div
                      className="frame-double relative aspect-[4/5] overflow-hidden rounded-[16px] bg-gold-soft"
                      style={{ "--frame-gap": "7px", "--frame-color": "var(--color-gold)" } as React.CSSProperties}
                    >
                      <Image
                        src={GUIDE_PORTRAIT}
                        alt={GUIDE.portraitAlt}
                        fill
                        sizes="(max-width: 768px) 88vw, 440px"
                        className="object-cover"
                      />
                      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "var(--grade-tint)" }} />
                      <div aria-hidden className="grain-overlay" style={{ "--grain-opacity": "0.035" } as React.CSSProperties} />
                      <div className="absolute inset-x-0 bottom-0 bg-bg/94 px-5 py-4 text-center">
                        <span className="block text-[0.65rem] leading-none text-gold" aria-hidden>◆</span>
                        <div className="mt-2 font-serif text-2xl font-bold text-navy">{GUIDE.name}</div>
                        <span aria-hidden className="mx-auto mt-2 block h-[3px] w-10 rounded-full bg-rose" />
                        <div className="mt-2 font-serif text-sm font-semibold text-navy-700">{GUIDE.role}</div>
                      </div>
                    </div>
                  </div>
                </MItem>
              </div>
              {/* the file's pieces — empathy strictly before authority */}
              <div className="flex flex-col gap-7">
                {/* one entrance verb for the whole room (constitution rule 4):
                    the file's pieces settle in reading order on the block axis.
                    The old four-grammar mix here was the biggest violation in the
                    code, and its horizontal travel also overflowed 390px phones. */}
                <MItem>
                  <div className="rounded-[12px] border border-line bg-card p-6 shadow-[var(--elevation-1)] md:bg-card/90 md:backdrop-blur-md">
                    <p className="max-w-[62ch] text-lg leading-[1.7] text-ink">{GUIDE.empathy}</p>
                  </div>
                </MItem>
                <MItem>
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
                {/* areas of care — a paper slip clipped under the index tabs, so
                    the dossier says what it covers. Deliberately quieter than the
                    mechanism tabs above it: this is reference, not the pitch. */}
                <MItem className="mt-6">
                  <div className="rounded-[10px] border border-line bg-card/90 px-5 py-4 md:backdrop-blur-md">
                    <p className="flex items-center gap-2 text-[13px] font-bold tracking-eyebrow text-gold-ink">
                      <span className="text-[0.6rem] leading-none" aria-hidden>◆</span>
                      {GUIDE.areasLabel}
                    </p>
                    <ul className="mt-3 flex flex-wrap gap-x-2.5 gap-y-2">
                      {GUIDE.areas.map((a) => (
                        <li
                          key={a}
                          className="rounded-full bg-sand px-3.5 py-1.5 text-sm font-semibold text-navy"
                        >
                          {a}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3.5 text-sm leading-relaxed text-muted">{GUIDE.areasNote}</p>
                  </div>
                </MItem>
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
        {/* soft-curve seam into the plan (crest — opposite the film's trough) */}
        <SeamShape variant="curve-up" />
      </section>

      {/* ── 03b · the dish ribbon — an EXTENSION of §03's GUIDE beat, not a new section.
             §03 answers "who is she"; the ribbon answers it in her own material —
             "a dietitian who really cooks" stops being a claim in a credential chip
             and becomes a wall of the food she actually made. Placed here (rather
             than beside the recipe grid at §05) so the proof-of-craft lands while
             the reader is still meeting her. The narrative chain is untouched: no
             new beat, no arrives/leaves contract rewritten. Archetype: marquee —
             adjacent to overlap-layered (§03) and sticky-scroll (§04), both
             distinct, and §21 holds marquee on /about where the rule is per-page. ── */}
      <div className="border-y border-line bg-card py-16 sm:py-20 md:py-24">
        <Container width="wide">
          <p className="mb-7 flex items-center justify-center gap-2.5 text-center">
            <span className="text-[0.7rem] leading-none text-gold" aria-hidden>◆</span>
            <span className="text-xs font-bold tracking-eyebrow text-gold-ink">{RIBBON.kicker}</span>
          </p>
        </Container>
        <DishRibbon tiles={RIBBON.tiles} />
        <Container width="wide">
          <p className="mt-7 text-center text-sm text-muted">{RIBBON.note}</p>
        </Container>
      </div>

      {/* ── 04 · PLAN — sticky-scroll ladder: three named rungs climb from a free call
             to the support that stays. Rungs 01–02 carry the generated stills (the
             conversation · the weekly plan, plan layer 8); rung 03 keeps the designed
             sage panel so the ladder ends on the site's own calm. ── */}
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
        </Container>
        </MScrollScene>
        {/* mirror-curve seam into the proof — trough, opposite the dossier's crest */}
        <SeamShape variant="curve-down" />
      </div>

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
      <section className="relative" style={{ "--grade-tint": "var(--hour-golden)" } as React.CSSProperties}>
        <Container width="wide" className="pb-32 pt-4 sm:pb-36 md:pb-44 md:pt-6">
          <div className="relative z-10 rounded-[16px] border border-line bg-bg p-7 shadow-[var(--elevation-2)] md:p-10">
            <SectionHeading eyebrow={STAKES.kicker} title={STAKES.title} accent="שקטה" />
            <p className="mt-8 font-serif text-lg italic text-rose-ink">{STAKES.cue}</p>
            <Comparison
              className="mt-5"
              fork
              // the film hands each future its own frame: the noisy year gets the
              // chaos peak (s07), the quiet way gets the finished plate (s14) —
              // both already in cache from the film, zero new bytes
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
                      "תוריד את הפיצרים הקטנים האלו על התמונה") — the thought-chips
                      now live ONLY inside the film, where they are the story. The
                      evening room stays a clean photograph with one ivory card. */}
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
    </>
  );
}
