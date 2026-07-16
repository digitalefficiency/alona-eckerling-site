import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";
import { LegalShell, LH, LP, LUL, LLI } from "@/components/legal/LegalShell";
import { CookiePrefsButton } from "@/components/CookiePrefsButton";

// ── COPY: ### סקשן 39 · Section width=prose (מדיניות פרטיות) ────────────────
// Lawyer-pending items (מספר עוסק מורשה, מייל רשמי, רשימת ספקי-עיבוד סופית)
// render as the generic-safe wording only — studio gate: אישור עו"ד + אימות
// הספקים לפני עלייה לאוויר. Never render markers.
const COPY = {
  eyebrow: "משפטי",
  title: "מדיניות פרטיות",
  intro: "הפרטיות שלך חשובה לי. כאן בדיוק כתוב איזה מידע נאסף, למה, ומה הזכויות שלך עליו.",
  // §1 מי אני — נוסח הקרדנציאל לאימות מול התעודה לפני עלייה (studio gate)
  whoAmI:
    "האתר מופעל על-ידי אלונה אקרלינג, דיאטנית קלינית מוסמכת (R.D.), רישיון משרד הבריאות 204526-11, עוסק מורשה, רעננה.",
  whoAmIContact: "פניות בנושא פרטיות אפשר לשלוח דרך",
  // §2 איזה מידע נאסף
  dataYouGiveLead: "מידע שאת מוסרת:",
  dataYouGive: [
    "בטופס יצירת הקשר: שם, טלפון, אימייל ותוכן הפנייה.",
    "בהרשמה לרשימת התפוצה: כתובת האימייל.",
    "ברכישת החוברת: פרטי הרכישה. פרטי אשראי מעובדים בדף סליקה מאובטח חיצוני ואינם נשמרים אצלי.",
    "בליווי: מידע בריאותי-תזונתי שאת בוחרת לשתף.",
  ],
  dataAutomatic: "מידע שנאסף אוטומטית: נתוני שימוש בסיסיים ועוגיות.",
  // §3 מטרות
  purposes: [
    "לחזור אלייך (עד 4 ימי עסקים).",
    "לתת את הליווי.",
    "לשלוח תוכן שביקשת, בהסכמה, עם אפשרות הסרה בכל רגע.",
    "לעבד רכישה.",
    "לשפר את האתר.",
  ],
  // §4 מידע בריאותי בסודיות מקצועית (הלב הרגשי של העמוד, verbatim)
  healthConfidentiality:
    "מידע בריאותי ותזונתי הוא מידע רגיש. ככל שתבחרי לשתף אותו במסגרת הליווי, הוא נשמר בסודיות מקצועית של דיאטנית קלינית מוסמכת, משמש אך ורק לצורך הליווי שלך, ואינו מועבר לאף גורם ללא הסכמתך המפורשת, למעט חובה חוקית.",
  // §5 עם מי המידע משותף — ספקים אמיתיים בלבד; ספק לא-מאושר מנוסח כללי
  sharingLead: "אני לא מוכרת ולא משכירה את המידע; אני נעזרת בספקי שירות בלבד:",
  sharing: [
    "סליקת תשלומים (משולם).",
    "דיוור (Smoove).",
    "אחסון האתר.",
    "וואטסאפ/Meta, בהסכמתך.",
    "כלי מדידה, בכפוף להסכמת העוגיות.",
  ],
  sharingAbroad: "חלק מהספקים מעבדים מידע גם מחוץ לישראל.",
  // §6 אבטחה
  security: "אני נוקטת אמצעים סבירים לאבטחת המידע. התשלום מתבצע בסביבת סליקה חיצונית מאובטחת.",
  // §7 הזכויות שלך
  rights:
    "לפי חוק הגנת הפרטיות, התשמ״א-1981, עומדות לך זכויות עיון, תיקון ומחיקה. הסרה מרשימת התפוצה אפשרית בכל רגע, בקישור שבתחתית כל מייל.",
  rightsContact: "בקשות אפשר לשלוח דרך",
  // §8 + §9 + §10
  retention: "המידע נשמר כל עוד הוא נחוץ, ובכפוף לחובות חוקיות.",
  minors: "השירותים באתר מיועדים לבגירות (18+).",
  changes: "מדיניות זו עשויה להתעדכן; הגרסה המעודכנת תופיע כאן עם תאריך.",
  contactPageLabel: "עמוד יצירת הקשר",
  siblingsLead: "מסמכים נוספים:",
} as const;

