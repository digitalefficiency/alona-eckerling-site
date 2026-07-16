import { Reveal } from "@/components/Reveal";

// Bento-grid archetype (pipeline.md §B) — a mixed-size tile grid: one or two
// feature tiles span wider/taller, the rest are quiet cells. The OVERVIEW /
// capability beat where a card-grid would read too even. Editorial, not a
// dashboard: house card idiom (rounded-[10px] border-line bg-card, ◆ eyebrow),
// generous air. Server component; each tile enters on the house Reveal stagger
// (reduced-motion-safe). RTL-safe — the grid is symmetric, text is logical.
type Tile = {
  title: string;
  body?: React.ReactNode;
  eyebrow?: string;
  wide?: boolean; // spans 2 columns on md+
  tall?: boolean; // spans 2 rows on md+
};

const SPAN = {
  base: "",
  wide: "md:col-span-2",
  tall: "md:row-span-2",
  both: "md:col-span-2 md:row-span-2",
} as const;

export function BentoGrid({
  items,
  className = "",
}: {
  items: Tile[];
  className?: string;
}) {
  return (
    <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 md:auto-rows-[minmax(11rem,auto)] ${className}`}>
      {items.map((t, i) => {
        const key = t.wide && t.tall ? "both" : t.wide ? "wide" : t.tall ? "tall" : "base";
        return (
          <Reveal key={i} delay={i * 60}>
            <article
              className={`flex h-full flex-col rounded-[10px] border border-line bg-card p-6 md:p-7 ${SPAN[key]}`}
            >
              {t.eyebrow && (
                <div className="mb-3 flex items-center gap-2.5">
                  <span className="text-[0.65rem] leading-none text-gold" aria-hidden>◆</span>
                  <span className="text-xs font-bold tracking-[.18em] text-gold-ink">{t.eyebrow}</span>
                </div>
              )}
              <h3 className="font-serif text-xl font-black leading-snug text-navy">{t.title}</h3>
              {t.body && <p className="mt-3 grow text-sm leading-relaxed text-muted">{t.body}</p>}
            </article>
          </Reveal>
        );
      })}
    </div>
  );
}
