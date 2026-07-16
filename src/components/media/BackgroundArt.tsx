"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { useMotionAllowed } from "@/lib/motion";

// A decorative generated artwork BEHIND the section; content scrolls over it with a quiet
// parallax — scroll-craft.md §C. `art` is a generated still (premium-generation.md, in our
// petrol/brass — NEVER a purple gradient). Amplitude is capped ±8% (MParallax's quiet cap).
//
// House rule #1: SSR / no-JS / prefers-reduced-motion / html.a11y-stop-motion render the art
// perfectly STATIC and the content over it in normal flow — parallax is a mount-time enhancement.
const MAX_AMPLITUDE = 8;

export function BackgroundArt({
  children,
  art,
  amplitude = 5,
  className = "",
}: {
  children: React.ReactNode;
  art: React.ReactNode; // the background layer (e.g. next/image fill + object-cover)
  amplitude?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const allowed = useMotionAllowed();
  const amp = Math.min(Math.abs(amplitude), MAX_AMPLITUDE);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [`${amp}%`, `${-amp}%`]);

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      <motion.div
        aria-hidden
        className={`pointer-events-none absolute inset-0 ${allowed ? "will-change-transform" : ""}`}
        style={allowed ? { y, scale: 1 + (2 * amp) / 100 } : undefined}
      >
        {art}
      </motion.div>
      <div className="relative">{children}</div>
    </div>
  );
}
