"use client";

import { Children, useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, type Variants } from "motion/react";
import { motionAllowed } from "@/lib/motion";
import { fadeUp, staggerChildren } from "@/lib/motion-variants";
import { DUR } from "@/lib/motion-tokens";

// Grid/list stagger container — wraps EACH direct child in a motion item and
// steps them in on the DUR.stagger token. Use for card grids, service lists,
// bio grids (the "wrap items in Reveal with a small stagger" recipe, as one
// container instead of N delay props). For a section's kicker→title→body→CTA
// hierarchy use MOrchestrate instead — one orchestrator per section.
//
// House rule #1: SSR / no-JS / reduced-motion / a11y-stop-motion render the
// FINAL VISIBLE grid (`initial={false}` + animate="show"). Motion allowed →
// a layout effect arms "hidden" pre-paint (SNAP — no flash), then a one-shot
// IntersectionObserver staggers the items in.
const useIso = typeof window !== "undefined" ? useLayoutEffect : useEffect;

const CONTAINERS = {
  div: motion.div,
  ul: motion.ul,
  ol: motion.ol,
} as const;

export function MStagger({
  children,
  as = "div",
  className = "",
  itemClassName = "",
  variants = fadeUp,
  stagger = DUR.stagger,
  delay = 0,
}: {
  children: React.ReactNode;
  as?: keyof typeof CONTAINERS; // ul/ol render items as motion.li
  className?: string; // the grid/flex classes live here
  itemClassName?: string;
  variants?: Variants; // per-item variant set (hidden/show, token-referencing)
  stagger?: number; // seconds between items; keep 0.06–0.10 (motion voice)
  delay?: number; // seconds before the first item
}) {
  const ref = useRef<HTMLElement>(null);
  const [phase, setPhase] = useState<"rest" | "enter" | "shown">("rest");

  useIso(() => {
    if (!motionAllowed()) return; // both gates → stay final visible
    const el = ref.current;
    if (!el) return;
    setPhase("enter"); // arm hidden before paint
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setPhase("shown");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const Tag = CONTAINERS[as];
  const Item = as === "div" ? motion.div : motion.li;
  return (
    <Tag
      ref={ref as never}
      className={className}
      initial={false}
      animate={phase === "enter" ? "hidden" : "show"}
      variants={staggerChildren(stagger, delay)}
    >
      {Children.map(children, (child) => (
        <Item className={itemClassName} variants={variants}>
          {child}
        </Item>
      ))}
    </Tag>
  );
}
