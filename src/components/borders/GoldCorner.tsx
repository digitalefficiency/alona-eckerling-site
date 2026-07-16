import type { CSSProperties } from "react";

// GoldCorner — thin brass corner brackets framing a panel (the editorial "this is important" mark). Four
// L-shaped ticks in the corners via border edges; fully static → reduced-motion-safe by construction.
// RTL/LTR-neutral (symmetric). Server component. Decorative → aria-hidden.
const BASE: CSSProperties = { position: "absolute", width: 18, height: 18, pointerEvents: "none" };
const G = "var(--color-gold, #C8A45C)";

export function GoldCorner({
  children,
  className = "",
  inset = 8,
}: {
  children?: React.ReactNode;
  className?: string;
  inset?: number; // distance of each bracket from the edge (px)
}) {
  const corners: CSSProperties[] = [
    { ...BASE, top: inset, left: inset, borderTop: `1.5px solid ${G}`, borderLeft: `1.5px solid ${G}` },
    { ...BASE, top: inset, right: inset, borderTop: `1.5px solid ${G}`, borderRight: `1.5px solid ${G}` },
    { ...BASE, bottom: inset, left: inset, borderBottom: `1.5px solid ${G}`, borderLeft: `1.5px solid ${G}` },
    { ...BASE, bottom: inset, right: inset, borderBottom: `1.5px solid ${G}`, borderRight: `1.5px solid ${G}` },
  ];
  return (
    <div className={`relative ${className}`}>
      {corners.map((s, i) => (
        <span key={i} aria-hidden style={s} />
      ))}
      {children}
    </div>
  );
}
