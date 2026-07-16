import type { Metadata } from "next";
import Link from "next/link";

import { Section } from "@/components/layout/Section";
import { SectionHeading } from "@/components/SectionHeading";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SplitText } from "@/components/motion/SplitText";
import { MOrchestrate, MItem } from "@/components/motion/MOrchestrate";
import { MStagger } from "@/components/motion/MStagger";
import { Reveal } from "@/components/Reveal";
import { FeatureAlternating } from "@/components/section/FeatureAlternating";
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
  body: "את כבר יודעת מה לאכול. מה שחסר זה לא עוד תפריט, אלא דרך שנבנית סביב השבוע שלך, בלי לוותר על האוכל שאת אוהבת. כדי שסוף-סוף יהיה שקט בראש והתוצאה תישאר.",
  trustToken: "דיאטנית קלינית מוסמכת · R.D. · רישיון משרד הבריאות 204526-11",
  ctaPrimary: "בואי נדבר · שיחת היכרות חינם",
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
      title: "מדע עדכני, לא טרנדים",
      body: "כל החלטה נשענת על מה שידוע היום על הגוף, לא על הדיאטה הבאה שכולם מדברים עליה. זה ההבדל בין ניחוש לבין שיטה.",
    },
    {
      title: "ליווי צמוד, לא לבד",
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
  lead: "בחרת כיוון? הנה בדיוק מה שקורה בפועל, בלי הפתעות: אותה דרך חמה, אחת-על-אחת, שנבנית סביב השבוע שלך.",
  steps: [
    {
      t: "שיחת היכרות",
      d: "בחינם, בלי התחייבות. נכיר, תספרי לי מה עובר עלייך, ונבין ביחד אם אני האדם הנכון ללוות אותך. בלי לחץ, בלי מכירה.",
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
  lead: "לא פיד ולא הבטחה: אוכל אמיתי שאני מבשלת, בנוי סביב שבוע אמיתי, בלי לוותר על מה שאת אוהבת.",
  // סלוט ההמלצות נשאר חשוך מבנית עד שתגיע עדות אמיתית ומיוחסת (YMYL, הוכחה-אמיתית-בלבד)
  testimonialEmpty: "המלצות אמיתיות יופיעו כאן ברגע שיהיו. אנחנו לא ממציאים סיפור שלא קרה.",
  cta: "לכל המתכונים ←",
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
      a: 'זה בדיוק הלב של העבודה שלי. המטרה היא לא עוד כללים, אלא שקט: פחות התלבטות, פחות אשמה, יותר ראש נקי. בלי שיפוט ובלי "נפלת".',
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
  packagesLine: "הליווי נמכר בחבילות שמתאימות לחיים שלך. על זה בדיוק נדבר בשיחה, בלי הפתעות ובלי מחיר שקופץ מהמסך.",
  promise: "אני חוזרת אלייך אישית, עד 4 ימי עסקים.",
  trustToken: "דיאטנית קלינית מוסמכת · R.D. · רישיון משרד הבריאות 204526-11",
  aboutPointer: "רוצה קודם להכיר אותי? הכירי אותי ←",
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
      {/* ── 09 · HOOK — hero סנד חם: still שולחן-הייעוץ המיוצר (layer 8, בלי פנים) נושם
             בצד הרחוק תחת מסך-סנד; פורטרט אמיתי של אלונה יחליף אותו כשיגיע. ── */}
      <section data-light-hero className="relative isolate overflow-hidden border-b border-line bg-sand">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/media/generated/09-coaching-table.jpg"
            alt=""
            className="absolute inset-y-0 -end-0 hidden h-full w-[42%] object-cover md:block"
          />
          <div className="absolute inset-y-0 -end-0 hidden h-full w-[46%] bg-gradient-to-l from-transparent via-sand/40 to-sand md:block" />
          <div className="absolute -top-24 -start-24 h-[26rem] w-[26rem] rounded-full bg-blush/70 blur-3xl" />
          <div className="absolute -bottom-28 -end-20 h-[24rem] w-[24rem] rounded-full bg-gold-soft/50 blur-3xl" />
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
              <span className="inline-flex items-center gap-2 rounded-full bg-navy px-4 py-2">
                <span className="text-[0.6rem] leading-none text-gold-soft" aria-hidden>◆</span>
                <span className="text-xs font-bold text-white">{HERO.trustToken}</span>
              </span>
            </MItem>
            <MItem className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="#lead"
                data-cta="coaching-hero-lead"
                className="rounded-full bg-gold px-7 py-3.5 text-[0.95rem] font-bold text-white transition hover:bg-gold-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
              >
                {HERO.ctaPrimary}
              </Link>
              <a
                href={WHATSAPP_HREF}
                target="_blank"
                rel="noopener noreferrer"
                data-cta="coaching-hero-whatsapp"
                className="rounded-full border border-navy/25 px-7 py-3.5 text-[0.95rem] font-bold text-navy-700 transition hover:border-gold hover:text-gold-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
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
        <Reveal delay={120}>
          <p className="mt-8 text-lg leading-relaxed text-ink">{PROBLEM.body1}</p>
        </Reveal>
        <Reveal delay={180}>
          <PullQuote>
            {PROBLEM.pullQuoteStart}
            <span className="underline decoration-rose decoration-4 underline-offset-8">{PROBLEM.pullQuoteMark}</span>
            {PROBLEM.pullQuoteEnd}
          </PullQuote>
        </Reveal>
        <Reveal delay={220}>
          <p className="mb-8 text-lg leading-relaxed text-ink">{PROBLEM.body2}</p>
        </Reveal>
        <Reveal delay={260}>
          <Link
            href="#method"
            data-cta="coaching-problem-to-method"
            className="inline-block font-bold text-gold-ink transition hover:text-gold-dark"
          >
            {PROBLEM.cta}
          </Link>
        </Reveal>
      </Section>

      {/* ── 11 · GUIDE — ארבעת עמודי המנגנון (זיג-זג עריכתי): עמוד 1 נושא צילום-מנה
             אמיתי שלה (הוכחת "דיאטנית שמבשלת"), עמוד 2 את still קצב-השבוע; 3–4 נשארים
             פאנלים מעוצבים לקצב. ── */}
      <Section tone="sand" id="method" seam>
        <SectionHeading eyebrow={METHOD.kicker} title={METHOD.title} />
        <FeatureAlternating
          className="mt-14"
          features={METHOD.pillars.map((p, i) => {
            const pillarImg =
              i === 0
                ? { src: "/media/client/recipes/cauliflower-fried-rice.jpg", alt: "אורז מוקפץ מכרובית, מנה אמיתית מהמטבח של אלונה" }
                : i === 1
                  ? { src: "/media/generated/11-method-week-bowls.jpg", alt: "" }
                  : null;
            return {
              title: p.title,
              body: <p>{p.body}</p>,
              media: pillarImg ? (
                <div
                  className="relative overflow-hidden rounded-[10px] border border-line"
                  style={{ aspectRatio: "var(--aspect-feature)" }}
                  aria-hidden={pillarImg.alt === "" || undefined}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={pillarImg.src} alt={pillarImg.alt} className="absolute inset-0 h-full w-full object-cover" />
                  <div aria-hidden className="grain-overlay" />
                </div>
              ) : (
                <div
                  aria-hidden
                  className={`relative flex items-center justify-center overflow-hidden rounded-[10px] border border-line ${
                    i % 2 === 0 ? "bg-gold-soft" : "bg-blush"
                  }`}
                  style={{ aspectRatio: "var(--aspect-feature)" }}
                >
                  <span className="font-serif text-7xl font-black text-navy/15 md:text-8xl">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div aria-hidden className="grain-overlay" />
                </div>
              ),
            };
          })}
        />
        <Reveal delay={120} className="mt-12">
          <Link
            href="#packages"
            data-cta="coaching-method-to-packages"
            className="inline-block font-bold text-gold-ink transition hover:text-gold-dark"
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
        <MStagger className="mt-12 grid gap-6 md:grid-cols-3" itemClassName="h-full">
          {packageCards.map((card) => (
            <article
              key={card.slug}
              className={`flex h-full flex-col rounded-[16px] border p-7 transition-[transform,box-shadow] duration-[var(--dur-micro)] ease-[var(--ease-out)] hover:-translate-y-1 hover:shadow-[var(--elevation-2)] motion-reduce:transition-none ${
                card.highlight ? "border-gold/50 bg-gold-soft md:-translate-y-2" : "border-line bg-sand"
              }`}
              style={card.highlight ? { boxShadow: "var(--elevation-2)" } : undefined}
            >
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
                  className="block rounded-full bg-gold px-6 py-3 text-center font-bold text-white transition hover:bg-gold-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
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
        <Reveal delay={120} className="mt-12">
          <ProcessTimeline headingAs="h3" steps={[...PROCESS.steps]} />
        </Reveal>
        <Reveal delay={180} className="mt-12">
          <Link
            href="#lead"
            data-cta="coaching-process-lead"
            className="inline-block font-bold text-gold-ink transition hover:text-gold-dark"
          >
            {PROCESS.cta}
          </Link>
        </Reveal>
      </Section>

      {/* ── 14 · PROOF — צילומי אוכל אמיתיים מהארכיון; סלוט העדויות נשאר חשוך בכנות ── */}
      <Section tone="white" border>
        <SectionHeading eyebrow={PROOF.kicker} title={PROOF.title} lead={PROOF.lead} />
        <MStagger className="mt-12 grid gap-6 md:grid-cols-3">
          {PROOF.stills.map((s) => (
            <ProofStill key={s.src} src={s.src} alt={s.alt} />
          ))}
        </MStagger>
        <Reveal delay={120} className="mt-10">
          <div className="rounded-[10px] border border-dashed border-line bg-bg2 px-6 py-8 text-center">
            <p className="text-sm leading-relaxed text-muted">{PROOF.testimonialEmpty}</p>
          </div>
        </Reveal>
        <Reveal delay={160} className="mt-8">
          <Link
            href="/recipes"
            data-cta="coaching-proof-recipes"
            className="inline-block font-bold text-gold-ink transition hover:text-gold-dark"
          >
            {PROOF.cta}
          </Link>
        </Reveal>
      </Section>

      {/* ── 15 · OBJECTION — 11 שאלות בקולה שלה + FAQPage JSON-LD ── */}
      <Section tone="sand" width="prose" seam>
        <JsonLd data={faqSchema([...FAQ.items])} />
        <SectionHeading eyebrow={FAQ.kicker} title={FAQ.title} lead={FAQ.lead} />
        <Reveal delay={120} className="mt-10">
          <FaqAccordion items={[...FAQ.items]} />
        </Reveal>
        <Reveal delay={160} className="mt-10">
          <p className="leading-relaxed text-ink">
            {FAQ.closeLine}{" "}
            <Link href="#lead" data-cta="coaching-faq-lead" className="font-bold text-gold-ink transition hover:text-gold-dark">
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
        </Reveal>
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
              <p className="mb-4 font-serif text-xl font-bold text-white">{CTA.button}</p>
              <ContactLeadForm />
            </div>
          </Reveal>
        </div>
      </Section>
    </main>
  );
}
