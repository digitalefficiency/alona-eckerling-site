import type { Metadata } from "next";
import Link from "next/link";

import { Section } from "@/components/layout/Section";
import { SectionHeading } from "@/components/SectionHeading";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SplitText } from "@/components/motion/SplitText";
import { MOrchestrate, MItem } from "@/components/motion/MOrchestrate";
import { MStagger } from "@/components/motion/MStagger";
import { Reveal } from "@/components/Reveal";
import { slideIn } from "@/lib/motion-variants";
import { MCardStack } from "@/components/motion/MCardStack";
import { ClipReveal } from "@/components/motion/ClipReveal";
import { ProcessTimeline } from "@/components/media/ProcessTimeline";
import { MediaFrame } from "@/components/media/MediaFrame";
import { FaqAccordion } from "@/components/FaqAccordion";
import { PullQuote } from "@/components/PullQuote";
import { ContactLeadForm } from "@/components/ContactLeadForm";
import { ResponsePromise } from "@/components/trust/ResponsePromise";
import { JsonLd, faqSchema } from "@/components/JsonLd";
import { site, services } from "@/lib/site";

// ============================================================================
// עמוד: איך עובדים איתי — כל מחרוזת גלויה מודבקת מ-COPY.md (או מ-lib/site.ts).
// אין tel: בשום מקום (Q4) — וואטסאפ + טפסים בלבד.
// ============================================================================

const WHATSAPP_HREF = `https://wa.me/${site.whatsapp}`;

// COPY: ### סקשן 9 · ImageHero + Breadcrumbs + SplitText H1
const HERO = {
  kicker: "ליווי אחת-על-אחת",
  title: "ככה נעבוד ביחד",
  body: "את כבר יודעת מה לאכול. הדרך צריכה להיבנות סביב השבוע שלך, בלי לוותר על האוכל שאת אוהבת, כדי שסוף-סוף יהיה שקט בראש והתוצאה תישאר.",
  trustToken: "דיאטנית קלינית מוסמכת · R.D. · רישיון משרד הבריאות 204526-11",
  // כותרת-כפתור נקייה + שורת-משנה קטנה מתחתיה (תאום ל-hero של הבית) — בלי · בתוך תווית
  ctaPrimary: "בואי נדבר",
  ctaSub: "שיחת היכרות חינם",
  ctaWhatsapp: "אפשר גם לכתוב לי בוואטסאפ",
  micro: "בלי התחייבות · מענה עד 4 ימי עסקים · על החבילות נדבר בשיחה",
} as const;

// COPY: ### סקשן 10 · Section width=prose (PAS ממוקד-שירות)
const PROBLEM = {
  kicker: "למה דווקא ליווי",
  title: "את כבר יודעת מה לאכול",
  subtitle: "מה שחסר זה לא עוד ידע.",
  // re-layout בלבד של גוף COPY §10 (ביקורת-עיצוב #35): פיצול בגבול-משפט לשתי
  // פסקאות, כשה-PullQuote הקיים נושם ביניהן. אפס שינוי-ניסוח.
  body1: "שמרת את הפוסטים, קראת את התפריטים, התחלת ביום ראשון. ולבד, שוב, זה לא החזיק, וזה לא כי טעית או לא ניסית מספיק.",
  body2: "הידע כבר אצלך; מה שאף מדריך לא נתן לך זה מישהי לצדך, בתוך השבוע האמיתי שלך.",
  pullQuoteStart: "הפער הוא לא במה לאכול. הפער הוא לעשות את זה ",
  pullQuoteMark: "לבד",
  pullQuoteEnd: ".",
  cta: "אז ככה זה עובד כשלא לבד ←",
} as const;

// COPY: ### סקשן 11 · FeatureAlternating (עמודי המנגנון)
const METHOD = {
  kicker: "שיטה, לא קסם",
  title: "ארבעה דברים שהופכים ידע לתוצאה שנשארת",
  pillars: [
    {
      title: "נבנה סביב השבוע האמיתי שלך",
      body: "לא תפריט גנרי שנלחם בחיים שלך, אלא דרך שנבנית סביב מה שבאמת קורה אצלך בשבוע: העבודה, הילדים, האירועים, והערב שבו אין כוח לבשל. בגלל זה זה מחזיק.",
    },
    {
      title: "בלי לוותר על האוכל שאת אוהבת",
      body: "אנחנו לא מוחקות מאכלים ולא עושות רשימות אסור. לומדות איך לשלב את מה שאת אוהבת בתוך משהו שעובד, בלי אשמה, כדי שיהיה שקט בראש.",
    },
    {
      title: "החלטות על סמך מדע עדכני",
      body: "כל החלטה נשענת על מה שידוע היום על הגוף, לא על הדיאטה הבאה שכולם מדברים עליה. זה ההבדל בין ניחוש לבין שיטה.",
    },
    {
      title: "ליווי צמוד גם בין הפגישות",
      body: "אני איתך בין הפגישות, לא רק בחדר: כדי שהידע יהפוך להרגל, ושלא תישארי לבד באמצע הדרך.",
    },
  ],
  cta: "ככה זה נראה בפועל, הנה החבילות ←",
} as const;

