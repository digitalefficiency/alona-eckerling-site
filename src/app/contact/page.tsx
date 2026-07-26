import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/layout/Container";
import { PaperTexture } from "@/components/backgrounds/PaperTexture";
import { SectionSeam } from "@/components/layout/SectionSeam";
import { SeamShape } from "@/components/layout/SeamShape";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Reveal } from "@/components/Reveal";
import { RevealHeading } from "@/components/motion/RevealHeading";
import { MOrchestrate, MItem } from "@/components/motion/MOrchestrate";
import { MStagger } from "@/components/motion/MStagger";
import { maskReveal } from "@/lib/motion-variants";
import { ResponsePromise } from "@/components/trust/ResponsePromise";
import { ContactQuietForm } from "@/components/ContactQuietForm";
import { IsraelReachMap } from "@/components/media/IsraelReachMap";
import { SocialLinks } from "@/components/SocialLinks";
import { JsonLd } from "@/components/JsonLd";
import { professionalService } from "@/lib/schema-presets";
import { site, services } from "@/lib/site";

// ============================================================================
// עמוד: יצירת קשר — העמוד הכי רגוע באתר (DESIGN-DIRECTION: טור יחיד, blush-wash,
// מינימום שדות). כל מחרוזת גלויה מודבקת מ-COPY.md «עמוד: יצירת קשר» או מ-lib/site.ts.
// אין מספר טלפון מודפס בשום מקום (Q4: וואטסאפ + טפסים בלבד); הקליניקה ברמת-עיר
// בלבד (רעננה), בלי רחוב ובלי מפה חיצונית. תקציב-תנועה: השקט שבשקט.
// ============================================================================

const WHATSAPP_HREF = `https://wa.me/${site.whatsapp}`; // site.ts — הוואטסאפ העסקי

/* ============================== COPY (pasted) ==============================
   מודבק מילה-במילה מ-COPY.md. חותמות [לאימות]/[חסר] הן מטא-דאטה של הסטודיו
   ואינן מרונדרות לעולם. */

// COPY: ### סקשן 35 · Section width=prose (הדלת השקטה)
const DOOR = {
  crumb: "צור קשר", // site.ts nav label
  kicker: "הדלת פתוחה",
  title: "בואי נדבר.",
  // הגוף מפוצל סביב סימון-הרוז היחיד («בלי התחייבות») — השרשור = המשפט המלא מ-COPY
  bodyStart:
    "אם הגעת עד לפה, כנראה משהו כבר מדבר אלייך. אין צורך להחליט על כלום עכשיו: נתחיל בשיחת היכרות קצרה, ",
  bodyMark: "בלי התחייבות",
  bodyEnd: " ובלי לחץ. אספר לך איך אני עובדת, את תספרי לי מה קורה אצלך, ומשם נחליט ביחד.",
  promise: "אני חוזרת אלייך אישית, עד 4 ימי עסקים.",
  place: "ברעננה, ואונליין מכל מקום בארץ.",
  trustToken: "דיאטנית קלינית מוסמכת · R.D. · רישיון משרד הבריאות",
  // תווית-הכפתור והשורה-הקטנה שמתחתיה — פיצול משפחת-ההירו של הבית (בלי נקודה-אמצעית בתוך כפתור)
  cta: "בואי נדבר",
  ctaSub: "שיחת היכרות חינם",
} as const;

