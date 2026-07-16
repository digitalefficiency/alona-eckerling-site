"use client";

// SequenceFilm — a pinned, scroll-scrubbed keyframe film (generic, prop-driven).
// The scroll IS the edit timeline: N frames crossfade across progress ∈ [0,1],
// floating "thought chips" accumulate then resolve, and sparse station captions
// punctuate the beats. Built for the home-only signature moment (one per site).
//
// Two layers, never one: the static fallback (final frame + prose) is ALWAYS in
// the DOM and SSR-rendered; the cinema layer mounts only when motion is allowed
// (prefers-reduced-motion / a11y-stop-motion / no-JS all get the static twin).
// Copy arrives via props from COPY.md — this file contains NO copy of its own.

import { useEffect, useRef, useState } from "react";
import { useScroll, useMotionValueEvent } from "motion/react";
import { useMotionAllowed } from "@/lib/motion";

export type FilmChip = {
  text: string;
  /** progress window [from, to] in which the chip is visible */
  from: number;
  to: number;
  /** absolute positioning, e.g. { top: "20%", right: "12%" } (RTL-aware caller) */
  position: React.CSSProperties;
  /** subtle rotation, e.g. -2 */
  tilt?: number;
};

export type FilmCaption = {
  big: string;
  small?: string;
  /** "turn" tints the big line with the accent (the pivot beat) */
  tone?: "default" | "turn";
  from: number;
  to: number;
};

export type SequenceFilmProps = {
  /** frame image srcs, scroll order; ~12-16 for a smooth build */
  frames: readonly string[];
  /** alt for the final (and static-fallback) frame — the only meaning-bearing image */
  finalAlt: string;
  kicker?: string;
  chips?: readonly FilmChip[];
  captions?: readonly FilmCaption[];
  /** total scroll length, in viewport-heights (default 55vh per frame, min 400) */
  lengthVh?: number;
  /** static twin: heading + body shown to reduced-motion / no-JS readers */
  staticHeading: string;
  staticBody: string;
  staticKicker?: string;
  /** hold the first frame until this progress (breath on the opening) */
  holdStart?: number;
  /** land on the last frame at this progress (hold through the resolution) */
  holdEnd?: number;
};

