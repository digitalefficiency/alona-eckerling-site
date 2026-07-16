import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";
import { LegalShell, LH, LP, LUL, LLI, LFlag } from "@/components/legal/LegalShell";

export const metadata: Metadata = {
  title: "הצהרת נגישות",
  description: `הצהרת הנגישות של אתר ${site.name} — עמידה בתקן הישראלי ת״י 5568 ובהנחיות WCAG 2.0 רמה AA, אמצעי הנגשה, ופרטי רכז הנגישות.`,
  alternates: { canonical: "/accessibility" },
};

// NOTE: template statement — verify conformance level and coordinator details with
// an accessibility professional before public launch (תקנות נגישות השירות).
export default function AccessibilityPage() {
  const c = site.accessibilityCoordinator;
  return (
    <LegalShell
      eyebrow="נגישות"
      title="הצהרת נגישות"
      intro={`${site.name} רואה חשיבות רבה במתן שירות שוויוני ונגיש לכלל הציבור, ופועל להנגשת האתר בהתאם לחוק שוויון זכויות לאנשים עם מוגבלות ולתקנות הנגישות.`}
    >
      <LH>1. רמת הנגישות באתר</LH>
      <LP>
        האתר הונגש בהתאם לתקן הישראלי ת״י 5568 ולהנחיות{" "}
        <span dir="ltr">WCAG 2.0</span> ברמת התאמה <span dir="ltr">AA</span>, ככל הניתן. ההנגשה
        בוצעה <LFlag>[תאריך/גורם מבצע — לאימות]</LFlag> ונבדקת מעת לעת.
      </LP>

      <LH>2. אמצעי ההנגשה באתר</LH>
      <LP>
        בתחתית/בצד המסך מופיע כפתור ״נגישות״ הפותח תפריט המאפשר התאמה אישית של חוויית הגלישה,
        לרבות:
      </LP>
      <LUL>
        <LLI>הגדלה והקטנה של גודל הטקסט.</LLI>
        <LLI>ניגודיות גבוהה ותצוגת גווני אפור.</LLI>
        <LLI>הדגשת קישורים וגופן קריא.</LLI>
        <LLI>עצירת אנימציות ותנועה.</LLI>
        <LLI>סמן עכבר מוגדל.</LLI>
        <LLI>איפוס ההגדרות.</LLI>
      </LUL>
      <LP>בנוסף, האתר תומך בניווט מקלדת, במבנה כותרות סמנטי ובתיאורי תמונה חלופיים (alt).</LP>

      <LH>3. מגבלות ידועות</LH>
      <LP>
        חרף מאמצי המשרד, ייתכן שחלקים מסוימים באתר טרם הונגשו במלואם או יציגו אי-התאמות בשל מורכבות
        טכנית או תכנים של צד שלישי. אנו פועלים לתיקון מתמשך ונשמח לקבל פניות.{" "}
        <LFlag>[פירוט מגבלות, אם קיימות — לאימות]</LFlag>
      </LP>

      <LH>4. פניות בנושא נגישות (רכז נגישות)</LH>
      <LP>
        נתקלתם בבעיית נגישות? נשמח שתעדכנו את רכז/ת הנגישות של המשרד, ונפעל לטפל בכך בהקדם:
      </LP>
      <LUL>
        <LLI>שם: {c.name || <LFlag>[שם רכז/ת הנגישות — לאימות]</LFlag>}</LLI>
        <LLI>
          טלפון:{" "}
          {c.phone ? (
            <a href={`tel:${c.phone}`} dir="ltr" className="text-gold-ink underline">
              {c.phone}
            </a>
          ) : (
            <LFlag>[טלפון — לאימות]</LFlag>
          )}
        </LLI>
        <LLI>
          דוא״ל:{" "}
          {c.email ? (
            <a href={`mailto:${c.email}`} className="text-gold-ink underline">
              {c.email}
            </a>
          ) : (
            <LFlag>[דוא״ל — לאימות]</LFlag>
          )}
        </LLI>
      </LUL>

      <LH>5. יצירת קשר כללית</LH>
      <LP>
        לכל פנייה נוספת ניתן להשתמש ב
        <Link href="/contact" className="font-semibold text-gold-ink underline hover:text-gold-dark">
          עמוד יצירת הקשר
        </Link>
        .
      </LP>
    </LegalShell>
  );
}