// COPY: ### סקשן 12 · PricingCard grid (3 חבילות)
// הכרטיסים נגזרים מ-site.ts services (3, בלי מחירים) ומועשרים מ-COPY בלבד.
const PACKAGES = {
  kicker: "שלוש דרכים להיכנס",
  title: "בחרי את הליווי שמתאים לך",
  lead: "אותה שיטה, בשלוש רמות של ליווי. בלי מחיר קשיח: נבחר ביחד את מה שמתאים לחיים שלך, בשיחת היכרות בלי התחייבות.",
  fitLabel: "למי זה מתאים:",
  includedLabel: "מה כלול:",
  cardCta: "בואי נדבר",
  sharedLine: "על החבילה והמחיר נדבר בשיחה. נתאים אותם אלייך, בלי התחייבות.",
} as const;

// COPY: ### סקשן 12 · PricingCard grid (3 חבילות) — העשרת הכרטיסים לפי slug
const PACKAGE_COPY: Record<
  string,
  { name: string; chip?: string; fit: string; included: readonly string[]; highlight?: boolean }
> = {
  "single-session": {
    name: "פגישת עומק · חד-פעמית",
    chip: "60 עד 75 דקות",
    fit: "לרגע שבו את רוצה כיוון מקצועי אחד, נקי: פגישה עמוקה ותוכנית אישית שנשארת איתך.",
    included: [
      "אבחון מעמיק בפגישה של 60 עד 75 דקות",
      "תוכנית אישית שנבנית סביב השבוע שלך",
      "קובץ מפורט עם כלים, טיפים והנחיות להתנהלות עצמאית",
    ],
  },
  "coaching-60": {
    name: "ליווי בסיס · 60 יום",
    fit: "כשאת רוצה לא רק לדעת מה נכון, אלא שמישהי תלווה אותך עד שזה נכנס לשגרה.",
    included: [
      "פגישת אבחון מעמיקה + 4 מפגשי מעקב (אחת לשבועיים)",
      "וואטסאפ ביני לבינך בין המפגשים",
      "פידבק על יומן האכילה",
      "צירוף לקבוצת הוואטסאפ + גישה לאפליקציה ותכנים מקצועיים",
    ],
  },
  "coaching-120": {
    name: "ליווי מורחב · 120 יום",
    fit: "מתאים כשהדפוס ותיק וניסית כבר הכל, וחשוב לך שהפעם זה יישאר.",
    included: [
      "כל מה שבליווי הבסיס",
      "ליווי לאורך כ-120 יום, לעומק ולאורך זמן",
      "4 מפגשי מעקב + ליווי צמוד בוואטסאפ ובאפליקציה",
    ],
    highlight: true,
  },
};

// רצועת-עובדות שקטה מעל רשת החבילות (ביקורת-עיצוב #35) — מורכבת אך ורק
// ממחרוזות COPY שכבר חיות בעמוד (צ'יפ הפגישה, שמות החבילות, HERO.micro).
// בלי אנימציית-ספירה, בלי מדדים מומצאים.
const PACKAGE_FACTS = [
  "60 עד 75 דקות",
  "ליווי בסיס · 60 יום",
  "ליווי מורחב · 120 יום",
  "מענה עד 4 ימי עסקים",
] as const;

// סדר הצגה: קל → עמוק (חד-פעמית → בסיס 60 → מורחב 120), מעל שירותי site.ts.
const PACKAGE_ORDER = ["single-session", "coaching-60", "coaching-120"] as const;
const packageCards = PACKAGE_ORDER.flatMap((slug) => {
  const svc = services.find((s) => s.slug === slug);
  const copy = PACKAGE_COPY[slug];
  return svc && copy ? [{ slug: svc.slug, ...copy }] : [];
});

// COPY: ### סקשן 13 · ProcessTimeline (מה קורה בפועל)
const PROCESS = {
  kicker: "שלב אחרי שלב",
  title: "מה קורה בכל שלב",
  lead: "בחרת כיוון? הנה מה שקורה בפועל, בלי הפתעות: אותה דרך חמה, אחת-על-אחת, שנבנית סביב השבוע שלך.",
  steps: [
    {
      t: "שיחת היכרות",
      d: "בחינם ובלי התחייבות. נכיר, תספרי לי מה עובר עלייך, ונבין ביחד אם אני האדם הנכון ללוות אותך. שיחה, לא שיחת מכירה.",
    },
    {
      t: "פגישה עמוקה + תוכנית אישית",
      d: "60 עד 75 דקות שיושבות לעומק: מה את אוהבת לאכול, איך נראה היום שלך, מה כבר ניסית, ובדיקות דם אם רלוונטי. את יוצאת עם תוכנית שנבנית סביב החיים שלך, לא במקומם.",
    },
    {
      t: "ליווי שנשאר",
      d: "כאן זה לא נגמר. בין המפגשים אני איתך בוואטסאפ, עם פידבק על יומן האכילה, ובחבילות גם אפליקציית ליווי, כדי שהדברים ייכנסו לשגרה ויישארו. לא עוד דיאטה שנגמרת ואת נשארת לבד איתה.",
    },
  ],
  cta: "מרגישה שזה מדבר אלייך? בואי נדבר ←",
} as const;

