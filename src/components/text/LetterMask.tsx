"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { motion } from "motion/react";
import { motionAllowed } from "@/lib/motion";
import { maskReveal, staggerChildren } from "@/lib/motion-variants";
import { DUR } from "@/lib/motion-tokens";

// Letter-mask — each GRAPHEME rises out of its own overflow-hidden mask, tight
// stagger (the "mono-minimal" luxury wordmark voice, brand.config characterPresets).
// Segments with Intl.Segmenter(grapheme) so a base letter + its nikud stay ONE
// unit (naive per-code-unit split would orphan combining marks — banned). Falls
// back to a per-WORD split where Segmenter is absent, never per-code-unit. For
// SHORT text only (a hero word / wordmark) — one mask per letter is a lot of DOM.
//
// House rule #1: SSR / no-JS / reduced-motion / a11y render the FINAL text
// (initial={false} + animate="show"). Motion allowed → a layout effect arms
// "hidden" pre-paint (SNAP), then a one-shot IO reveals it.
const useIso = typeof window !== "undefined" ? useLayoutEffect : useEffect;

type Seg = { s: string; space: boolean };

function segment(text: string): Seg[] {
  const Segmenter = (Intl as unknown as { Segmenter?: typeof Intl.Segmenter }).Segmenter;
  if (Segmenter) {
    const seg = new Segmenter(undefined, { granularity: "grapheme" });
    return Array.from(seg.segment(text), (p) => ({ s: p.segment, space: /\s/.test(p.segment) }));
  }
  // Fallback: split into words + spaces (never per-code-unit — would break nikud).
  return text.split(/(\s+)/).filter(Boolean).map((s) => ({ s, space: /^\s+$/.test(s) }));
}

export function LetterMask({
  text,
  as = "span",
  className = "",
  style,
  stagger = DUR.stagger * 0.5,
  delay = 0,
}: {
  text: string;
  as?: "span" | "h1" | "h2" | "h3";
  className?: string;
  style?: CSSProperties;
  stagger?: number; // seconds between letters; default is a tight 0.04
  delay?: number;
}) {
  const ref = useRef<HTMLElement>(null);
  const [phase, setPhase] = useState<"rest" | "enter" | "shown">("rest");

  useIso(() => {
    if (!motionAllowed()) return;
    const el = ref.current;
    if (!el) return;
    setPhase("enter");
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

  const Tag = motion[as];
  const segs = segment(text);
  return (
    <Tag
      ref={ref as never}
      className={className}
      style={{ whiteSpace: "pre-wrap", ...style }}
      initial={false}
      animate={phase === "enter" ? "hidden" : "show"}
      variants={staggerChildren(stagger, delay)}
    >
      {segs.map((seg, i) =>
        seg.space ? (
          <span key={i}>{seg.s}</span>
        ) : (
          <span key={i} className="inline-block overflow-hidden align-bottom">
            <motion.span className="inline-block" variants={maskReveal}>
              {seg.s}
            </motion.span>
          </span>
        ),
      )}
    </Tag>
  );
}
