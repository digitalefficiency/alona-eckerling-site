import type { CSSProperties } from "react";

// A sparse DOT FIELD (style-library.md) — faint brass dots, radial-masked, STATIC (no JS) →
// reduced-motion-safe. Absolute layer inside a `relative` section.
export function DotField({
  className = "",
  size = 28,
  opacity = 0.5,
}: {
  className?: string;
  size?: number;
  opacity?: number;
}) {
  const mask = "radial-gradient(ellipse at center, #000 35%, transparent 80%)";
  const style: CSSProperties = {
    backgroundImage: "radial-gradient(var(--color-gold, #C8A45C) 1px, transparent 1.4px)",
    backgroundSize: `${size}px ${size}px`,
    opacity,
    WebkitMaskImage: mask,
    maskImage: mask,
  };
  return <div aria-hidden className={`pointer-events-none absolute inset-0 ${className}`} style={style} />;
}
