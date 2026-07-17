import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";
import { Container } from "@/components/layout/Container";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SectionHeading } from "@/components/SectionHeading";
import { PullQuote } from "@/components/PullQuote";
import { FaqAccordion } from "@/components/FaqAccordion";
import { FeatureAlternating } from "@/components/section/FeatureAlternating";
import { SpotlightCard } from "@/components/section/SpotlightCard";
import { MediaFrame } from "@/components/media/MediaFrame";
import { Reveal } from "@/components/Reveal";
import { RevealHeading } from "@/components/motion/RevealHeading";
import { MOrchestrate, MItem } from "@/components/motion/MOrchestrate";
import { MStagger } from "@/components/motion/MStagger";
import { MChapter } from "@/components/motion/MChapter";
import { JsonLd } from "@/components/JsonLd";

// ============================================================================
// עמוד המוצר «הקול השפוי» — חוברת המתכונים (149 ₪, אוואטר B · נועה).
// כל מחרוזת גלויה מודבקת מ-COPY.md → "## עמוד: הקול השפוי" (סקשנים 26–31).
// ============================================================================

// ── יעדי-ביניים (שער-בנייה) ─────────────────────────────────────────────────
// קישור עמוד הסליקה של משולם טרם חובר — עד שיתקבל ה-URL מהלקוחה, כפתור הרכישה
// מפנה לוואטסאפ העסקי (ערוץ הפניות הקיים, site.whatsapp). להחליף כאן בלבד.
const CHECKOUT_HREF = `https://wa.me/${site.whatsapp}`;
// עמוד ההצטרפות לרשימה (Smoove) טרם חובר — בינתיים ההצטרפות דרך עמוד יצירת הקשר,
// ישירות אל עוגן הטופס (#lead). הפרמטר ?list=1 מיועד לסימון-מראש של צ'קבוקס הרשימה
// ב-ContactQuietForm — החיווט שם בבעלות אחרת (ביקורת-עיצוב #51).
const LIST_HREF = "/contact?list=1#lead";
const WHATSAPP_HREF = `https://wa.me/${site.whatsapp}`;

// COPY: ### סקשן 26 · SplitHero (כריכת החוברת + מחיר)
const HERO = {
  crumb: "הקול השפוי", // פירורי-לחם: «בית / הקול השפוי» (בית נוסף אוטומטית ברכיב)
  kicker: "חוברת המתכונים",
  title: "הקול השפוי",
  body: "אוכל טוב, בלי חוקים מיותרים, בדרך שמתאימה לחיים שלך. חוברת מתכונים של דיאטנית שבאמת מבשלת: מתכונים קלים, בדוקים, בלי אשמה.",
  priceChip: "149 ₪ · תשלום חד-פעמי", // שער-בנייה: 149, לעולם לא 119
  community: "כולל כניסה לקבוצת הוואטסאפ של הקהילה",
  rdMark: "מאת דיאטנית קלינית מוסמכת · R.D.",
  ctaPrimary: "אני רוצה את החוברת · 149 ₪",
  ctaSecondary: "רק להישאר מעודכנת? הצטרפי לרשימה",
} as const;

// COPY: ### סקשן 27 · Section width=prose (זה נכתב בשבילך)
const FORYOU = {
  kicker: "למי זה מתאים",
  title: "כל שבוע טרנד חדש, ואת לא יודעת מה נכון",
  subtitle: "הנה קול אחד שפוי, נכתב בשבילך.",
  // re-layout בלבד של גוף COPY §27 (ביקורת-עיצוב #33): ארבעת שברי-הטרנד מוצגים
  // כצ'יפי-רעש (הד למוטיב צ'יפי-הסרט מהבית), שאר המשפטים כפסקה. כל מילה נשמרת, בסדרה.
  noise: ["קטו", "פחמימות זה רע", "רק חלבון", "בלי לאכול אחרי שבע"],
  body: "הפיד לא מפסיק, ובאמצע כל הרעש קשה בכלל לזכור מה בא לך לאכול. וזה לא כי משהו לא בסדר איתך: פשוט אף אחד עוד לא באמת דיבר אלייך, אל אישה צעירה שרוצה להרגיש טוב בגוף שלה, בלי להפוך את זה לדיאטה של אמא שלה.",
  pullQuoteLead: "זו לא הדיאטה של אמא שלך. ",
  pullQuoteMark: "זה נכתב בשבילך.",
  solution: "אוכל שאת אוהבת, בלי חוקים מיותרים, ולצידך נשים כמוך שהולכות באותה דרך.",
  ctaBridge: "אז הנה מה שמחכה לך בפנים ←",
} as const;

