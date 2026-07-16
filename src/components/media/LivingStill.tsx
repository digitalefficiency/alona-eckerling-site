"use client";

import Image from "next/image";
import { useMotionAllowed } from "@/lib/motion";

// The film ↔ site BRIDGE — MediaFrame's exact grade (same fixed token crops,
// same --grade-tint, same shared .grain-overlay — one camera) around a short
// ambient VIDEO loop: an office curtain moving, steam off a cup, street light
// drifting. Keep loops a few seconds and heavily compressed (mp4/webm).
//
// House rule #1: the REQUIRED `poster` (the film bundle's act stills are
// perfect sources) IS the content — it renders as next/image for SSR / no-JS
// / reduced-motion and is the LCP candidate (`priority` when above the fold).
// The video mounts CLIENT-SIDE over it only while motion is allowed AND a
// `src` exists (prefers-reduced-motion + html.a11y-stop-motion both gate,
// reactively — a mid-session gate flip unmounts the video back to the still).
// `src` is OPTIONAL: omit it and the component is a graceful poster-only
// still (same frame, same grade) — drop the loop in later without a reflow.
// Always muted / playsInline / loop / aria-hidden: pure ambience, never
// information — so a visitor who only ever sees the poster misses nothing.
type Ratio = "3/4" | "16/9" | "1/1" | "21/9";

// Fixed crops — identical to MediaFrame (the unified image grade).
const AR: Record<Ratio, string> = {
  "3/4": "var(--aspect-portrait)",
  "16/9": "16 / 9",
  "1/1": "var(--aspect-avatar)",
  "21/9": "var(--aspect-hero)",
};

export function LivingStill({
  src,
  poster,
  alt,
  ratio,
  caption,
  priority = false,
  sizes = "(max-width:768px) 100vw, 800px",
  className = "",
}: {
  src?: string; // short ambient loop (mp4/webm) — a few seconds, compressed hard; omit → poster-only
  poster: string; // REQUIRED — the SSR / reduced-motion / LCP still
  alt: string; // describes the still (the video adds nothing to describe)
  ratio: Ratio; // deliberate, fixed crop — no free-form aspect
  caption?: string;
  priority?: boolean; // only when the poster is the LCP image
  sizes?: string;
  className?: string;
}) {
  const allowed = useMotionAllowed();
  const frame = (
    <div
      className={`relative overflow-hidden rounded-[10px] border border-line ${caption ? "" : className}`}
      style={{ aspectRatio: AR[ratio] }}
    >
      <Image src={poster} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
      {allowed && src && (
        <video
          src={src}
          poster={poster}
          muted
          playsInline
          loop
          autoPlay
          preload="metadata"
          aria-hidden
          tabIndex={-1}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      {/* the grade sits OVER poster and video alike: brand tint (--grade-tint) … */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "var(--grade-tint)" }}
      />
      {/* … + the ONE film grain (.grain-overlay / --texture-grain at --grain-opacity) */}
      <div aria-hidden className="grain-overlay" />
    </div>
  );

  if (!caption) return frame;
  return (
    <figure className={className}>
      {frame}
      <figcaption className="mt-3 flex items-center gap-2 text-sm text-muted">
        <span className="text-[0.55rem] leading-none text-gold-ink" aria-hidden>
          ◆
        </span>
        {caption}
      </figcaption>
    </figure>
  );
}
