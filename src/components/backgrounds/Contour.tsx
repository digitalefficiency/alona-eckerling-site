// Topographic CONTOUR hairlines (style-library.md) — a static SVG of brass strokes, low opacity;
// an architectural, editorial texture (never a busy pattern). Reduced-motion-safe by construction.
// Absolute layer inside a `relative` section; strokes take the gold role via currentColor override.
export function Contour({ className = "", opacity = 0.22 }: { className?: string; opacity?: number }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 800 400"
      preserveAspectRatio="xMidYMid slice"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      style={{ opacity }}
    >
      <g fill="none" stroke="var(--color-gold, #C8A45C)" strokeWidth="1">
        <path d="M0,110 C200,52 600,172 800,102" />
        <path d="M0,168 C220,110 580,232 800,160" />
        <path d="M0,226 C240,168 560,292 800,220" />
        <path d="M0,284 C260,226 540,352 800,280" />
        <path d="M0,342 C280,284 520,408 800,338" />
      </g>
    </svg>
  );
}
