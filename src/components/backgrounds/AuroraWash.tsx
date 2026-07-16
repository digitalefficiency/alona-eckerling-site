import type { CSSProperties } from "react";

// A very soft petrol→brass WASH (style-library.md) — the editorial-luxury alternative to a neon
// aurora: two quiet blurred radials in the brand palette, nothing rainbow. STATIC → reduced-motion-
// safe. Absolute layer inside a `relative` section (best on a navy band).
export function AuroraWash({ className = "", opacity = 0.5 }: { className?: string; opacity?: number }) {
  const style: CSSProperties = {
    opacity,
    background:
      "radial-gradient(60% 50% at 18% 20%, color-mix(in oklab, var(--color-navy, #0A1E3F) 34%, transparent), transparent 70%)," +
      "radial-gradient(52% 42% at 86% 32%, color-mix(in oklab, var(--color-gold, #C8A45C) 22%, transparent), transparent 72%)",
    filter: "blur(10px)",
  };
  return <div aria-hidden className={`pointer-events-none absolute inset-0 ${className}`} style={style} />;
}
