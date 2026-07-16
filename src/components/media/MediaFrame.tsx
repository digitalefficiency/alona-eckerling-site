import Image from "next/image";

// UNIFIED IMAGE GRADE (premium-tier "Imagery" gate + backlog #9).
// THE frame every content image routes through: one brand tint + one film
// grain + fixed token crops, so all site stills — and the cinema film, which
// uses the SAME grain — read as a single art-directed shoot.
// Tune the grade once per site via the globals.css @theme tokens
// (--grade-tint / --grain-opacity), never per image. Headshots comply too:
// route them through MediaFrame, or use Portrait (corner-tick team treatment)
// when the wipe/ticks matter more than the grade.
// Both overlays are STATIC (no animation → reduced-motion-safe by
// construction), aria-hidden and pointer-events-none.

// The grain lives in globals.css as the shared --texture-grain token +
// .grain-overlay class — the exact data-URI the cinema film uses (addons/
// cinema StoryCinema), also available to textured navy bands. One texture =
// one camera; never fork or retune it per component.

type Ratio = "3/4" | "16/9" | "1/1" | "21/9";

// Fixed crops — map onto the @theme aspect tokens where one exists.
const AR: Record<Ratio, string> = {
  "3/4": "var(--aspect-portrait)",
  "16/9": "16 / 9",
  "1/1": "var(--aspect-avatar)",
  "21/9": "var(--aspect-hero)",
};

export function MediaFrame({
  src,
  alt,
  ratio,
  priority = false,
  sizes = "(max-width:768px) 100vw, 800px",
  caption,
  className = "",
}: {
  src: string;
  alt: string;
  ratio: Ratio; // deliberate, fixed crop — no free-form aspect
  priority?: boolean; // only on the LCP image
  sizes?: string;
  caption?: string;
  className?: string;
}) {
  const frame = (
    <div
      className={`relative overflow-hidden rounded-[10px] border border-line ${caption ? "" : className}`}
      style={{ aspectRatio: AR[ratio] }}
    >
      <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
      {/* the grade: brand tint (--grade-tint, primary @ ~10%) … */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "var(--grade-tint)" }}
      />
      {/* … + fine film grain: the shared .grain-overlay class (globals.css) —
          --texture-grain at --grain-opacity (0.05 default, keep ≤ 0.06) */}
      <div aria-hidden className="grain-overlay" />
    </div>
  );

  if (!caption) return frame;
  return (
    <figure className={className}>
      {frame}
      <figcaption className="mt-3 flex items-center gap-2 text-sm text-muted">
        <span className="text-[0.55rem] leading-none text-gold-ink" aria-hidden>
          ◆
        </span>
        {caption}
      </figcaption>
    </figure>
  );
}
