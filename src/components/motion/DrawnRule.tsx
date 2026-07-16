"use client";

import { useReveal } from "@/lib/motion";

// A single self-drawing rule for her-voice signature moments (the house
// .rule-draw keyframe, same mechanism as SectionSeam/MChapter). The wrapper
// arms via the shared one-shot useReveal observer (attr="data-shown"); the
// inner bar carries .rule-draw and scaleX-draws in from the right (RTL).
// Tokens only: --dur-rule + --ease-signature. Reduced-motion and the
// accessibility stop-motion switch resolve to the static final bar
// (globals.css static twin), so the rule is never missing.
export function DrawnRule({ className = "" }: { className?: string }) {
  const ref = useReveal<HTMLSpanElement>({ attr: "data-shown" });
  return (
    <span ref={ref} aria-hidden className="block">
      <span className={`rule-draw block ${className}`} />
    </span>
  );
}