// COPY: ### סקשן 28 · FeatureAlternating (מה יש בחוברת)
const INSIDE = {
  kicker: "מה יש בפנים",
  title: "בלי הפתעות: הנה בדיוק מה שאת מקבלת",
  rows: [
    {
      title: "מתכונים ליום-יום, לא לתמונה",
      body: "אוכל אמיתי שבאמת מבשלים בערב עמוס: פשוט, מהיר, ומסודר כך שתמצאי מה להכין בלי לחשוב יותר מדי. לא עוד קובץ יפה שיישב בטלפון.",
      img: "/media/client/recipes/one-pot-bulgur-stew.jpg", // צילום אמיתי מארכיון המתכונים של אלונה
      alt: "תבשיל בורגול בסיר אחד",
    },
    {
      title: "חלבון, בלי להפוך את זה לפרויקט",
      body: "איך להכניס חלבון לארוחות שאת ממילא אוכלת, כדי להרגיש שבעה ומלאת אנרגיה. בלי אבקות, בלי לספור, ובלי לשגע את עצמך.",
      img: "/media/client/recipes/tofu-shawarma.jpg", // צילום אמיתי מארכיון המתכונים של אלונה
      alt: "שווארמה טופו ביתית",
    },
    {
      title: "בלי לוותר על האוכל שאת אוהבת",
      body: "הדברים שאת הכי אוהבת נשארים בפנים. בלי רשימות אסור ובלי אשמה. אוכל טוב, בלי חוקים מיותרים, בדרך שמתאימה לחיים שלך.",
      img: "/media/client/recipes/flourless-brownies.jpg", // צילום אמיתי מארכיון המתכונים של אלונה
      alt: "בראוניז ללא קמח",
    },
  ],
  ctaBridge: "רוצה את זה אצלך? הנה איך מקבלים ←",
} as const;

// COPY: ### סקשן 29 · card-grid (החבילה המלאה = שייכות)
const INCLUDES = {
  kicker: "זו לא רק חוברת",
  title: "מה מקבלים, ולמי את מצטרפת",
  lead: "«הקול השפוי» זה לא קובץ שמורידים ושוכחים. זו חוברת, קבוצה שלמה של בנות, וקשר שממשיך.",
  cards: [
    {
      title: "חוברת «הקול השפוי»",
      body: "חוברת המתכונים המלאה שלי. אוכל אמיתי, בלי חוקים מיותרים, מסודר ושלך להישאר.",
      motif: "booklet",
    },
    {
      title: "קבוצת הוואטסאפ",
      body: "קבוצה של בנות שמדברות אותך: שאלה, מתכון, טיפ שקט, בלי שיפוט. את לא לבד עם זה.",
      motif: "bubbles",
    },
    {
      title: "עדכונים שממשיכים",
      body: "זה לא נגמר בהורדה. מתכונים חדשים וטיפים שממשיכים להגיע.",
      motif: "leaf",
    },
  ],
} as const;

