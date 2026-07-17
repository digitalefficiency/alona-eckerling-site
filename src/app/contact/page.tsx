import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/layout/Container";
import { SectionSeam } from "@/components/layout/SectionSeam";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Reveal } from "@/components/Reveal";
import { RevealHeading } from "@/components/motion/RevealHeading";
import { MOrchestrate, MItem } from "@/components/motion/MOrchestrate";
import { MStagger } from "@/components/motion/MStagger";
import { maskReveal } from "@/lib/motion-variants";
import { ResponsePromise } from "@/components/trust/ResponsePromise";
import { ContactQuietForm } from "@/components/ContactQuietForm";
import { IsraelReachMap } from "@/components/media/IsraelReachMap";
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
  bodyEnd: " ובלי לחץ. נכיר, אספר לך איך אני עובדת, ונבין יחד אם אני האדם הנכון ללוות אותך אל השקט הזה.",
  promise: "אני חוזרת אלייך אישית, עד 4 ימי עסקים.",
  place: "ברעננה, ואונליין מכל מקום בארץ.",
  trustToken: "דיאטנית קלינית מוסמכת · R.D. · רישיון משרד הבריאות",
  cta: "בואי נדבר · שיחת היכרות חינם",
} as const;

// COPY: ### סקשן 36 · SpotlightCard + ContactLeadForm(≤5)
const FORM = {
  // הכותרת מפוצלת סביב סימון-הרוז («רק שיחה.») — השרשור = הכותרת המלאה מ-COPY
  titleStart: "הצעד הראשון הוא ",
  titleMark: "רק שיחה.",
  body: "שיחת היכרות קצרה, בלי התחייבות ובלי לחץ. נכיר, ונבין יחד אם אני האדם הנכון ללוות אותך אל השקט הזה, בלי לוותר על האוכל שאת אוהבת.",
  packages:
    "הליווי נמכר בחבילות שמתאימות לחיים שלך. על זה נדבר בשיחה, בלי הפתעות ובלי מחיר שקופץ מהמסך.",
  whatsappRow: "מעדיפה לכתוב? דברי איתי ישירות בוואטסאפ",
  place: "קליניקה ברעננה · ליווי אונליין בכל הארץ",
  promise: "אני חוזרת אלייך אישית, עד 4 ימי עסקים.",
  trustToken: "דיאטנית קלינית מוסמכת · R.D. · רישיון משרד הבריאות",
  button: "בואי נדבר, שיחת היכרות חינם",
  magnet: "עוד לא מוכנה לשיחה? הצטרפי לרשימה השפויה וקבלי ממני מתכונים וטיפים שקטים למייל",
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
} as const;

