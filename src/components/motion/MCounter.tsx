"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { animate } from "motion/react";
import { motionAllowed } from "@/lib/motion";
import { DUR, EASE } from "@/lib/motion-tokens";
import { bezier } from "@/lib/motion-variants";

// Count-up for stats — fires ONCE via IntersectionObserver, on the DUR.reveal
// + EASE.out tokens. YMYL note (see StatCounters): only animate honest
// numbers (years, counts) — never invented figures.
//
// House rule #1: SSR / no-JS / reduced-motion / a11y-stop-motion render the
// FINAL number (the stat is real content — never hidden behind JS). When
// motion is allowed, a layout effect arms 0 BEFORE first paint, then the
// observer runs the count-up on first view. A visually-hidden copy of the
// final value keeps screen readers on the real stat while digits animate.
const useIso = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function MCounter({
  value,
  prefix = "",
  suffix = "",
  className = "",
  locale = false,
}: {
  value: number; // the final (real) figure
  prefix?: string; // e.g. "+"
  suffix?: string; // e.g. "%"
  className?: string;
  locale?: boolean; // true → toLocaleString grouping (1,250)
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(value); // final value by default
  const [armed, setArmed] = useState(false);

  useIso(() => {
    if (!motionAllowed()) return; // both gates → final number, no roll
    const el = ref.current;
    if (!el) return;
    setDisplay(0);
    setArmed(true); // arm before paint — no value flash
    let controls: { stop: () => void } | undefined;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          controls = animate(0, value, {
            duration: DUR.reveal,
            ease: bezier(EASE.out),
            onUpdate: (v) => setDisplay(Math.round(v)),
          });
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      controls?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const format = (n: number) => (locale ? n.toLocaleString() : String(n));
  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {armed && <span className="sr-only">{`${prefix}${format(value)}${suffix}`}</span>}
      <span aria-hidden={armed || undefined} dir="ltr">
        {prefix}
        {format(display)}
        {suffix}
      </span>
    </span>
  );
}
