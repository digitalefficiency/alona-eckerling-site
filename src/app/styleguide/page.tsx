import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Section } from "@/components/layout/Section";
import { SectionHeading } from "@/components/SectionHeading";
import { Reveal } from "@/components/Reveal";
import { RevealHeading } from "@/components/motion/RevealHeading";
import { SplitText } from "@/components/motion/SplitText";
import { MOrchestrate, MItem } from "@/components/motion/MOrchestrate";
import { MStagger } from "@/components/motion/MStagger";
import { MParallax } from "@/components/motion/MParallax";
import { MMagnetic } from "@/components/motion/MMagnetic";
import { MCounter } from "@/components/motion/MCounter";
import { MScrollScene } from "@/components/motion/MScrollScene";
import { DiagramReveal } from "@/components/motion/DiagramReveal";
import { MChapter } from "@/components/motion/MChapter";
import { MediaFrame } from "@/components/media/MediaFrame";
import { LivingStill } from "@/components/media/LivingStill";
import { BioCard } from "@/components/trust/BioCard";
import { TestimonialCard } from "@/components/trust/TestimonialCard";
import { ResultCard } from "@/components/trust/ResultCard";
import { RecognitionBadges } from "@/components/trust/RecognitionBadges";
import { ResponsePromise } from "@/components/trust/ResponsePromise";
import { EASE, DUR, cssEase, cssDur } from "@/lib/motion-tokens";

// INTERNAL styleguide/demo page — the living reference for the design + motion
// system. Never a client deliverable: noindex'd here, deliberately absent from
// sitemap.ts, and exempt from scripts/lint-copy.mjs (sample copy below is demo
// content). MPageTransition is a per-site layout opt-in and is NOT mounted here.
export const metadata: Metadata = {
  title: "Styleguide — דף הדגמה פנימי",
  robots: { index: false, follow: false },
};

// Color roles — Tailwind role classes off the @theme tokens, so every swatch
// auto-retints when a vertical preset overrides the --brand-* vars.
const COLOR_ROLES: { cls: string; name: string; use: string }[] = [
  { cls: "bg-navy", name: "navy", use: "צבע המותג — כותרות, פסי נאבי" },
  { cls: "bg-navy-700", name: "navy-700", use: "משטחי עומק על נאבי" },
  { cls: "bg-navy-600", name: "navy-600", use: "hover לקישורי נאבי" },
  { cls: "bg-gold", name: "gold", use: "אקצנט בלבד — ◆ וקווים, לא משטחים" },
  { cls: "bg-gold-dark", name: "gold-dark", use: "hover לכפתורי זהב" },
  { cls: "bg-gold-soft", name: "gold-soft", use: "רקע אקצנט רך, ::selection" },
  { cls: "bg-gold-ink", name: "gold-ink", use: "טקסט אקצנט נגיש (AA) על בהיר" },
  { cls: "bg-sand", name: "sand", use: "פס חול חם — מקצב הפסים" },
  { cls: "bg-bg", name: "bg", use: "רקע העמוד" },
  { cls: "bg-card border border-line", name: "card", use: "כרטיסים ומשטחי תוכן" },
  { cls: "bg-ink", name: "ink", use: "טקסט רץ" },
  { cls: "bg-muted", name: "muted", use: "טקסט משני" },
  { cls: "bg-line", name: "line", use: "קווי הפרדה עדינים" },
];

const TYPE_SCALE: { token: string; label: string; sample: string }[] = [
  { token: "--text-display", label: "H1 של דף הבית", sample: "שקט מקצועי" },
  { token: "--text-hero", label: "H1 של עמוד פנימי", sample: "ליווי מקצועי מהשלב הראשון" },
  { token: "--text-section", label: "H2 של סקשן", sample: "איך אנחנו עובדים" },
  { token: "--text-stat", label: "ספרות סטטיסטיקה", sample: "18+" },
];

// Full literal classes — Tailwind's scanner needs the complete class string.
const ELEVATIONS: { n: 1 | 2 | 3 | 4; cls: string; use: string }[] = [
  { n: 1, cls: "shadow-(--elevation-1)", use: "כרטיסים במנוחה" },
  { n: 2, cls: "shadow-(--elevation-2)", use: "hover / כרום דביק" },
  { n: 3, cls: "shadow-(--elevation-3)", use: "מודאלים ותפריטים" },
  { n: 4, cls: "shadow-(--elevation-4)", use: "הרחפה תיאטרלית אחת" },
];