// COPY: ### סקשן 36 · SpotlightCard + ContactLeadForm(≤5)
const FORM = {
  // הכותרת מפוצלת סביב סימון-הרוז («רק שיחה.») — השרשור = הכותרת המלאה מ-COPY
  titleStart: "הצעד הראשון הוא ",
  titleMark: "רק שיחה.",
  body: "כמו שאמרתי למעלה: שיחה אחת קצרה, בלי התחייבות ובלי לחץ. משם נחליט ביחד, בלי למחוק שום דבר שאת אוהבת לאכול.",
  packages:
    "הליווי נמכר בחבילות שמתאימות לחיים שלך. איזו חבילה מתאימה לך וכמה היא עולה, אלה דברים שאני אומרת לך בשיחה עצמה, בפשטות.",
  whatsappRow: "מעדיפה לכתוב? דברי איתי ישירות בוואטסאפ",
  place: "קליניקה ברעננה · ליווי אונליין בכל הארץ",
  promise: "אני חוזרת אלייך אישית, עד 4 ימי עסקים.",
  trustToken: "דיאטנית קלינית מוסמכת · R.D. · רישיון משרד הבריאות",
  button: "בואי נדבר, שיחת היכרות חינם",
  fields: {
    name: "שם",
    phone: "טלפון / וואטסאפ",
    message: "מה הכי מעסיק אותך עכשיו? (לא חובה)",
    email: "אימייל",
    consent: "אני מאשרת שאלונה תחזור אליי בטלפון / וואטסאפ / מייל",
  },
  // מסך-התודה משחזר את ההבטחה; מפוצל סביב קישור המתכונים — השרשור = המשפט המלא מ-COPY
  thanksStart:
    "קיבלתי את הפנייה שלך. אני חוזרת אלייך אישית, עד 4 ימי עסקים, בערוץ שבחרת. עד אז, את מוזמנת ",
  thanksLink: "להציץ במתכונים",
  thanksEnd: " ולנשום קצת.",
  submitting: "שולח…", // מחרוזת-מערכת (plumbing, זהה ל-ContactLeadForm)
} as const;

// COPY: ### סקשן 37 · FeatureRow (רעננה + אונליין)
const WHERE = {
  kicker: "איפה נפגשות",
  title: "איפה שנוח לך:\nאונליין בכל הארץ, או בקליניקה ברעננה",
  body: "רוב הליווי מתקיים אונליין, מכל מקום בארץ, בלי לצאת מהבית ובלי לאבד זמן על נסיעות. ואם נוח לך פנים-אל-פנים, יש קליניקה ברעננה. נמצא יחד את הדרך שמתאימה לחיים שלך.",
  items: [
    { title: "ליווי אונליין בכל הארץ", body: "מהסלון שלך, מתי שמתאים. הכול מרחוק." },
    { title: "קליניקה ברעננה", body: "מעדיפה פנים-אל-פנים? יש גם מקום לשבת בו." },
    { title: "וואטסאפ בין הפגישות", body: "לא נעלמת. ערוץ אמיתי לשאלות קטנות בדרך, בחבילות הליווי." },
  ],
  chip: "אני חוזרת אלייך אישית, עד 4 ימי עסקים.",
  // COPY: ### סקשן 37 — הדרך הרביעית להיפגש, בלי להתחייב לכלום
  socialLabel: "ואפשר גם פשוט לעקוב",
} as const;

export const metadata: Metadata = {
  title: "צור קשר",
  // Standalone meta description (≤155) — NOT the reused hero paragraph, which ran
  // long and duplicated on-page body text.
  description:
    "שיחת היכרות חינם עם אלונה אקרלינג, דיאטנית קלינית מוסמכת. נכיר, אספר איך אני עובדת, ונבין יחד אם זו הדרך בשבילך — אונליין או בקליניקה ברעננה.",
  alternates: { canonical: "/contact" },
  openGraph: { url: "/contact" },
};

// JSON-LD (סקשן 37 מחזיק אותו): ProfessionalService — עסק אמיתי, מיקום ברמת-עיר
// בלבד (בלי streetAddress עד אימות), בלי דירוגים, בלי מחירים, בלי אימייל שאינו
// ערוץ ציבורי. הכל נגזר מ-lib/site.ts — אפס המצאות.
const orgSchema: Record<string, unknown> = { ...professionalService(site, services) };
delete orgSchema.email; // ה-Gmail הישן אינו ערוץ ציבורי (תקנון בלבד)
orgSchema.address = {
  "@type": "PostalAddress",
  addressLocality: site.address.city,
  addressCountry: site.address.country,
};

// מפריד-הנשימה המקומי (SoftArc) ירד: הקשת של האתר היא SeamShape, רכיב-התפר האחד
// (2026-07-21, יישור שפת-עיצוב). הוא לא קישוט בתוך הזרימה אלא צורה שנעוצה לתחתית
// החדר, והכיוון מתחלף בין תפרים עוקבים — בדיוק כמו בעמוד הבית.

