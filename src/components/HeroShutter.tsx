"use client";

import { useEffect, useLayoutEffect, useState } from "react";

const useIso = typeof window !== "undefined" ? useLayoutEffect : useEffect;

// Cinematic "image opens from both sides" entrance for the hero.
// OPT-IN + LCP-SAFE: renders NOTHING on the server and on the first client paint
// (so the real hero image — which keeps `priority` — is the LCP element and the
// no-JS / reduced-motion experience is the finished hero). Only after mount, when
// motion is allowed, two image leaves momentarily cover the hero and split apart,
// revealing the headline behind. The leaves carry the hero photo itself, so it
// reads as the image splitting open. Pure decoration over a static hero.
export function HeroShutter({ image }: { image: string }) {
  const [phase, setPhase] = useState<"idle" | "closed" | "open">("idle");

  useIso(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return; // no shutter
    setPhase("closed"); // cover before the browser paints the next frame (no flash)
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setPhase("open"));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, []);

  if (phase === "idle") return null;

  return (
    <div className="hero-shutter" data-open={phase === "open" ? "" : undefined} aria-hidden>
      <div className="hero-leaf hero-leaf-l" style={{ backgroundImage: `url('${image}')` }} />
      <div className="hero-leaf hero-leaf-r" style={{ backgroundImage: `url('${image}')` }} />
      <span className="hero-seam"><i /></span>
    </div>
  );
}
