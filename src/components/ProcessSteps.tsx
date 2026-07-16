import { Fragment } from "react";
import { Section } from "@/components/layout/Section";
import { SectionHeading } from "@/components/SectionHeading";
import { Reveal } from "@/components/Reveal";

// "איך זה עובד" — transparent process columns (blend with the sand band): a large
// 2D outlined ghost numeral set behind and to the side of the text, with big 2D
// chevrons BETWEEN the steps showing the flow. YMYL-safe (scope only).
const STEPS = [
  {
    n: "01",
    t: "שיחת אבחון ראשונית",
    d: "שיחה קצרה וללא התחייבות. נשמע את המקרה, נשאל את השאלות הנכונות, ונאמר לכם בכנות איפה אתם עומדים ומה הצעדים האפשריים — עוד לפני שהתחייבתם למשהו.",
  },
  {
    n: "02",
    t: "בדיקת מסמכים והערכת כדאיות",
    d: "בוחנים לעומק את השומה, את התשתית התכנונית ואת הזכויות שלכם. בסוף השלב תדעו בדיוק מה הפוטנציאל, מה הסיכוי ומה כדאי לעשות — בלי הפתעות.",
  },
  {
    n: "03",
    t: "חוות דעת / ייצוג",
    d: "כותבים חוות דעת שמאית מנומקת, או מייצגים אתכם בעצמנו — מול הרשות, ועדת הערר או בית המשפט. אנחנו עומדים מאחורי כל מספר, עד הסוף.",
  },
];

export function ProcessSteps() {
  return (
    <Section tone="sand">
      <Reveal>
        <SectionHeading
          eyebrow="התהליך"
          title="איך זה עובד"
          lead="שלושה צעדים ברורים — משיחה ראשונית ועד חוות דעת או ייצוג."
        />
      </Reveal>

      <div className="mt-16 flex flex-col items-stretch gap-12 md:flex-row md:items-center md:gap-5 lg:gap-3">
        {STEPS.map((s, i) => (
          <Fragment key={s.n}>
            <Reveal as="div" delay={(i % 3) * 90} className="relative flex-1 overflow-hidden px-3 pt-10 text-right">
              {/* 2D outlined ghost numeral — behind + to the (start) side of the text */}
              <span
                aria-hidden
                dir="ltr"
                style={{ color: "transparent", WebkitTextStroke: "1.5px rgba(10,30,63,0.22)" }}
                className="pointer-events-none absolute -top-1 right-0 select-none font-serif text-[4rem] font-black leading-none sm:text-[5rem] md:text-[6.5rem]"
              >
                {s.n}
              </span>

              <div className="relative">
                <span className="text-[0.7rem] leading-none text-gold" aria-hidden>◆</span>
                <h3 className="mt-3 font-serif text-xl font-bold text-navy">{s.t}</h3>
                <p className="mt-3 max-w-[40ch] text-sm leading-relaxed text-muted">{s.d}</p>
              </div>
            </Reveal>

            {/* flat 2D chevron BETWEEN the steps — points to the next (RTL: leftward) */}
            {i < STEPS.length - 1 && (
              <span
                aria-hidden
                style={{ color: "transparent", WebkitTextStroke: "1.5px rgba(200,164,92,0.55)" }}
                className="hidden shrink-0 select-none font-serif text-5xl leading-none md:block"
              >
                ›
              </span>
            )}
          </Fragment>
        ))}
      </div>
    </Section>
  );
}
