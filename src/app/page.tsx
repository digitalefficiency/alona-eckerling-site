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

// ============================================================================
// בית — composed from plan/sections/01..08 (beats: HOOK→TENSION→GUIDE→PLAN→
// PROOF→STAKES→SUCCESS→RESOLUTION). Every visible string below is pasted from
// COPY.md « עמוד: בית » — studio [לאימות]/[חסר] annotations are NOT rendered.
// ============================================================================

// COPY: ### סקשן 1 · ImageHero + MOrchestrate
// The hero photograph — REAL client photography. Round 2 (Rom, 2026-08-12:
// «אני רוצה תמונה טובה יותר ב-hero»): the green-shakshuka pan gave way to her
// protein-pancakes frame (IMG_9931 from the Drive library, installed as
// cl-115): a bright stack with figs, blueberries and banana on a white plate
// over pale marble — morning light, generous quiet marble around the plate,
// the warmest most editorial frame in her library. Privacy-checked on the
// full pixels, EXIF stripped. It replaced the generated ring-loop film room:
// DESIGN-DIRECTION locked «hero חם סטטי», and the media rule is real editorial
// food photography wherever real pixels exist. The film assets stay on disk.
const HERO_IMAGE = {
  src: "/media/client/alona/dish-protein-pancakes.jpg",
  alt: "מגדל פנקייקים עם תאנים, אוכמניות ובננה על צלחת לבנה, על שיש בהיר, מהמטבח של אלונה",
} as const;

const HERO = {
  kicker: "תזונת נשים · ליווי אישי",
  title: "את כבר יודעת מה לאכול.\nמה שחסר זה לא עוד תפריט.",
  // refined 2026-08-11 (studio pass): the lede tightened from two winding
  // sentences to two sharp ones — «נשאר בפנים» (the approved phrasing from
  // sections 4 and 22) replaces the negative «בלי לוותר על», and the close
  // lands in two beats instead of a long «כדי ש» clause.
  lede: "אלא דרך שנבנית סביב השבוע האמיתי שלך, והאוכל שאת אוהבת נשאר בפנים. שקט בראש, ותוצאה שנשארת.",
  ctaPrimary: "בואי נדבר",
  ctaSub: "שיחת היכרות חינם",
  // ONE trust line, split for the pill's sake: on <sm the license clause hides so
  // the pill stays a single-line pill (the full license lives in GUIDE.credentials
  // and /about); nothing is added or reworded — only shown by width.
  trustToken: "דיאטנית קלינית מוסמכת · R.D.",
  trustTokenLicense: " · רישיון משרד הבריאות",
  ctaRecipes: "עוד לא מוכנה לשיחה? המתכונים שלי כאן",
} as const;

// COPY: ### סקשן 3 · FeatureRow + BioCard + CredentialStrip
// §03 room background — the desk the dossier spreads on (generated per plan
// layer 8: top-down desk, blank notebook, palette-locked linens, faceless).
const GUIDE_BG = "/media/generated/03-guide-desk.jpg";
// REAL portrait (cl-101, MEDIA-PLAN §3) — never a generated face, never stock.
const GUIDE_PORTRAIT = "/media/client/alona/alona-guide.jpg";

