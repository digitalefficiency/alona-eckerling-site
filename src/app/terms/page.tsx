import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";
import { LegalShell, LH, LP, LUL, LLI } from "@/components/legal/LegalShell";

// ── COPY: ### סקשן 38 · Section width=prose (תקנון) ─────────────────────────
// Lawyer-pending items (ניסוח סופי לעו"ד, מספר עוסק מורשה, מע"מ, מחוז שיפוט,
// מייל רשמי) render as the generic-safe wording only — studio gate: אישור עו"ד
// + אימות מספר הרישיון מול התעודה לפני עלייה לאוויר. Never render markers.
const COPY = {
  eyebrow: "משפטי",
  title: "תקנון",
  intro:
    "ריכזתי כאן, בשפה ברורה, את הכללים של האתר והשירות, כדי שתדעי בדיוק מה מגיע לך, בלי אותיות קטנות.",
  // §1 מי אנחנו — נוסח הקרדנציאל לאימות מול התעודה לפני עלייה (studio gate)
  whoWeAre:
    "האתר והשירות מופעלים על-ידי אלונה אקרלינג, דיאטנית קלינית מוסמכת (R.D.), רישיון משרד הבריאות 204526-11, עוסק מורשה. השירות ניתן בקליניקה ברעננה ואונליין בכל הארץ.",
  whoWeAreContact: "לכל שאלה אפשר לפנות דרך",
  // §2 השירותים והמוצרים
  services: [
    "שיחת היכרות ללא עלות.",
    "ליווי אישי בתשלום, בחבילות.",
  ],
  // §3 רכישה ותשלום
  purchase:
    "המחירים באתר נקובים בשקלים חדשים. התשלום מתבצע בסליקה חיצונית מאובטחת (משולם), הדיוור נשלח באמצעות Smoove, ומוצרים דיגיטליים נמסרים באופן מיידי.",
  // §4 ביטולים והחזרים — הנוסח הסופי בשער עו"ד; כאן הנוסח הכללי-הבטוח בלבד
  cancellations:
    "ביטול עסקה והחזרים נעשים בהתאם לחוק הגנת הצרכן, התשמ״א-1981 ותקנותיו, כולל ההבחנה בין שירות למוצר-מידע דיגיטלי.",
  // §5 דיסקליימר תזונתי-רפואי (מרונדר בעמוד, verbatim)
  disclaimer:
    "התכנים באתר הם מידע כללי ואינם ייעוץ רפואי או תחליף לו. אם יש לך מצב רפואי, הריון או הנקה, תרופות קבועות או רקע של הפרעת אכילה, התייעצי עם הרופא המטפל לפני כל שינוי תזונתי.",
  // §6 + §7 — נוסח בסיס כללי-בטוח מהתבנית (בשער עו"ד)
  ip: "כל זכויות הקניין הרוחני באתר ובתכניו, לרבות טקסטים, מתכונים, עיצוב, לוגו ותמונות, שייכות לאלונה אקרלינג או לבעלי הזכויות מטעמה, ואין לעשות בהם שימוש ללא הרשאה מראש ובכתב.",
  liability:
    "האתר ותכניו ניתנים כמות שהם (As-Is). אין באמור באתר התחייבות לתוצאה, ואלונה אקרלינג לא תישא באחריות לנזק ישיר או עקיף הנובע מהסתמכות על מידע כללי באתר ללא ליווי אישי, או מתקלה טכנית או אי-זמינות של האתר.",
  // §9 דין וסמכות שיפוט — מחוז השיפוט ייקבע בשער עו"ד; נוסח כללי-בטוח
  law: "על תקנון זה יחולו דיני מדינת ישראל בלבד, וסמכות השיפוט נתונה לבית המשפט המוסמך על-פי דין.",
  // §10 עדכונים ויצירת קשר
  updates: "התקנון עשוי להתעדכן מעת לעת; הגרסה המעודכנת תופיע כאן עם תאריך.",
  contactQuestion: "שאלה על התקנון? כתבי לי דרך",
  contactPageLabel: "עמוד יצירת הקשר",
} as const;

// תוכן עניינים עוגני (עוזר-נגישות) — כותרות הסעיפים מתוך שלד-הסעיפים של COPY
const TOC = [
  { id: "who-we-are", label: "מי אנחנו" },
  { id: "services", label: "השירותים והמוצרים" },
  { id: "purchase", label: "רכישה ותשלום" },
  { id: "cancellations", label: "ביטולים והחזרים" },
  { id: "disclaimer", label: "דיסקליימר תזונתי-רפואי" },
  { id: "ip", label: "קניין רוחני" },
  { id: "liability", label: "הגבלת אחריות" },
  { id: "privacy-a11y", label: "פרטיות ונגישות" },
  { id: "law", label: "דין וסמכות שיפוט" },
  { id: "updates", label: "עדכונים ויצירת קשר" },
] as const;

export const metadata: Metadata = {
  title: "תקנון",
  description: `תקנון האתר של ${site.name}: השירותים והמוצרים, רכישה ותשלום, ביטולים והחזרים לפי חוק הגנת הצרכן, קניין רוחני ודין ישראלי.`,
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
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

      <LH id="who-we-are">1. מי אנחנו</LH>
      <LP>{COPY.whoWeAre}</LP>
      <LP>
        {COPY.whoWeAreContact}{" "}
        <Link href="/contact" className="font-semibold text-gold-ink underline hover:text-gold-dark">
          {COPY.contactPageLabel}
        </Link>
        .
      </LP>

      <LH id="services">2. השירותים והמוצרים</LH>
      <LUL>
        {COPY.services.map((s) => (
          <LLI key={s}>{s}</LLI>
        ))}
      </LUL>

      <LH id="purchase">3. רכישה ותשלום</LH>
      <LP>{COPY.purchase}</LP>

      <LH id="cancellations">4. ביטולים והחזרים</LH>
      <LP>{COPY.cancellations}</LP>

      <LH id="disclaimer">5. דיסקליימר תזונתי-רפואי</LH>
      {/* inset-band רך (blush-wash, דקורטיבי בלבד) — נוכחות שקטה בלי אזעקה */}
      <div className="mt-4 rounded-card bg-blush/70 p-6">
        <p className="leading-relaxed text-ink">{COPY.disclaimer}</p>
      </div>

      <LH id="ip">6. קניין רוחני</LH>
      <LP>{COPY.ip}</LP>

      <LH id="liability">7. הגבלת אחריות</LH>
      <LP>{COPY.liability}</LP>

      <LH id="privacy-a11y">8. פרטיות ונגישות</LH>
      <LP>
        איסוף המידע והשימוש בו מוסדרים ב
        <Link href="/privacy" className="font-semibold text-gold-ink underline hover:text-gold-dark">
          מדיניות הפרטיות
        </Link>
        , והתאמות הנגישות מפורטות ב
        <Link href="/accessibility" className="font-semibold text-gold-ink underline hover:text-gold-dark">
          הצהרת הנגישות
        </Link>
        .
      </LP>

      <LH id="law">9. דין וסמכות שיפוט</LH>
      <LP>{COPY.law}</LP>

      <LH id="updates">10. עדכונים ויצירת קשר</LH>
      <LP>{COPY.updates}</LP>
      <LP>
        {COPY.contactQuestion}{" "}
        <Link href="/contact" className="font-semibold text-gold-ink underline hover:text-gold-dark">
          {COPY.contactPageLabel}
        </Link>
        .
      </LP>
    </LegalShell>
  );
}
