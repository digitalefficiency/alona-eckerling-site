"use client";

import { useState, type CSSProperties } from "react";
import { useMotionPrefs } from "@/lib/motion";

// DockRow — a restrained row of items (service icons, credential badges) that gently magnify the hovered one and
// its neighbors (the Apple-dock feel, dialed to editorial). House rule #1: coarse-pointer / reduced-motion / a11y
// = a plain static flex row (no magnify). Fine-pointer only. RTL/LTR via native flex direction (logical). The
// scale transition is CSS-tokenized. PROP-DRIVEN.
export function DockRow({
  items,
  className = "",
}: {
  items: React.ReactNode[];
  className?: string;
}) {
  const { reduced, coarse } = useMotionPrefs();
  const active = !reduced && !coarse;
  const [hover, setHover] = useState<number | null>(null);

  const scaleFor = (i: number): number => {
    if (!active || hover === null) return 1;
    const d = Math.abs(i - hover);
    return d === 0 ? 1.25 : d === 1 ? 1.1 : 1;
  };

  return (
    <div className={`flex items-end justify-center gap-4 ${className}`}>
      {items.map((node, i) => {
        const style: CSSProperties = {
          transform: `scale(${scaleFor(i)})`,
          transformOrigin: "bottom",
          transition: "transform var(--dur-micro) var(--ease-micro)",
        };
        return (
          <div
            key={i}
            onPointerEnter={() => active && setHover(i)}
            onPointerLeave={() => setHover(null)}
            style={style}
          >
            {node}
          </div>
        );
      })}
    </div>
  );
}
