"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { useMotionAllowed } from "@/lib/motion";

// Pinned HORIZONTAL scroll — the track translates sideways as you scroll down the tall pinning
// container (scroll-craft.md §D). `rtl` flows the track right→left for Hebrew. ONE per site
// (the pinned-scene budget).
//
// NO WASTED SCROLL, BY CONSTRUCTION (scroll-craft.md §D "no-waste mechanic"): the travel is MEASURED
// (track.scrollWidth − viewport width), the pin height is DERIVED (100vh + travel), and x translates
// exactly that measured distance — so d(x)/d(scroll) is a nonzero constant everywhere and no scroll is
// dead. A panels-count percentage guess (the old `-(panels-1)*100%`) over/under-translated whenever the
// panels weren't ~full-width — the drain/overshoot bug. `panels` now only seeds the pre-measure height.
//
// House rule #1 + WCAG single-direction: SSR / no-JS / prefers-reduced-motion / a11y-stop-motion /
// (and small screens, via the caller) render a normal VERTICAL STACK — the user is NEVER trapped
// in horizontal-only scroll; the full content is reachable by ordinary vertical scrolling.
export function HorizontalPin({
  children,
  panels = 3,
  rtl = false,
  className = "",
}: {
  children: React.ReactNode; // the horizontal track — a flex row of panels
  panels?: number; // pre-measure height estimate only (real travel is measured)
  rtl?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null); // tall pinning container (useScroll target)
  const viewportRef = useRef<HTMLDivElement>(null); // the sticky overflow-hidden viewport
  const trackRef = useRef<HTMLDivElement>(null); // the flex track
  const [travel, setTravel] = useState(0); // MEASURED px the track must move to reveal all panels
  const allowed = useMotionAllowed();

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  // px, not %: exactly the measured travel → pin height (100vh + travel) makes progress 0→1 span
  // `travel` px of scroll, so the track moves 1px per scrolled px — a constant, dead-region-free.
  const x = useTransform(scrollYProgress, [0, 1], [0, rtl ? travel : -travel]);

  useEffect(() => {
    if (!allowed) return;
    const measure = () => {
      const track = trackRef.current, vp = viewportRef.current;
      if (track && vp) setTravel(Math.max(0, track.scrollWidth - vp.clientWidth));
    };
    const raf = requestAnimationFrame(measure); // after layout/fonts settle
    const ro = new ResizeObserver(measure);
    if (trackRef.current) ro.observe(trackRef.current);
    window.addEventListener("resize", measure);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); window.removeEventListener("resize", measure); };
  }, [allowed]);

  // reduced-motion / SSR: a plain vertical stack (WCAG single-direction)
  if (!allowed) {
    return <div className={`flex flex-col gap-12 ${className}`}>{children}</div>;
  }

  return (
    <div ref={ref} style={{ height: travel > 0 ? `calc(100vh + ${travel}px)` : `${Math.max(panels, 1) * 100}vh` }} className={`relative ${className}`}>
      <div ref={viewportRef} className="sticky top-0 flex h-screen items-center overflow-hidden">
        <motion.div ref={trackRef} className="flex will-change-transform" style={{ x }}>
          {children}
        </motion.div>
      </div>
    </div>
  );
}
