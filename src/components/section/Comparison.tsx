import Image from "next/image";
import { Reveal } from "@/components/Reveal";
import { MStagger } from "@/components/motion/MStagger";
import { slideIn } from "@/lib/motion-variants";

// Comparison archetype (pipeline.md §B) — two approaches side by side, one the
// recommended column (gold border + gold bullets). The DECISION / tension beat: "the
// usual way vs. our way", a plan chosen, a status quo rejected. Renders only the
// text you pass — no invented superiority claims (YMYL). Server component. RTL-safe
// (logical columns, symmetric grid).
//
// `fork` (the scroll-story mode): the two futures APPROACH FROM OPPOSITE inline
// sides — column 0 leans in from inline-start, column 1 from inline-end (logical,
// so RTL resolves visually right/left). Default stays the quiet block Reveal.
// `noisy` marks the not-recommended column. Tone only: it renders in the SAME
// type as the recommended side (the old serif-italic film-chip echo retired
// with the film era — Rom, 2026-08-12); the contrast lives in borders/bullets.
type Column = {
  label: string;
  points: string[];
  highlight?: boolean; // the recommended / "our way" column
  note?: string; // small caption under the label (e.g. a caveat)
  noisy?: boolean; // the not-recommended future (no highlight chrome)
  ghost?: string; // «חדרים מצולמים»: a faint still haunting the card's
  // background (~0.16 opacity under the content) — EACH column carries its OWN
  // photograph (Rom 2026-07-21: both used to share one film frame, which read as
  // a repeat): the crowded counter for the noisy year, the one settled place for
  // the quiet way. Lazy by default — it sits well below the fold.
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
            className={`relative flex h-full flex-col rounded-[10px] p-6 md:p-8 ${
              c.highlight ? "border-2 border-gold bg-card" : "border border-line bg-card/60"
            }`}
          >
            {c.ghost && (
              <div aria-hidden className="absolute inset-0 overflow-hidden rounded-[inherit]">
                <Image src={c.ghost} alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover opacity-[0.16]" />
              </div>
            )}
            {/* No ◆ badge here: the ◆ is a STRUCTURE mark (kickers, seams, step
                markers), and this is a label. The recommended column is already
                announced three times over — the 2px gold border, the gold bullets
                and the ink-dark label against the muted one. A fourth signal is
                wallpaper. */}
            <h3 className={`relative mb-4 font-serif text-lg font-black ${c.highlight ? "text-navy" : "text-muted"}`}>
              {c.label}
            </h3>
            {c.note && <p className="relative mb-4 text-[13px] leading-relaxed text-muted">{c.note}</p>}
            {/* both futures speak the same type — the noisy serif-italic
                retired (Rom, 2026-08-12: «שהם יהיו אותו דבר כמו בכרטיסיה של
                הדרך השקטה»); only tone and borders differ */}
            <ul className="relative flex flex-col gap-3">
              {c.points.map((p, j) => (
                <li
                  key={j}
                  className="flex gap-2.5 text-sm leading-relaxed text-muted"
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
          <Reveal key={i} delay={i * 80}>
            {card}
          </Reveal>
        );
      })}
    </div>
  );
}
