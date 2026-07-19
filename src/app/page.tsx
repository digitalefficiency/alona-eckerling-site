import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { SectionSeam } from "@/components/layout/SectionSeam";
import { ShapedSection } from "@/components/layout/ShapedSection";
import { SectionHeading } from "@/components/SectionHeading";
import { MOrchestrate, MItem } from "@/components/motion/MOrchestrate";
import { MStagger } from "@/components/motion/MStagger";
import { ProofRecipes } from "@/components/ProofRecipes";
import { MChapter } from "@/components/motion/MChapter";
import { RevealHeading } from "@/components/motion/RevealHeading";
import { slideIn, scaleSoft } from "@/lib/motion-variants";
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
  // the "לא X אלא Y" flip is the hero's line and stays THERE alone (it read as a
  // pasted twin here); the plan states the same thing plainly, in her own voice.
  lead: "תפריטים כבר יש לך. הדרך צריכה להיבנות סביב השבוע שלך.",
  steps: [
    {
      n: "01",
      t: "שיחת היכרות",
      d: "בחינם, בלי התחייבות. נכיר, ונבין ביחד אם אני האדם הנכון ללוות אותך.",
    },
    {
      n: "02",
      t: "פגישה עמוקה + תוכנית אישית",
      d: "60 עד 75 דקות שיושבות לעומק: מה את אוהבת לאכול ואיך נראה היום שלך. יוצאות עם תוכנית שנבנית סביב החיים שלך, והאוכל שאת אוהבת נשאר בפנים.",
    },
    {
      n: "03",
      t: "ליווי שנשאר",
      d: "אני לא נעלמת אחרי הפגישה. בין המפגשים אני איתך בוואטסאפ, עם פידבק על יומן האכילה, כדי שהדברים ייכנסו לשגרה ויישארו. לא עוד דיאטה שנגמרת.",
    },
  ],
  cta: "רוצה לראות איך זה נראה בפועל? הצצה למטבח שלי ←",
} as const;

