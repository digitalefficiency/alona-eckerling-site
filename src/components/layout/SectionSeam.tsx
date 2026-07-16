"use client";

import { useReveal } from "@/lib/motion";

// Decorative gold hairline + ◆ that self-draws on scroll-in (uses the shared
// .rule-draw keyframe). Marks the seam between alternating section bands.
export function SectionSeam({ className = "" }: { className?: string }) {
  const ref = useReveal<HTMLDivElement>({ attr: "data-shown" });
  return (
    <div
      ref={ref}
      aria-hidden
      className={`flex items-center justify-center gap-3 ${className}`}
    >
      <span className="rule-draw h-px w-16 bg-gold/45" />
      <span className="text-[0.5rem] leading-none text-gold">◆</span>
      <span className="rule-draw h-px w-16 bg-gold/45" />
    </div>
  );
}