const GUIDE = {
  kicker: "נעים להכיר",
  title: "אני מכירה את הבלבול הזה",
  // Her voice sits directly under the title as the section's standfirst (Rom,
  // 2026-08-12: «תכניס את הפסקה מתחת לכותרת, כתת כותרת») — one continuous
  // breath, same approved words. The old ageLine const was deleted — it was
  // never rendered here, and its home is /about.
  empathy:
    "גם אני עמדתי מול הבלגן הזה, עד שכבר לא ידעתי מה נכון ומה לא נכון. בדיוק בגלל זה הלכתי ללמוד: להבין מה באמת קורה בגוף שלנו.",
  name: "אלונה אקרלינג",
  role: "דיאטנית קלינית מוסמכת · R.D.",
  portraitAlt: "אלונה אקרלינג, דיאטנית קלינית מוסמכת, אוכלת מקערה במטבח שלה",
  credentials: [
    "דיאטנית קלינית מוסמכת · R.D.",
    "רישיון משרד הבריאות 204526-11",
    "B.Sc במדעי התזונה",
    "התמחות קלינית · איכילוב",
  ],
  // the four mechanism labels became one first-person hello (Rom, 2026-08-12:
  // «כמה משפטים בגוף ראשון, משהו כמו היי אני אלונה») — same approved content
  // (דיאטנית שמבשלת · נבנה סביב השבוע שלך · מדע עדכני · ליווי אחת-על-אחת ·
  // בגובה העיניים), woven into her voice instead of an index.
  introHello: "היי, אני אלונה.",
  intro:
    "דיאטנית קלינית שגם מבשלת באמת, כל שבוע, במטבח שלי. אני מלווה אחת-על-אחת, בדרך שנבנית סביב השבוע האמיתי שלך ונשענת על המדע הכי עדכני. ומה שהכי חשוב לי: שנדבר בגובה העיניים.",
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
  // first person (Rom, 2026-08-12): the section speaks in her voice, like the
  // hello above it — «אני», not «היא»
  title: "אני באמת מבשלת",
  body: "לא עוד תמונה יפה. אוכל אמיתי שאני מבשלת, מתוך שבוע רגיל ועמוס.",
  // re-verified against the CMS after the 2026-08-12 archive import (55 real
  // entries) — the honest count, never rounded up
  countChip: "55 מתכונים · מתכון חדש כל שבוע",
  // the honest dark slots (testimonials + media logos) came off 2026-08-12
  // (Rom: «במקום המקום של ההמלצות תעשה מקום ל-3 מאמרים») — replaced by the
  // articles index below. The INTEGRITY rule is untouched: no invented
  // testimonials, and the testimonial capability (consent gate) stays intact
  // for another page when real quotes exist.
  cta: "לכל המתכונים ←",
} as const;

// COPY: ### סקשן 5 — אינדקס המאמרים (2026-08-12): שלושה סלוטים, נמשכים חיים
// מאוסף המאמרים (כותרת + תקציר מה-frontmatter שלהם) — כשיש פחות משלושה,
// מוצגים רק האמיתיים; הסלוט השלישי מופיע כשמאמר שלישי מתפרסם. אפס המצאה.
const ARTICLES_STRIP = {
  kicker: "מאמרים",
  // a real masthead (Rom, 2026-08-12: «חסר לי כאן כותרת כמו שצריך») — the old
  // lead line split into a serif title + a quiet standfirst; the title is
  // stored in two parts so the rose rule can rest under the accent
  titleA: "מה שאני מסבירה בקליניקה, ",
  titleAccent: "כתוב כאן",
  lead: "בלי קיצורי דרך ובלי הפחדות.",
  itemCta: "לקריאה ←",
  allCta: "לכל המאמרים ←",
} as const;