// Rung media (rungs 01–02 only; rung 03 keeps the designed sage panel so the ladder
// ends on the site's own calm). 01 stays the generated still — decorative, alt="".
// 02 is now a REAL dish from her kitchen (one pot for the week IS that rung's story),
// so it earns a real alt: informative, factual, straight off the recipe's own card.
const PLAN_MEDIA: readonly { src: string; alt: string }[] = [
  { src: "/media/generated/11-method-two-cups.jpg", alt: "" },
  {
    src: "/media/client/recipes/one-pot-bulgur-stew.jpg",
    alt: "תבשיל בורגול עם ירקות וקטניות בסיר אחד, מהמתכונים של אלונה",
  },
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
      {/* ── 01 · HOOK — a COMPOSITION, not a veiled backdrop. The owner's own note
             ("כותרות על תמונות") retired the full-bleed veil + blur orbs: the words
             now sit on OPAQUE warm paper and the photograph is an OBJECT — a gold
             double-framed panel that bleeds off the inline-end edge of the screen
             and leans into the text track with real elevation. The boundary between
             word and image is HARD (the frame), never a gradient.
             The <img> is ONE swappable slot: a real consultation photo of Alona
             replaces this still later — same src attribute, same priority hints.
             data-light-hero: the floating header must take its dark-ink treatment
             here (light paper, not a dark hero). ── */}
      <section data-light-hero className="relative isolate overflow-hidden bg-bg">
        <div aria-hidden className="grain-overlay" />
        <Container width="wide" className="py-16 pb-24 md:py-24 md:pb-36">
          {/* ONE orchestrator for the whole composition: the words step in block-axis,
              the framed panel settles beside them (scaleSoft — the media variant). */}
          <MOrchestrate className="grid items-center gap-12 lg:min-h-[64vh] lg:grid-cols-[1fr_0.8fr] lg:gap-6">
            {/* the words — inline-start (right in RTL), on plain warm paper. z-10 keeps
                the copy above the panel at every paint; pe-16 holds the reading measure
                clear of the panel's frame where it crosses into this track. */}
            <div className="relative z-10 lg:pe-16">
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
                // sized to the COLUMN, not the screen: at the 3.2rem ceiling both
                // designed lines (\n) fit the ~585px lg text track as the 2 lines
                // they were broken into; the 2.1rem floor matches --text-display's
                // floor so ≤390px screens keep the CTA above the fold
                style={{ fontSize: "clamp(2.1rem, 5vw, 3.2rem)" }}
              />
              <MItem as="p" className="mt-7 max-w-[62ch] text-lg leading-[1.7] text-muted">
                {HERO.lede}
              </MItem>
              <MItem className="mt-10">
                <div className="flex flex-wrap items-center gap-x-5 gap-y-4">
                  <div className="flex flex-col items-center gap-1.5">
                    <Link
                      href="#lead"
                      data-cta="hero-primary"
                      className="btn-chamfer rounded-[6px] bg-gold px-8 py-4 text-base font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
                    >
                      {HERO.ctaPrimary}
                    </Link>
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
            </div>
            {/* the photograph as an OBJECT — a framed panel bleeding off the inline-end
                edge of the SCREEN (the negative inline-end margin resolves the container
                gutter + the outer margin at every width; the section clips the overspill).
                Below lg it stacks under the words as a band with the same edge-bleed —
                never a veil under text. */}
            {/* NOT animated (LCP): the framed photo is simply already there when the
                page paints — the words arrive around it. Opacity-arming this panel
                was the measured 5.8s LCP (element render-delay after a 70ms load). */}
            <div
              className="relative z-0 me-[-1rem] sm:me-[calc(-24px-max(0px,(100vw-1240px)/2))] lg:-ms-16"
            >
              <div
                className="frame-double relative rounded-[16px] shadow-[var(--elevation-2)]"
                style={{ "--frame-gap": "10px", "--frame-color": "var(--color-gold)" } as React.CSSProperties}
              >
                {/* the first thought-chip, resting limp on the frame — the noise
                    the whole page is about to quiet. TEXT FROM FILM_CHIPS ONLY
                    (YMYL: chips never get new copy); the film picks it up at
                    full strength, §07 lays it to rest. */}
                <span
                  aria-hidden
                  className="absolute -top-4 start-8 z-10 inline-block rotate-[-2deg] whitespace-nowrap rounded-full border border-line bg-bg/90 px-4 py-1.5 font-serif text-[0.95rem] italic text-muted opacity-70 shadow-sm"
                >
                  {FILM_CHIPS[0].text}
                </span>
                <div className="relative aspect-[16/10] overflow-hidden rounded-[inherit] lg:aspect-[5/4]">
                  {/* next/image WITHOUT the priority prop: srcset/AVIF for a
                      viewport-sized download (the LCP), but no preload hint —
                      priority's preload rides the RSC payload and replays on
                      every route that prefetches home */}
                  <Image
                    src="/media/generated/01-hero-kitchen.jpg"
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 44vw, 100vw"
                    fetchPriority="high"
                    loading="eager"
                    className="object-cover object-[30%_center]"
                  />
                  {/* the ONE shared image grade (archive continuity) */}
                  <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "var(--grade-tint)" }} />
                  {/* material diet: mid-page grain thins (0.05 → 0.035 → §07 clean) */}
                  <div aria-hidden className="grain-overlay" style={{ "--grain-opacity": "0.035" } as React.CSSProperties} />
                </div>
              </div>
            </div>
          </MOrchestrate>
        </Container>
      </section>

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

      {/* ── 03 · GUIDE — asymmetric-split: empathy → checkable credentials → the age
             answer in her voice → the mechanism. Portrait slot = honest empty-state
             (real Alona photo pending — never a generated face), styled as a designed
             calling card (sage wash + ◆ + serif name), never a dashed wireframe. ── */}
      <section className="relative">
        <Container width="wide" className="py-16 sm:py-20 md:py-32">
          <SectionSeam className="mb-12" />
          <SectionHeading eyebrow={GUIDE.kicker} title={GUIDE.title} accent="מכירה" />
          {/* ONE orchestrator for the whole split (choreography rule): the calling
              card settles, her age-line LEANS IN from the inline-start (the page's
              first side-entrance — her voice arriving beside the card), the argument
              column staggers block-axis. */}
          <MOrchestrate className="mt-12 grid items-start gap-12 md:grid-cols-[0.85fr_1.15fr]">
            {/* portrait column — RTL inline-start (right): the real-photo slot, kept honest */}
            <div className="mx-auto w-full max-w-[420px]">
              <MItem variants={scaleSoft}>
                {/* flagship card — the geometric signature's double frame */}
                <div
                  className="frame-double relative flex aspect-[4/5] flex-col items-center justify-center gap-3 rounded-[16px] bg-gold-soft p-8 text-center"
                  style={{ "--frame-gap": "7px", "--frame-color": "var(--color-gold)" } as React.CSSProperties}
                >
                  <div aria-hidden className="grain-overlay" style={{ "--grain-opacity": "0.035" } as React.CSSProperties} />
                  <span className="relative text-[0.65rem] leading-none text-gold" aria-hidden>◆</span>
                  <div className="relative font-serif text-3xl font-bold text-navy">{GUIDE.name}</div>
                  <span aria-hidden className="relative h-[3px] w-10 rounded-full bg-rose" />
                  <div className="relative font-serif text-base font-semibold text-navy-700">{GUIDE.role}</div>
                </div>
              </MItem>
              <MItem variants={slideIn("inline-start", 32)} className="mt-7">
                <figure className="border-s-4 border-rose ps-5">
                  <blockquote className="font-serif text-lg italic leading-relaxed text-navy">
                    {GUIDE.ageLine}
                  </blockquote>
                </figure>
              </MItem>
            </div>
            {/* argument column — empathy strictly before authority */}
            <div>
              <MItem as="p" className="max-w-[62ch] text-lg leading-[1.7] text-muted">{GUIDE.empathy}</MItem>
              <MItem className="mt-8">
                <RecognitionBadges badges={[...GUIDE.credentials]} />
              </MItem>
              <ul className="mt-9 grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
                {GUIDE.mechanism.map((m) => (
                  <MItem as="li" key={m} className="self-start">
                    <span className="inline-block border-b-2 border-rose pb-1.5 font-serif text-lg font-bold text-navy">
                      {m}
                    </span>
                  </MItem>
                ))}
              </ul>
              <MItem className="mt-10">
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
      </section>

      {/* ── 04 · PLAN — sticky-scroll ladder: three named rungs climb from a free call
             to the support that stays. Rungs 01–02 carry the generated stills (the
             conversation · the weekly plan, plan layer 8); rung 03 keeps the designed
             sage panel so the ladder ends on the site's own calm. ── */}
      <ShapedSection tone="sand" shape="arc" edge="top">
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
                  <div className="rounded-[16px] border border-line bg-card p-7 shadow-[var(--elevation-1)]">
                    <span aria-hidden className="grid h-11 w-11 rotate-45 place-items-center border border-gold/60 bg-gold-soft">
                      <span className="-rotate-45 font-serif text-base font-bold text-gold-ink">{s.n}</span>
                    </span>
                    <h3 className="mt-5 font-serif text-2xl font-bold text-navy">{s.t}</h3>
                    <span aria-hidden className="mt-2.5 block h-[2px] w-12 bg-rose" />
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
              left={{ label: STAKES.quiet.label, note: STAKES.quiet.note, points: [...STAKES.quiet.points], highlight: true }}
              right={{ label: STAKES.noisy.label, note: STAKES.noisy.note, points: [...STAKES.noisy.points], noisy: true, echo: FILM_CHIPS[3].text }}
            />
          </div>
          <div className="mt-8 flex flex-col items-center justify-between gap-6 rounded-[16px] bg-blush p-7 md:flex-row md:p-9">
            <p className="max-w-[52ch] text-lg font-medium leading-relaxed text-navy">{STAKES.band}</p>
            <div className="flex shrink-0 flex-col items-center gap-3 sm:flex-row sm:gap-5">
              <Link
                href="#lead"
                data-cta="stakes-to-cta"
                className="btn-chamfer rounded-[6px] bg-gold px-7 py-3.5 font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
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
        {/* the shared sage wash: begins inside the stakes' bottom padding and flows
            into the Success gradient field — the seamless breath before the peak */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-28 md:h-36"
          style={{ background: "linear-gradient(180deg, transparent 0%, var(--color-gold-soft) 100%)" }}
        />
      </section>

      {/* ── 07 · SUCCESS — the quiet made tangible: a golden-hour "ate out and
             enjoyed it" still inside the signature double frame, the felt-lines
             reading beside it, and the film's noise-chips finally AT REST over
             the frame's edge (the motif resolves in plain sight). First-person
             felt-lines framed as the possible future — never a testimonial. ── */}
      <section
        className="relative"
        style={{ background: "linear-gradient(180deg, var(--color-gold-soft) 0%, var(--color-blush) 100%)" }}
      >
        <Container width="wide" className="py-24 md:py-36">
          <MOrchestrate className="grid items-center gap-16 md:grid-cols-[1.05fr_0.95fr] md:gap-12 lg:gap-20">
            {/* the felt-lines — read first (inline-start), leaning toward the evening */}
            <div className="text-center md:text-start">
              <MItem
                variants={slideIn("inline-start", 32)}
                className="flex items-center justify-center gap-2.5 md:justify-start"
              >
                <span className="text-[0.65rem] leading-none text-gold" aria-hidden>◆</span>
                <p className="font-serif text-[1.2rem] font-medium leading-snug text-navy">{SUCCESS.kicker}:</p>
              </MItem>
              <RevealHeading
                as="h2"
                text={SUCCESS.lines}
                className="mt-7 font-serif font-bold leading-[1.5] text-navy"
                style={{ fontSize: "clamp(1.55rem, 3.1vw, 2.45rem)" }}
                lastLineClass="relative mx-auto w-fit md:mx-0 after:absolute after:inset-x-0 after:bottom-[0.02em] after:h-[3px] after:rounded-full after:bg-rose after:origin-[100%_50%] after:transition-transform after:duration-[var(--dur-rule)] after:ease-[var(--ease-signature)] after:delay-[calc(var(--dur-reveal)_+_2*var(--dur-stagger))] motion-reduce:after:transition-none [.is-masked_&]:after:scale-x-0"
              />
              <MItem variants={slideIn("inline-start", 32)} className="mt-11">
                <Link
                  href="#lead"
                  data-cta="success-to-lead"
                  className="btn-chamfer inline-block rounded-[6px] border-2 border-navy/30 bg-bg/70 px-7 py-3.5 text-lg font-semibold text-navy transition hover:border-navy/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
                >
                  {SUCCESS.bridge}
                </Link>
              </MItem>
            </div>
            {/* the evening it points to — double-framed still entering from the far
                side; the settled noise rests over its edge, set down for good */}
            <MItem variants={slideIn("inline-end", 48)} className="mx-auto w-full max-w-[420px] md:max-w-[480px]">
              <div
                className="frame-double relative rounded-[16px]"
                style={{ "--frame-gap": "10px", "--frame-color": "var(--color-rose)" } as React.CSSProperties}
              >
                <div className="relative aspect-[4/5] overflow-hidden rounded-[inherit]">
                  <Image
                    src="/media/generated/07-success-evening.jpg"
                    alt="שולחן במסעדה בשעת ערב: צלחת כמעט ריקה אחרי ארוחה שנהנו ממנה, ויד נחה רגועה על השולחן"
                    fill
                    sizes="(min-width: 768px) 40vw, 92vw"
                    className="object-cover"
                  />
                </div>
                {/* the settled noise — the film's thought-chips, laid down */}
                <div aria-hidden className="absolute -bottom-6 start-[-10px] flex flex-col items-start gap-2 sm:start-[-22px]">
                  {SETTLED_NOISE.map((w) => (
                    <span
                      key={w.text}
                      className="inline-block whitespace-nowrap rounded-full border border-line bg-bg/90 px-4 py-1.5 font-serif text-[0.95rem] italic text-muted shadow-sm"
                      style={{ transform: `rotate(${w.tilt}deg)`, marginInlineStart: w.offset }}
                    >
                      {w.text}
                    </span>
                  ))}
                </div>
              </div>
            </MItem>
          </MOrchestrate>
        </Container>
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
