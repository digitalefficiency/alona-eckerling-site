"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { motionAllowed } from "@/lib/motion";
import { DUR } from "@/lib/motion-tokens";

// SVG process-diagram line-draw — every stroke draws itself on first view via
// stroke-dasharray/-offset on the drawLine timing (--dur-reveal on --ease-out,
// stepped per stroke by the stagger token). Pure CSS transitions on the motion
// tokens — no motion library — so the global html.a11y-stop-motion transition
// kill (globals.css) snaps it to the final state even mid-flight.
//
// House rule #1 (the Reveal/RevealHeading mechanism): SSR / no-JS /
// prefers-reduced-motion / html.a11y-stop-motion show the FULLY DRAWN diagram
// (final state) — the drawing is the enhancement. When motion is allowed, a
// layout effect measures each stroke and arms it behind its own dash length
// BEFORE first paint (the SNAP arm — no flash), then a one-shot
// IntersectionObserver releases the strokes in DOM order.
//
// Two modes: pass an inline <svg> as children (do NOT pre-dash it — it must
// arrive fully drawn), OR pass `paths` (SVG `d` strings) + `viewBox` and the
// component renders its own currentColor svg (color it via className, e.g.
// "text-gold-ink" on light / "text-gold" on navy).
const useIso = typeof window !== "undefined" ? useLayoutEffect : useEffect;

const GEOMETRY = "path, line, polyline, polygon, circle, ellipse, rect";

export function DiagramReveal({
  children,
  paths,
  viewBox = "0 0 100 100",
  label,
  strokeWidth = 1.5,
  stagger = DUR.stagger,
  className = "",
  svgClassName = "",
}: {
  children?: React.ReactNode; // an inline <svg> — takes precedence over paths
  paths?: readonly string[]; // OR: path `d` strings for the internal svg
  viewBox?: string; // internal svg only — size it to your path coordinates
  label?: string; // a11y name for the internal svg; omit = decorative (aria-hidden)
  strokeWidth?: number; // internal svg only
  stagger?: number; // seconds between strokes; keep 0.06–0.10 (motion voice)
  className?: string;
  svgClassName?: string; // internal svg only
}) {
  const ref = useRef<HTMLDivElement>(null);

  if (process.env.NODE_ENV !== "production") {
    if (children && paths) {
      console.warn("[DiagramReveal] pass an inline <svg> child OR `paths` — ignoring `paths`.");
    }
    if (!children && !paths) {
      console.warn("[DiagramReveal] nothing to draw — pass an inline <svg> child or `paths`.");
    }
    if (stagger < 0.06 || stagger > 0.1) {
      console.warn(
        `[DiagramReveal] stagger ${stagger}s is outside the 0.06–0.10s motion voice — prefer the DUR.stagger token (${DUR.stagger}s).`,
      );
    }
  }

  useIso(() => {
    if (!motionAllowed()) return; // both gates → stay fully drawn
    const root = ref.current;
    if (!root) return;
    const strokes = Array.from(root.querySelectorAll<SVGGeometryElement>(GEOMETRY))
      .map((el) => {
        try {
          return { el, len: el.getTotalLength() };
        } catch {
          return { el, len: 0 };
        }
      })
      .filter((s) => s.len > 0);
    if (strokes.length === 0) return;

    // Arm each stroke behind its own dash BEFORE paint — instant, no flash.
    for (const { el, len } of strokes) {
      el.style.transition = "none";
      el.style.strokeDasharray = `${len}`;
      el.style.strokeDashoffset = `${len}`;
    }

    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        strokes.forEach(({ el }, i) => {
          // drawLine timing via the token vars, stepped per stroke.
          el.style.transitionProperty = "stroke-dashoffset";
          el.style.transitionDuration = "var(--dur-reveal)";
          el.style.transitionTimingFunction = "var(--ease-out)";
          el.style.transitionDelay = `${i * stagger}s`;
          el.style.strokeDashoffset = "0";
        });
        io.disconnect();
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    io.observe(root);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const inner =
    children ??
    (paths ? (
      <svg
        viewBox={viewBox}
        className={svgClassName}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...(label ? { role: "img" as const, "aria-label": label } : { "aria-hidden": true })}
      >
        {paths.map((d, i) => (
          <path key={i} d={d} vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
    ) : null);

  return (
    <div ref={ref} className={className}>
      {inner}
    </div>
  );
}
