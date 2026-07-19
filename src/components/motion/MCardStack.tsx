"use client";

// MCardStack — a pinned, scroll-scrubbed CARD DECK: each scroll segment slides
// the next card in from the side and lands it ON TOP of the previous one, so at
// any moment only the topmost card reads. The covered card settles back a
// touch (scale + lift) so the deck has physical depth without ever competing.
//
// House rule #1: SSR / no-JS / prefers-reduced-motion / a11y-stop-motion render
// the staticFallback — the SAME content as a fully visible vertical layout — so
// nothing is ever hidden without JS and crawlers read every word. When motion
// is allowed the deck mounts for md+ only; below md the staticFallback always
// renders (a pinned deck is a desktop gesture).
//
// Scroll-craft budget: this is a PINNED moment — one per page, like the home
// film. The scrub maps progress directly to transforms (no durations), and the
// progress diamonds are the house rotate-45 markers.
//
// RTL: cards enter from the inline-END edge (physical left in rtl) — the
// "next page" direction — via a physical sign derived from `dir`.

import { useRef, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
  type MotionValue,
} from "motion/react";
import { useMotionAllowed } from "@/lib/motion";

function DeckCard({
  i,
  n,
  progress,
  enterSign,
  children,
}: {
  i: number;
  n: number;
  progress: MotionValue<number>;
  enterSign: 1 | -1;
  children: React.ReactNode;
}) {
  const seg = 1 / Math.max(1, n - 1);
  // entrance window: card i travels in during segment i-1 (card 0 is pre-dealt)
  const enterStart = (i - 1) * seg;
  const enterEnd = enterStart + seg * 0.72;
  // covered window: when card i+1 travels, this card settles back under it
  const coverStart = i * seg;
  const coverEnd = coverStart + seg * 0.72;

  const first = i === 0;
  const last = i === n - 1;

  const x = useTransform(
    progress,
    first ? [0, 1] : [enterStart, enterEnd],
    first ? ["0%", "0%"] : [`${enterSign * 108}%`, "0%"],
  );
  const rotate = useTransform(
    progress,
    first ? [0, 1] : [enterStart, enterEnd],
    first ? [0, 0] : [enterSign * 2.5, 0],
  );
  const scale = useTransform(
    progress,
    last ? [0, 1] : [coverStart, coverEnd],
    last ? [1, 1] : [1, 0.955],
  );
  const y = useTransform(
    progress,
    last ? [0, 1] : [coverStart, coverEnd],
    last ? ["0%", "0%"] : ["0%", "-3%"],
  );

  return (
    <motion.div
      className="absolute inset-0 will-change-transform"
      style={{ x, y, rotate, scale, zIndex: i + 1 }}
    >
      {children}
    </motion.div>
  );
}

export function MCardStack({
  cards,
  staticFallback,
  dir = "rtl",
  ariaLabel,
  className = "",
}: {
  /** fully-styled card faces, deal order; the deck supplies position + motion */
  cards: readonly React.ReactNode[];
  /** the always-valid vertical layout (SSR / no-JS / reduced-motion / mobile) */
  staticFallback: React.ReactNode;
  dir?: "rtl" | "ltr";
  ariaLabel?: string;
  className?: string;
}) {
  const allowed = useMotionAllowed();
  const n = cards.length;
  // cards arrive from the inline-end edge (the "next" direction): physical
  // left in rtl → negative X; physical right in ltr → positive X.
  const enterSign: 1 | -1 = dir === "rtl" ? -1 : 1;

  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // progress diamonds: which card is on top right now (state flips are rare —
  // once per landed card — so this stays cheap)
  const [active, setActive] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    const seg = 1 / Math.max(1, n - 1);
    const a = Math.max(0, Math.min(n - 1, Math.floor(p / seg + 0.35)));
    if (a !== active) setActive(a);
  });

  // useMotionAllowed starts false (SSR twin) and flips on mount when motion is
  // truly allowed — so the server render and no-JS are ALWAYS the fallback.
  if (!allowed || n < 2) {
    return <div className={className}>{staticFallback}</div>;
  }

  return (
    <div className={className}>
      {/* ── the deck (md+ only: a pinned deck is a desktop gesture) ── */}
      <div
        ref={sectionRef}
        className="relative hidden md:block"
        style={{ height: `${100 + (n - 1) * 85}vh` }}
        role="group"
        aria-label={ariaLabel}
      >
        {/* overflow-hidden on the sticky viewport: an entering card lives
            off-screen without ever minting a horizontal scrollbar */}
        <div className="sticky top-0 flex h-screen flex-col items-center justify-center overflow-hidden">
          <div className="relative h-[min(66vh,560px)] w-full max-w-[880px] px-6">
            {cards.map((card, i) => (
              <DeckCard key={i} i={i} n={n} progress={scrollYProgress} enterSign={enterSign}>
                {card}
              </DeckCard>
            ))}
          </div>
          {/* progress beads — the house diamond markers; the landed card fills */}
          <div className="mt-10 flex items-center gap-4" aria-hidden>
            {cards.map((_, i) => (
              <span
                key={i}
                className={`h-2.5 w-2.5 rotate-45 border transition-colors duration-[var(--dur-micro)] ease-[var(--ease-out)] ${
                  i <= active ? "border-gold bg-gold/70" : "border-gold/50 bg-transparent"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
      {/* ── below md: the vertical layout, always ── */}
      <div className="md:hidden">{staticFallback}</div>
    </div>
  );
}
