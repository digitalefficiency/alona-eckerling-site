import Image from "next/image";
import Link from "next/link";
import { Section } from "@/components/layout/Section";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { SplitText } from "@/components/motion/SplitText";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Prose } from "@/components/Prose";
import { ProcessTimeline } from "@/components/media/ProcessTimeline";
import { JuxtaposeSlider } from "@/components/JuxtaposeSlider";
import { StatCounters } from "@/components/StatCounters";
import { FaqAccordion } from "@/components/FaqAccordion";
import { StoryPanel } from "@/components/media/StoryPanel";
import { BuildingAssemblyScene } from "@/components/urban-renewal/BuildingAssemblyScene";
import { UrbanRenewalLeadForm } from "@/components/UrbanRenewalLeadForm";

// The appraiser's coverage inside a renewal project (the "professional wrapper").
const COVERAGE = [
  { t: "שומת מצב קיים ומוצע", d: "הערכת שווי הדירה הקיימת מול הדירה החדשה על כל תוספותיה." },
  { t: "בדיקת כדאיות", d: "ניתוח רווחיות הפרויקט וזכויות הבנייה — האם ההצעה באמת משתלמת לכם." },
  { t: "היטל השבחה ומיסוי", d: "בחינת ההיטלים והחבויות הנלווים לעסקת ההתחדשות." },
  { t: "ליווי נציגות הדיירים", d: "ייצוג מקצועי מול היזם ושמאי מטעמו — על בסיס מספרים, לא מצגות." },
  { t: "חוות דעת לבית משפט", d: "חוות דעת מומחה קבילה לוועדה, לגישור או להליך משפטי." },
];

// The appraiser's role across the renewal journey (YMYL: scope only, no numbers).
const TIMELINE = [
  { t: "בדיקת היתכנות", d: "ניתוח זכויות הבנייה והכדאיות הראשונית של הפרויקט." },
  { t: "שומת מצב קיים", d: "הערכת שווי הדירות והזכויות שאתם מוסרים ליזם." },
  { t: "בחינת התמורה", d: "כימות הדירה החדשה והתוספות מול ההצעה שעל השולחן." },
  { t: "ליווי המשא ומתן", d: "איזון בין הדיירים ליזם על בסיס הנתונים השמאיים." },
  { t: "חוות דעת / ייצוג", d: "חוות דעת מומחה לוועדה או לבית המשפט בעת הצורך." },
];

