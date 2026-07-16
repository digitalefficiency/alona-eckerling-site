"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { motion } from "motion/react";
import { motionAllowed } from "@/lib/motion";
import { maskReveal, staggerChildren } from "@/lib/motion-variants";
import { DUR } from "@/lib/motion-tokens";

// Word-stagger — each WORD rises out of its own overflow-hidden mask with a
// per-word stagger (the "kinetic" character voice, brand.config characterPresets).
// Splits on spaces ONLY (never per-glyph — preserves Hebrew nikud + final-letter
// shaping, same rule as SplitText / RevealHeading). For short statement lines.
//
// House rule #1: SSR / no-JS / reduced-motion / a11y-stop-motion render the FINAL
// visible line (initial={false} + animate="show"). Motion allowed → a layout
// effect arms "hidden" pre-paint (SNAP — no flash), then a one-shot IO reveals it.
const useIso = typeof window !== "undefined" ? useLayoutEffect : useEffect;

const TAGS = {
  span: motion.span,
  div: motion.div,
  h1: motion.h1,
  h2: motion.h2,
  h3: motion.h3,
  p: motion.p,
} as const;

export function WordReveal({
  text,
  as = "span",
  className = "",
  style,
  stagger = DUR.stagger,
  delay = 0,
}: {
  text: string;
  as?: keyof typeof TAGS;
  className?: string;
  style?: CSSProperties;
  stagger?: number; // seconds between words; keep 0.06–0.10 (motion voice)
  delay?: number; // seconds before the first word
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

  const Tag = TAGS[as];
  const words = text.split(" ");
  return (
    <Tag
      ref={ref as never}
      className={className}
      style={style}
      initial={false}
      animate={phase === "enter" ? "hidden" : "show"}
      variants={staggerChildren(stagger, delay)}
    >
      {words.map((word, i) => (
        <span key={i}>
          <span className="inline-block overflow-hidden align-bottom">
            <motion.span className="inline-block" variants={maskReveal}>
              {word}
            </motion.span>
          </span>
          {i < words.length - 1 ? " " : null}
        </span>
      ))}
    </Tag>
  );
}