// COPY: ### סקשן 14 · MediaFrame band + ResultCard
const PROOF = {
  kicker: "תראי בעצמך",
  title: "מהמטבח של אלונה",
  lead: "אוכל שאני באמת מבשלת, בתוך שבוע רגיל, בלי למחוק את מה שאת אוהבת.",
  // סלוט ההמלצות נשאר חשוך מבנית עד שתגיע עדות אמיתית ומיוחסת (YMYL, הוכחה-אמיתית-בלבד)
  testimonialEmpty: "המלצות אמיתיות יופיעו כאן ברגע שיהיו. אני לא ממציאה סיפור שלא קרה.",
  cta: "הצצה למטבח שלי ←",
  // צילומי אוכל אמיתיים מארכיון המתכונים של אלונה (media/client/recipes);
  // ה-alt = כותרת המתכון מקובץ התוכן (content/recipes/*)
  stills: [
    { src: "/media/client/recipes/green-shakshuka.jpg", alt: "שקשוקה ירוקה - שקשוקת תרד חלומית" },
    { src: "/media/client/recipes/one-pot-bulgur-stew.jpg", alt: "תבשיל בורגול בסיר אחד" },
    { src: "/media/client/recipes/roasted-tomato-soup.jpg", alt: "מרק עגבניות צלויות" },
  ],
} as const;

// COPY: ### סקשן 15 · FaqAccordion (11 פריטים)
const FAQ = {
  kicker: "לפני שנדבר",
  title: "כל מה שאת שואלת את עצמך עכשיו",
  lead: "ריכזתי כאן את השאלות שחוזרות אליי הכי הרבה, בכנות, בלי מכירה. אם נשאר לך עוד משהו, בדיוק בשביל זה יש שיחת היכרות בלי התחייבות.",
  items: [
    {
      q: "אני כבר יודעת מה לאכול. אז מה ליווי בכלל ייתן לי?",
      a: "רוב הנשים שמגיעות אליי יודעות בדיוק מה נכון. הפער אף פעם לא היה בידע, הוא בלעשות את זה לבד, בתוך שבוע עמוס. הליווי הוא לא עוד מידע: הוא דרך שנבנית סביב השבוע האמיתי שלך, ומישהי אחת שנשארת איתך עד שזה נכנס לשגרה.",
    },
    {
      q: "ניסיתי כבר הכל. למה שדווקא זה יעבוד?",
      a: "כי זה לא עוד דיאטה ולא עוד תפריט. אין אצלי קיצורי דרך, טרנדים והבטחות קסם: בונות דרך סביב החיים שלך, בלי לוותר על האוכל שאת אוהבת, בקצב שאפשר להתמיד בו.",
    },
    {
      q: "אני לא רוצה עוד תפריט נוקשה שאי אפשר לעמוד בו.",
      a: "ואני לא עובדת ככה. אין תפריט אחיד ואין רשימת איסורים: יש התאמה לשבוע שלך, לטעמים שלך ולקצב שלך, וגמישות כשהחיים משתנים.",
    },
    {
      q: "יש לי כל הזמן רעש ואשמה בראש סביב אוכל. זה יכול להשתנות?",
      a: 'זה בדיוק הלב של העבודה שלי. המטרה היא שקט: פחות התלבטות, פחות אשמה, יותר ראש נקי. בלי שיפוט ובלי "נפלת".',
    },
    {
      q: "אני אוכלת הרבה מתוך לחץ או רגש. את מתייחסת גם לזה?",
      a: "כן, זה חלק מרכזי בליווי. מסתכלות יחד על הדפוסים בעדינות, בלי שיפוט, ובונות במקומם הרגלים שקטים יותר ומערכת יחסים טובה יותר עם אוכל.",
    },
    {
      q: "איך אני יודעת שהפעם זה יישאר ולא יחזור כמו תמיד?",
      a: "כי אנחנו לא רודפות אחרי תוצאה מהירה שנעלמת. בונות הרגלים באמת, בקצב שנכון לך, כך שאפשר להתמיד לאורך זמן. הליווי המורחב קיים בדיוק בשביל זה.",
    },
    {
      q: "מה קורה אחרי שהליווי נגמר? אני חוזרת לאותו מקום?",
      a: "המטרה שלי הפוכה מתלות: שתצאי עם דרך שהיא כבר שלך. תוכנית שנשארת בידיים שלך, הרגלים שהפכו טבעיים, וכלים שיישארו גם הרבה אחרי שהליווי יסתיים.",
    },
    {
      q: "אני מרגישה שאני מתמודדת עם זה לבד. איך הליווי עוזר בזה?",
      a: "בזה שאני באמת שם. יש פגישות אחת-על-אחת, ובחבילות הליווי גם וואטסאפ ביני לבינך בין המפגשים, עם פידבק על יומן האכילה. המטרה היא שלא תישארי לבד מול האתגרים של היום יום.",
    },
    {
      q: "את בת 26. יש לך מספיק ניסיון, או שאת עוד אינפלואנסרית?",
      a: 'שאלה הוגנת. אני דיאטנית קלינית מוסמכת, רישיון משרד הבריאות 204526-11 (אפשר לבדוק במאגר משרד הבריאות), עם B.Sc במדעי התזונה והתמחות קלינית בבית החולים איכילוב. ואני דווקא חושבת שהגיל הוא יתרון: אני מגיעה עם אנרגיה, סקרנות ורצון ללמוד ולהתפתח. את כל הסיפור תמצאי בעמוד "עליי".',
    },
    {
      q: "אין לי זמן וכוח לעוד פרויקט גדול. איך זה משתלב בחיים?",
      a: "זה בכוונה לא פרויקט ענק. בונים את התהליך סביב החיים האמיתיים: גם אם את עובדת שעות ארוכות, אוכלת בחוץ או כמעט לא מבשלת, נמצא יחד מה שעובד אצלך. ויש גם פגישת עומק חד-פעמית, למי שרוצה כיוון בלי התחייבות ארוכה.",
    },
    {
      q: "אינסטגרם מלא בתוכן חינם. למה בכלל לשלם על ליווי?",
      a: "תוכן חינם הוא נהדר, אבל הוא כללי ומיועד לכולם, ולכן קל לדעת ולא לעשות. ליווי נותן ארבעה דברים שפוסט לא ייתן: התאמה אישית, מבנה, מישהי שבאמת חוזרת אלייך, וקהילה של בנות באותה דרך. המידע חינם; מה שמחזיק לאורך זמן זה הליווי.",
    },
  ],
  closeLine: 'נשאר לך "כן, אבל" שלא מופיע כאן? בשיחת היכרות בלי עלות ובלי התחייבות נענה עליו יחד.',
  closeCta: "בואי נדבר ←",
  magnet: "עדיין לא בטוחה? הצטרפי לרשימה השפויה.",
} as const;

