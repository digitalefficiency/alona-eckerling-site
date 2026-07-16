"use client";

import { createContext, useContext, useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";
import { SPRING } from "@/lib/motion-tokens";
import { useMotionAllowed, useMotionPrefs } from "@/lib/motion";

// Magnetic hover on SPRING.snappy — the element pulls toward the cursor
// (≤12px, the house cap shared with MagneticButton) and springs back.
// Fine-pointer only: disabled under reduced-motion, html.a11y-stop-motion
// AND coarse pointers. SSR-safe by construction — the spring rests at 0,0
// so the default render IS the final design.
//
// MotionBudgetProvider = the premium-tier "magnetic effects ≤2 CTAs" rule IN
// CODE: every MMagnetic registers itself and the 3rd concurrent mount
// dev-warns. A module-level budget backs the default context so the warning
// fires even without mounting the provider; wrap a route/page in
// <MotionBudgetProvider> to scope the count per page.

type MotionBudget = { magnetics: number };

const globalBudget: MotionBudget = { magnetics: 0 };
const MotionBudgetContext = createContext<MotionBudget>(globalBudget);

export function MotionBudgetProvider({ children }: { children: React.ReactNode }) {
  const budget = useRef<MotionBudget>({ magnetics: 0 });
  return (
    <MotionBudgetContext.Provider value={budget.current}>{children}</MotionBudgetContext.Provider>
  );
}

const MAX_PULL = 12; // px — the house magnetic cap (design-system.md → Micro)

export function MMagnetic({
  children,
  className = "",
  strength = 0.3,
}: {
  children: React.ReactNode; // usually ONE CTA link/button (keeps data-cta on the child)
  className?: string;
  strength?: number; // cursor-distance multiplier before the ±12px clamp
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const allowed = useMotionAllowed();
  const { coarse } = useMotionPrefs();
  const enabled = allowed && !coarse;

  const budget = useContext(MotionBudgetContext);
  useEffect(() => {
    budget.magnetics += 1;
    if (process.env.NODE_ENV !== "production" && budget.magnetics > 2) {
      console.warn(
        `[MMagnetic] ${budget.magnetics} magnetic elements mounted — the premium tier caps magnetic effects at 2 CTAs per page (references/premium-tier.md → motion discipline). Remove the extras or scope pages with <MotionBudgetProvider>.`,
      );
    }
    return () => {
      budget.magnetics -= 1;
    };
  }, [budget]);

  // Springs rest at 0 → zero transform at SSR and whenever motion is off.
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, SPRING.snappy);
  const sy = useSpring(y, SPRING.snappy);

  const onPointerMove = (e: React.PointerEvent) => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const clamp = (v: number) => Math.max(-MAX_PULL, Math.min(MAX_PULL, v * strength));
    x.set(clamp(e.clientX - (r.left + r.width / 2)));
    y.set(clamp(e.clientY - (r.top + r.height / 2)));
  };
  const reset = () => {
    x.set(0);
    y.set(0);
  };

  useEffect(() => {
    if (!enabled) reset(); // release mid-flight when a gate flips on
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return (
    <motion.span
      ref={ref}
      className={`inline-block ${className}`}
      style={{ x: sx, y: sy }}
      onPointerMove={onPointerMove}
      onPointerLeave={reset}
    >
      {children}
    </motion.span>
  );
}