export function UrbanRenewalExperience({
  html,
  faq,
}: {
  html: string;
  faq: { q: string; a: string }[];
}) {
  const crumbs = [
    { label: "תחומי התמחות", href: "/services" },
    { label: "התחדשות עירונית", href: "/services/urban-renewal" },
  ];

  return (
    <>
      {/* ===== HERO — full-bleed, kicker over serif H1, CTA → #lead ===== */}
      <section className="relative isolate overflow-hidden bg-navy text-white">
        <div className="absolute inset-0">
          <Image
            src="/media/services/urban-renewal.webp"
            alt="פרויקט התחדשות עירונית — מגדל מגורים חדש"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to left, rgba(10,30,63,.93) 0%, rgba(10,30,63,.66) 46%, rgba(10,30,63,.34) 100%)",
            }}
          />
        </div>
        <div className="relative mx-auto max-w-[var(--container-wide)] px-6 py-24 md:py-36">
          <Breadcrumbs items={crumbs} tone="dark" />
          <div className="mt-8 flex items-center gap-3">
            <span className="text-[0.7rem] leading-none text-gold" aria-hidden>◆</span>
            <span className="h-px w-12 bg-gold/40" aria-hidden />
            <span className="font-serif tracking-wide text-gold-soft" style={{ fontSize: "clamp(1.4rem,3vw,2.2rem)" }}>
              MAKE THE OLD NEW
            </span>
          </div>
          <SplitText
            as="h1"
            text={"התחדשות עירונית —\nבעיניים של שמאי"}
            className="mt-5 max-w-[18ch] font-serif font-black leading-[1.05] text-white"
            style={{ fontSize: "var(--text-hero)" }}
          />
          <p className="mt-6 max-w-[52ch] text-lg leading-relaxed text-slate-200">
            תמ״א 38 ופינוי-בינוי — לפני שאתם מוסרים זכויות, כדאי לדעת בדיוק מה מגיע לכם.
            שלושה דורות של שמאות מקרקעין, לצד בעלי הדירות.
          </p>
          <div className="mt-9 flex flex-wrap gap-4">
            <MagneticButton
              href="#lead"
              dataCta="urban-renewal-hero"
              className="rounded-[4px] bg-gold px-7 py-4 font-bold text-navy transition-colors hover:bg-gold-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy"
            >
              השאירו פרטים לבדיקה
            </MagneticButton>
            <Link
              href="#guide"
              className="rounded-[4px] border border-white/25 px-7 py-4 font-semibold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              למדריך המלא
            </Link>
          </div>
        </div>
      </section>

      {/* ===== REASSURANCE band ===== */}
      <Section tone="sand" border width="prose">
        <Reveal>
          <SectionHeading
            eyebrow="A HOME IS MORE THAN ITS WALLS"
            title="הערך האמיתי נמצא בפרטים"
          />
        </Reveal>
        <Reveal delay={90} className="mt-7 space-y-5 text-[1.08rem] leading-relaxed text-ink">
          <p>
            בלב כל פרויקט התחדשות עומדת שאלה אחת: האם החלוקה בין הדיירים ליזם מאזנת נכון
            בין הסיכון, ההשקעה והרווח. כאן נכנס השמאי מטעם הדיירים — איש המקצוע הבלתי תלוי
            שמתרגם הבטחות שיווקיות למספרים.
          </p>
          <p>
            במשרד ברזילי, עם שלושה דורות של שמאות מקרקעין, אנחנו מלווים בעלי דירות ונציגויות
            בתים בכל שלבי העסקה — מבדיקת הכדאיות הראשונית ועד חוות דעת מומחה לבית המשפט.
          </p>
        </Reveal>
      </Section>

      {/* ===== THE CINEMATIC MOMENT — building assembly + blueprint line-draw ===== */}
      <BuildingAssemblyScene />

      {/* ===== THE PROFESSIONAL WRAPPER ===== */}
      <Section tone="white" border>
        <Reveal>
          <SectionHeading
            eyebrow="THE PROFESSIONAL WRAPPER"
            title="המעטפת המקצועית"
            lead="מה השמאי בודק עבורכם לאורך פרויקט ההתחדשות — מהשורה הראשונה ועד ההליך המשפטי."
          />
        </Reveal>
        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {COVERAGE.map((c, i) => (
            <Reveal as="div" key={c.t} delay={(i % 3) * 70}>
              <div className="survey-card h-full rounded-[10px] border border-line bg-card p-6 transition hover:-translate-y-1 hover:border-gold/70">
                <span className="text-[0.7rem] leading-none text-gold" aria-hidden>◆</span>
                <h3 className="mt-3 font-serif text-xl font-bold text-navy">{c.t}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted">{c.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ===== THE JOURNEY — process timeline ===== */}
      <Section tone="sand" border>
        <Reveal>
          <SectionHeading
            eyebrow="THE JOURNEY"
            title="תפקיד השמאי בכל שלב"
            lead="חמישה שלבים — משיחת ההיתכנות ועד חוות דעת מומחה, אם וכאשר תידרש."
          />
        </Reveal>
        <Reveal className="mt-14">
          <ProcessTimeline steps={TIMELINE} headingAs="h3" />
        </Reveal>
      </Section>

      {/* ===== BY THE NUMBERS — honest stats ===== */}
      <StatCounters />

      {/* ===== BEFORE / AFTER ===== */}
      <Section tone="white" border>
        <Reveal>
          <SectionHeading
            eyebrow="PROMISE VS REALITY"
            title="מה שמבטיחים מול מה שנבנה"
            lead="גררו את הידית — לקרוא את הפער בין התכנית למציאות הוא לב העבודה השמאית בהתחדשות עירונית."
          />
        </Reveal>
        <Reveal className="mt-10" delay={120}>
          <JuxtaposeSlider
            planSrc="/media/generated/urban-plan.webp"
            builtSrc="/media/generated/urban-built.webp"
          />
          <p className="mt-4 text-sm text-muted">
            להמחשה בלבד — השוואה בין תכנית אדריכלית לבנוי בפועל. אינה מייצגת תוצאת שומה,
            תמורה או רווח כספי.
          </p>
        </Reveal>
      </Section>

      {/* ===== THE LEGACY — story panel → /about ===== */}
      <StoryPanel
        kicker="THREE GENERATIONS"
        image="/media/building/stage-6.webp"
        alt="מגדל מגורים מודרני בשעת בין הערביים"
        cta={{ label: "הכירו את המשרד", href: "/about" }}
      >
        <p>
          השם <strong className="font-bold text-white">ברזילי</strong> מלווה את שוק המקרקעין
          הישראלי מאז 1987 — שלושה דורות של שמאות תחת קורת גג אחת.
        </p>
        <p>
          את הניסיון הזה אנחנו מביאים לכל נציגות ולכל בעל דירה בפרויקט התחדשות: סמכות אקדמית,
          ניסיון מהשטח, ועמידה במבחן הוועדה ובית המשפט — <strong className="font-bold text-white">דור אחר דור</strong>.
        </p>
      </StoryPanel>

      {/* ===== THE FULL GUIDE — SEO-rich article prose ===== */}
      <Section id="guide" tone="sand" border width="prose">
        <Reveal>
          <SectionHeading eyebrow="THE FULL GUIDE" title="המדריך המלא לשמאות בהתחדשות עירונית" />
        </Reveal>
        <Reveal className="mt-10">
          <Prose html={html} />
        </Reveal>
      </Section>

      {/* ===== FAQ ===== */}
      {faq.length > 0 && (
        <Section tone="white" border width="prose">
          <Reveal>
            <SectionHeading eyebrow="שאלות נפוצות" title="שו״ת — מה שחשוב לדעת" />
          </Reveal>
          <Reveal className="mt-10">
            <FaqAccordion items={faq} />
          </Reveal>
        </Section>
      )}

      {/* ===== CONVERT — inline lead form (id=lead) ===== */}
      <UrbanRenewalLeadForm />
    </>
  );
}