// COPY: ### סקשן 30 · FaqAccordion (7 פריטים)
const FAQ = {
  kicker: "לפני שקונים",
  title: "כמה שאלות שתמיד עולות לפני שקונים",
  lead: "בכנות, בלי לחץ, כדי שתדעי בדיוק מה את מקבלת ולמה זה שווה. אם נשאר לך עוד משהו, כתבי לי, אני עונה.",
  items: [
    {
      q: "באינסטגרם יש המון תוכן חינם. אז למה לשלם על החוברת?",
      a: "כי תוכן חינם נהדר אבל מפוזר, כללי, ובסוף האלגוריתם מחליט מה את רואה. החוברת היא ההפך: הכל מסודר במקום אחד, בנוי צעד-אחר-צעד, שלך לתמיד, ולצידה קבוצת וואטסאפ חיה. את משלמת על הסדר, השקט והאנשים שלצידך, לא על המידע לבדו.",
    },
    {
      q: "אני לא מרגישה מוכנה לליווי אישי. החוברת בכלל בשבילי?",
      a: "בול בשבילך. החוברת היא הצעד הקטן והפשוט להתחיל בו: בלי התחייבות לתהליך, בלי פגישות, בקצב שלך. ואם יום אחד תרצי יותר, הדלת לליווי פתוחה, בלי לחץ.",
    },
    {
      q: '149 ש"ח, זה לא יקר לחוברת דיגיטלית?',
      a: "זו קנייה חד-פעמית, לא מנוי. מה שאת מקבלת זה החוברת המלאה וגם כניסה לקבוצת הוואטסאפ של «הקול השפוי». שילמת פעם אחת, וזה נשאר איתך.",
    },
    {
      q: "מה בעצם יש בפנים?",
      a: "מתכונים אמיתיים לשבוע רגיל, ולצידם הגישה שלי בשפה פשוטה: איך הגוף עובד, קבוצות המזון, קניות חכמות וחלבון. דברים שתשתמשי בהם כבר השבוע.",
    },
    {
      q: 'זו עוד חוברת של "אסור"?',
      a: "ממש לא. אין רשימת איסורים ואין אוכל אסור, זה כל הרעיון. את לומדת לאכול טוב וליהנות, כולל ממה שאת אוהבת, בלי אשמה.",
    },
    {
      q: "זו באמת קהילה או סתם PDF?",
      a: "כשקונים את החוברת מצטרפים גם לקבוצת «הקול השפוי» בוואטסאפ, קהילה חיה של נשים כמוך. לא קובץ שכוח: יש לצידו אנשים.",
    },
    {
      q: "איך קונים ומתי מקבלים גישה?",
      // זרימת-ביניים כנה (ביקורת-עיצוב #20): כפתור הרכישה מפנה כרגע לוואטסאפ, לא
      // לעמוד סליקה. להחזיר את נוסח COPY §30 המקורי כש-CHECKOUT_HREF יקבל את
      // ה-URL האמיתי של משולם.
      a: "כרגע קונים דרך וואטסאפ: כותבים לי ומקבלים קישור תשלום מאובטח של משולם. אחרי התשלום מקבלים קובץ דיגיטלי שנפתח בכל מכשיר, וההצטרפות לקבוצה מיד אחרי.",
    },
  ],
  closeBefore: 'נשאר עוד "כן, אבל"? ',
  closeLink: "כתבי לי בוואטסאפ",
  closeAfter: " ואני אענה לך באמת.",
  deRiskBefore: "עדיין מתלבטת? ",
  deRiskLink: "הצטרפי קודם לרשימה השפויה",
  deRiskAfter: ", חינם, ותבואי לחוברת כשתהיי מוכנה.",
  cta: "לרכישת החוברת ←",
} as const;

// COPY: ### סקשן 31 · SpotlightCard (רכישה → משולם)
const CHECKOUT = {
  kicker: "החוברת המלאה",
  title: "רוצה את «הקול השפוי» שלך?",
  body: "כל מה שראית פה מחכה לך במקום אחד: «הקול השפוי», חוברת המתכונים המלאה שלי. אוכל אמיתי, בלי חוקים מיותרים, בדרך שמתאימה לחיים שלך.",
  community: "עם הרכישה את גם נכנסת לקבוצת הוואטסאפ: מתכונים, טיפים שקטים, וקהילה של בנות שמדברות אותך.",
  ctaPrimary: "אני רוצה את החוברת · 149 ₪",
  // זרימת-ביניים כנה (ביקורת-עיצוב #20): ה-CTA מפנה כרגע לוואטסאפ. להחזיר את
  // מיקרו-הביטחון של COPY §31 כש-CHECKOUT_HREF יקבל את ה-URL האמיתי של משולם.
  secure: "כרגע קונים דרך וואטסאפ: כותבים לי ומקבלים קישור תשלום מאובטח של משולם. פרטי התשלום שלך לא נשמרים אצלנו.",
  ctaSecondary: "הצטרפי לרשימה השפויה, חינם",
} as const;

export const metadata: Metadata = {
  title: `${HERO.title} · ${HERO.kicker}`,
  description: HERO.body,
  alternates: { canonical: "/sane-voice" },
};

// FAQPage JSON-LD — נגזר מפריטי הקופי שלמעלה (סקשן 30), אפס מחרוזות חדשות.
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.items.map((i) => ({
    "@type": "Question",
    name: i.q,
    acceptedAnswer: { "@type": "Answer", text: i.a },
  })),
};

