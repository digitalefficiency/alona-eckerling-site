"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { BrandLogo } from "@/components/BrandLogo";

const useIso = typeof window !== "undefined" ? useLayoutEffect : useEffect;

// How long the curtain stays CLOSED before it opens (ms). Tunable — single knob.
const HOLD_MS = 3500;
// Must outlast the leaf/seam open transition (1.3s) before we unmount.
const OPEN_MS = 1500;

// Show the intro only ONCE per browsing session — a fresh entry to the site plays
// it, but back-navigation / internal returns to the homepage within the same session
// do not. sessionStorage clears on tab close, so the next genuine visit replays it.
const SHOWN_KEY = "bz_hero_curtain_shown";

// Brand "curtain" intro over the hero: a navy panel carrying the big centered logo
// + an animated title and subtitle. It holds closed for ~HOLD_MS, then splits open
// from both sides to reveal the hero behind it.
//
// OPT-IN + LCP-SAFE: renders NOTHING on the server and on the first client paint, so
// the real hero image stays the LCP element and the no-JS / reduced-motion experience
// is the finished hero (never a curtain stuck shut). It mounts only after hydration,
// and only when motion is allowed. A click skips the hold so it never traps a visitor.
export function HeroCurtain() {
  const [phase, setPhase] = useState<"idle" | "closed" | "opening" | "done">("idle");

  // Cover before the next paint (no flash), but only past the SSR/first paint so the
  // hero is what the browser paints — and measures as LCP — first.
  useIso(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Once-per-session gate. If already shown this session, skip straight to "done"
    // (renders null — no portal, no flash). Storage may throw in private mode/quota,
    // in which case we fall through and play the curtain anyway.
    try {
      if (window.sessionStorage.getItem(SHOWN_KEY)) {
        setPhase("done");
        return;
      }
      window.sessionStorage.setItem(SHOWN_KEY, "1");
    } catch {
      /* private mode / quota — best-effort, show the curtain */
    }
    setPhase("closed");
  }, []);

  useEffect(() => {
    if (phase !== "closed") return;
    const t = window.setTimeout(() => setPhase("opening"), HOLD_MS);
    return () => window.clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== "opening") return;
    const t = window.setTimeout(() => setPhase("done"), OPEN_MS);
    return () => window.clearTimeout(t);
  }, [phase]);

  if (phase === "idle" || phase === "done") return null;

  const opening = phase === "opening";

  return createPortal(
    <div
      className="hero-curtain"
      data-opening={opening ? "" : undefined}
      aria-hidden
      onClick={() => !opening && setPhase("opening")}
    >
      <span className="hero-curtain-leaf hero-curtain-leaf-l" />
      <span className="hero-curtain-leaf hero-curtain-leaf-r" />

      {/* centered brand spine: 3 gold diamonds (above logo / middle / below titles)
          linked by thin threads that sit only in the gaps — never across the text */}
      <div className="hero-curtain-brand">
        <span className="hero-curtain-star hero-curtain-star-1" aria-hidden>◆</span>
        <span className="hero-curtain-thread hero-curtain-thread-1" aria-hidden />
        <span className="hero-curtain-logo">
          <BrandLogo dark className="h-20 w-auto md:h-24" />
        </span>
        <span className="hero-curtain-thread hero-curtain-thread-2" aria-hidden />
        <span className="hero-curtain-star hero-curtain-star-2" aria-hidden>◆</span>
        <span className="hero-curtain-thread hero-curtain-thread-3" aria-hidden />
        <span className="hero-curtain-title">
          שמאות <em>מקרקעין</em>
        </span>
        <span className="hero-curtain-sub">
          משרד בוטיק מתקדם · <em>שלושה דורות</em>
        </span>
        <span className="hero-curtain-tag">מאז 1987 · דוקטור למקרקעין ושמאי מכריע</span>
        <span className="hero-curtain-thread hero-curtain-thread-4" aria-hidden />
        <span className="hero-curtain-star hero-curtain-star-3" aria-hidden>◆</span>
      </div>
    </div>,
    document.body,
  );
}
