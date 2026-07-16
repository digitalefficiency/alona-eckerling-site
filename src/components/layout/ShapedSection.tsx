import type { ReactNode } from "react";

// A band with a SHAPED edge (non-rectangular) instead of a flat rectangle — scroll-craft.md §A.
// Pure static SVG divider: SSR-drawn, no JS, so reduced-motion-safe by construction. The divider
// sits at the tone-band transition (its fill = this section's tone, extending into the band above,
// so the previous band appears to end in a curve/wave/angle). Palette/grade stay constant (continuity).
// One shared 1440×120 viewBox keeps every shape crisp at any width.

type Shape = "curve" | "wave" | "angle" | "arc" | "slant";
const PATHS: Record<Shape, string> = {
  curve: "M0,120 L0,48 Q720,-8 1440,48 L1440,120 Z",
  wave: "M0,120 L0,64 C360,4 1080,124 1440,64 L1440,120 Z",
  angle: "M0,120 L0,88 L1440,16 L1440,120 Z",
  arc: "M0,120 L0,24 Q720,120 1440,24 L1440,120 Z",
  slant: "M0,120 L0,40 L1440,84 L1440,120 Z",
};
const FILL: Record<string, string> = {
  navy: "var(--color-navy, #0A1E3F)",
  sand: "var(--color-sand, #efe7d6)",
  white: "var(--color-card, #ffffff)",
  blush: "var(--color-blush, #F7DED9)",
};

export function ShapedSection({
  children,
  shape = "curve",
  edge = "top",
  tone = "navy",
  className = "",
}: {
  children: ReactNode;
  shape?: Shape;
  edge?: "top" | "bottom";
  tone?: "white" | "sand" | "navy" | "blush";
  className?: string;
}) {
  const bg =
    tone === "navy"
      ? "bg-navy text-white"
      : tone === "sand"
        ? "bg-sand"
        : tone === "blush"
          ? "bg-blush"
          : "bg-card";
  const divider = (
    <svg aria-hidden viewBox="0 0 1440 120" preserveAspectRatio="none" className="block h-[56px] w-full sm:h-[88px]">
      <path d={PATHS[shape]} fill={FILL[tone]} />
    </svg>
  );
  return (
    <div className={`relative ${bg} ${className}`}>
      {edge === "top" && <div className="absolute inset-x-0 top-0 -translate-y-[98%] leading-[0]">{divider}</div>}
      {children}
      {edge === "bottom" && (
        <div className="absolute inset-x-0 bottom-0 translate-y-[98%] rotate-180 leading-[0]">{divider}</div>
      )}
    </div>
  );
}
