"use client";

import { useEffect, useRef } from "react";

// Adds data-hero-enter on mount (next frame) to play the hero entrance timeline,
// only when motion is allowed. Without it the SSR markup is the final state —
// so no-JS and reduced-motion show the finished hero instantly (LCP-safe).
export function HeroEntrance({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current;
    if (!el) return;
    const id = requestAnimationFrame(() => el.setAttribute("data-hero-enter", ""));
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <section ref={ref} className={className}>
      {children}
    </section>
  );
}
