"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

// Subtle fade-up on first view. Follows the project's opt-in rule: the DEFAULT
// (SSR / no-JS / reduced-motion) renders the FINISHED, visible design — so
// content is never hidden without JS and the LCP element paints immediately.
// When JS + motion are available, a layout effect arms the "from" state BEFORE
// the first paint (no flash), then an IntersectionObserver animates it in.
const useIso = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function Reveal({
  children,
  className = "",
  delay = 0,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "li" | "section";
}) {
  const ref = useRef<HTMLDivElement>(null);
  // "rest" = final visible (default). "enter" = armed hidden, pre-paint. "shown" = animated in.
  const [phase, setPhase] = useState<"rest" | "enter" | "shown">("rest");

  useIso(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return; // stay visible
    const el = ref.current;
    if (!el) return;
    setPhase("enter"); // hide before the browser paints — no flash from visible→hidden
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setPhase("shown");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const hidden = phase === "enter";
  return (
    <Tag
      ref={ref as never}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-[var(--ease-out)] ${
        hidden ? "translate-y-6 opacity-0" : "translate-y-0 opacity-100"
      } ${className}`}
    >
      {children}
    </Tag>
  );
}
