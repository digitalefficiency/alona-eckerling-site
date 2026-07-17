import { Reveal } from "@/components/Reveal";
import { MStagger } from "@/components/motion/MStagger";
import { slideIn } from "@/lib/motion-variants";

// Comparison archetype (pipeline.md §B) — two approaches side by side, one the
// recommended column (gold border + ◆ badge). The DECISION / tension beat: "the
// usual way vs. our way", a plan chosen, a status quo rejected. Renders only the
// text you pass — no invented superiority claims (YMYL). Server component. RTL-safe
// (logical columns, symmetric grid).
//
// `fork` (the scroll-story mode): the two futures APPROACH FROM OPPOSITE inline
// sides — column 0 leans in from inline-start, column 1 from inline-end (logical,
// so RTL resolves visually right/left). Default stays the quiet block Reveal.
// `noisy` on a column sets its points in the film-chip serif-italic — the faint
// echo of the home film's thought-chips (the traveling motif).
type Column = {
  label: string;
  points: string[];
  highlight?: boolean; // the recommended / "our way" column
  note?: string; // small caption under the label (e.g. a caveat)
  noisy?: boolean; // serif-italic points — the thought-chip echo
};

export function Comparison({
  left,
  right,
  className = "",
  fork = false,
}: {
  left: Column;
  right: Column;
  className?: string;
  fork?: boolean;
}) {
  const cols = [left, right];
  return (
    <div className={`grid gap-4 md:grid-cols-2 ${className}`}>
      {cols.map((c, i) => {
        const card = (
          <div
            className={`flex h-full flex-col rounded-[10px] p-6 md:p-8 ${
              c.highlight ? "border-2 border-gold bg-card" : "border border-line bg-card/60"
            }`}
          >
            <div className="mb-4 flex items-center gap-2.5">
              {c.highlight && <span className="text-[0.7rem] leading-none text-gold" aria-hidden>◆</span>}
              <h3 className={`font-serif text-lg font-black ${c.highlight ? "text-navy" : "text-muted"}`}>
                {c.label}
              </h3>
            </div>
            {c.note && <p className="mb-4 text-xs leading-relaxed text-muted/80">{c.note}</p>}
            <ul className="flex flex-col gap-3">
              {c.points.map((p, j) => (
                <li
                  key={j}
                  className={`flex gap-2.5 text-sm leading-relaxed text-muted ${
                    c.noisy ? "font-serif italic" : ""
                  }`}
                >
                  <span
                    className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${c.highlight ? "bg-gold" : "bg-line"}`}
                    aria-hidden
                  />
                  <span className={c.highlight ? "text-ink" : ""}>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        );
        return fork ? (
          <MStagger
            key={i}
            className="h-full"
            itemClassName="h-full"
            variants={slideIn(i === 0 ? "inline-start" : "inline-end", 40)}
          >
            {card}
          </MStagger>
        ) : (
          <Reveal key={i} delay={i * 90}>
            {card}
          </Reveal>
        );
      })}
    </div>
  );
}
