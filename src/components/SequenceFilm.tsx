"use client";

// SequenceFilm — a pinned, scroll-scrubbed keyframe film (generic, prop-driven).
// The scroll IS the edit timeline: N frames crossfade across progress ∈ [0,1],
// floating "thought chips" accumulate then resolve, and sparse station captions
// punctuate the beats. Built for the home-only signature moment (one per site).
//
// Two layers, never one: the static fallback (final frame + prose) is ALWAYS in
// the DOM and SSR-rendered; the cinema layer mounts only when motion is allowed
// (prefers-reduced-motion / a11y-stop-motion / no-JS all get the static twin).
// The static twin also serves as the POSTER: it stays visible until the opening
// frame is decoded, so the film never opens on a blank stage.
// Copy arrives via props from COPY.md — this file contains NO copy of its own.
//
// GPU discipline: frames are eager-loaded (they ARE the moment) but only the
// active crossfade pair is promoted (will-change) — set/unset imperatively in
// the scroll handler and released entirely when the section leaves the viewport,
// so 14+ full-viewport composited layers never coexist.

import Image from "next/image";
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
  /** "turn" marks the pivot beat — rendered with a sage accent bar over the big line */
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
  /** total scroll length, in viewport-heights (default 30vh per frame, min 400) */
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
  holdEnd = 0.78,
}: SequenceFilmProps) {
  const motionAllowed = useMotionAllowed();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Load gate: the cinema arms only AFTER the window load event (+ idle tick).
  // Mounting at hydration put all N full-bleed frames on top of the sticky
  // stage just below the fold, where native lazy-loading fetches every one of
  // them immediately — ~1.4MB competing with the hero LCP on the critical
  // window (measured: the frames were 75% of all first-load image bytes; a
  // nearness IO can't help because the film IS within one viewport of the
  // hero). Post-load the same fetch storm is free: the reader is still in the
  // hero while the frames trickle in, and the static twin covers until then.
  const [near, setNear] = useState(false);
  useEffect(() => {
    if (!mounted || !motionAllowed || near) return;
    let timer = 0;
    const arm = () => {
      timer = window.setTimeout(() => setNear(true), 300);
    };
    if (document.readyState === "complete") arm();
    else window.addEventListener("load", arm, { once: true });
    return () => {
      window.removeEventListener("load", arm);
      clearTimeout(timer);
    };
  }, [mounted, motionAllowed, near]);

  // Poster gate: decode the opening frame BEFORE the cinema mounts. Until then
  // the static twin stays visible, so the signature moment never flashes blank.
  const [posterDone, setPosterDone] = useState(false);
  useEffect(() => {
    if (!mounted || !motionAllowed || !near || frames.length < 2 || posterDone) return;
    let cancelled = false;
    const arm = () => {
      if (!cancelled) setPosterDone(true);
    };
    const img = new window.Image();
    img.src = frames[0];
    if (typeof img.decode === "function") img.decode().then(arm, arm);
    else {
      img.onload = arm;
      img.onerror = arm;
    }
    return () => {
      cancelled = true;
    };
  }, [mounted, motionAllowed, near, frames, posterDone]);

  const cinema = mounted && motionAllowed && frames.length > 1 && posterDone;

  const sectionRef = useRef<HTMLElement | null>(null);
  const frameRefs = useRef<(HTMLImageElement | null)[]>([]);
  const overlayRefs = useRef<HTMLDivElement[]>([]);
  const barRef = useRef<HTMLDivElement | null>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // Imperative per-frame opacity on scroll (no per-frame React renders).
  // will-change lives ONLY on the active crossfade pair — every other frame
  // stays unpromoted so raster memory never holds N full-viewport layers.
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    if (!cinema) return;
    const span =
      Math.max(0, Math.min((p - holdStart) / (holdEnd - holdStart), 1)) *
      (frames.length - 1);
    const i = Math.min(Math.floor(span), frames.length - 1);
    const f = span - i;
    // DECODE GUARD — all 14 frames share one sticky stage, so they cross the
    // lazy-load threshold together and land as a burst. On a slow connection the
    // scrub can reach frame 9 before frame 9 has arrived, and writing
    // `opacity: 1` onto an empty <img> shows bare bg-sand: a blank stage in the
    // middle of the site's one signature moment. So resolve the target down to
    // the newest frame that HAS decoded. The film then holds on the last real
    // image and catches up as bytes land, instead of flashing empty.
    const ready = (k: number) => {
      const img = frameRefs.current[k];
      return !!img && img.complete && img.naturalWidth > 0;
    };
    let shown = i;
    while (shown > 0 && !ready(shown)) shown--;
    // Only cross-fade into the next frame once it is genuinely paintable.
    const blend = shown === i && ready(i + 1) ? f : 0;

    frameRefs.current.forEach((img, k) => {
      if (!img) return;
      img.style.opacity = k === shown ? String(1 - blend) : k === shown + 1 ? String(blend) : "0";
      const wc = k === shown || k === shown + 1 ? "opacity" : "auto";
      if (img.style.willChange !== wc) img.style.willChange = wc;
    });
    overlayRefs.current.forEach((el) => {
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

  // Release ALL promoted layers when the film leaves the viewport — the GPU
  // owes the rest of the page (credentials, proof, lead form) its memory back.
  useEffect(() => {
    if (!cinema) return;
    const section = sectionRef.current;
    if (!section) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry && !entry.isIntersecting) {
        frameRefs.current.forEach((img) => {
          if (img && img.style.willChange !== "auto")
            img.style.willChange = "auto";
        });
      }
    });
    io.observe(section);
    return () => io.disconnect();
  }, [cinema]);

  const setOverlayRef = (el: HTMLDivElement | null) => {
    // prune detached nodes (cinema can unmount/remount via the a11y stop-motion
    // toggle) so the scroll handler never mutates stale, off-DOM elements
    overlayRefs.current = overlayRefs.current.filter((n) => n.isConnected);
    if (el && !overlayRefs.current.includes(el)) overlayRefs.current.push(el);
  };

  const height = lengthVh ?? Math.max(400, frames.length * 30);
  const lastFrame = frames[frames.length - 1];

  // RESERVE THE RUNWAY AT HYDRATION, not when the cinema mounts.
  //
  // `cinema` only flips after window.load + 300ms + frame-0 decode. On this page
  // that lands seconds after first paint — long after a real reader has started
  // scrolling. When it flipped, the section grew from auto-height to 420vh AND
  // the static twin left the layout, teleporting everything below (the guide,
  // the credential strip, the lead form) down by ~2,700px on desktop under a
  // reader who was already there. Chrome and Firefox soften it with scroll
  // anchoring; Safari does not. Lighthouse reports CLS 0 because it never
  // scrolls, which is exactly why this stayed invisible.
  //
  // Reserving as soon as we know the cinema WILL mount (mounted + motion
  // allowed) moves the resize into the hydration frame, before the reader can
  // act on it. Crucially this is gated on `mounted`, not on a CSS media query:
  // a no-JS or reduced-motion visitor keeps the auto-height twin and never gets
  // a 420vh box holding one paragraph.
  const reserveRunway = mounted && motionAllowed;

  return (
    <section
      ref={sectionRef}
      className="relative bg-sand"
      style={reserveRunway ? { height: `${height}vh` } : undefined}
      aria-label={staticHeading}
    >
      {/* ── Layer B — the cinema (mounts only when motion is allowed) ── */}
      {cinema && (
        // h-[100svh] (not h-screen): the stage lives inside the SMALL viewport that
        // iOS guarantees even with the URL bar open — svh is stable (no dvh jump),
        // so captions never dive below the visible line mid-scrub
        <div className="sticky top-0 h-[100svh] overflow-hidden" aria-hidden="true">
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
              style={{ opacity: k === 0 ? 1 : 0 }}
              // frame 0 is the poster (eager — the section opens on it); the other
              // 13 full-viewport JPEGs ride native lazy-loading so they stop
              // competing with the hero LCP on first load (they fetch as the
              // reader approaches the film)
              loading={k === 0 ? "eager" : "lazy"}
              decoding="async"
            />
          ))}
          {/* soft veil for caption legibility */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, color-mix(in srgb, var(--color-navy) 16%, transparent) 0%, transparent 30%, transparent 55%, var(--color-bg) 130%)",
            }}
          />
          {/* progress hairline — pinned to the stage's BOTTOM edge: the top of the
              viewport belongs to the fixed header (which draws its own gold progress
              bar), so two gold hairlines never stack and tell different numbers */}
          <div className="absolute bottom-0 inset-x-0 h-[3px] bg-line/60">
            <div ref={barRef} className="h-full w-0 bg-gold" />
          </div>
          {kicker && (
            <div
              ref={setOverlayRef}
              data-from="0"
              data-to="0.97"
              className="pointer-events-none absolute top-20 md:top-24 inset-x-0 text-center"
              style={{
                opacity: 0,
                transform: "translateY(12px)",
                transition:
                  "opacity var(--dur-reveal) var(--ease-out), transform var(--dur-reveal) var(--ease-out)",
              }}
            >
              {/* paper chip — same family as the thought-chips, reads over any frame */}
              <span className="inline-block rounded-full border border-line bg-bg/85 px-4 py-1.5 text-[13px] font-semibold tracking-eyebrow text-ink shadow-sm">
                {kicker}
              </span>
            </div>
          )}
          {/* chip stage: inset on small screens (positions pull inward, clear of the
              kicker) so no chip can touch or overflow the viewport edge */}
          {chips.length > 0 && (
            <div className="absolute inset-x-[4vw] top-20 bottom-0 md:inset-x-0 md:top-0">
              {chips.map((c) => (
                <div
                  key={c.text}
                  ref={setOverlayRef}
                  data-from={c.from}
                  data-to={c.to}
                  data-tilt={c.tilt ?? 0}
                  className="absolute max-w-[min(85vw,34rem)] rounded-full border border-line bg-bg/85 px-5 py-2.5 text-center font-serif italic text-ink shadow-sm [text-wrap:balance]"
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
            </div>
          )}
          {captions.map((cap) => (
            <div
              key={cap.big}
              ref={setOverlayRef}
              data-from={cap.from}
              data-to={cap.to}
              className="absolute bottom-[calc(9vh+3.5rem+env(safe-area-inset-bottom))] md:bottom-[9vh] inset-x-0 px-6 text-center pointer-events-none"
              style={{
                opacity: 0,
                transform: "translateY(14px)",
                transition:
                  "opacity var(--dur-reveal) var(--ease-out), transform var(--dur-reveal) var(--ease-out)",
              }}
            >
              {/* soft paper scrim so the caption reads over any frame */}
              <div className="mx-auto w-fit max-w-[min(88vw,40rem)] rounded-2xl bg-bg/75 px-6 py-4 backdrop-blur-[2px] shadow-sm">
                {cap.tone === "turn" && (
                  <div className="mx-auto mb-3 h-[3px] w-12 rounded-full bg-gold" />
                )}
                <div
                  className="mx-auto max-w-[24ch] font-serif font-medium leading-[1.3] text-ink"
                  style={{ fontSize: "clamp(1.6rem, 3.4vw, 2.7rem)" }}
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
            </div>
          ))}
        </div>
      )}

      {/* ── Layer A — the static twin (SSR, crawlable, no-JS, reduced-motion,
             and the visible poster until the opening frame is decoded) ── */}
      {/* While the runway is reserved but the cinema has not mounted yet, the twin
          becomes the poster INSIDE the tall section — sticky so it sits on screen
          rather than stranded at the top of a 420vh box. Once cinema takes over it
          goes sr-only (still crawlable); with no JS it is a plain static block. */}
      <div
        className={
          cinema ? "sr-only" : reserveRunway ? "sticky top-0 flex h-[100svh] items-center py-10" : "py-24"
        }
      >
        <div className="mx-auto max-w-[760px] px-7 text-center">
          {staticKicker && (
            <div className="mb-3 text-[13px] font-semibold tracking-eyebrow text-gold-ink">
              {staticKicker}
            </div>
          )}
          <h2 className="font-serif text-3xl md:text-4xl font-medium text-ink">
            {staticHeading}
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-muted">{staticBody}</p>
          <Image
            src={lastFrame}
            alt={finalAlt}
            width={1400}
            height={781}
            sizes="(min-width: 880px) 820px, 92vw"
            className="mx-auto mt-9 h-auto w-full max-w-[820px] rounded-card"
          />
        </div>
      </div>
    </section>
  );
}