// Product/Offer JSON-LD (ביקורת-עיצוב #50) — נגזר מהקבועים הקיימים בלבד;
// המחיר 149 (שער-בנייה: לעולם לא 119), התמונה = ה-still שכבר חי בהירו.
const productSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: HERO.title,
  description: HERO.body,
  image: `${site.url}/media/generated/26-booklet-object.jpg`,
  offers: {
    "@type": "Offer",
    price: "149",
    priceCurrency: "ILS",
    availability: "https://schema.org/InStock",
    url: `${site.url}/sane-voice`,
  },
};

// ── גליפים דקורטיביים (SSR, aria-hidden) — לעולם לא צילומי-מסך/תוכן מומצא ──
function BookletGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-9 w-9"
      aria-hidden
    >
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5V5.5Z" />
      <path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20" />
    </svg>
  );
}

function LeafGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-9 w-9"
      aria-hidden
    >
      <path d="M5 19C5 11 11 5 19 5c0 8-6 14-14 14Z" />
      <path d="M7 17C10 13 13 10 17 7" />
    </svg>
  );
}

function LockGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 shrink-0"
      aria-hidden
    >
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

// מוטיב "קבוצה מדברת" — בועות שיחה מופשטות (קוד בלבד; אף פעם לא צילום-מסך מפוברק).
function BubblesMotif() {
  return (
    <div className="flex items-end gap-1.5" aria-hidden>
      <span className="h-8 w-14 rounded-2xl rounded-es-sm bg-gold/50" />
      <span className="h-8 w-10 rounded-2xl rounded-ee-sm border border-line bg-card" />
      <span className="h-8 w-8 rounded-full bg-rose/60" />
    </div>
  );
}

// עטיפת «הקול השפוי» — מצב-מעוצב כן: כריכה טיפוגרפית על כרטיס שנהב (אין עדיין
// קובץ כריכה מקורי מהלקוחה — לעולם לא מפברקים כריכה; החלפה לנכס האמיתי כשיגיע).
// כל הטקסט כאן משוכפל מעמודת הטקסט של ההירו → הבלוק כולו aria-hidden.
function BookletCover() {
  return (
    <div aria-hidden className="mx-auto w-full max-w-[320px] sm:max-w-[360px]">
      <div
        className="relative overflow-hidden rounded-[16px] border border-line bg-sand"
        style={{ aspectRatio: "4 / 5", boxShadow: "var(--elevation-3)" }}
      >
        {/* רמז-שדרה בצד הכריכה (RTL: הכריכה נכרכת מימין = inline-start) */}
        <span className="absolute inset-y-4 start-4 w-px bg-line" />
        <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
          <span className="text-[0.65rem] font-bold tracking-[0.22em] text-rose-ink">
            {HERO.kicker}
          </span>
          <span className="font-serif text-4xl font-black leading-tight text-navy sm:text-5xl">
            {HERO.title}
          </span>
          <span className="h-px w-12 bg-rose/70" />
          <span className="max-w-[22ch] text-xs font-semibold leading-relaxed text-muted">
            {HERO.rdMark}
          </span>
        </div>
        <span className="absolute inset-x-0 bottom-6 text-center text-[0.7rem] font-bold tracking-[0.18em] text-muted">
          {site.name}
        </span>
      </div>
    </div>
  );
}

