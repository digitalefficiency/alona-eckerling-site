import { Reveal } from "@/components/Reveal";

// Feature-alternating archetype (pipeline.md §B) — a zig-zag of image+text rows,
// the media side flipping every row for the editorial left/right rhythm. The
// multi-feature PLAN / capabilities beat, where a single FeatureRow isn't enough
// and a card-grid is too flat. Media is caller-supplied (pass ClipReveal /
// MediaFrame / Image as `media`); with no media, a large brass index numeral
// carries the column. Server component; rows enter on the house Reveal. RTL-safe
// — column order flips via `order`, not physical left/right.
type Feature = {
  eyebrow?: string;
  title: string;
  body?: React.ReactNode;
  media?: React.ReactNode; // caller passes their own framed media node
};

export function FeatureAlternating({
  features,
  className = "",
}: {
  features: Feature[];
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-16 md:gap-24 ${className}`}>
      {features.map((f, i) => {
        const flip = i % 2 === 1; // odd rows put media on the inline-start
        return (
          <Reveal key={i} delay={i * 60}>
            <div className="grid items-center gap-8 md:grid-cols-2 md:gap-14">
              <div className={flip ? "md:order-last" : ""}>
                {f.media ?? (
                  <div
                    className="flex items-center justify-center rounded-[10px] border border-line bg-card"
                    style={{ aspectRatio: "var(--aspect-feature, 4 / 3)" }}
                  >
                    <span className="font-serif text-7xl font-black text-gold/30 md:text-8xl" aria-hidden>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                )}
              </div>
              <div>
                {f.eyebrow && (
                  <div className="mb-3 flex items-center gap-2.5">
                    <span className="text-[0.65rem] leading-none text-gold" aria-hidden>◆</span>
                    <span className="text-xs font-bold tracking-[.18em] text-gold-ink">{f.eyebrow}</span>
                  </div>
                )}
                <h3 className="font-serif text-2xl font-black leading-snug text-navy md:text-3xl">{f.title}</h3>
                {f.body && <div className="mt-4 text-lg leading-relaxed text-muted">{f.body}</div>}
              </div>
            </div>
          </Reveal>
        );
      })}
    </div>
  );
}