const goldCta =
  "inline-block rounded-[6px] bg-gold px-6 py-3 text-sm font-bold text-navy transition hover:bg-gold-dark";

function Note({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-4 flex items-start gap-2 text-sm leading-relaxed text-muted">
      <span className="mt-1 text-[0.55rem] leading-none text-gold" aria-hidden>◆</span>
      <span>{children}</span>
    </p>
  );
}

export default function StyleguidePage() {
  return (
    <>
      {/* ===== header band ===== */}
      <Section tone="sand" pad="tight">
        <div className="flex items-center gap-2.5">
          <span className="text-[0.65rem] leading-none text-gold" aria-hidden>◆</span>
          <span className="text-xs font-bold tracking-[.18em] text-gold-ink">STYLEGUIDE</span>
        </div>
        <RevealHeading
          as="h1"
          text={"מערכת העיצוב והתנועה\nשל הבית"}
          className="mt-4 font-serif font-black text-navy"
          style={{ fontSize: "var(--text-hero)" }}
        />
        <Note>
          דף הדגמה פנימי — לא עמוד לקוח. העמוד noindex, אינו במפת האתר, ופטור משער הקופי
          (lint-copy). כל התוכן כאן הוא תוכן דוגמה בלבד.
        </Note>
      </Section>

      {/* ===== A. color roles ===== */}
      <Section tone="white" border>
        <SectionHeading
          eyebrow="A · צבע"
          title="תפקידי צבע סמנטיים"
          lead="מחלקות תפקיד (bg-navy, bg-gold…) על טוקני @theme — כל פריסט ורטיקלי צובע את הכול מחדש."
        />
        <ul className="mt-12 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {COLOR_ROLES.map((c) => (
            <li key={c.name}>
              <div className={`h-14 rounded-[8px] ${c.cls}`} />
              <p className="mt-2 text-sm font-bold text-navy" dir="ltr">{c.name}</p>
              <p className="text-xs leading-relaxed text-muted">{c.use}</p>
            </li>
          ))}
        </ul>
      </Section>

      {/* ===== B. type scale ===== */}
      <Section tone="sand">
        <SectionHeading
          eyebrow="B · טיפוגרפיה"
          title="סולם הטקסט"
          lead="ארבעה clamp-ים חיים — סריף שחור לכותרות, סנס לגוף. הקיקר: ◆ + אותיות מרווחות."
        />
        <div className="mt-12 grid gap-10">
          {TYPE_SCALE.map((t) => (
            <div key={t.token}>
              <p className="text-xs font-bold tracking-wide text-gold-ink" dir="ltr">
                {t.token} · <span className="text-muted">{t.label}</span>
              </p>
              <p
                className="mt-1 font-serif font-black leading-[1.1] text-navy"
                style={{ fontSize: `var(${t.token})` }}
              >
                {t.sample}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* ===== C. elevation ladder ===== */}
      <Section tone="white" border>
        <SectionHeading
          eyebrow="C · עומק"
          title="סולם הצללים"
          lead="ארבע מדרגות — צל כחול-נאבי, לא אפור. כמעט הכול חי במדרגה 1."
        />
        <ul className="mt-12 grid grid-cols-2 gap-8 lg:grid-cols-4">
          {ELEVATIONS.map((e) => (
            <li key={e.n} className={`rounded-[10px] bg-card p-6 ${e.cls}`}>
              <p className="font-serif text-xl font-black text-navy" dir="ltr">elevation-{e.n}</p>
              <p className="mt-1 text-sm text-muted">{e.use}</p>
            </li>
          ))}
        </ul>
      </Section>

      {/* ===== D. motion primitives — live ===== */}
      <Section tone="sand" seam>
        <SectionHeading
          eyebrow="D · תנועה"
          title="ששת פרימיטיבי התנועה"
          lead="הכול על טוקני הקול — בלי עקומות או משכים גולמיים. תחת reduced-motion הכול נשאר במצב הסופי."
        />
        <p className="mt-4 text-xs text-muted" dir="ltr">
          --ease-out: {cssEase(EASE.out)} · --dur-reveal: {cssDur(DUR.reveal)} · --dur-stagger: {cssDur(DUR.stagger)}
        </p>

        {/* MOrchestrate — full section entrance: kicker → title → body → CTA */}
        <div className="mt-12 rounded-[10px] border border-line bg-card p-7 md:p-9">
          <MOrchestrate>
            <MItem as="p" className="flex items-center gap-2.5">
              <span className="text-[0.65rem] leading-none text-gold" aria-hidden>◆</span>
              <span className="text-xs font-bold tracking-[.18em] text-gold-ink">MORCHESTRATE</span>
            </MItem>
            <RevealHeading
              text="כניסת סקשן מתוזמרת"
              className="mt-4 font-serif text-3xl font-black text-navy"
            />
            <MItem as="p" className="mt-3 max-w-[55ch] leading-relaxed text-muted">
              קיקר, כותרת, גוף וכפתור נכנסים לפי סדר ה-DOM, במדרגות של טוקן ה-stagger.
              כותרות הצהרה לעולם לא ב-fade בלבד — הן עוברות דרך RevealHeading.
            </MItem>
            <MItem className="mt-6">
              <Link href="/contact" data-cta="styleguide-orchestrate" className={goldCta}>
                כפתור לדוגמה
              </Link>
            </MItem>
          </MOrchestrate>
        </div>

        {/* MStagger — card grid */}
        <MStagger className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3" stagger={0.08}>
          {["כרטיס ראשון", "כרטיס שני", "כרטיס שלישי"].map((t) => (
            <div key={t} className="rounded-[10px] border border-line bg-card p-6">
              <p className="font-serif text-lg font-black text-navy">{t}</p>
              <p className="mt-1 text-sm text-muted">MStagger עוטף כל ילד ומדרג אותו פנימה.</p>
            </div>
          ))}
        </MStagger>

        {/* MParallax — quiet media drift, capped at ±8% */}
        <MParallax
          amplitude={5}
          className="relative mt-8 aspect-video overflow-hidden rounded-[10px] border border-line"
          innerClassName="relative"
        >
          <Image
            src="/media/features/authority-room.webp"
            alt="תצלום הדגמה לפרלקסה שקטה"
            fill
            sizes="(max-width:768px) 100vw, 900px"
            className="object-cover"
          />
        </MParallax>
        <Note>
          MParallax — סחיפה אנכית שקטה בגלילה, תקרה קשיחה של ±8%. תחת reduced-motion התמונה סטטית לחלוטין.
        </Note>

        {/* MMagnetic — the ≤2-per-page budget; this page mounts exactly one */}
        <div className="mt-8 flex flex-wrap items-center gap-6">
          <MMagnetic>
            <Link href="/contact" data-cta="styleguide-magnetic" className={goldCta}>
              כפתור מגנטי
            </Link>
          </MMagnetic>
          <p className="text-sm text-muted">
            MMagnetic — משיכה לעבר הסמן עד 12px, קפיץ SPRING.snappy. תקציב: עד 2 מגנטיים בעמוד.
          </p>
        </div>

        {/* MCounter — honest numbers only (YMYL) */}
        <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3">
          {[
            { value: 18, suffix: "+", label: "שנות ניסיון" },
            { value: 240, suffix: "", label: "תיקים שטופלו" },
            { value: 4, suffix: "", label: "שעות עד מענה" },
          ].map((s) => (
            <div key={s.label} className="rounded-[10px] border border-line bg-card p-6 text-center">
              <span
                className="font-serif font-black leading-none text-navy"
                style={{ fontSize: "var(--text-stat)" }}
              >
                <MCounter value={s.value} suffix={s.suffix} />
              </span>
              <p className="mt-1 text-sm text-muted">{s.label}</p>
            </div>
          ))}
        </div>
        <Note>MCounter — ספירה חד-פעמית בכניסה לפריים. רק מספרים אמיתיים (YMYL) — לעולם לא נתונים מומצאים.</Note>

        {/* MPageTransition — documentation only, deliberately NOT mounted */}
        <div className="mt-8 rounded-[10px] border border-line bg-card p-6">
          <p className="font-serif text-lg font-black text-navy">MPageTransition — לא מורכב כאן</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            מעבר עמודים הוא opt-in ברמת האתר: עוטפים את <code dir="ltr">{"{children}"}</code> ב-layout.tsx
            בלבד — לעולם לא סביב ה-Header/Footer. עמוד בודד לא יכול להדגים אותו ביושר, ולכן הוא מתועד ולא מודגם.
          </p>
        </div>
      </Section>

      {/* ===== E. RevealHeading vs SplitText ===== */}
      <Section tone="white" border>
        <SectionHeading
          eyebrow="E · כותרות"
          title="RevealHeading מול SplitText"
          lead="אותה כותרת, שתי מחוות — פיצול לשורות בלבד, לעולם לא לאותיות (שימור ניקוד ואותיות סופיות)."
        />
        <div className="mt-12 grid gap-10 md:grid-cols-2">
          <div>
            <p className="text-xs font-bold tracking-wide text-gold-ink" dir="ltr">RevealHeading</p>
            <RevealHeading
              text={"עליית שורות\nמתוך מסכה"}
              className="mt-2 font-serif text-3xl font-black text-navy"
            />
            <p className="mt-3 text-sm text-muted">לכותרות הצהרה — שורה עולה מתוך overflow-hidden.</p>
          </div>
          <div>
            <p className="text-xs font-bold tracking-wide text-gold-ink" dir="ltr">SplitText</p>
            <SplitText
              as="h3"
              text={"מחיקת דיו\nמימין לשמאל"}
              className="mt-2 block font-serif text-3xl font-black text-navy"
            />
            <p className="mt-3 text-sm text-muted">מחוות החתימה — clip-path מכיוון הקריאה; ברירת המחדל של SectionHeading.</p>
          </div>
        </div>
        <div className="mt-10">
          <p className="text-xs font-bold tracking-wide text-gold-ink" dir="ltr">Reveal (fade-up גנרי)</p>
          <Reveal className="mt-2 max-w-[55ch]">
            <p className="leading-relaxed text-muted">
              Reveal הוא הכניסה הגנרית לגוף טקסט וכרטיסים — לא לכותרות הצהרה (האיסור על fade בלבד).
            </p>
          </Reveal>
        </div>
      </Section>

      {/* ===== F. trust stack ===== */}
      <Section tone="sand">
        <SectionHeading
          eyebrow="F · אמון"
          title="רכיבי האמון"
          lead="כל הנתונים כאן הם דוגמה מובהקת — שמות, ציטוטים ותוצאות אינם אמיתיים."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <BioCard
            name="עו״ד דוגמה ישראלי"
            role="מלווה משפחות בהסדרי ירושה (דמו)"
            photo={{ src: "/media/team/boaz.webp", alt: "דיוקן הדגמה לכרטיס ביו" }}
            credentials={["חבר לשכה משנת 2009 (דוגמה)", "LL.M — אוניברסיטה לדוגמה"]}
            narrative="שורת נרטיב קצרה של דוגמה — מה הלקוח מקבל ממני בפועל."
          />
          <TestimonialCard
            quote="ציטוט דוגמה: ליוו אותנו מהפגישה הראשונה ועד ההכרעה, בשקיפות מלאה ובזמינות שלא הכרנו."
            attribution={{ name: "משפחת דוגמה", context: "תיק ירושה, עיר לדוגמה (דמו)" }}
            outcome="שורת תוצאה קצרה לדוגמה"
          />
          <ResultCard
            matterType="תחום לדוגמה"
            title="תיק דוגמה להמחשת המבנה"
            story="סיפור קצר לדוגמה: מה הייתה נקודת הפתיחה, מה נעשה בפועל, ואיך התקדם התיק — נרטיב, לא מספר יבש."
            outcome="תוצאה מנוסחת בזהירות"
            disclaimer="דוגמה בלבד: התוצאה תלויה בנסיבות המקרה ואינה מבטיחה תוצאה דומה."
          />
        </div>
        <div className="mt-8 grid gap-8 md:grid-cols-2">
          <div>
            <p className="text-xs font-bold tracking-wide text-gold-ink" dir="ltr">RecognitionBadges</p>
            <div className="mt-3">
              <RecognitionBadges badges={["חבר לשכה (דוגמה)", "בורר מוסמך (דוגמה)", "מרצה אורח (דוגמה)"]} />
            </div>
            <Note>
              עד 7 הכרות, טיפוגרפי ושקט. כשקיימים קובצי לוגו אמיתיים משתמשים ב-CredentialStrip
              (עד 7 לוגואים, מונוכרום) — לתבנית אין לוגואים, ולכן הוא אינו מודגם כאן.
            </Note>
          </div>
          <div className="grid gap-5">
            <ResponsePromise
              promise="חוזרים תוך 4 שעות ביום עסקים (דוגמה)"
              sub="פנייה אחרי 17:00 נענית למחרת בבוקר (דוגמה)"
            />
            <div className="rounded-[10px] bg-navy p-5">
              <ResponsePromise tone="dark" promise="אותה הבטחה על פס נאבי (דוגמה)" />
            </div>
          </div>
        </div>
      </Section>

      {/* ===== G. MediaFrame + grain ===== */}
      <Section tone="white" border>
        <SectionHeading
          eyebrow="G · מדיה"
          title="MediaFrame והגריין המשותף"
          lead="ארבעה יחסי חיתוך קבועים, טינט מותג אחד וגריין אחד — מצלמה אחת לכל האתר."
        />
        <div className="mt-12 grid grid-cols-2 items-start gap-6 lg:grid-cols-4">
          <MediaFrame src="/media/features/appraiser.webp" alt="חיתוך דיוקן 3:4" ratio="3/4" />
          <MediaFrame src="/media/features/desk.webp" alt="חיתוך 16:9" ratio="16/9" />
          <MediaFrame src="/media/features/scale.webp" alt="חיתוך ריבועי 1:1" ratio="1/1" />
          <MediaFrame
            src="/media/features/authority-room.webp"
            alt="חיתוך פנורמי 21:9"
            ratio="21/9"
            caption="21/9 — עם כיתוב ◆"
          />
        </div>
        <div className="relative mt-8 grid h-28 place-items-center overflow-hidden rounded-[10px] bg-navy">
          <div aria-hidden className="grain-overlay" />
          <p className="relative text-sm font-bold text-white" dir="ltr">.grain-overlay · --grain-opacity ≤ 0.06</p>
        </div>
        <Note>
          הגריין הוא בדיוק אותו data-URI שסרט הסינמה צורב על הפריימים שלו — סטילס, פסים והסרט נקראים כצילום אחד.
        </Note>
      </Section>

      {/* ===== H. narrative choreography ===== */}
      <Section tone="sand">
        <SectionHeading
          eyebrow="H · כוריאוגרפיה נרטיבית"
          title="סצנה, דיאגרמה, תפר וסטיל חי"
          lead="ארבעת רכיבי הנרטיב — סצנה צמודת־גלילה, דיאגרמה שמציירת את עצמה, תפר פרקים בין פסי טון, וסטיל שנושם. הגלילה לעולם לא נחטפת."
        />

        {/* MScrollScene — scroll-LINKED scene, never pinned (pin stays with the cinema hero) */}
        <MScrollScene
          amplitude={5}
          zoom={2}
          className="mt-12 overflow-hidden rounded-[10px] border border-line"
          media={
            <>
              <Image
                src="/media/features/authority-room.webp"
                alt=""
                fill
                sizes="(max-width:768px) 100vw, 1000px"
                className="object-cover"
              />
              <div aria-hidden className="absolute inset-0 bg-navy/65" />
            </>
          }
        >
          <div className="px-7 py-20 text-center md:py-28">
            <p className="text-xs font-bold tracking-[.18em] text-gold" dir="ltr">
              MSCROLLSCENE
            </p>
            <p className="mx-auto mt-4 max-w-[30ch] font-serif text-3xl font-black text-white">
              הרקע נסחף בשקט — הטקסט נשאר בזרימה
            </p>
            <p className="mx-auto mt-3 max-w-[48ch] text-sm leading-relaxed text-white/80">
              שכבת המדיה שמאחור נעה ומתקרבת מעט לאורך חציית הסקשן; התוכן עצמו לעולם אינו עובר טרנספורמציה.
            </p>
          </div>
        </MScrollScene>
        <Note>
          MScrollScene — סצנה צמודת־גלילה, לעולם לא נעוצה (ה-pin שמור לגיבור הסינמה). amplitude
          מוגבל ל-±8% (תקרת הפרלקסה השקטה), zoom ל-4%; תחת reduced-motion המדיה והתוכן סטטיים לחלוטין.
        </Note>

        {/* DiagramReveal — every stroke draws itself; SSR / reduced-motion show it fully drawn */}
        <div className="mt-8 rounded-[10px] border border-line bg-card p-7 md:p-9">
          <p className="text-xs font-bold tracking-wide text-gold-ink" dir="ltr">
            DiagramReveal
          </p>
          <DiagramReveal className="mt-6 text-gold-ink">
            <svg
              viewBox="0 0 560 120"
              role="img"
              aria-label="דיאגרמת תהליך בת שלושה שלבים לדוגמה: פנייה, לוח זמנים, הכרעה"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mx-auto block h-auto w-full max-w-2xl"
            >
              {/* step 1 (right — reading direction): the inquiry */}
              <circle cx="480" cy="60" r="26" />
              <path d="M469 51h22M469 60h22M469 69h14" />
              <path d="M446 60H314" />
              {/* step 2: the timeline */}
              <circle cx="280" cy="60" r="26" />
              <path d="M280 44v16l11 8" />
              <path d="M246 60H114" />
              {/* step 3: the resolution */}
              <circle cx="80" cy="60" r="26" />
              <path d="M67 61l9 9 17-19" />
            </svg>
          </DiagramReveal>
          <Note>
            DiagramReveal — כל קו נמדד ומצויר ב-<code dir="ltr">--dur-reveal</code>, מדורג בטוקן ה-stagger לפי סדר ה-DOM
            (כאן: מימין לשמאל, כיוון הקריאה). SSR / reduced-motion מציגים את הדיאגרמה מצוירת במלואה;
            מעבירים SVG מוכן — לעולם לא מקווקו מראש.
          </Note>
        </div>
      </Section>

      {/* MChapter — the labeled hand-off at the seam between the sand band above
          and this white band (SectionSeam's chaptered sibling) */}
      <Section tone="white" border>
        <MChapter label="פרק לדוגמה" className="mb-10" />
        <Note>
          MChapter — תפר הפרקים בין פסי טון: שני קווי זהב נמשכים ונפגשים ב-◆ סביב כותרת פרק.
          מציבים בין שני פסים או בראש הפס הנכנס; על נאבי — <code dir="ltr">{'tone="dark"'}</code>.
          לתפר שקט בלי כותרת נשאר SectionSeam.
        </Note>

        {/* LivingStill — poster-only: the template ships no video asset, so the
            optional `src` loop is omitted and the still IS the content */}
        <div className="mt-12 grid gap-8 md:grid-cols-2 md:items-start">
          <LivingStill
            poster="/media/features/desk.webp"
            alt="סטיל דוגמה — שולחן עבודה במשרד"
            ratio="16/9"
            caption="LivingStill במצב פוסטר בלבד — אותה מסגרת, אותו גריין"
          />
          <div>
            <p className="text-xs font-bold tracking-wide text-gold-ink" dir="ltr">
              LivingStill
            </p>
            <p className="mt-3 max-w-[55ch] text-sm leading-relaxed text-muted">
              הגשר בין הסרט לאתר: המסגרת והגריידינג של MediaFrame סביב לופ וידאו אמביינטי קצר.
              ה-poster הוא התוכן — הוא מה שמוגש ב-SSR, תחת reduced-motion, והוא מועמד ה-LCP.
              prop ה-<code dir="ltr">src</code> (mp4/webm, שניות ספורות, דחוס חזק) אופציונלי:
              לתבנית לא נשלח נכס וידאו, ולכן ההדגמה כאן היא פוסטר בלבד. כשמוסיפים לופ,
              הווידאו עולה מעל הפוסטר רק כשהתנועה מותרת — ומתפרק חזרה לסטיל כשמכבים אותה.
            </p>
          </div>
        </div>
      </Section>
    </>
  );
}