export default function SaneVoicePage() {
  return (
    <>
      <JsonLd data={faqSchema} />
      <JsonLd data={productSchema} />

      {/* ── 26 · hero — HOOK · asymmetric-split ──────────────────────────────
          עצם-מוצר מוגבה על פנל blush (ימין ב-RTL, העין פוגשת את הכריכה קודם) +
          עמודת טקסט: פירורי-לחם → קיקר → H1 → גוף → צ'יפ מחיר → CTA → קהילה →
          קישור-רשימה → סימן R.D. */}
      <section data-light-hero className="border-b border-line">
        <Container className="grid grid-cols-1 items-center gap-10 py-14 md:grid-cols-[52fr_48fr] md:gap-14 md:py-24">
          {/* פנל הכריכה — ראשון ב-DOM = צד ימין ב-RTL; ה-still המיוצר (חוברת על שולחן
              חם, layer 8) הוא הרקע האווירתי, הכריכה הטיפוגרפית הכנה צפה מעליו */}
          {/* isolate + ‎-z-10 — סדר-צביעה בטוח: המדיה הממוקמת לעולם לא נצבעת מעל הכריכה (ביקורת-עיצוב #3/#13) */}
          <div className="relative isolate overflow-hidden rounded-[16px] bg-blush px-6 py-10 sm:px-10 sm:py-14">
            <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
              {/* <picture> keeps the still EAGER here but stops React's preload hint —
                  hints ride the RSC payload and replay on any page prefetching this route */}
              <picture className="contents">
                <img
                  src="/media/generated/26-booklet-object.jpg"
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover opacity-80"
                />
              </picture>
              <div className="absolute inset-0 bg-gradient-to-t from-blush/90 via-blush/40 to-blush/20" />
            </div>
            <div aria-hidden className="grain-overlay" />
            <Reveal className="relative">
              <BookletCover />
            </Reveal>
          </div>

          {/* עמודת הטקסט */}
          <div>
            <div className="mb-6">
              <Breadcrumbs items={[{ label: HERO.crumb, href: "/sane-voice" }]} />
            </div>
            <MOrchestrate>
              <MItem as="p" className="flex items-center gap-2.5">
                <span className="text-[0.7rem] leading-none text-rose" aria-hidden>
                  ◆
                </span>
                <span className="text-xs font-bold tracking-[.2em] text-rose-ink">
                  {HERO.kicker}
                </span>
              </MItem>
              <MItem>
                <RevealHeading
                  as="h1"
                  text={HERO.title}
                  baseDelay={120}
                  className="mt-4 font-serif font-black leading-[1.05] text-navy"
                  style={{ fontSize: "var(--text-hero)" }}
                />
              </MItem>
              <MItem as="p" className="mt-5 max-w-[52ch] text-lg leading-relaxed text-muted">
                {HERO.body}
              </MItem>
              <MItem className="mt-7">
                <span className="inline-flex items-center rounded-full border border-line bg-card px-5 py-2 text-sm font-bold text-navy">
                  {HERO.priceChip}
                </span>
              </MItem>
              <MItem className="mt-6 flex flex-wrap items-center gap-4">
                {/* היעד הסופי: עמוד הסליקה של משולם — עד החיווט, העוגן יורד לכרטיס הרכישה (סקשן 31) */}
                <a
                  href="#checkout"
                  data-cta="product-hero-buy"
                  className="btn-chamfer rounded-[6px] bg-gold px-7 py-3.5 text-[0.95rem] font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
                >
                  {HERO.ctaPrimary}
                </a>
              </MItem>
              <MItem as="p" className="mt-4 text-sm text-muted">
                {HERO.community}
              </MItem>
              <MItem as="p" className="mt-3">
                <Link
                  href={LIST_HREF}
                  data-cta="product-hero-freelist"
                  className="text-sm font-semibold text-gold-ink underline-offset-4 transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                >
                  {HERO.ctaSecondary}
                </Link>
              </MItem>
              <MItem as="p" className="mt-6 flex items-center gap-2.5">
                <span className="text-[0.6rem] leading-none text-gold" aria-hidden>
                  ◆
                </span>
                <span className="text-sm font-semibold text-navy">{HERO.rdMark}</span>
              </MItem>
            </MOrchestrate>
          </div>
        </Container>
      </section>

      {/* ── 27 · for-you — TENSION · centered-prose ──────────────────────────
          עמודת קריאה שקטה אחת על נייר חם: זיהוי-עצמי → PullQuote → שורת-פתרון. */}
      <section id="foryou" className="scroll-mt-24">
        <Container width="prose" className="py-16 sm:py-20 md:py-28">
          <MChapter className="mb-12" />
          <MOrchestrate>
            <MItem as="p" className="flex items-center gap-2.5">
              <span className="text-[0.65rem] leading-none text-rose" aria-hidden>
                ◆
              </span>
              <span className="text-xs font-bold tracking-[.18em] text-rose-ink">
                {FORYOU.kicker}
              </span>
            </MItem>
            <MItem>
              <RevealHeading
                as="h2"
                text={FORYOU.title}
                className="mt-4 font-serif font-black leading-[1.12] text-navy"
                style={{ fontSize: "clamp(1.8rem, 4vw, 2.9rem)" }}
              />
            </MItem>
            <MItem as="p" className="mt-4 font-serif text-xl font-bold text-gold-ink sm:text-2xl">
              {FORYOU.subtitle}
            </MItem>
            {/* צ'יפי-הרעש — סטטיים (SSR, בלי אנימציה), הטיה מתחלפת ±2° במשפחת צ'יפי-הסרט */}
            <MItem className="mt-8 flex flex-wrap items-center gap-3">
              {FORYOU.noise.map((n, i) => (
                <span
                  key={n}
                  className="rounded-full border border-line bg-card px-5 py-2.5 font-serif italic text-ink shadow-sm"
                  style={{ transform: `rotate(${i % 2 === 0 ? -2 : 2}deg)` }}
                >
                  {n}
                </span>
              ))}
            </MItem>
            <MItem as="p" className="mt-7 text-lg leading-relaxed text-muted">
              {FORYOU.body}
            </MItem>
            <MItem>
              <PullQuote>
                {FORYOU.pullQuoteLead}
                <span className="underline decoration-rose decoration-[3px] underline-offset-8">
                  {FORYOU.pullQuoteMark}
                </span>
              </PullQuote>
            </MItem>
            <MItem as="p" className="text-lg leading-relaxed text-navy-700">
              {FORYOU.solution}
            </MItem>
            <MItem as="p" className="mt-8">
              <a
                href="#inside"
                data-cta="product-foryou-to-inside"
                className="font-bold text-gold-ink underline-offset-4 transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                {FORYOU.ctaBridge}
              </a>
            </MItem>
          </MOrchestrate>
        </Container>
      </section>

      {/* ── 28 · inside — GUIDE · feature-alternating ────────────────────────
          שלוש שורות זיג-זג: צילומי אוכל אמיתיים מארכיון המתכונים של אלונה
          (הוכחת-מלאכה — לעולם לא עמודי-חוברת מפוברקים). */}
      <section id="inside" className="scroll-mt-24 border-y border-line bg-card">
        <Container className="py-16 sm:py-20 md:py-28">
          <SectionHeading eyebrow={INSIDE.kicker} title={INSIDE.title} />
          <FeatureAlternating
            className="mt-14"
            features={INSIDE.rows.map((r) => ({
              title: r.title,
              body: r.body,
              media: (
                <MediaFrame
                  src={r.img}
                  alt={r.alt}
                  ratio="1/1"
                  sizes="(max-width:768px) 100vw, 580px"
                />
              ),
            }))}
          />
          <p className="mt-14 text-center">
            <a
              href="#checkout"
              data-cta="product-inside-to-checkout"
              className="font-bold text-gold-ink underline-offset-4 transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              {INSIDE.ctaBridge}
            </a>
          </p>
        </Container>
      </section>

      {/* ── 29 · includes — PROOF · card-grid ────────────────────────────────
          שלושה כרטיסי-שנהב: חוברת · קבוצת וואטסאפ (מרכז-החום, blush) · עדכונים.
          בלי מונה-חברות, בלי ציטוטים מומצאים — חום-קהילה כן בלבד. */}
      <section id="includes" className="scroll-mt-24">
        <Container className="py-16 sm:py-20 md:py-28">
          <MChapter className="mb-12" />
          <SectionHeading
            eyebrow={INCLUDES.kicker}
            title={INCLUDES.title}
            lead={INCLUDES.lead}
            align="center"
          />
          <MStagger className="mt-14 grid gap-6 md:grid-cols-3" itemClassName="h-full">
            {INCLUDES.cards.map((c) => (
              <div
                key={c.title}
                className={`flex h-full flex-col gap-5 rounded-[16px] p-7 ${
                  c.motif === "bubbles"
                    ? "frame-double bg-blush"
                    : "border border-line bg-sand"
                }`}
                style={
                  c.motif === "bubbles"
                    ? ({ "--frame-color": "var(--color-rose)", "--frame-gap": "6px" } as React.CSSProperties)
                    : undefined
                }
              >
                <div className="text-gold-ink">
                  {c.motif === "booklet" && <BookletGlyph />}
                  {c.motif === "bubbles" && <BubblesMotif />}
                  {c.motif === "leaf" && <LeafGlyph />}
                </div>
                <h3 className="font-serif text-xl font-black leading-snug text-navy">
                  <span className="underline decoration-rose/70 decoration-2 underline-offset-8">
                    {c.title}
                  </span>
                </h3>
                <p className="leading-relaxed text-muted">{c.body}</p>
              </div>
            ))}
          </MStagger>
        </Container>
      </section>

      {/* ── 30 · faq — OBJECTION · centered-prose ────────────────────────────
          7 שאלות-כסף בקולה של נועה, כולל פריט-החובה חינם-מול-בתשלום. */}
      <section id="faq" className="scroll-mt-24 border-t border-line">
        <Container width="prose" className="py-16 sm:py-20 md:py-28">
          <SectionHeading eyebrow={FAQ.kicker} title={FAQ.title} lead={FAQ.lead} align="center" />
          <div className="mt-12">
            <FaqAccordion items={[...FAQ.items]} />
          </div>
          <div className="mt-10 space-y-4 text-center">
            <p className="leading-relaxed text-muted">
              {FAQ.closeBefore}
              <a
                href={WHATSAPP_HREF}
                target="_blank"
                rel="noopener noreferrer"
                data-cta="product-faq-whatsapp"
                className="font-semibold text-gold-ink underline-offset-4 transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                {FAQ.closeLink}
              </a>
              {FAQ.closeAfter}
            </p>
            <p className="leading-relaxed text-muted">
              {FAQ.deRiskBefore}
              <Link
                href={LIST_HREF}
                data-cta="product-faq-freelist"
                className="font-semibold text-gold-ink underline-offset-4 transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                {FAQ.deRiskLink}
              </Link>
              {FAQ.deRiskAfter}
            </p>
            <p className="pt-4">
              <a
                href="#checkout"
                data-cta="product-faq-to-checkout"
                className="inline-block rounded-full border border-navy/25 px-7 py-3 text-[0.95rem] font-bold text-navy-700 transition hover:border-gold hover:text-gold-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                {FAQ.cta}
              </a>
            </p>
          </div>
        </Container>
      </section>

      {/* ── 31 · checkout — RESOLUTION · spotlight-card ──────────────────────
          דלפק-הרכישה השקט: כרטיס אחד מוגבה על שדה blush. הסליקה עצמה חיצונית
          (משולם) — האתר לא נוגע בפרטי תשלום; בלי דחיפות, בלי מונים מפוברקים. */}
      <section id="checkout" className="scroll-mt-24">
        <Container width="standard" className="pb-20 pt-4 md:pb-32">
          <div className="relative overflow-hidden rounded-[24px] bg-blush px-4 py-10 sm:px-10 md:px-16 md:py-16">
            <div aria-hidden className="grain-overlay" />
            <div className="relative mx-auto max-w-[720px]">
              <SpotlightCard>
                <MOrchestrate>
                  <MItem as="p" className="flex items-center gap-2.5">
                    <span className="text-[0.65rem] leading-none text-gold" aria-hidden>
                      ◆
                    </span>
                    <span className="text-xs font-bold tracking-[.18em] text-gold-soft">
                      {CHECKOUT.kicker}
                    </span>
                  </MItem>
                  <MItem>
                    <RevealHeading
                      as="h2"
                      text={CHECKOUT.title}
                      className="mt-4 font-serif font-black leading-[1.15] text-white"
                      style={{ fontSize: "clamp(1.7rem, 3.6vw, 2.6rem)" }}
                    />
                  </MItem>
                  <MItem as="p" className="mt-5 text-lg leading-relaxed text-white/85">
                    {CHECKOUT.body}
                  </MItem>
                  <MItem as="p" className="mt-4 leading-relaxed text-white/75">
                    {CHECKOUT.community}
                  </MItem>
                  <MItem className="mt-9 flex flex-col items-start gap-4">
                    {/* יעד סופי: עמוד הסליקה של משולם — טרם חובר; בינתיים וואטסאפ עסקי (CHECKOUT_HREF) */}
                    <a
                      href={CHECKOUT_HREF}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-cta="product-checkout-buy"
                      className="btn-chamfer rounded-[6px] bg-gold px-8 py-4 text-base font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy"
                    >
                      {CHECKOUT.ctaPrimary}
                    </a>
                    <p className="flex items-center gap-2 text-sm text-white/70">
                      <LockGlyph />
                      {CHECKOUT.secure}
                    </p>
                    <Link
                      href={LIST_HREF}
                      data-cta="product-checkout-freelist"
                      className="rounded-full border border-white/40 px-7 py-3 text-[0.95rem] font-bold text-white transition hover:border-gold-soft hover:text-gold-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    >
                      {CHECKOUT.ctaSecondary}
                    </Link>
                  </MItem>
                </MOrchestrate>
              </SpotlightCard>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
