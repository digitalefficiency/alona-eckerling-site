"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, type Variants } from "motion/react";
import { motionAllowed, onFirstInView } from "@/lib/motion";
import { fadeUp, staggerChildren } from "@/lib/motion-variants";
import { DUR } from "@/lib/motion-tokens";

// Section entrance ORCHESTRATOR — one per section (choreography rule in
// references/design-system.md). Children declared as <MItem> animate in DOM
// order — kicker → title → body → CTA — each stepped by the DUR.stagger token
// via the staggerChildren container variants.
//
// House rule #1 (copied from Reveal/RevealHeading): SSR / no-JS /
// prefers-reduced-motion / html.a11y-stop-motion render the FINAL VISIBLE
// section (`initial={false}` + animate="show" = final-state styles in the
// server HTML). When motion is allowed, a layout effect arms "hidden" BEFORE
// first paint (every variant's hidden state is a SNAP — instant, no flash),
// then a one-shot IntersectionObserver flips to "show" on first view.
const useIso = typeof window !== "undefined" ? useLayoutEffect : useEffect;

const CONTAINERS = {
  div: motion.div,
  section: motion.section,
  header: motion.header,
} as const;

export function MOrchestrate({
  children,
  as = "div",
  className = "",
  stagger = DUR.stagger,
  delay = 0,
}: {
  children: React.ReactNode;
  as?: keyof typeof CONTAINERS;
  className?: string;
  stagger?: number; // seconds between children; keep 0.06–0.10 (motion voice)
  delay?: number; // seconds before the first child starts
}) {
  const ref = useRef<HTMLElement>(null);
  // "rest" = final visible (default). "enter" = armed hidden pre-paint. "shown" = revealing.
  const [phase, setPhase] = useState<"rest" | "enter" | "shown">("rest");

  if (process.env.NODE_ENV !== "production" && (stagger < 0.06 || stagger > 0.1)) {
    console.warn(
      `[MOrchestrate] stagger ${stagger}s is outside the 0.06–0.10s motion voice — prefer the DUR.stagger token (${DUR.stagger}s).`,
    );
  }

  useIso(() => {
    if (!motionAllowed()) return; // reduced-motion / a11y-stop-motion → stay final
    const el = ref.current;
    if (!el) return;
    setPhase("enter"); // arm hidden before the browser paints — no flash
    // onFirstInView = IO + geometry-poll failsafe (IO delivery can starve).
    return onFirstInView(el, () => setPhase("shown"));
  }, []);

  const Tag = CONTAINERS[as];
  return (
    <Tag
      ref={ref as never}
      className={className}
      initial={false}
      animate={phase === "enter" ? "hidden" : "show"}
      variants={staggerChildren(stagger, delay)}
    >
      {children}
    </Tag>
  );
}

const ITEMS = {
  div: motion.div,
  span: motion.span,
  p: motion.p,
  h1: motion.h1,
  h2: motion.h2,
  h3: motion.h3,
  li: motion.li,
} as const;

// One orchestrated child. Default variant = fadeUp (body/CTA); pass another
// token-referencing set from lib/motion-variants (e.g. scaleSoft for media).
// NOTE (premium-tier ban): statement headlines never get opacity-only fadeUp —
// use <RevealHeading> for the title slot, or maskReveal inside a mask.
export function MItem({
  children,
  as = "div",
  className = "",
  variants = fadeUp,
}: {
  children: React.ReactNode;
  as?: keyof typeof ITEMS;
  className?: string;
  variants?: Variants; // must expose hidden/show and reference motion tokens
}) {
  const Tag = ITEMS[as];
  return (
    <Tag className={className} variants={variants}>
      {children}
    </Tag>
  );
}