// תוכן עניינים עוגני — כותרות הסעיפים מתוך שלד-הסעיפים של COPY
const TOC = [
  { id: "who-am-i", label: "מי אני" },
  { id: "what-data", label: "איזה מידע נאסף" },
  { id: "purposes", label: "מטרות" },
  { id: "health-data", label: "מידע בריאותי בסודיות מקצועית" },
  { id: "sharing", label: "עם מי המידע משותף" },
  { id: "security", label: "אבטחה" },
  { id: "rights", label: "הזכויות שלך" },
  { id: "retention", label: "שמירת מידע" },
  { id: "minors", label: "קטינות" },
  { id: "changes", label: "שינויים" },
] as const;

export const metadata: Metadata = {
  title: "מדיניות פרטיות",
  description: `מדיניות הפרטיות של ${site.name}: איזה מידע נאסף, למה, עם מי הוא משותף, ומה הזכויות שלך לפי חוק הגנת הפרטיות, התשמ״א-1981.`,
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalShell eyebrow={COPY.eyebrow} title={COPY.title} intro={COPY.intro}>
      {/* תוכן עניינים — chips בסייג' רגוע, ניווט פנימי בלבד */}
      <nav aria-label="תוכן העניינים">
        <ul className="flex flex-wrap gap-2">
          {TOC.map((item, i) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className="inline-block rounded-btn bg-gold-soft/60 px-3 py-1.5 text-sm font-semibold text-gold-ink hover:bg-gold-soft"
              >
                {i + 1}. {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <LH id="who-am-i">1. מי אני</LH>
      <LP>{COPY.whoAmI}</LP>
      <LP>
        {COPY.whoAmIContact}{" "}
        <Link href="/contact" className="font-semibold text-gold-ink underline hover:text-gold-dark">
          {COPY.contactPageLabel}
        </Link>
        .
      </LP>

      <LH id="what-data">2. איזה מידע נאסף</LH>
      <LP>{COPY.dataYouGiveLead}</LP>
      <LUL>
        {COPY.dataYouGive.map((s) => (
          <LLI key={s}>{s}</LLI>
        ))}
      </LUL>
      <LP>{COPY.dataAutomatic}</LP>
      <LP>
        <CookiePrefsButton className="font-semibold text-gold-ink underline hover:text-gold-dark" />
      </LP>

      <LH id="purposes">3. מטרות</LH>
      <LUL>
        {COPY.purposes.map((s) => (
          <LLI key={s}>{s}</LLI>
        ))}
      </LUL>

      <LH id="health-data">4. מידע בריאותי בסודיות מקצועית</LH>
      {/* inset-band רך (sage-wash, דקורטיבי בלבד) — הבטחת הסודיות, בלי כרטיס שיווקי */}
      <div className="mt-4 rounded-card bg-gold-soft/60 p-6">
        <p className="leading-relaxed text-ink">{COPY.healthConfidentiality}</p>
      </div>

      <LH id="sharing">5. עם מי המידע משותף</LH>
      <LP>{COPY.sharingLead}</LP>
      <LUL>
        {COPY.sharing.map((s) => (
          <LLI key={s}>{s}</LLI>
        ))}
      </LUL>
      <LP>{COPY.sharingAbroad}</LP>

      <LH id="security">6. אבטחה</LH>
      <LP>{COPY.security}</LP>

      <LH id="rights">7. הזכויות שלך</LH>
      <LP>{COPY.rights}</LP>
      <LP>
        {COPY.rightsContact}{" "}
        <Link href="/contact" className="font-semibold text-gold-ink underline hover:text-gold-dark">
          {COPY.contactPageLabel}
        </Link>
        .
      </LP>

      <LH id="retention">8. שמירת מידע</LH>
      <LP>{COPY.retention}</LP>

      <LH id="minors">9. קטינות</LH>
      <LP>{COPY.minors}</LP>

      <LH id="changes">10. שינויים</LH>
      <LP>{COPY.changes}</LP>

      {/* קישורי-אחיות שקטים — יציאה רכה, בלי CTA מכירתי */}
      <LP>
        {COPY.siblingsLead}{" "}
        <Link href="/terms" className="font-semibold text-gold-ink underline hover:text-gold-dark">
          תקנון
        </Link>
        {" · "}
        <Link href="/accessibility" className="font-semibold text-gold-ink underline hover:text-gold-dark">
          הצהרת נגישות
        </Link>
      </LP>
    </LegalShell>
  );
}