// COPY: ### סקשן 5 — רצועת המנות (הרחבה של ביט ה-PROOF, 2026-07-26)
// המנות אמיתיות ומצולמות על ידה; נבחרו לעוצמה ויזואלית באריח אחיד (MEDIA-PLAN §2)
// — פריימים דהויים (מרק בקערת זכוכית, כוסות פרפה על שיש אפור) נפסלו בכוונה.
const RIBBON = {
  kicker: "מהמטבח שלי",
  note: "כל מתכון כאן נבדק אצלי בבית לפני שהוא מגיע אלייך. אלה לא צילומי מאגר.",
  // The band was already a wall of her real food; these two lines are what turn
  // it into the CHANNEL. «הקהילה = האינסטגרם» (Rom) — so the proof-of-craft and
  // the follow ask are the same object, instead of a second photo band competing
  // with this one for the same job further down the page.
  follow: "כל מנה כאן עלתה קודם לאינסטגרם. שם עולים מתכונים חדשים, טיפים קטנים, ומה שבאמת קורה במטבח ביום רגיל.",
  // spoken only by screen readers, appended to each linked tile's name
  linkHint: "לצפייה באינסטגרם, נפתח בלשונית חדשה",
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
    : RIBBON.tiles.map((t) => ({ ...t, href: instagram })));
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
      {/* ── 01 · HOOK — the editorial split hero (2026-08-11, the design-language
             pass): a magazine spread instead of words-over-footage. The words own
             the reading edge (RTL inline-start = right) on the page paper — no
             scrim, no contrast debt, and the H1 finally wears the LOCKED display
             scale clamp(2.6rem,6vw,4.75rem) (it had been capped at 3.3rem, a
             subheading pretending to be a masthead). The photograph owns the
             other column at near-native ratio: her REAL green shakshuka (cl-012)
             replacing the generated ring-loop film room — MEDIA-PLAN's split-band
             answer to real 3:4 pixels, and DESIGN-DIRECTION's «hero חם סטטי»
             finally honored. LCP becomes the H1 text itself (faster than any
             poster). The trust chip and the recipes escape-link fused into ONE
             hairline masthead row — the editorial credential treatment, no boxes.
             The thought-chip arc retired with the §02 film (2026-08-11); the old
             HeroFilm ring loop stays on disk should a real film production land.
             Header safety is DEFAULT-ON: the white nav treatment requires an
             explicit [data-dark-hero], so this light hero can never ship an
             invisible nav. ── */}
      <section className="relative isolate overflow-hidden bg-bg" style={{ "--grade-tint": "var(--hour-morning)" } as React.CSSProperties}>
        <div className="mx-auto grid w-full max-w-[1440px] lg:min-h-[88svh] lg:grid-cols-[minmax(0,11fr)_minmax(0,9fr)]">
          {/* the words — reading start, on paper; ONE orchestrator, same
              block-axis choreography as ever */}
          <div className="flex items-center px-5 pb-4 pt-32 sm:px-8 sm:pt-36 lg:self-center lg:py-32 lg:pe-14 lg:ps-10 xl:ps-16">
            <MOrchestrate className="max-w-[700px]">
              <MItem as="p" className="flex items-center gap-2.5 text-xs font-bold tracking-eyebrow text-gold-ink">
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
                // the display scale, re-fit for a split column (the D1 lock's
                // 6vw/4.75rem was measured for a FULL-width hero; in an 11fr
                // column it wraps the composed two-line masthead into four) —
                // 4.5vw/4rem is the largest size that keeps each written line
                // whole from 1024px up
                className="mt-6 font-serif font-black leading-[1.08] text-navy md:tracking-[-0.01em]"
                style={{ fontSize: "clamp(2.4rem, 4.5vw, 4rem)" }}
              />
              {/* the standfirst — its own register between display and body
                  (text-xl, tighter measure), so the ladder reads kicker →
                  display → standfirst → body */}
              <MItem as="p" className="mt-7 max-w-[48ch] text-xl leading-[1.65] text-ink">
                {HERO.lede}
              </MItem>
              {/* the CTA stands alone — the «שיחת היכרות חינם» sub-line came off
                  (Rom, 2026-08-12); the free-call promise still lives in §04 step
                  01 and on /coaching, so the button stays quiet here */}
              <MItem className="mt-10">
                {/* magnet 1 of the page's pair («חוט ואור» move 6; ≤2 budget enforced by MMagnetic) */}
                <MMagnetic>
                <Link
                  href="#lead"
                  data-cta="hero-primary"
                  className="btn-chamfer inline-block rounded-[6px] bg-gold px-9 py-4 text-base font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
                >
                  {HERO.ctaPrimary}
                </Link>
                </MMagnetic>
              </MItem>
              {/* the masthead footer — ONE hairline-ruled row instead of a boxed
                  trust chip + an orphaned link: the rule and the spaced kicker
                  ARE the editorial credential treatment («קווי מערכת, קיקרים
                  באותיות מרווחות», no boxes). The width-conditional license
                  split survives verbatim. */}
              <MItem className="mt-10">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-line/80 pt-5">
                  <Link
                    href="/about"
                    data-cta="hero-credential"
                    className="text-[13px] font-bold tracking-eyebrow text-navy transition hover:text-gold-ink"
                  >
                    {/* one span = one flex item, so the inline separator keeps its space */}
                    <span>
                      {HERO.trustToken}
                      <span className="hidden sm:inline">{HERO.trustTokenLicense}</span>
                    </span>
                  </Link>
                  <span aria-hidden className="hidden text-muted sm:inline">·</span>
                  <Link
                    href="/recipes"
                    data-cta="hero-recipes"
                    className="text-[0.95rem] font-medium text-muted underline decoration-rose decoration-2 underline-offset-4 transition hover:text-navy"
                  >
                    {HERO.ctaRecipes}
                  </Link>
                </div>
              </MItem>
            </MOrchestrate>
          </div>
          {/* the photograph — real pixels at near-native ratio, graded by the
              one-camera system (tint + grain), stretching the full spread height
              on lg; a quiet 4:5 band on mobile below the words */}
          <div className="relative mt-8 aspect-[4/5] w-full sm:aspect-[3/4] lg:mt-0 lg:aspect-auto lg:self-stretch">
            <Image
              src={HERO_IMAGE.src}
              alt={HERO_IMAGE.alt}
              fill
              priority
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="object-cover"
            />
            <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "var(--grade-tint)" }} />
            <div aria-hidden className="grain-overlay" style={{ "--grain-opacity": "0.05" } as React.CSSProperties} />
          </div>
        </div>
        {/* soft-curve seam — the cream ground crests up over the photo's foot,
            a shaped hand-off into the dossier, not a hard photo cut.
            The «גללי» scroll cue came off (Rom, 2026-08-12). */}
        <SeamShape variant="curve-up" />
      </section>

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
                <SectionHeading eyebrow={GUIDE.kicker} title={GUIDE.title} accent="מכירה" align="center" />
                <SplitText
                  as="p"
                  text={GUIDE.empathy}
                  accentText="להבין מה באמת קורה בגוף שלנו"
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
        {/* the articles index moved BELOW the stakes fork (Rom, 2026-08-12:
            «תחליף בין סקשן המאמרים לבין סקשן נמאס מהסבב הזה») — it now reads
            as the quiet study after the fork, right before the evening peak. */}
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

      {/* ── 06b · the articles study — up to three REAL articles from the
             collection (title + its own frontmatter description, family-wash
             cards), placed after the fork (Rom, 2026-08-12) as the calm
             reading room before the evening peak; renders only when articles
             exist, the third slot fills itself on publish. ── */}
      {articlesPool.length > 0 && (
        <Section tone="white" border>
          {/* a centered masthead — kicker, serif title with the rose rule
              resting under «כתוב כאן» (base state drawn), quiet standfirst */}
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center gap-2.5">
              <span className="text-[0.65rem] leading-none text-gold" aria-hidden>◆</span>
              <span className="text-xs font-bold tracking-eyebrow text-gold-ink">{ARTICLES_STRIP.kicker}</span>
            </div>
            <h3
              className="mt-4 font-serif font-black leading-[1.15] text-navy"
              style={{ fontSize: "clamp(1.5rem, 2.8vw, 2.2rem)" }}
            >
              {ARTICLES_STRIP.titleA}
              <span className="u-rose-draw">{ARTICLES_STRIP.titleAccent}</span>
            </h3>
            <p className="mt-3 max-w-[60ch] text-[1.08rem] leading-relaxed text-muted">{ARTICLES_STRIP.lead}</p>
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
                  {a.tag ?? ARTICLES_STRIP.kicker}
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
                  {ARTICLES_STRIP.itemCta}
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
              {ARTICLES_STRIP.allCta}
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
