"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useAfterWindowLoad, useMotionAllowed } from "@/lib/motion";

// Full-bleed hero film — LivingStill's poster-first contract grown into a room.
// The POSTER is the LCP: a static eager next/image painted on the first frame
// (no `priority` — its preload rides the RSC payload and replays cross-route,
// the measured trap). The <video> exists ONLY client-side and arms strictly
// AFTER window.load (+300ms settle, the SequenceFilm gate as a hook), so the
// film never competes with the LCP window; `preload="none"` + the arming gate
// mean zero video bytes before load even on the fastest connections.
//
// Gates, all reactive: useMotionAllowed (reduced-motion / a11y-stop-motion →
// poster only, video unmounts mid-flight if toggled), saveData (poster only),
// and an IntersectionObserver pauses playback whenever the hero leaves the
// viewport (GPU discipline — the page below owes nothing to a hidden loop).
// webm/mp4 are optional: without them this is a plain full-bleed poster, so
// the hero ships before the production lands.
//
// iOS Low-Power-Mode suspends autoplay → the element's own poster shows (never
// a black box). muted+playsInline satisfies Chrome/iOS autoplay policy.

function prefersReducedData(): boolean {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
  return !!nav.connection?.saveData;
}

export function HeroFilm({
  poster,
  webm,
  mp4,
  objectPosition,
  className = "",
}: {
  poster: string; // the LCP image AND the video poster — first frame of the loop
  webm?: string;
  mp4?: string;
  objectPosition?: string;
  className?: string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const allowed = useMotionAllowed();
  const loaded = useAfterWindowLoad(300);
  const videoRef = useRef<HTMLVideoElement>(null);

  const showVideo = Boolean(mounted && allowed && loaded && !prefersReducedData() && (webm || mp4));

  useEffect(() => {
    const v = videoRef.current;
    if (!showVideo || !v) return;
    const io = new IntersectionObserver(([e]) => {
      if (!e) return;
      if (e.isIntersecting) v.play().catch(() => {});
      else v.pause();
    });
    io.observe(v);
    return () => io.disconnect();
  }, [showVideo]);

  const fit = { objectPosition } as React.CSSProperties;

  return (
    <div aria-hidden className={`absolute inset-0 ${className}`}>
      <Image
        src={poster}
        alt=""
        fill
        sizes="100vw"
        fetchPriority="high"
        loading="eager"
        className="object-cover"
        style={objectPosition ? fit : undefined}
      />
      {showVideo && (
        <video
          ref={videoRef}
          muted
          playsInline
          loop
          autoPlay
          preload="none"
          poster={poster}
          disablePictureInPicture
          tabIndex={-1}
          className="absolute inset-0 h-full w-full object-cover"
          style={objectPosition ? fit : undefined}
        >
          {webm && <source src={webm} type="video/webm" />}
          {mp4 && <source src={mp4} type="video/mp4" />}
        </video>
      )}
      {/* the ONE shared grade + full grain — the page opens at 0.05 texture
          (the material diet thins from here) */}
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "var(--grade-tint)" }} />
      <div aria-hidden className="grain-overlay" />
    </div>
  );
}
