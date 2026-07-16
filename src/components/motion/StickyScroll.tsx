"use client";

import { useEffect, useRef, useState } from "react";
import { useMotionAllowed } from "@/lib/motion";

// The "ladder" — a sticky media column swaps its media as the other column scrolls through
// the steps (scroll-craft.md §B). IntersectionObserver-driven (NO scroll listeners). RTL:
// `mediaSide="start"` keeps the media on the caption-opposite side.
//
// House rule #1: SSR / no-JS / prefers-reduced-motion / html.a11y-stop-motion render a plain
// VERTICAL STACK — every step with its media inline, the full story static (no sticky, no swap).
export function StickyScroll({
  steps,
  mediaSide = "start",
  className = "",
}: {
  steps: { media: React.ReactNode; content: React.ReactNode }[];
  mediaSide?: "start" | "end";
  className?: string;
}) {
  const allowed = useMotionAllowed();
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!allowed) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const i = Number((e.target as HTMLElement).dataset.step);
            if (!Number.isNaN(i)) setActive(i);
          }
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    for (const el of refs.current) if (el) io.observe(el);
    return () => io.disconnect();
  }, [allowed]);

  // reduced-motion / SSR: the full vertical stack, every media inline
  if (!allowed) {
    return (
      <div className={className}>
        {steps.map((s, i) => (
          <div key={i} className="mb-16 grid items-center gap-8 md:grid-cols-2">
            <div className={mediaSide === "end" ? "md:order-2" : ""}>{s.media}</div>
            <div>{s.content}</div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid gap-8 md:grid-cols-2 ${className}`}>
      <div className={`hidden md:block ${mediaSide === "end" ? "md:order-2" : ""}`}>
        <div className="sticky top-24">
          {steps.map((s, i) => (
            <div
              key={i}
              aria-hidden={i !== active}
              className="transition-opacity duration-500"
              style={
                i === 0
                  ? { opacity: i === active ? 1 : 0, position: "relative" }
                  : { opacity: i === active ? 1 : 0, position: "absolute", inset: 0 }
              }
            >
              {s.media}
            </div>
          ))}
        </div>
      </div>
      <div>
        {steps.map((s, i) => (
          <div
            key={i}
            data-step={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            className="flex min-h-[70vh] flex-col justify-center"
          >
            <div className="mb-6 md:hidden">{s.media}</div>
            {s.content}
          </div>
        ))}
      </div>
    </div>
  );
}
