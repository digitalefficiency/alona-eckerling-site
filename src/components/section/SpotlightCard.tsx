"use client";

import { useRef, useState, type CSSProperties } from "react";
import { useMotionPrefs } from "@/lib/motion";

// Spotlight-card archetype (pipeline.md §B) — ONE elevated card (a single hero
// feature, a premium CTA panel) with a soft brass spotlight that follows the
// pointer. The SIGNATURE / focus beat: use once per page, where a card-grid
// would flatten the one thing that matters. House card idiom on navy.
//
// House rule #1: on a coarse pointer (touch) OR reduced-motion / a11y, there is
// NO pointer tracking — a fixed top spotlight renders instead, so the card is
// complete and identical in weight without any motion. Fine-pointer desktop
// only: --mx/--my CSS vars track the cursor for the radial highlight.
export function SpotlightCard({
  children,
  className = "",
  size = 340,
}: {
  children: React.ReactNode;
  className?: string;
  size?: number; // spotlight diameter in px
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { reduced, coarse } = useMotionPrefs();
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const track = !reduced && !coarse;

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!track) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({ x: e.clientX - r.left, y: e.clientY - r.top });
  }

  // Default (touch / reduced / pre-move): a fixed spotlight at the top center.
  const cx = track && pos ? `${pos.x}px` : "50%";
  const cy = track && pos ? `${pos.y}px` : "0%";
  const glow: CSSProperties = {
    background: `radial-gradient(${size}px circle at ${cx} ${cy}, color-mix(in oklab, var(--color-gold, #C8A45C) 26%, transparent), transparent 70%)`,
  };

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={() => setPos(null)}
      className={`group relative overflow-hidden rounded-[14px] border border-gold/40 bg-navy p-8 text-white md:p-12 ${className}`}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0" style={glow} />
      <div className="relative">{children}</div>
    </div>
  );
}
