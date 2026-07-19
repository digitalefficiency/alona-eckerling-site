"use client";

import { createElement, type CSSProperties, type ReactNode } from "react";
import { useReveal } from "@/lib/motion";

// «חוט ואור» move 4: wrap the pivot word/phrase in a .u-rose-draw span — the
// rose rule draws itself under it AFTER the line's reveal (CSS in globals).
// The accent must live inside ONE line (never across a \n). No match → plain.
export function accentLine(line: string, accent?: string): ReactNode {
  if (!accent) return line;
  const at = line.indexOf(accent);
  if (at === -1) return line;
  return [
    line.slice(0, at),
    createElement("span", { key: "accent", className: "u-rose-draw" }, accent),
    line.slice(at + accent.length),
  ];
}

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
  autoplay = false,
  accentText,
}: {
  text: string;
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
  style?: CSSProperties;
  baseDelay?: number; // ms added before the per-line stagger
  lastLineClass?: string; // extra classes for the final line (e.g. accent color)
  /** LCP-safe hero mode: `is-animating` ships in the SERVER html, so the CSS
   *  ink-wipe starts at first style application — no hydration/IO wait. Use
   *  ONLY above the fold: JS re-arming after a visible first paint was
   *  measured pushing LCP by seconds. Reduced-motion gates still force final. */
  autoplay?: boolean;
  /** the section's pivot word — gets the rose self-drawing rule (move 4) */
  accentText?: string;
}) {
  const ref = useReveal<HTMLElement>(autoplay ? {} : { className: "is-animating" });
  const lines = text.split("\n");
  return createElement(
    as,
    {
      ref,
      className: `splittext ${autoplay ? "is-animating " : ""}${className}`,
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
          accentLine(line, accentText),
        ),
      ),
    ),
  );
}
