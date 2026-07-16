"use client";

import { createElement, useEffect, useRef, useState, type CSSProperties } from "react";
import { motionAllowed } from "@/lib/motion";
import { DUR } from "@/lib/motion-tokens";

// Typewriter — the line types itself once on first view, a brass caret at the logical end, then rests. Segments
// with Intl.Segmenter (grapheme) so a Hebrew base + nikud type as one unit (never per-code-unit). USE SPARINGLY
// (a hero line / kicker), never on body — like ScrambleIn. House rule #1: the default (SSR / no-JS / reduced-
// motion / a11y) is the FINAL text immediately; typing runs client-side only when both gates pass. The real
// text is the aria-label; the typing layer is aria-hidden. Direction handled by the document/logical flow.
function graphemes(text: string): string[] {
  const Segmenter = (Intl as unknown as { Segmenter?: typeof Intl.Segmenter }).Segmenter;
  if (Segmenter) return Array.from(new Segmenter(undefined, { granularity: "grapheme" }).segment(text), (p) => p.segment);
  return Array.from(text); // fallback (rare) — code points
}

export function Typewriter({
  text,
  as = "span",
  className = "",
  style,
}: {
  text: string;
  as?: "span" | "h1" | "h2" | "h3" | "p";
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(text.length); // SSR + rest = the whole line

  useEffect(() => {
    if (!motionAllowed()) return; // both gates → final text, no typing
    const el = ref.current;
    if (!el) return;
    const gs = graphemes(text);
    let timer: ReturnType<typeof setInterval> | null = null;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      let i = 0;
      setShown(0);
      const step = Math.max(24, Math.round((DUR.reveal * 1000) / gs.length)); // whole line ≈ DUR.reveal
      timer = setInterval(() => {
        i += 1;
        setShown(gs.slice(0, i).join("").length);
        if (i >= gs.length && timer) clearInterval(timer);
      }, step);
    }, { rootMargin: "0px 0px -12% 0px" });
    io.observe(el);
    return () => { io.disconnect(); if (timer) clearInterval(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visible = text.slice(0, shown);
  const typing = shown < text.length;
  return createElement(
    as,
    { ref, className: `typewriter${typing ? " is-typing" : ""} ${className}`, style, "aria-label": text },
    createElement("span", { "aria-hidden": true }, visible),
  );
}
