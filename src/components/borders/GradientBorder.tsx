"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { motionAllowed } from "@/lib/motion";

// GradientBorder — a brass gradient ring around a card. The ring is ALWAYS fully present (padding-box /
// border-box gradient trick); when motion is allowed it slowly pans (globals.css .gb-animated keyframe).
// House rule #1: SSR / no-JS / reduced-motion / a11y = the static ring (the pan class is added on view only
// when BOTH motion gates pass). RTL/LTR-neutral (the gradient angle is direction-agnostic). PROP-DRIVEN.
export function GradientBorder({
  children,
  className = "",
  radius = 12,
  animated = true,
}: {
  children: React.ReactNode;
  className?: string;
  radius?: number;
  animated?: boolean; // opt out of the pan entirely (still a static gradient ring)
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    if (!animated || !motionAllowed()) return; // both gates → static ring
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setOn(true); io.disconnect(); }
    }, { rootMargin: "0px 0px -12% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [animated]);

  const style: CSSProperties = {
    borderRadius: radius,
    border: "1px solid transparent",
    background:
      "linear-gradient(var(--color-card, #fbf9f4), var(--color-card, #fbf9f4)) padding-box, " +
      "linear-gradient(120deg, var(--color-gold, #C8A45C), var(--color-gold-soft, #F3E8CF), var(--color-gold, #C8A45C)) border-box",
    backgroundSize: "100% 100%, 220% 100%",
    backgroundPosition: "0 0, 0 0",
  };
  return (
    <div ref={ref} className={`gradient-border${on ? " gb-animated" : ""} ${className}`} style={style}>
      {children}
    </div>
  );
}
