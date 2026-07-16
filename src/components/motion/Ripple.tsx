"use client";

import { useRef, useState, type CSSProperties } from "react";
import { motionAllowed } from "@/lib/motion";

// Ripple — a single brass ink-ripple from the pointer point on press (the quiet tactile ack for a CTA/tile).
// House rule #1: reduced-motion / a11y = NO ripple (the element is still fully clickable). One ripple at a
// time, self-removing on animation end. The ripple animation lives in globals.css (.ripple-ink). RTL/LTR-neutral.
type Drop = { id: number; x: number; y: number; d: number };

export function Ripple({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const seq = useRef(0);
  const [drops, setDrops] = useState<Drop[]>([]);

  function onDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!motionAllowed()) return; // both gates → no ripple
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const d = Math.max(r.width, r.height) * 2;
    const id = (seq.current += 1);
    setDrops((prev) => [...prev, { id, x: e.clientX - r.left, y: e.clientY - r.top, d }]);
  }
  const clear = (id: number) => setDrops((prev) => prev.filter((d) => d.id !== id));

  return (
    <div ref={ref} onPointerDown={onDown} className={`relative overflow-hidden ${className}`}>
      {children}
      {drops.map((r) => {
        const style: CSSProperties = { left: r.x - r.d / 2, top: r.y - r.d / 2, width: r.d, height: r.d };
        return <span key={r.id} aria-hidden className="ripple-ink" style={style} onAnimationEnd={() => clear(r.id)} />;
      })}
    </div>
  );
}
