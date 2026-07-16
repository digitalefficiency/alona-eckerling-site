import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";
import { LegalShell, LH, LP, LUL, LLI } from "@/components/legal/LegalShell";

// ── COPY: ### סקשן 40 · Section width=prose (הצהרת נגישות) ──────────────────
// Coordinator specifics (שם, ערוץ פנייה, תאריך/גורם מבצע) are pending
// verification — they render from site.ts fields only when filled; until then
// the generic-safe channel is the contact page (never the personal phone,
// never the old Gmail). Studio gate: בדיקת מומחה נגישות לפני עלייה לאוויר.
const COPY = {
  eyebrow: "נגישות",
  title: "הצהרת נגישות",
  intro:
    "אלונה אקרלינג רואה חשיבות רבה במתן שירות שוויוני ונגיש לכלל הציבור, ופועלת להנגשת האתר בהתאם לחוק שוויון זכויות לאנשים עם מוגבלות ולתקנות הנגישות.",
  // §1 רמת הנגישות — תמיד «ככל הניתן», לעולם לא «נגיש לחלוטין»;
  // «ההנגשה בוצעה [תאריך/גורם]» יתווסף רק אחרי אימות
  conformance: "האתר הונגש בהתאם לתקן הישראלי ת״י 5568 ולהנחיות",
  conformanceEnd: "ברמת התאמה",
  conformanceHedge: ", ככל הניתן. ההנגשה נבדקת מעת לעת.",
  // §2 אמצעי ההנגשה — רק מה שקיים בפועל (תפריט הנגישות של האתר)
  meansLead: "בצד המסך מופיע כפתור ״נגישות״ הפותח תפריט המאפשר התאמה אישית של חוויית הגלישה, לרבות:",
  means: [
    "הגדלה והקטנה של טקסט.",
    "ניגודיות גבוהה ותצוגת גווני אפור.",
    "הדגשת קישורים וגופן קריא.",
    "עצירת אנימציות ותנועה.",
    "סמן עכבר מוגדל.",
    "איפוס.",
  ],
  meansExtra: "בנוסף, האתר תומך בניווט מקלדת, במבנה כותרות סמנטי ובתיאורי תמונה חלופיים.",
  // §3 מגבלות ידועות — גילוי כן, בלי הסתרה
  limitations:
    "חרף מאמצינו, ייתכן שחלקים מסוימים, לרבות תכני צד שלישי או מדיה בארכיון המתכונים, טרם הונגשו במלואם. אנו פועלים לתיקון מתמשך ונשמח לקבל פניות.",
  // §4 רכז/ת נגישות
  coordinatorLead: "נתקלת בבעיית נגישות? נשמח שתעדכני את רכז/ת הנגישות ונטפל בכך בהקדם:",
  coordinatorChannelFallback: "ערוץ פנייה: דרך",
  // §5 יצירת קשר כללית
  generalContact: "לכל פנייה נוספת אפשר להשתמש ב",
  contactPageLabel: "עמוד יצירת הקשר",
} as const;

export const metadata: Metadata = {
  title: "הצהרת נגישות",
  description: `הצהרת הנגישות של אתר ${site.name}: התאמה לתקן הישראלי ת״י 5568 ולהנחיות WCAG 2.0 ברמת AA ככל הניתן, אמצעי ההנגשה באתר ופניות בנושא נגישות.`,
  alternates: { canonical: "/accessibility" },
};

export default function AccessibilityPage() {
  const c = site.accessibilityCoordinator;
  const hasCoordinator = Boolean(c.name || c.phone || c.email);
  return (
    <LegalShell eyebrow={COPY.eyebrow} title={COPY.title} intro={COPY.intro}>
      <LH id="conformance">1. רמת הנגישות באתר</LH>
      <LP>
        {COPY.conformance} <span dir="ltr">WCAG 2.0</span> {COPY.conformanceEnd}{" "}
        <span dir="ltr">AA</span>
        {COPY.conformanceHedge}
      </LP>

      <LH id="means">2. אמצעי ההנגשה באתר</LH>
      <LP>{COPY.meansLead}</LP>
      <LUL>
        {COPY.means.map((s) => (
          <LLI key={s}>{s}</LLI>
        ))}
      </LUL>
      <LP>{COPY.meansExtra}</LP>

      <LH id="limitations">3. מגבלות ידועות</LH>
      <LP>{COPY.limitations}</LP>

      <LH id="coordinator">4. פניות בנושא נגישות (רכז/ת נגישות)</LH>
      <LP>{COPY.coordinatorLead}</LP>
      {hasCoordinator ? (
        <LUL>
          {c.name && <LLI>שם: {c.name}</LLI>}
          {c.phone && (
            <LLI>
              טלפון:{" "}
              <a href={`tel:${c.phone}`} dir="ltr" className="text-gold-ink underline">
                {c.phone}
              </a>
            </LLI>
          )}
          {c.email && (
            <LLI>
              דוא״ל:{" "}
              <a href={`mailto:${c.email}`} className="text-gold-ink underline">
                {c.email}
              </a>
            </LLI>
          )}
        </LUL>
      ) : (
        <LP>
          {COPY.coordinatorChannelFallback}{" "}
          <Link href="/contact" className="font-semibold text-gold-ink underline hover:text-gold-dark">
            {COPY.contactPageLabel}
          </Link>
          .
        </LP>
      )}

      <LH id="general-contact">5. יצירת קשר כללית</LH>
      <LP>
        {COPY.generalContact}
        <Link href="/contact" className="font-semibold text-gold-ink underline hover:text-gold-dark">
          {COPY.contactPageLabel}
        </Link>
        .
      </LP>
    </LegalShell>
  );
}