export default function ContactPage() {
  return (
    <>
      {/* ===== 35 · HOOK — הדלת השקטה: פרוזה ממורכזת על blush, נשיפה אחת איטית.
           COPY: ### סקשן 35 ===== */}
      <section className="relative overflow-hidden bg-blush/60">
        {/* רצועת-מרקם מהמטבח שלה (MEDIA-PLAN §2, שכבה A). נבחר דווקא לוח השיש
            ולא רצועת הירק: הסקשן הוא פרוזה ממורכזת על blush, ומרקם עלים נבדק כאן
            והתברר כשגוי — הצורות הגדולות התחרו במידה, וירוק על ורוד יצא עכור.
            השיש כמעט חסר-צורה, ולכן הוא מוסיף חום-נייר בלבד. אטימות נמוכה כי
            הכלל של השכבה הוא שה-wash קונה חום, לא רשות לשים גוף-טקסט על צילום. */}
        <PaperTexture name="marble" opacity={0.28} />
        <div aria-hidden className="grain-overlay" />
        <Container width="prose" className="relative py-16 sm:py-20 md:py-32">
          <Breadcrumbs items={[{ label: DOOR.crumb, href: "/contact" }]} />
          <div className="mt-14 flex flex-col items-center text-center">
            {/* התור נעצר אחרי ההבטחה: הדלת נכנסת, הקרקע שמתחתיה כבר שם. */}
            <MOrchestrate className="flex flex-col items-center">
              <MItem as="p" className="flex items-center justify-center gap-2.5">
                <span className="text-[0.7rem] leading-none text-gold" aria-hidden>◆</span>
                <span className="text-xs font-bold tracking-eyebrow text-gold-ink">{DOOR.kicker}</span>
              </MItem>
              <RevealHeading
                as="h1"
                autoplay
                text={DOOR.title}
                baseDelay={120}
                className="mt-6 font-serif font-black leading-[1.05] text-navy"
                style={{ fontSize: "var(--text-hero)" }}
              />
              {/* הקשת הקטנה שישבה כאן ירדה עם SoftArc — בבית הכותרת נושמת ישר אל
                  הפסקה, וזאת הנשימה שהעמוד הזה יורש. */}
              <MItem as="p" className="mx-auto mt-8 max-w-[62ch] text-lg leading-[1.8] text-muted">
                {DOOR.bodyStart}
                <span className="underline decoration-rose decoration-2 underline-offset-4">
                  {DOOR.bodyMark}
                </span>
                {DOOR.bodyEnd}
              </MItem>
              <MItem className="mt-10">
                <div className="flex flex-col items-center gap-1.5">
                  <Link
                    href="#lead"
                    data-cta="contact-door-cta"
                    className="inline-block btn-chamfer rounded-[6px] bg-gold px-9 py-4 text-[1.02rem] font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
                  >
                    {DOOR.cta}
                  </Link>
                  <span className="text-sm font-semibold text-muted">{DOOR.ctaSub}</span>
                </div>
              </MItem>
              {/* זנב דחוס לשתי שכבות — גלולה אחת (הבטחה · מקום) ושורת-רישיון שקטה:
                  העין מסיימת על ה-CTA, לא על טוטם של ארבעה פריטי-אמון. */}
              <MItem className="mt-8">
                <div className="inline-flex max-w-full flex-wrap items-center justify-center gap-x-2.5 gap-y-1 rounded-full bg-sand/90 px-6 py-3">
                  <ResponsePromise promise={DOOR.promise} />
                  <span className="text-sm text-muted" aria-hidden>·</span>
                  <span className="text-sm font-semibold text-navy">{DOOR.place}</span>
                </div>
              </MItem>
            </MOrchestrate>

            {/* מחוץ לאורקסטרטור בכוונה — הרישיון פשוט נוכח, בלי להיכנס לתור:
                שורת-טקסט שקטה, לא גלולה מתחרה. עמוד שכל הרעיון שלו הוא מנוחה. */}
            <p className="mt-6 inline-flex items-center gap-2 text-[0.8rem] font-semibold text-muted">
              <span className="text-[0.6rem] leading-none text-gold" aria-hidden>◆</span>
              {DOOR.trustToken}
            </p>
          </div>
        </Container>
        {/* תפר 1 — שדה ה-blush המלא של סקשן 36 מתרומם אל הדלת הבהירה שמעליו
            (crest). מסירה מעוצבת בין חדרים, לא חתך צבע שטוח. */}
        <SeamShape variant="curve-up" fill="var(--color-blush)" />
      </section>

      {/* ===== 36 · RESOLUTION — רצפת-החיכוך: כרטיס שנהב אחד מואר על שדה blush;
           טופס ≤5 שדות + וואטסאפ + מגנט רך; מסך-תודה שמשחזר את ההבטחה.
           COPY: ### סקשן 36 ===== */}
      {/* בלי scroll-mt — ה-scroll-padding-top הגלובלי (6rem) כבר מפנה את ההדר;
          אופסט כפול הנחית את «בואי נדבר» על ~330px של blush ריק לפני הכותרת. */}
      <section id="lead" className="relative overflow-hidden bg-blush">
        <div aria-hidden className="grain-overlay" />
        <Container width="standard" className="relative py-16 sm:py-20 md:py-32">
          <SectionSeam className="mb-8" />
          {/* קו-הזהב אומר «זה הדבר החשוב» — והטופס הוא הדבר החשוב בעמוד. מסגרת-זהב
              כפולה (frame-double), החזקה מבין מחוות-הזהב בעמוד. ה-overflow-hidden ירד
              מהכרטיס (הוא היה גוזם את המסגרת החיצונית) ועבר לעטיפת בריכת-האור בלבד. */}
          <div
            className="frame-double relative mx-auto max-w-[720px] rounded-[16px] bg-sand p-7 sm:p-10 md:p-12"
            style={{
              boxShadow: "var(--elevation-2)",
              "--frame-gap": "8px",
              "--frame-color": "var(--color-gold)",
            } as React.CSSProperties}
          >
            {/* בריכת-האור השקטה — זוהר tone-on-tone קבוע, לא תנועה */}
            <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[16px]">
              <div
                className="absolute inset-x-0 top-0 h-44"
                style={{
                  background:
                    "radial-gradient(380px circle at 50% 0%, rgba(255,255,255,0.75), transparent 72%)",
                }}
              />
            </div>
            <MOrchestrate className="relative">
              <div className="overflow-hidden">
                <MItem variants={maskReveal}>
                  <h2
                    className="font-serif font-black leading-[1.22] text-navy"
                    style={{ fontSize: "clamp(1.7rem, 3.6vw, 2.5rem)" }}
                  >
                    {FORM.titleStart}
                    <span className="underline decoration-rose decoration-[3px] underline-offset-8">
                      {FORM.titleMark}
                    </span>
                  </h2>
                </MItem>
              </div>
              <MItem as="p" className="mt-5 max-w-[62ch] text-lg leading-[1.7] text-muted">
                {FORM.body}
              </MItem>
              <MItem as="p" className="mt-4 max-w-[62ch] text-[0.95rem] leading-relaxed text-muted">
                {FORM.packages}
              </MItem>
              <MItem className="mt-9">
                <ContactQuietForm
                  copy={{
                    nameLabel: FORM.fields.name,
                    phoneLabel: FORM.fields.phone,
                    messageLabel: FORM.fields.message,
                    emailLabel: FORM.fields.email,
                    consentLabel: FORM.fields.consent,
                    submitLabel: FORM.button,
                    submittingLabel: FORM.submitting,
                    whatsappLabel: FORM.whatsappRow,
                    whatsappHref: WHATSAPP_HREF,
                    thanks: {
                      start: FORM.thanksStart,
                      linkLabel: FORM.thanksLink,
                      linkHref: "/recipes",
                      end: FORM.thanksEnd,
                    },
                  }}
                />
              </MItem>
              <MItem className="mt-10 flex flex-col gap-4 border-t border-line pt-6">
                <ResponsePromise promise={FORM.promise} />
                <p className="text-sm font-semibold text-navy-700">{FORM.place}</p>
                <p className="flex items-center gap-2.5 text-[0.8rem] font-bold text-navy-700">
                  <span className="text-[0.6rem] leading-none text-gold" aria-hidden>◆</span>
                  {FORM.trustToken}
                </p>
              </MItem>
            </MOrchestrate>
          </div>
        </Container>
        {/* תפר 2 — הקרקע השמנת של סקשן 37 עולה אל שדה ה-blush (trough, הפוך לתפר 1).
            הצורה הזאת מחליפה גם את ה-SoftArc שפתח את הסקשן וגם את הגרדיאנט השטוח
            blush→bg שהיה בו: מסירה אחת מעוצבת במקום שני מנגנוני-מעבר. */}
        <SeamShape variant="curve-down" />
      </section>

      {/* ===== 37 · GUIDE — איפה נפגשות: פיצול א-סימטרי יחיד בעמוד — מפה מסוגננת
           (SSR, בלי צד-שלישי, רמת-עיר בלבד) מול רשימת-נגישות על שנהב; אמון-Fogg,
           בלי CTA. מחזיק את ה-JSON-LD העסקי. COPY: ### סקשן 37 ===== */}
      <section className="relative overflow-hidden bg-bg">
        <JsonLd data={orgSchema} />
        <div aria-hidden className="grain-overlay" />
        <Container width="wide" className="relative py-16 sm:py-20 md:py-32">
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center gap-2.5">
              <span className="text-[0.65rem] leading-none text-gold" aria-hidden>◆</span>
              <span className="text-xs font-bold tracking-eyebrow text-gold-ink">{WHERE.kicker}</span>
            </div>
            <RevealHeading
              as="h2"
              text={WHERE.title}
              className="mt-5 font-serif font-black leading-[1.2] text-navy"
              style={{ fontSize: "clamp(1.8rem, 3.8vw, 2.8rem)" }}
            />
            <Reveal delay={90}>
              <p className="mx-auto mt-6 max-w-[62ch] text-lg leading-[1.75] text-muted">
                {WHERE.body}
              </p>
            </Reveal>
          </div>

          <div className="mt-16 grid items-center gap-12 md:grid-cols-[1.1fr_0.9fr]">
            {/* פאנל-המפה (inline-start, קריאה-ראשונה ב-md+): עוגן אמיתי אחד שמקרין
                לכל הארץ. בטור-יחיד האיור הדקורטיבי יורד אחרי שלוש הדרכים האמיתיות
                (max-md:order-2) — חותם את הסקשן במקום לחצוץ באמצע התוכן. */}
            <Reveal className="max-md:order-2">
              <IsraelReachMap />
            </Reveal>

            {/* פאנל-הנגישות: שלוש דרכים אמיתיות להיפגש, על כרטיס שנהב */}
            <Reveal delay={90}>
              {/* גם כאן קו-זהב — ההבטחה «אני חוזרת אלייך עד 4 ימי עסקים» היא לב-האמון בעמוד */}
              <div
                className="rounded-[16px] border border-gold/35 bg-sand p-7 md:p-9"
                style={{ boxShadow: "var(--elevation-1)" }}
              >
                <MStagger as="ul" className="flex flex-col gap-8">
                  {WHERE.items.map((item) => (
                    <div key={item.title}>
                      <h3 className="text-lg font-bold text-navy">
                        <span className="underline decoration-rose decoration-2 underline-offset-8">
                          {item.title}
                        </span>
                      </h3>
                      <p className="mt-3 leading-relaxed text-muted">{item.body}</p>
                    </div>
                  ))}
                </MStagger>
                <div className="mt-9 inline-flex rounded-full bg-gold-soft/70 px-5 py-3">
                  <ResponsePromise promise={WHERE.chip} />
                </div>
                {/* the no-commitment way in: three of the ways above ask her to
                    reach out, this one asks nothing at all */}
                <SocialLinks
                  label={WHERE.socialLabel}
                  showHandle
                  className="mt-8 border-t border-line pt-7"
                />
              </div>
            </Reveal>
          </div>
        </Container>
      </section>
    </>
  );
}