// COPY: ### סקשן 16 · ContactLeadForm (פאנל נייבי, Service+FAQPage JSON-LD)
const CTA = {
  title: "הגעת עד לפה.\nנשאר רק להכיר. בואי נדבר.",
  body: "שיחת היכרות קצרה, בלי התחייבות. נכיר, ונבין יחד אם אני האדם הנכון ללוות אותך, בלי לוותר על האוכל שאת אוהבת, כדי שסוף-סוף יהיה שקט בראש.",
  packagesLine: "הליווי נמכר בחבילות שמתאימות לחיים שלך. על זה נדבר בשיחה, בלי הפתעות ובלי מחיר שקופץ מהמסך.",
  promise: "אני חוזרת אלייך אישית, עד 4 ימי עסקים.",
  trustToken: "דיאטנית קלינית מוסמכת · R.D. · רישיון משרד הבריאות 204526-11",
  aboutPointer: "רוצה קודם להכיר אותי? הסיפור שלי בעמוד עליי ←",
  button: "בואי נדבר, שיחת היכרות חינם",
} as const;

// Service JSON-LD — בלי מחירים (Q19), בלי דירוגים מומצאים; נגזר מ-site.ts בלבד.
const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "ליווי תזונתי אישי",
  serviceType: "ליווי תזונתי אישי",
  provider: { "@type": "ProfessionalService", name: site.legalName, url: site.url },
  areaServed: site.areasServed,
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: PACKAGES.kicker,
    itemListElement: services.map((s) => ({
      "@type": "Offer",
      itemOffered: { "@type": "Service", name: s.title, description: s.short },
    })),
  },
};

export const metadata: Metadata = {
  title: "איך עובדים איתי",
  description: HERO.body,
  alternates: { canonical: "/coaching" },
  openGraph: { url: "/coaching" },
};

// ביקורת-עיצוב #32 — still-הוכחה עם חשיפת ink-wipe: משכפל את גרייד-הבית של
// MediaFrame (טינט + גרעון, aria-hidden, סטטיים) סביב ClipReveal — חשיפת-המדיה
// החתומה של DESIGN-DIRECTION D2. תאום reduced-motion כבר בנוי ב-.clip-frame
// (globals.css) — בלי תנועה ה-SSR מציג את התמונה הסופית.
function ProofStill({ src, alt }: { src: string; alt: string }) {
  return (
    <div
      className="relative overflow-hidden rounded-[10px] border border-line"
      style={{ aspectRatio: "16 / 9" }}
    >
      <ClipReveal src={src} alt={alt} sizes="(max-width:768px) 100vw, 400px" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "var(--grade-tint)" }}
      />
      <div aria-hidden className="grain-overlay" />
    </div>
  );
}

