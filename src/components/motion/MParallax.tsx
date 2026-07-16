"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { useMotionAllowed } from "@/lib/motion";

// QUIET media parallax — the inner layer drifts vertically as the frame
// crosses the viewport. Amplitude is hard-capped at ±8% (design-system
// "quiet media parallax"): anything louder reads as an effect, not depth.
//
// House rule #1: SSR / no-JS / reduced-motion / a11y-stop-motion render the
// child perfectly STATIC (no transform, no bleed scale) — the parallax is a
// mount-time enhancement only. The compensating scale (1 + 2×amp) is applied
// only while active so the drifting layer never exposes frame edges.
// Coarse pointers keep the parallax (it is scroll-driven, not cursor-driven).
const MAX_AMPLITUDE = 8; // percent — the cap, not a default

export function MParallax({
  children,
  amplitude = 5,
  className = "",
  innerClassName = "",
}: {
  children: React.ReactNode;
  amplitude?: number; // percent of the frame height, capped at ±8
  className?: string; // the frame — sized/positioned by the caller
  innerClassName?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const allowed = useMotionAllowed();

  if (process.env.NODE_ENV !== "production" && Math.abs(amplitude) > MAX_AMPLITUDE) {
    console.warn(
      `[MParallax] amplitude ${amplitude}% exceeds the ±${MAX_AMPLITUDE}% quiet-parallax cap (references/design-system.md) — clamping.`,
    );
  }
  const amp = Math.min(Math.abs(amplitude), MAX_AMPLITUDE);

  // Hooks run unconditionally; the transform is only APPLIED when allowed.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [`${amp}%`, `${-amp}%`]);

  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <motion.div
        className={`h-full w-full ${allowed ? "will-change-transform" : ""} ${innerClassName}`}
        style={allowed ? { y, scale: 1 + (2 * amp) / 100 } : undefined}
      >
        {children}
      </motion.div>
    </div>
  );
}
