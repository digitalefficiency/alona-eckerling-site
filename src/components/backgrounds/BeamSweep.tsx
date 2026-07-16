import type { CSSProperties } from "react";

// ONE soft diagonal light BEAM (style-library.md) — a single restrained brass shaft, never a laser
// show. STATIC → reduced-motion-safe. Absolute layer inside a `relative` section.
export function BeamSweep({ className = "", opacity = 0.35 }: { className?: string; opacity?: number }) {
  const style: CSSProperties = {
    opacity,
    background:
      "linear-gradient(115deg, transparent 32%, color-mix(in oklab, var(--color-gold, #C8A45C) 28%, transparent) 50%, transparent 68%)",
  };
  return <div aria-hidden className={`pointer-events-none absolute inset-0 ${className}`} style={style} />;
}
