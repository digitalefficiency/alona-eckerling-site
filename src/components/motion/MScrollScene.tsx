"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { useMotionAllowed } from "@/lib/motion";

// Scroll-LINKED narrative scene — NOT pinned (the one-pinned-scene-per-site
// rule stays with the cinema hero; this wrapper never hijacks the scroll).
// As the section crosses the viewport, the `media` slot (a full-bleed layer
// behind the content) drifts vertically and optionally zooms — quiet,
// MParallax-capped — while `children` render as normal static flow above it.
//
// House rule #1 (the Reveal/MParallax mechanism): SSR / no-JS /
// prefers-reduced-motion / html.a11y-stop-motion render media + children
// perfectly STATIC (no transform, no bleed scale) — the scroll link is a
// mount-time enhancement only. The compensating scale (1 + 2×amp) is applied
// only while active so the drifting layer never exposes frame edges. Coarse
// pointers keep the effect (it is scroll-driven, not cursor-driven).
const MAX_AMPLITUDE = 8; // percent — MParallax's quiet-parallax cap
const MAX_ZOOM = 4; // percent — the extra scale-drift cap (subtle, never a Ken Burns)

export function MScrollScene({
  children,
  media,
  amplitude = 5,
  zoom = 0,
  className = "",
  mediaClassName = "",
  contentClassName = "",
}: {
  children: React.ReactNode; // normal flow content — never transformed
  media: React.ReactNode; // the layer that drifts (e.g. next/image fill + object-cover)
  amplitude?: number; // translateY drift, % of the scene height — capped ±8
  zoom?: number; // extra scale drift across the crossing, % — capped 4
  className?: string; // the scene frame — sizing/padding/tone live here
  mediaClassName?: string; // extras for the clipping media layer (e.g. opacity)
  contentClassName?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const allowed = useMotionAllowed();

  if (process.env.NODE_ENV !== "production") {
    if (Math.abs(amplitude) > MAX_AMPLITUDE) {
      console.warn(
        `[MScrollScene] amplitude ${amplitude}% exceeds the ±${MAX_AMPLITUDE}% quiet-parallax cap (references/design-system.md) — clamping.`,
      );
    }
    if (Math.abs(zoom) > MAX_ZOOM) {
      console.warn(
        `[MScrollScene] zoom ${zoom}% exceeds the ${MAX_ZOOM}% scale-drift cap — clamping.`,
      );
    }
  }
  const amp = Math.min(Math.abs(amplitude), MAX_AMPLITUDE);
  const z = Math.min(Math.abs(zoom), MAX_ZOOM);
  const bleed = 1 + (2 * amp) / 100; // covers the y drift so edges never show

  // Hooks run unconditionally; the transforms are only APPLIED when allowed.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [`${amp}%`, `${-amp}%`]);
  const scale = useTransform(scrollYProgress, [0, 1], [bleed, bleed + z / 100]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <div className={`absolute inset-0 overflow-hidden ${mediaClassName}`}>
        {/* `relative` is REQUIRED, not cosmetic: the documented `media` slot is a
            next/image with `fill`, which positions against its nearest positioned
            ancestor. This div was static, so Next warned and the image resolved
            against the outer absolute layer instead — and under reduced-motion
            there is no transform here either, so not even a transform-induced
            containing block saved it. One word, and the drift layer actually
            clips its own image. */}
        <motion.div
          className={`relative h-full w-full ${allowed ? "will-change-transform" : ""}`}
          style={allowed ? { y, scale } : undefined}
        >
          {media}
        </motion.div>
      </div>
      <div className={`relative ${contentClassName}`}>{children}</div>
    </div>
  );
}