export default function CoachingPage() {
  return (
    <main>
      {/* ── 09 · HOOK — hero סנד חם: still שולחן-הייעוץ המיוצר (layer 8, בלי פנים) יושב
             בפאנל-ממוסגר עם גבול גיאומטרי חד בקצה inline-end (בלי מסך-המסה, בלי אורות);
             פורטרט אמיתי של אלונה יחליף אותו כשיגיע. ── */}
      <section data-light-hero className="relative isolate overflow-hidden border-b border-line bg-sand">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          {/* the still is CROPPED INTO A FRAMED PANEL, not melted into the page: a
              double-frame plate (the house flagship treatment) anchored to the
              inline-end screen edge, which crops it. Same frame language as the
              mobile MediaFrame twin below. The <img> stays a swappable slot;
              <picture> keeps it EAGER here but stops React emitting a preload hint
              (hints ride the RSC payload and replay on every page that prefetches
              /coaching). Grade = the house tint + grain, never a melt-scrim. */}
          {/* the positioning lives on a PLAIN wrapper — .frame-double is unlayered
              CSS that forces position:relative and defeats an `absolute` utility
              (the ImageHero note), which would collapse the plate to ~0 height. The
              frame-double stays relative (as it forces) and fills the absolutely-
              sized wrapper via h-full; the wrapper's top+bottom give it definite
              height so h-full resolves. Ring lives on the frame-double, whose
              overflow-hidden inner clip never hides its ::after. */}
          <div className="absolute inset-y-10 end-0 hidden w-[40%] md:block">
            <div className="frame-double relative h-full w-full rounded-[10px] [--frame-color:var(--color-gold)] [--frame-gap:6px]">
              <div className="absolute inset-0 overflow-hidden rounded-[10px]">
                <picture className="contents">
                  <img
                    src="/media/generated/09-coaching-table.jpg"
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </picture>
                <div className="absolute inset-0" style={{ background: "var(--grade-tint)" }} />
                <div className="grain-overlay" />
              </div>
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-[var(--container-wide)] px-4 py-16 sm:px-6 md:py-24">
          <Breadcrumbs items={[{ label: "איך עובדים איתי", href: "/coaching" }]} />
          <MOrchestrate className="mt-10 max-w-[68ch]">
            <MItem as="p" className="flex items-center gap-2.5">
              <span className="text-[0.7rem] leading-none text-gold" aria-hidden>◆</span>
              <span className="text-xs font-bold tracking-[.2em] text-gold-ink">{HERO.kicker}</span>
            </MItem>
            <SplitText
              as="h1"
              text={HERO.title}
              baseDelay={140}
              className="mt-5 font-serif font-black leading-[1.05] text-navy"
              style={{ fontSize: "var(--text-hero)" }}
            />
            <MItem as="p" className="mt-6 max-w-[52ch] text-lg leading-relaxed text-muted">
              {HERO.body}
            </MItem>
            <MItem className="mt-7">
              {/* the rose thread is born here — a hairline under the trust chip that
                  travels the whole page (pin rail → package rule → form rule) */}
              <span className="inline-flex flex-col items-start gap-1.5">
                <span className="inline-flex items-center gap-2 rounded-full bg-navy px-4 py-2">
                  <span className="text-[0.6rem] leading-none text-gold-soft" aria-hidden>◆</span>
                  <span className="text-xs font-bold text-white">{HERO.trustToken}</span>
                </span>
                <span aria-hidden className="block h-[2px] w-16 bg-rose" />
              </span>
            </MItem>
            <MItem className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-4">
              {/* primary label + a small sub-line under it (the home hero's answer) —
                  a button label never carries a · separator */}
              <div className="flex flex-col items-center gap-1.5">
                <Link
                  href="#lead"
                  data-cta="coaching-hero-lead"
                  className="btn-chamfer rounded-[6px] bg-gold px-7 py-3.5 text-[0.95rem] font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
                >
                  {HERO.ctaPrimary}
                </Link>
                <span className="text-xs font-semibold text-muted">{HERO.ctaSub}</span>
              </div>
              {/* the ghost twin carries the SAME chamfered silhouette as the primary */}
              <a
                href={WHATSAPP_HREF}
                target="_blank"
                rel="noopener noreferrer"
                data-cta="coaching-hero-whatsapp"
                className="btn-chamfer rounded-[6px] border border-navy/25 px-7 py-3.5 text-[0.95rem] font-bold text-navy-700 transition hover:border-gold hover:text-gold-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                {HERO.ctaWhatsapp}
              </a>
            </MItem>
            <MItem as="p" className="mt-4 text-sm text-muted">
              {HERO.micro}
            </MItem>
          </MOrchestrate>
          {/* ביקורת-עיצוב #31 — במובייל ה-still חבוי (hidden md:block ברקע); רצועת 16/9
              שקטה עם אותו צילום, תחת מסך-סנד עדין, כדי שגם מבקרות אינסטגרם יפגשו קליניקה. */}
          <Reveal className="mt-10 md:hidden">
            <div className="relative">
              <MediaFrame
                src="/media/generated/09-coaching-table.jpg"
                alt=""
                ratio="16/9"
                sizes="100vw"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-[10px] bg-gradient-to-t from-sand/45 to-transparent"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── 10 · TENSION — פרוזה ממורכזת: הפער הוא ה"לבד", לא הידע ── */}
      <Section tone="white" width="prose" border>
        <SectionHeading eyebrow={PROBLEM.kicker} title={PROBLEM.title} lead={PROBLEM.subtitle} />
        {/* ONE orchestrator for the section (token stagger) — and the page's single
            lean-in: the rose-marked pull-quote arrives from the reading side while
            everything around it stays quiet. */}
        <MOrchestrate>
          <MItem as="p" className="mt-8 text-lg leading-relaxed text-ink">
            {PROBLEM.body1}
          </MItem>
          <MItem variants={slideIn("inline-start")}>
            <PullQuote>
              {PROBLEM.pullQuoteStart}
              <span className="underline decoration-rose decoration-4 underline-offset-8">{PROBLEM.pullQuoteMark}</span>
              {PROBLEM.pullQuoteEnd}
            </PullQuote>
          </MItem>
          <MItem as="p" className="mb-8 text-lg leading-relaxed text-ink">
            {PROBLEM.body2}
          </MItem>
          <MItem>
            <Link
              href="#method"
              data-cta="coaching-problem-to-method"
              className="underline-grow inline-block font-bold text-gold-ink"
            >
              {PROBLEM.cta}
            </Link>
          </MItem>
        </MOrchestrate>
      </Section>

      {/* ── 11 · GUIDE — the method DECK (the page's ONE pinned moment, client-
             requested): scroll deals each pillar-card in from the side and lands
             it OVER the previous one, so only the current claim reads. Card faces
             carry the ledger DNA (diamond numeral, ghost folio, rose foot). ZERO
             photography — a dish photo cannot illustrate an abstract method claim;
             the food gallery lives in PROOF (§14) and /recipes.
             Static twin (SSR / no-JS / reduced-motion / mobile): the numbered
             ledger below — every word always readable. ── */}
      <Section tone="sand" id="method" seam>
        <SectionHeading eyebrow={METHOD.kicker} title={METHOD.title} />
        <MCardStack
          className="mt-6"
          dir="rtl"
          ariaLabel={METHOD.title}
          cards={METHOD.pillars.map((p, i) => (
            <div
              key={p.title}
              className="frame-double relative flex h-full flex-col justify-center rounded-[16px] bg-card p-10 shadow-[var(--elevation-2)] md:p-16"
              style={{ "--frame-gap": "8px", "--frame-color": "var(--color-gold)" } as React.CSSProperties}
            >
              <div aria-hidden className="grain-overlay" />
              {/* index row — the diamond numeral + a gold hairline running to the edge */}
              <div className="relative flex items-center gap-5">
                <span aria-hidden className="grid h-11 w-11 shrink-0 rotate-45 place-items-center border border-gold/60 bg-card">
                  <span className="-rotate-45 font-serif text-sm font-bold text-gold-ink">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </span>
                <span aria-hidden className="h-px flex-1 bg-gold/35" />
              </div>
              {/* ghost folio bottom-anchored to the title band only (ledger DNA) */}
              <div className="relative mt-8 w-fit">
                <span aria-hidden className="method-folio pointer-events-none absolute bottom-0 -start-1 select-none">
                  {i + 1}
                </span>
                <h3 className="relative font-serif text-3xl font-bold leading-[1.15] text-navy md:text-4xl">
                  {p.title}
                </h3>
              </div>
              <p className="relative mt-6 max-w-[52ch] text-lg leading-[1.75] text-muted md:text-xl">
                {p.body}
              </p>
              {/* the rose thread lands at the card's foot */}
              <span aria-hidden className="absolute inset-x-10 bottom-8 h-[3px] rounded-full bg-rose/50 md:inset-x-16" />
            </div>
          ))}
          staticFallback={
            <div className="relative mx-auto mt-8 max-w-[46rem] md:mt-14">
          <MOrchestrate className="relative">
            {METHOD.pillars.map((p, i) => {
              const isLast = i === METHOD.pillars.length - 1;
              return (
                <MItem
                  key={p.title}
                  as="div"
                  className={`relative grid grid-cols-[3rem_1fr] gap-x-5 md:grid-cols-[5.5rem_1fr] md:gap-x-10 ${
                    isLast ? "" : "pb-14 md:pb-24"
                  }`}
                >
                  {/* the rose thread — ONE segment per gap, node-center → node-center,
                      so the rail begins at the first bead and ends at the last (no stub
                      above, no tail below); the next bead's bg-sand masks its arrival. */}
                  {!isLast && (
                    <span
                      aria-hidden
                      className="pointer-events-none absolute top-[1.375rem] -bottom-[1.375rem] start-[1.5rem] w-px -translate-x-1/2 bg-rose/45 md:top-[1.625rem] md:-bottom-[1.625rem] md:start-[2.75rem]"
                    />
                  )}
                  {/* thread column — the diamond node beaded onto the rail */}
                  <div className="relative flex items-start justify-center">
                    <span
                      aria-hidden
                      className="mt-1.5 grid h-8 w-8 rotate-45 place-items-center border border-gold/60 bg-sand md:h-10 md:w-10"
                    >
                      <span className="h-1.5 w-1.5 bg-gold/70 md:h-2 md:w-2" />
                    </span>
                  </div>
                  {/* entry column — the ghosted folio numeral is bottom-anchored to the
                      TITLE band only (it rises behind the title, never washing the body) */}
                  <div className="min-w-0">
                    <div className="relative w-fit">
                      <span aria-hidden className="method-folio pointer-events-none absolute bottom-0 -start-1 select-none">
                        {i + 1}
                      </span>
                      <h3 className="relative font-serif text-2xl font-bold leading-[1.15] text-navy md:text-[2.05rem]">
                        {p.title}
                      </h3>
                    </div>
                    <p className="mt-4 max-w-[52ch] text-lg leading-[1.75] text-muted">{p.body}</p>
                  </div>
                </MItem>
              );
            })}
          </MOrchestrate>
            </div>
          }
        />
        <Reveal delay={120} className="mt-12">
          <Link
            href="#packages"
            data-cta="coaching-method-to-packages"
            className="underline-grow inline-block font-bold text-gold-ink"
          >
            {METHOD.cta}
          </Link>
        </Reveal>
      </Section>

      {/* ── 12 · PLAN — שלוש חבילות מ-site.ts, מועשרות מ-COPY; בלי מחיר, בלי דחיפה ── */}
      <Section tone="white" id="packages" border>
        <SectionHeading eyebrow={PACKAGES.kicker} title={PACKAGES.title} lead={PACKAGES.lead} />
        <Reveal delay={100} className="mt-8">
          <ul className="flex flex-wrap items-center gap-2.5">
            {PACKAGE_FACTS.map((fact) => (
              <li key={fact}>
                <span className="inline-flex rounded-full border border-line bg-card px-3 py-1 text-xs font-bold text-navy-700">
                  {fact}
                </span>
              </li>
            ))}
          </ul>
        </Reveal>
        {/* Tailwind v4 lifts cards via the `translate` property — `transform` is NOT
            it, so the old transition list left the lift jumping at 0ms while the
            shadow eased. The flagship card is ALREADY raised: it does not lift again
            on hover (stillness is the signature) — its frame answers instead,
            gold → rose, on the same token. */}
        <MStagger className="mt-12 grid gap-6 md:grid-cols-3" itemClassName="h-full">
          {packageCards.map((card) => (
            <article
              key={card.slug}
              className={`flex h-full flex-col rounded-[16px] p-7 transition-[translate,box-shadow,border-color] duration-[var(--dur-micro)] ease-[var(--ease-out)] motion-reduce:transition-none ${
                card.highlight
                  ? "frame-double bg-gold-soft [--frame-color:var(--color-gold)] [--frame-gap:6px] hover:[--frame-color:var(--color-rose)] md:-translate-y-2"
                  : "border border-line bg-sand hover:-translate-y-1 hover:shadow-[var(--elevation-2)]"
              }`}
              style={card.highlight ? { boxShadow: "var(--elevation-2)" } : undefined}
            >
              {card.highlight && <span aria-hidden className="mb-4 block h-[2px] w-16 bg-rose" />}
              <h3 className="font-serif text-xl font-black leading-snug text-navy">
                <span className="underline decoration-rose decoration-2 underline-offset-8">{card.name}</span>
              </h3>
              {card.chip && (
                <p className="mt-4">
                  <span className="inline-flex rounded-full border border-line bg-card px-3 py-1 text-xs font-bold text-navy-700">
                    {card.chip}
                  </span>
                </p>
              )}
              <p className="mt-5 text-sm font-bold text-gold-ink">{PACKAGES.fitLabel}</p>
              <p className="mt-1 leading-relaxed text-muted">{card.fit}</p>
              <p className="mt-5 text-sm font-bold text-gold-ink">{PACKAGES.includedLabel}</p>
              <ul className="mt-2 flex flex-col gap-2.5">
                {card.included.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 leading-relaxed text-ink">
                    <span className="mt-1.5 text-sm leading-none text-gold" aria-hidden>✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-7">
                <Link
                  href="#lead"
                  data-cta={`coaching-package-${card.slug}`}
                  className="btn-chamfer block rounded-[6px] bg-gold px-6 py-3 text-center font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
                >
                  {PACKAGES.cardCta}
                </Link>
              </div>
            </article>
          ))}
        </MStagger>
        <Reveal delay={120}>
          <p className="mt-10 text-center leading-relaxed text-muted">{PACKAGES.sharedLine}</p>
        </Reveal>
      </Section>

      {/* ── 13 · PLAN — ציר תהליך תלת-תחנתי: הסרת אי-ודאות לפני הסגירה ── */}
      <Section tone="sand" seam>
        <SectionHeading eyebrow={PROCESS.kicker} title={PROCESS.title} lead={PROCESS.lead} />
        {/* ONE orchestrator, token stagger — no hand-rolled delay ladder */}
        <MOrchestrate>
          <MItem className="mt-12">
            <ProcessTimeline headingAs="h3" steps={[...PROCESS.steps]} />
          </MItem>
          <MItem className="mt-12">
            <Link
              href="#lead"
              data-cta="coaching-process-lead"
              className="underline-grow inline-block font-bold text-gold-ink"
            >
              {PROCESS.cta}
            </Link>
          </MItem>
        </MOrchestrate>
      </Section>

      {/* ── 14 · PROOF — the "half-bg + card" pattern (the approved plan's #1 placement):
             her real dish photo bleeds the inline-END half to the viewport edge; a
             frosted ivory card LEANS IN from the inline-start with the proof story —
             "standing in her kitchen". Mobile: the photo becomes a top band, the card
             stacks, no slide. The testimonial slot stays honestly dark (soft wash, ◆). ── */}
      <section className="relative overflow-hidden border-y border-line bg-card">
        {/* the half-bleed photo (desktop) — inline-end half, scrimmed toward the text half */}
        <div aria-hidden className="absolute inset-y-0 end-0 hidden w-[52%] md:block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={PROOF.stills[0].src} alt="" loading="lazy" className="h-full w-full object-cover" />
          <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "var(--grade-tint)" }} />
          <div className="absolute inset-0 bg-gradient-to-l from-card via-card/35 to-transparent" />
        </div>
        {/* mobile: the photo as a top band */}
        <div className="relative aspect-[3/2] md:hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={PROOF.stills[0].src} alt={PROOF.stills[0].alt} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
          <div aria-hidden className="grain-overlay" />
        </div>
        <div className="relative mx-auto max-w-[var(--container-wide)] px-4 py-16 sm:px-6 md:py-28">
          <div className="md:w-[52%]">
            <MStagger variants={slideIn("inline-start", 48)}>
              <div className="rounded-[16px] border border-line bg-card/80 p-7 shadow-[var(--elevation-2)] backdrop-blur-md md:p-9">
                <SectionHeading eyebrow={PROOF.kicker} title={PROOF.title} lead={PROOF.lead} />
                <div className="mt-8 grid grid-cols-2 gap-4">
                  {PROOF.stills.slice(1).map((s) => (
                    <div key={s.src} className="relative aspect-square overflow-hidden rounded-[10px] border border-line">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={s.src} alt={s.alt} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                      <div aria-hidden className="grain-overlay" />
                    </div>
                  ))}
                </div>
                <div className="mt-8 rounded-[10px] bg-bg2 px-6 py-5 text-center">
                  <p className="text-sm leading-relaxed text-muted">
                    <span className="text-[0.6rem] leading-none text-gold" aria-hidden>◆ </span>
                    {PROOF.testimonialEmpty}
                  </p>
                </div>
                <div className="mt-7">
                  <Link
                    href="/recipes"
                    data-cta="coaching-proof-recipes"
                    className="underline-grow inline-block font-bold text-gold-ink"
                  >
                    {PROOF.cta}
                  </Link>
                </div>
              </div>
            </MStagger>
          </div>
        </div>
      </section>

      {/* ── 15 · OBJECTION — 11 שאלות בקולה שלה + FAQPage JSON-LD ── */}
      <Section tone="sand" width="prose" seam>
        <JsonLd data={faqSchema([...FAQ.items])} />
        <SectionHeading eyebrow={FAQ.kicker} title={FAQ.title} lead={FAQ.lead} />
        {/* ONE orchestrator, token stagger — no hand-rolled delay ladder */}
        <MOrchestrate>
          <MItem className="mt-10">
            <FaqAccordion items={[...FAQ.items]} />
          </MItem>
          <MItem className="mt-10">
            <p className="leading-relaxed text-ink">
              {FAQ.closeLine}{" "}
              <Link href="#lead" data-cta="coaching-faq-lead" className="underline-grow font-bold text-gold-ink">
                {FAQ.closeCta}
              </Link>
            </p>
            <p className="mt-3 text-sm text-muted">
              <Link
                href="/recipes"
                data-cta="coaching-faq-magnet"
                className="underline decoration-rose underline-offset-4 transition hover:text-navy"
              >
                {FAQ.magnet}
              </Link>
            </p>
          </MItem>
        </MOrchestrate>
      </Section>

      {/* ── 16 · RESOLUTION — פאנל נייבי #lead: הצעד הקטן והבטוח + Service JSON-LD ── */}
      <Section tone="navy" id="lead" seam>
        <JsonLd data={serviceSchema} />
        <div className="grid items-start gap-12 md:grid-cols-[1.1fr_0.9fr]">
          <MOrchestrate>
            <SplitText
              as="h2"
              text={CTA.title}
              baseDelay={120}
              className="font-serif font-black leading-[1.12] text-white"
              style={{ fontSize: "clamp(2rem, 4.6vw, 3.4rem)" }}
            />
            <MItem as="p" className="mt-6 max-w-[52ch] text-lg leading-relaxed text-slate-200">
              {CTA.body}
            </MItem>
            <MItem as="p" className="mt-4 max-w-[52ch] leading-relaxed text-slate-300">
              {CTA.packagesLine}
            </MItem>
            <MItem className="mt-7">
              <ResponsePromise tone="dark" promise={CTA.promise} />
            </MItem>
            <MItem className="mt-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/25 px-4 py-2">
                <span className="text-[0.6rem] leading-none text-gold-soft" aria-hidden>◆</span>
                <span className="text-xs font-bold text-white/90">{CTA.trustToken}</span>
              </span>
            </MItem>
            <MItem className="mt-8">
              <Link
                href="/about"
                data-cta="coaching-cta-about"
                className="font-bold text-gold-soft transition hover:text-white"
              >
                {CTA.aboutPointer}
              </Link>
            </MItem>
          </MOrchestrate>
          <Reveal delay={140}>
            <div>
              {/* the rose thread ends at the door */}
              <span aria-hidden className="mb-3 block h-[2px] w-16 bg-rose" />
              <p className="mb-4 font-serif text-xl font-bold text-white">{CTA.button}</p>
              <ContactLeadForm />
            </div>
          </Reveal>
        </div>
      </Section>
    </main>
  );
}
