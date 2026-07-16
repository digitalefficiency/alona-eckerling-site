"use client";

import { createElement, type CSSProperties } from "react";
import { useReveal } from "@/lib/motion";

// Splits Hebrew text into LINES (on \n only — never per-glyph, which would break
// nikud / final-letter shaping) and reveals each line with the signature RTL
// ink-wipe (clip-path from the right). SSR renders the final visible text; the
// "is-animating" class is added only on first view when motion is allowed.
export function SplitText({
  text,
  as = "span",
  className = "",
  style,
  baseDelay = 0,
  lastLineClass = "",
}: {
  text: string;
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
  style?: CSSProperties;
  baseDelay?: number; // ms added before the per-line stagger
  lastLineClass?: string; // extra classes for the final line (e.g. accent color)
}) {
  const ref = useReveal<HTMLElement>({ className: "is-animating" });
  const lines = text.split("\n");
  return createElement(
    as,
    {
      ref,
      className: `splittext ${className}`,
      style: { ["--base" as string]: `${baseDelay}ms`, ...style },
    },
    lines.map((line, i) =>
      createElement(
        "span",
        { key: i, className: "split-line", style: { ["--i" as string]: i } },
        createElement(
          "span",
          {
            className: `split-inner${i === lines.length - 1 && lastLineClass ? ` ${lastLineClass}` : ""}`,
          },
          line,
        ),
      ),
    ),
  );
}
