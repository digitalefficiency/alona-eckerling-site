"use client";

import {
  createElement,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { onFirstInView } from "@/lib/motion";
import { accentLine } from "@/components/motion/SplitText";

// Masked line reveal — the PREMIUM sibling of Reveal (which stays the generic
// fade-up). Splits text into LINES on \n only (never per-glyph — preserves
// Hebrew nikud + final-letter shaping), wraps each line in an overflow-hidden
// mask (.rh-line) and slides the inner up translateY(110%) → 0 with a
// 60–100ms per-line stagger. Pure CSS transitions on the motion tokens
// (--dur-reveal / --ease-out / --dur-stagger, src/lib/motion-tokens.ts) —
// no motion library. Block-axis motion + logical properties = RTL/LTR-safe.
//
// House rule #1: the DEFAULT (SSR / no-JS / prefers-reduced-motion /
// html.a11y-stop-motion) renders the FINAL visible headline. When motion is
// allowed, a layout effect arms the masked state BEFORE first paint (no
// visible→hidden flash), then a one-shot IntersectionObserver reveals it.
// CSS in globals.css additionally forces the final state the moment either
// gate turns on mid-flight.
const useIso = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function RevealHeading({
  text,
  as = "h2",
  className = "",
  style,
  baseDelay = 0,
  stagger,
  lastLineClass = "",
  autoplay = false,
  accentText,
}: {
  text: string; // split on \n — one mask per line
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
  style?: CSSProperties;
  baseDelay?: number; // ms before the first line starts
  stagger?: number; // ms between lines; default = --dur-stagger token (80ms). Keep 60–100.
  lastLineClass?: string; // extra classes for the final line (e.g. accent color)
  /** LCP-safe hero mode: the SAME masked rise as a pure-CSS animation that
   *  starts at first paint — no hydration/IO wait. Use ONLY on above-the-fold
   *  headlines: JS arming was measured pushing LCP by seconds (Lighthouse
   *  element render-delay). Reduced-motion/a11y gates still force final. */
  autoplay?: boolean;
  /** the section's pivot word — gets the rose self-drawing rule (move 4) */
  accentText?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  // "rest" = final visible (default). "enter" = masked pre-paint. "shown" = revealing.
  const [phase, setPhase] = useState<"rest" | "enter" | "shown">("rest");

  if (
    process.env.NODE_ENV !== "production" &&
    stagger !== undefined &&
    (stagger < 60 || stagger > 100)
  ) {
    console.warn(
      `[RevealHeading] stagger ${stagger}ms is outside the 60–100ms motion voice — prefer the default token (80ms).`,
    );
  }

  useIso(() => {
    if (autoplay) return; // CSS animation drives the reveal — no arming at all
    // Both motion gates render the final state: OS preference + a11y menu toggle.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (document.documentElement.classList.contains("a11y-stop-motion")) return;
    const el = ref.current;
    if (!el) return;
    setPhase("enter"); // mask before the browser paints — no flash
    // onFirstInView = IO + geometry-poll failsafe (IO delivery can starve).
    return onFirstInView(el, () => setPhase("shown"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lines = text.split("\n");
  const phaseClass = autoplay
    ? "rh-autoplay"
    : phase === "enter" ? "is-masked" : phase === "shown" ? "is-revealing" : "";
  return createElement(
    as,
    {
      ref,
      className: ["reveal-heading", phaseClass, className].filter(Boolean).join(" "),
      style: {
        ["--rh-base" as string]: `${baseDelay}ms`,
        ...(stagger !== undefined ? { ["--rh-stagger" as string]: `${stagger}ms` } : null),
        ...style,
      },
    },
    lines.map((line, i) =>
      createElement(
        "span",
        { key: i, className: "rh-line", style: { ["--i" as string]: i } },
        createElement(
          "span",
          {
            className: `rh-inner${
              i === lines.length - 1 && lastLineClass ? ` ${lastLineClass}` : ""
            }`,
          },
          accentLine(line, accentText),
        ),
      ),
    ),
  );
}
