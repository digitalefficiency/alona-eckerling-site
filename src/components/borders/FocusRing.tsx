import type { CSSProperties } from "react";

// FocusRing — an a11y-first brass focus ring around whatever it wraps (inputs, buttons, cards). Pure CSS
// :focus-within, no motion (reduced-motion-safe by construction). Always-on under keyboard focus — this is
// a visibility affordance, never decoration. RTL/LTR-neutral (symmetric). Server component.
// Style lives in globals.css (.focus-ring:focus-within) so the ring color/offset stay tokenized.
export function FocusRing({
  children,
  className = "",
  radius = 10,
}: {
  children: React.ReactNode;
  className?: string;
  radius?: number; // match the wrapped control's radius
}) {
  const style: CSSProperties = { borderRadius: radius };
  return (
    <div className={`focus-ring ${className}`} style={style}>
      {children}
    </div>
  );
}
