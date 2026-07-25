"use client";

import { useReveal } from "@/lib/motion";

// Band-to-band HAND-OFF — a thin decorative seam between tone sections that
// replaces the hard band cut: two gold hairlines draw in (the shared
// rule-draw keyframe, second line stepped by --i), meeting at a ◆ and an
// optional chapter label. The labeled, chaptered sibling of SectionSeam —
// use it when the transition marks a narrative beat ("the process", "the
// team"), keep SectionSeam for quiet unlabeled seams. Place between two
// <Section> bands (or at the top of the incoming band); `tone="dark"` keeps
// the label AA on navy.
//
// House rule #1: SSR / no-JS render the fully drawn seam (the animation only
// starts once JS sets data-shown); prefers-reduced-motion +
// html.a11y-stop-motion resolve rule-draw to the final static state via the
// globals.css gates — useReveal still sets the attr so nothing stays hidden.
export function MChapter({
  label,
  tone = "light",
  className = "",
}: {
  label?: string; // optional chapter kicker (intake copy — never invented)
  tone?: "light" | "dark"; // label color: light bands (white/sand) vs navy
  className?: string;
}) {
  const ref = useReveal<HTMLDivElement>({ attr: "data-shown" });
  return (
    <div
      ref={ref}
      aria-hidden={label ? undefined : true}
      className={`flex items-center justify-center gap-3 ${className}`}
    >
      <span aria-hidden className="rule-draw h-px w-16 bg-gold/45 sm:w-24" />
      <span aria-hidden className="text-[0.5rem] leading-none text-gold">
        ◆
      </span>
      {label && (
        <span
          className={`text-[0.7rem] font-bold tracking-eyebrow ${
            tone === "dark" ? "text-white/70" : "text-muted"
          }`}
        >
          {label}
        </span>
      )}
      {label && (
        <span aria-hidden className="text-[0.5rem] leading-none text-gold">
          ◆
        </span>
      )}
      <span
        aria-hidden
        className="rule-draw h-px w-16 bg-gold/45 sm:w-24"
        style={{ ["--i" as string]: 1 }}
      />
    </div>
  );
}
