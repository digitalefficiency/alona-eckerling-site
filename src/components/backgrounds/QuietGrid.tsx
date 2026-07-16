import type { CSSProperties } from "react";

// A faint editorial LINE GRID (style-library.md) — hairlines on the band's own bg, radial-masked
// so it fades at the edges. STATIC (no JS) → reduced-motion-safe by construction. Absolute layer:
// drop it inside a `relative` section, content in a higher layer.
export function QuietGrid({
  className = "",
  size = 48,
  opacity = 0.4,
}: {
  className?: string;
  size?: number;
  opacity?: number;
}) {
  const mask = "radial-gradient(ellipse 80% 60% at 50% 40%, #000 30%, transparent 85%)";
  const style: CSSProperties = {
    backgroundImage:
      "linear-gradient(var(--color-line, #e2e8f1) 1px, transparent 1px)," +
      "linear-gradient(90deg, var(--color-line, #e2e8f1) 1px, transparent 1px)",
    backgroundSize: `${size}px ${size}px`,
    opacity,
    WebkitMaskImage: mask,
    maskImage: mask,
  };
  return <div aria-hidden className={`pointer-events-none absolute inset-0 ${className}`} style={style} />;
}
