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
// iOS Low-Power-Mode suspends autoplay → the <Image> beneath simply stays
// visible (never a black box). muted+playsInline satisfies Chrome/iOS policy.
//
// THE BRIDGE (2026-07-22, Rom: "שהסרטון ימשיך גם למערכת גלילה, מאוחד"):
// the film opens on the poster's exact frame and LANDS on the scroll-film's
// first frame (02-problem-s01) — same table, same kitchen, camera descending
// from overhead to eye level. So it plays ONCE and holds that last frame: the
// reader then scrolls straight into the scrub, and hero → film reads as one
// unbroken take instead of two separate plate-builds. Looping would break the
// hand-off, so the IO only *starts* it and never restarts a finished film.

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
  poster: string; // the LCP image — and the film's exact opening frame
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
      // never restart a film that already landed on its final frame — that
      // frame IS the scroll-film's opening, and it must stay put
      if (e.isIntersecting) {
        if (!v.ended) v.play().catch(() => {});
      } else if (!v.ended) {
        v.pause();
      }
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
          autoPlay
          preload="none"
          // NO poster attribute, deliberately: the <Image> underneath already
          // holds this exact frame as the eager LCP. Giving the video its own
          // poster made the VIDEO the LCP element — it mounts after window.load,
          // so its poster painted at ~520ms and pushed LCP 4.1s → 4.8s (measured).
          // Without it the video contributes no LCP candidate, and if it can
          // never play (iOS low-power, decode failure) the image simply shows.
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
