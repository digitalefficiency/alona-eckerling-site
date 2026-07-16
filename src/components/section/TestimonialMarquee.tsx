"use client";

import { motion } from "motion/react";
import { useMotionAllowed } from "@/lib/motion";
import { bezier } from "@/lib/motion-variants";
import { EASE } from "@/lib/motion-tokens";

// TestimonialMarquee — a slow band of short testimonial cards (the social-proof seam). Reuses the Marquee
// mechanic: reactive gate → reduced-motion / a11y = a STATIC wrapped row (every quote fully present); allowed =
// a duplicated track glides seamlessly (linear token). YMYL: renders only supplied quotes/names. RTL/LTR-aware.
type Quote = { quote: string; name: string; role?: string };

export function TestimonialMarquee({
  items,
  speed = 48,
  className = "",
}: {
  items: Quote[];
  speed?: number; // seconds for one full pass; higher = slower
  className?: string;
}) {
  const allowed = useMotionAllowed();
  const Card = (q: Quote, key: number, extraAria = false) => (
    <figure
      key={key}
      aria-hidden={extraAria || undefined}
      className="mx-3 flex w-72 shrink-0 flex-col justify-between rounded-[10px] border border-line bg-card p-5"
    >
      <blockquote className="text-sm leading-relaxed text-muted">“{q.quote}”</blockquote>
      <figcaption className="mt-4 text-xs font-bold tracking-wide text-gold-ink">
        {q.name}{q.role ? <span className="font-normal text-muted"> · {q.role}</span> : null}
      </figcaption>
    </figure>
  );

  return (
    <div className={`overflow-hidden ${className}`}>
      {allowed ? (
        <motion.div
          className="flex w-max flex-nowrap"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: speed, ease: bezier(EASE.linear), repeat: Infinity }}
        >
          <div className="flex flex-nowrap">{items.map((q, i) => Card(q, i))}</div>
          <div className="flex flex-nowrap" aria-hidden>{items.map((q, i) => Card(q, i, true))}</div>
        </motion.div>
      ) : (
        <div className="flex flex-wrap justify-center gap-y-4">{items.map((q, i) => Card(q, i))}</div>
      )}
    </div>
  );
}