export const metadata: Metadata = {
  title: "צור קשר",
  description: DOOR.bodyStart + DOOR.bodyMark + DOOR.bodyEnd,
  alternates: { canonical: "/contact" },
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

// מפריד-נשימה soft-arc (SSR, tone-on-tone, תאום-סטטי מבנייה) — סימן-הקשת של העמוד
function SoftArc({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 18" aria-hidden className={`mx-auto h-4 w-36 ${className}`} fill="none">
      <path
        d="M4 15 Q80 -8 156 15"
        className="stroke-gold/50"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="80" cy="7" r="2" className="fill-rose" opacity="0.7" />
    </svg>
  );
}

export default function ContactPage() {
  return (
    <>
      {/* ===== 35 · HOOK — הדלת השקטה: פרוזה ממורכזת על blush, נשיפה אחת איטית.
           COPY: ### סקשן 35 ===== */}
      <section data-light-hero className="relative overflow-hidden bg-blush/60">
        <div aria-hidden className="grain-overlay" />
        <Container width="prose" className="relative py-20 md:py-36">
          <Breadcrumbs items={[{ label: DOOR.crumb, href: "/contact" }]} />
          <MOrchestrate className="mt-14 flex flex-col items-center text-center">
            <MItem as="p" className="flex items-center justify-center gap-2.5">
              <span className="text-[0.7rem] leading-none text-gold" aria-hidden>◆</span>
              <span className="text-xs font-bold tracking-[.2em] text-gold-ink">{DOOR.kicker}</span>
            </MItem>
            <RevealHeading
              as="h1"
              text={DOOR.title}
              baseDelay={120}
              className="mt-6 font-serif font-black leading-[1.05] text-navy"
              style={{ fontSize: "var(--text-hero)" }}
            />
            <MItem className="mt-8">
              <SoftArc />
            </MItem>
            <MItem as="p" className="mx-auto mt-8 max-w-[62ch] text-lg leading-[1.8] text-muted">
              {DOOR.bodyStart}
              <span className="underline decoration-rose decoration-2 underline-offset-4">
                {DOOR.bodyMark}
              </span>
              {DOOR.bodyEnd}
            </MItem>
            <MItem className="mt-10">
              <Link
                href="#lead"
                data-cta="contact-door-cta"
                className="inline-block btn-chamfer rounded-[6px] bg-gold px-9 py-4 text-[1.02rem] font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
              >
                {DOOR.cta}
              </Link>
            </MItem>
            <MItem className="mt-8">
              <div className="inline-flex rounded-full bg-sand/90 px-6 py-3">
                <ResponsePromise promise={DOOR.promise} />
              </div>
            </MItem>
            <MItem as="p" className="mt-5 text-[0.95rem] text-muted">
              {DOOR.place}
            </MItem>
            <MItem className="mt-7">
              <span className="inline-flex items-center gap-2 rounded-full bg-navy px-4 py-2">
                <span className="text-[0.6rem] leading-none text-gold-soft" aria-hidden>◆</span>
                <span className="text-xs font-bold text-white">{DOOR.trustToken}</span>
              </span>
            </MItem>
          </MOrchestrate>
        </Container>
      </section>

      {/* ===== 36 · RESOLUTION — רצפת-החיכוך: כרטיס שנהב אחד מואר על שדה blush;
           טופס ≤5 שדות + וואטסאפ + מגנט רך; מסך-תודה שמשחזר את ההבטחה.
           COPY: ### סקשן 36 ===== */}
      <section id="lead" className="relative scroll-mt-24 overflow-hidden bg-blush">
        <div aria-hidden className="grain-overlay" />
        <Container width="standard" className="relative py-16 md:py-28">
          <SectionSeam className="mb-14" />
          <div
            className="relative mx-auto max-w-[720px] overflow-hidden rounded-[16px] border border-line bg-sand p-7 sm:p-10 md:p-12"
            style={{ boxShadow: "var(--elevation-2)" }}
          >
            {/* בריכת-האור השקטה — זוהר tone-on-tone קבוע, לא תנועה */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-44"
              style={{
                background:
                  "radial-gradient(380px circle at 50% 0%, rgba(255,255,255,0.75), transparent 72%)",
              }}
            />
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
                    magnetLabel: FORM.magnet,
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
                <p className="flex items-center gap-2.5 text-xs font-bold text-navy-700">
                  <span className="text-[0.6rem] leading-none text-gold" aria-hidden>◆</span>
                  {FORM.trustToken}
                </p>
              </MItem>
            </MOrchestrate>
          </div>
        </Container>
      </section>

      {/* ===== 37 · GUIDE — איפה נפגשות: פיצול א-סימטרי יחיד בעמוד — מפה מסוגננת
           (SSR, בלי צד-שלישי, רמת-עיר בלבד) מול רשימת-נגישות על שנהב; אמון-Fogg,
           בלי CTA. מחזיק את ה-JSON-LD העסקי. COPY: ### סקשן 37 ===== */}
      <section
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(180deg, var(--color-blush) 0%, var(--color-bg) 100%)" }}
      >
        <JsonLd data={orgSchema} />
        <div aria-hidden className="grain-overlay" />
        <Container width="wide" className="relative py-20 md:py-32">
          <SoftArc className="mb-14" />
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center gap-2.5">
              <span className="text-[0.65rem] leading-none text-gold" aria-hidden>◆</span>
              <span className="text-xs font-bold tracking-[.18em] text-gold-ink">{WHERE.kicker}</span>
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
            {/* פאנל-המפה (inline-start, קריאה-ראשונה): עוגן אמיתי אחד שמקרין לכל הארץ */}
            <Reveal>
              <IsraelReachMap />
            </Reveal>

            {/* פאנל-הנגישות: שלוש דרכים אמיתיות להיפגש, על כרטיס שנהב */}
            <Reveal delay={90}>
              <div
                className="rounded-[16px] border border-line bg-sand p-7 md:p-9"
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
              </div>
            </Reveal>
          </div>
        </Container>
      </section>
    </>
  );
}
