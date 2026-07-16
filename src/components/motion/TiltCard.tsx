"use client";

import { useRef, useState, type CSSProperties } from "react";
import { useMotionPrefs } from "@/lib/motion";

// TiltCard — a restrained ≤5° perspective tilt toward the pointer (the premium "this responds to me"). ONE
// interactive card, not a grid. House rule #1: on a coarse pointer (touch) OR reduced-motion / a11y there is
// NO tilt — the card renders flat and identical in weight. Fine-pointer desktop only. RTL/LTR-neutral (spatial).
const MAX_DEG = 5; // the cap, not a default

export function TiltCard({
  children,
  className = "",
  max = MAX_DEG,
}: {
  children: React.ReactNode;
  className?: string;
  max?: number; // degrees; hard-capped at 5
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { reduced, coarse } = useMotionPrefs();
  const [t, setT] = useState<{ rx: number; ry: number } | null>(null);
  const active = !reduced && !coarse;
  const cap = Math.min(max, MAX_DEG);

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!active) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setT({ rx: -py * cap * 2, ry: px * cap * 2 });
  }

  const style: CSSProperties = {
    transform: active && t ? `perspective(900px) rotateX(${t.rx}deg) rotateY(${t.ry}deg)` : undefined,
    transition: "transform var(--dur-micro) var(--ease-micro)",
    transformStyle: "preserve-3d",
  };
  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={() => setT(null)}
      className={className}
      style={style}
    >
      {children}
    </div>
  );
}
