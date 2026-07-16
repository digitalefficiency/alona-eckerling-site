"use client";

import { motion } from "motion/react";
import { useMotionAllowed } from "@/lib/motion";
import { bezier } from "@/lib/motion-variants";
import { EASE } from "@/lib/motion-tokens";

// Marquee archetype (pipeline.md §B) — a slow ticker band of short items
// (credentials, client names, press) with a ◆ between. The ATMOSPHERE / trust
// seam between heavier sections: motion that says "there is more" without a
// grid. One brass-hairline band, never a flashing news ticker.
//
// House rule #1: the reactive gate releases mid-flight. Reduced-motion / a11y →
// a STATIC wrapped row (no animation), so the content is always fully present.
// Only when motion is allowed does the duplicated track glide (linear, seamless).
export function Marquee({
  items,
  speed = 40,
  className = "",
}: {
  items: string[];
  speed?: number; // seconds for one full pass; higher = slower
  className?: string;
}) {
  const allowed = useMotionAllowed();
  const sep = (
    <span className="mx-6 text-[0.6rem] leading-none text-gold sm:mx-10" aria-hidden>◆</span>
  );
  const row = (extraAria = false) =>
    items.map((it, i) => (
      <span key={i} className="inline-flex items-center whitespace-nowrap" aria-hidden={extraAria || undefined}>
        <span className="text-sm font-semibold tracking-wide text-muted">{it}</span>
        {sep}
      </span>
    ));

  return (
    <div className={`overflow-hidden border-y border-line py-5 ${className}`}>
      {allowed ? (
        <motion.div
          className="flex w-max flex-nowrap"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: speed, ease: bezier(EASE.linear), repeat: Infinity }}
        >
          <div className="flex flex-nowrap">{row()}</div>
          <div className="flex flex-nowrap" aria-hidden>{row(true)}</div>
        </motion.div>
      ) : (
        <div className="flex flex-wrap items-center justify-center gap-y-3">{row()}</div>
      )}
    </div>
  );
}
