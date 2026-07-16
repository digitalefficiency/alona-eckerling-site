"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { motionAllowed } from "@/lib/motion";

// BorderBeam — a single point of brass light travels the card perimeter ONCE on view, then rests as a static
// gold hairline. The "this is the recommended one" accent for a Comparison / SpotlightCard panel. One per view.
// House rule #1: SSR / no-JS / reduced-motion / a11y = the static hairline border (the beam ::before runs only
// when both gates pass, and only once). RTL/LTR-neutral (perimeter travel is rotational). PROP-DRIVEN.
export function BorderBeam({
  children,
  className = "",
  radius = 14,
}: {
  children: React.ReactNode;
  className?: string;
  radius?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    if (!motionAllowed()) return; // both gates → static border, no beam
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setOn(true); io.disconnect(); }
    }, { rootMargin: "0px 0px -12% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const style: CSSProperties = {
    borderRadius: radius,
    border: "1px solid color-mix(in oklab, var(--color-gold, #C8A45C) 45%, transparent)",
  };
  return (
    <div ref={ref} className={`border-beam${on ? " is-beaming" : ""} ${className}`} style={style}>
      {children}
    </div>
  );
}
