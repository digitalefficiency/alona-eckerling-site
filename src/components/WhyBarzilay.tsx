import Link from "next/link";
import { yearsOfExperience } from "@/lib/site";
import { Section } from "@/components/layout/Section";
import { Reveal } from "@/components/Reveal";
import { SplitText } from "@/components/motion/SplitText";
import { AngularFrame } from "@/components/media/AngularFrame";

// Merged "why us + authority" section, framed around the avatars' shared pain:
// the value that decides their case is set inside an opaque system (committee /
// authority / court), and a weak opinion costs them. The answer = an authority the
// system can't dismiss — proven by credentials, three generations, and a track record.
const PILLARS = [
  {
    t: "סמכות נדירה",
    d: "דוקטור למקרקעין ושמאי מכריע מטעם משרד המשפטים — צירוף שמעט מאוד שמאים בישראל יכולים להציג, והוא מה שמעניק לחוות הדעת משקל מכריע.",
  },
  {
    t: "שלושה דורות",
    d: "מורשת רצופה מאז 1987. שיקול דעת שנבנה דור אחר דור, ומבט שמכיר כל ועדה, רשות והליך — מבפנים.",
  },
  {
    t: "אלפי חוות דעת",
    d: "ניסיון מוכח מול ועדות ערר, רשויות מקומיות, רמ״י ובתי משפט. אנחנו יודעים מה מחזיק בחקירה — ומה נדחה.",
  },
];

export function WhyBarzilay() {
  const years = yearsOfExperience();
  const stats = [
    { n: "PhD", l: "דוקטור למקרקעין" },
    { n: "8", l: "ספרים מקצועיים" },
    { n: "+40", l: "מאמרים אקדמיים" },
    { n: `${years}`, l: "שנות ניסיון" },
  ];

  return (
    <Section tone="navy" seam>
      <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-10 lg:gap-16">
        {/* avatar-pain image: "the room where your value is decided" */}
        <Reveal className="order-1 mx-auto w-full max-w-[460px] md:order-2 md:max-w-none">
          <AngularFrame
            src="/media/features/authority-room.webp"
            alt="חדר דיונים מכובד — חוות דעת שמאית כרוכה על שולחן עץ, נוף עיר בשעה כחולה ברקע"
            aspectRatio="4 / 5"
            chamfer={7}
            sizes="(max-width:1024px) 90vw, 480px"
          />
        </Reveal>

        <Reveal as="div" className="order-2 text-right md:order-1">
          <div className="flex items-center justify-end gap-2.5">
            <span className="text-xs font-bold tracking-[.2em] text-gold-soft">למה ברזילי</span>
            <span className="text-[0.7rem] leading-none text-gold" aria-hidden>◆</span>
          </div>

          <SplitText
            as="h2"
            text={"כשמולכם עומדת מערכת —\nצריך סמכות שמחזיקה."}
            lastLineClass="text-gold"
            baseDelay={140}
            className="mt-4 font-serif font-black leading-[1.12] text-white"
            style={{ fontSize: "clamp(1.5rem, 3vw, 2.3rem)" }}
          />

          <p className="mt-6 max-w-[54ch] self-end text-lg leading-relaxed text-slate-200">
            היטל השבחה, ירידת ערך, הפקעה או חוות דעת לבית משפט — בכל מקרה, ההכרעה על השווי שלכם
            נשענת על מי שכתב את חוות הדעת ועל המשקל שהיא נושאת מול הוועדה, הרשות או השופט. זה
            ההבדל בין שומה שמתקבלת לשומה שנדחית.
          </p>

          <ol className="mt-8 space-y-5">
            {PILLARS.map((p, i) => (
              <li key={p.t} className="border-r-2 border-gold/30 pr-4">
                <span dir="ltr" className="block font-mono text-xs tracking-wider text-gold-soft">
                  0{i + 1}
                </span>
                <h3 className="mt-1 font-serif text-lg font-bold text-white">{p.t}</h3>
                <p className="mt-1 max-w-[48ch] text-sm leading-relaxed text-slate-300">{p.d}</p>
              </li>
            ))}
          </ol>

          {/* proof strip — verifiable credentials only */}
          <dl className="mt-8 flex flex-wrap justify-end gap-x-8 gap-y-4 border-t border-white/10 pt-6">
            {stats.map((s) => (
              <div key={s.l} className="text-right">
                <dt className="font-serif text-2xl font-black text-gold" dir="ltr">{s.n}</dt>
                <dd className="mt-0.5 text-xs text-slate-300">{s.l}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-8 flex flex-wrap justify-end gap-3">
            <Link
              href="/why-us"
              data-cta="home-whyus"
              className="rounded-[4px] bg-gold px-7 py-3.5 text-[0.95rem] font-bold text-navy transition-colors hover:bg-gold-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy"
            >
              כל הסיבות לבחור בברזילי
            </Link>
            <Link
              href="/knowledge"
              data-cta="home-knowledge"
              className="rounded-[4px] border border-white/30 px-7 py-3.5 text-[0.95rem] font-bold text-white transition hover:border-gold hover:text-gold-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              למאגר הידע ›
            </Link>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
