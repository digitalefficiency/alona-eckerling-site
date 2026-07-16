"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

// "תכנית מול מציאות" — the appraiser's core act made tactile: drag the gold
// divider to wipe between the architectural plan and the built reality.
// --split is written DIRECTLY to the DOM on pointermove (no motion-value
// binding). RTL: plan sits on the RIGHT (reading start), built on the LEFT.
// Fully keyboard-operable (role=slider). YMYL: illustrative, not a valuation.
// NEUTRAL TEMPLATE: planSrc/builtSrc are REQUIRED — no default demo media. Compose
// them per client from generated/client assets (/media/generated/… or /media/client/…).
export function JuxtaposeSlider({
  planSrc,
  builtSrc,
  planLabel = "תכנית",
  builtLabel = "מציאות",
}: {
  planSrc: string;
  builtSrc: string;
  planLabel?: string;
  builtLabel?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [split, setSplit] = useState(50);

  // One-shot idle "breathe" on first view to invite dragging (visual only —
  // aria-valuenow/state stay at 50). Gated: fine pointer + not reduced-motion.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      window.matchMedia("(pointer: coarse)").matches
    )
      return;
    let done = false;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting || done) return;
        done = true;
        io.disconnect();
        const dur = 900;
        let t0 = 0;
        const tick = (t: number) => {
          if (!t0) t0 = t;
          const p = Math.min((t - t0) / dur, 1);
          const wave = Math.sin(p * Math.PI); // 0 → 1 → 0
          el.style.setProperty("--split", `${50 + wave * 9}%`);
          if (p < 1) requestAnimationFrame(tick);
          else el.style.setProperty("--split", "50%");
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const apply = (clientX: number) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const pct = Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100));
    setSplit(pct);
    el.style.setProperty("--split", `${pct}%`);
  };

  const onKey = (e: React.KeyboardEvent) => {
    let next = split;
    if (e.key === "ArrowLeft") next = Math.max(0, split - 2);
    else if (e.key === "ArrowRight") next = Math.min(100, split + 2);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = 100;
    else return;
    e.preventDefault();
    setSplit(next);
    ref.current?.style.setProperty("--split", `${next}%`);
  };

  return (
    <div
      ref={ref}
      role="slider"
      tabIndex={0}
      aria-label="השוואת תכנית אדריכלית מול הבנוי בפועל"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(split)}
      onKeyDown={onKey}
      onPointerDown={(e) => {
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        apply(e.clientX);
      }}
      onPointerMove={(e) => {
        if (e.buttons === 1) apply(e.clientX);
      }}
      className="group relative aspect-[16/10] w-full select-none overflow-hidden rounded-[10px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 sm:aspect-[2/1]"
      style={{ ["--split" as string]: "50%", touchAction: "pan-y" }}
    >
      {/* Base layer: built reality (left side) */}
      <Image src={builtSrc} alt="המגדל הבנוי — מציאות" fill sizes="100vw" className="object-cover" />
      {/* Top layer: the plan, clipped to the RIGHT of the divider */}
      <div className="absolute inset-0" style={{ clipPath: "inset(0 0 0 var(--split))" }}>
        <Image src={planSrc} alt="תכנית אדריכלית של המגדל" fill sizes="100vw" className="object-cover" />
        <div aria-hidden className="absolute inset-0 bg-navy/10" />
      </div>

      {/* Labels */}
      <span className="pointer-events-none absolute right-4 top-4 rounded-[3px] bg-navy/75 px-3 py-1 text-xs font-bold tracking-wide text-gold-soft backdrop-blur">
        {planLabel}
      </span>
      <span className="pointer-events-none absolute left-4 top-4 rounded-[3px] bg-navy/75 px-3 py-1 text-xs font-bold tracking-wide text-white backdrop-blur">
        {builtLabel}
      </span>

      {/* Divider + grip */}
      <div className="pointer-events-none absolute inset-y-0" style={{ left: "var(--split)" }}>
        <div className="absolute inset-y-0 w-px -translate-x-1/2 bg-gold/90 shadow-[0_0_12px_rgba(200,164,92,.5)]" />
        <div className="absolute top-1/2 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-gold/80 bg-navy/80 text-gold backdrop-blur transition group-hover:scale-110">
          <span className="text-[0.7rem] leading-none" aria-hidden>◆</span>
        </div>
      </div>

      {/* corner ticks */}
      <span className="tick tick-1" aria-hidden />
      <span className="tick tick-2" aria-hidden />
      <span className="tick tick-3" aria-hidden />
      <span className="tick tick-4" aria-hidden />
    </div>
  );
}