export function SequenceFilm({
  frames,
  finalAlt,
  kicker,
  chips = [],
  captions = [],
  lengthVh,
  staticHeading,
  staticBody,
  staticKicker,
  holdStart = 0.08,
  holdEnd = 0.82,
}: SequenceFilmProps) {
  const motionAllowed = useMotionAllowed();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const cinema = mounted && motionAllowed && frames.length > 1;

  const sectionRef = useRef<HTMLElement | null>(null);
  const frameRefs = useRef<(HTMLImageElement | null)[]>([]);
  const overlayRefs = useRef<(HTMLDivElement | null)[]>([]);
  const barRef = useRef<HTMLDivElement | null>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // Imperative per-frame opacity on scroll (no per-frame React renders).
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    if (!cinema) return;
    const span =
      Math.max(0, Math.min((p - holdStart) / (holdEnd - holdStart), 1)) *
      (frames.length - 1);
    const i = Math.min(Math.floor(span), frames.length - 1);
    const f = span - i;
    frameRefs.current.forEach((img, k) => {
      if (!img) return;
      img.style.opacity = k === i ? "1" : k === i + 1 ? String(f) : "0";
    });
    overlayRefs.current.forEach((el) => {
      if (!el) return;
      const from = Number(el.dataset.from);
      const to = Number(el.dataset.to);
      const on = p >= from && p <= to;
      el.style.opacity = on ? "1" : "0";
      el.style.transform = on
        ? `translateY(0) rotate(${el.dataset.tilt || 0}deg)`
        : `translateY(12px) rotate(${el.dataset.tilt || 0}deg)`;
    });
    if (barRef.current) barRef.current.style.width = `${(p * 100).toFixed(1)}%`;
  });

  const height = lengthVh ?? Math.max(400, frames.length * 55);
  const lastFrame = frames[frames.length - 1];

  return (
    <section
      ref={sectionRef}
      className="relative bg-sand"
      style={cinema ? { height: `${height}vh` } : undefined}
      aria-label={staticHeading}
    >
      {/* ── Layer B — the cinema (mounts only when motion is allowed) ── */}
      {cinema && (
        <div className="sticky top-0 h-screen overflow-hidden" aria-hidden="true">
          {frames.map((src, k) => (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              key={src}
              ref={(el) => {
                frameRefs.current[k] = el;
              }}
              src={src}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              style={{ opacity: k === 0 ? 1 : 0, willChange: "opacity" }}
              loading={k < 3 ? "eager" : "lazy"}
            />
          ))}
          {/* soft veil for caption legibility */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(34,48,76,.16) 0%, rgba(34,48,76,0) 30%, rgba(34,48,76,0) 55%, var(--color-bg) 130%)",
            }}
          />
          {/* progress hairline */}
          <div className="absolute top-0 inset-x-0 h-[3px] bg-line/60">
            <div ref={barRef} className="h-full w-0 bg-gold" />
          </div>
          {kicker && (
            <div
              ref={(el) => {
                if (el) overlayRefs.current[overlayRefs.current.length] = el;
              }}
              data-from="0"
              data-to="0.97"
              className="absolute top-8 inset-x-0 text-center text-[13px] font-semibold tracking-[0.12em] text-card"
              style={{
                opacity: 0,
                textShadow: "0 1px 8px rgba(34,48,76,.35)",
                transition:
                  "opacity var(--dur-reveal) var(--ease-out), transform var(--dur-reveal) var(--ease-out)",
              }}
            >
              {kicker}
            </div>
          )}
          {chips.map((c) => (
            <div
              key={c.text}
              ref={(el) => {
                if (el) overlayRefs.current[overlayRefs.current.length] = el;
              }}
              data-from={c.from}
              data-to={c.to}
              data-tilt={c.tilt ?? 0}
              className="absolute whitespace-nowrap rounded-full border border-line bg-bg/85 px-5 py-2.5 font-serif italic text-ink shadow-sm"
              style={{
                ...c.position,
                fontSize: "clamp(15px, 1.9vw, 21px)",
                opacity: 0,
                transform: `translateY(12px) rotate(${c.tilt ?? 0}deg)`,
                transition:
                  "opacity var(--dur-reveal) var(--ease-out), transform var(--dur-reveal) var(--ease-out)",
              }}
            >
              {c.text}
            </div>
          ))}
          {captions.map((cap) => (
            <div
              key={cap.big}
              ref={(el) => {
                if (el) overlayRefs.current[overlayRefs.current.length] = el;
              }}
              data-from={cap.from}
              data-to={cap.to}
              className="absolute bottom-[9vh] inset-x-0 px-6 text-center pointer-events-none"
              style={{
                opacity: 0,
                transform: "translateY(14px)",
                transition:
                  "opacity var(--dur-reveal) var(--ease-out), transform var(--dur-reveal) var(--ease-out)",
              }}
            >
              <div
                className={`mx-auto max-w-[24ch] font-serif font-medium leading-[1.3] ${
                  cap.tone === "turn" ? "text-gold-ink" : "text-ink"
                }`}
                style={{
                  fontSize: "clamp(1.6rem, 3.4vw, 2.7rem)",
                  textShadow: "0 1px 14px rgba(251,246,241,.8)",
                }}
              >
                {cap.big}
              </div>
              {cap.small && (
                <div
                  className="mt-3 text-muted"
                  style={{ fontSize: "clamp(1rem, 1.8vw, 1.2rem)" }}
                >
                  {cap.small}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Layer A — the static twin (SSR, crawlable, no-JS, reduced-motion) ── */}
      <div className={cinema ? "sr-only" : "py-24"}>
        <div className="mx-auto max-w-[760px] px-7 text-center">
          {staticKicker && (
            <div className="mb-3 text-[13px] font-semibold tracking-[0.12em] text-gold-ink">
              {staticKicker}
            </div>
          )}
          <h2 className="font-serif text-3xl md:text-4xl font-medium text-ink">
            {staticHeading}
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-muted">{staticBody}</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lastFrame}
            alt={finalAlt}
            className="mx-auto mt-9 w-full max-w-[820px] rounded-card"
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
}
