"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { motionAllowed } from "@/lib/motion";
import { DUR, EASE } from "@/lib/motion-tokens";
import { bezier } from "@/lib/motion-variants";

// KenBurns — a slow cinematic scale + pan on a still, inside its frame (the child should be a full-bleed
// image). ENHANCEMENT ONLY: SSR / no-JS / reduced-motion / a11y render the image perfectly static; the drift
// starts on view when both motion gates pass. Wrap it in your own graded MediaFrame. RTL/LTR-neutral.
export function KenBurns({
  children,
  className = "",
  intensity = 1,
}: {
  children: React.ReactNode;
  className?: string;
  intensity?: number; // 1 = the house default (~6% zoom); keep ≤1.5
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!motionAllowed()) return; // both gates → static still
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setOn(true); io.disconnect(); }
    }, { rootMargin: "0px 0px -10% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const amp = 0.06 * intensity;
  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <motion.div
        className="h-full w-full"
        initial={false}
        animate={on ? { scale: 1 + amp, x: `${-amp * 30}%`, y: `${-amp * 12}%` } : { scale: 1, x: "0%", y: "0%" }}
        transition={{ duration: DUR.reveal * 20, ease: bezier(EASE.linear) }}
      >
        {children}
      </motion.div>
    </div>
  );
}
