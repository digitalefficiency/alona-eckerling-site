"use client";

import { useEffect, useRef } from "react";
import { useMotionAllowed } from "@/lib/motion";

// A subtle gold ring that trails the cursor (lerp) and grows over interactive
// elements — a premium accent that AUGMENTS the native cursor (never hides it,
// so usability/accessibility are untouched). Hard-gated: fine pointer only, and
// disabled under reduced-motion OR the a11y menu's stop-motion toggle.
// Decorative (aria-hidden).
export function EvidenceCursor() {
  const ringRef = useRef<HTMLDivElement>(null);
  // «עצירת אנימציות» in the accessibility menu MUST stop this one. It is a
  // requestAnimationFrame loop writing transform every frame, so no CSS rule can
  // reach it — and the old gate read prefers-reduced-motion only, which left the
  // single effect the visitor disabled by hand as the one still running.
  // useMotionAllowed() covers the media query AND html.a11y-stop-motion, and is
  // reactive, so toggling takes effect immediately.
  const motionOk = useMotionAllowed();

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    if (!fine || !motionOk) return;

    const ring = ringRef.current;
    if (!ring) return;

    let tx = -100,
      ty = -100,
      x = -100,
      y = -100,
      visible = false,
      raf = 0;

    const onMove = (e: MouseEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      if (!visible) {
        visible = true;
        ring.style.opacity = "1";
      }
      const t = (e.target as HTMLElement)?.closest?.(
        "a,button,[role=slider],input,select,textarea,label",
      );
      ring.classList.toggle("is-active", !!t);
    };
    const onLeave = () => {
      visible = false;
      ring.style.opacity = "0";
    };

    const loop = () => {
      x += (tx - x) * 0.18;
      y += (ty - y) * 0.18;
      ring.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(raf);
      // The ring is a persistent element; leaving it mid-trail after the loop
      // stops would strand it on screen.
      ring.style.opacity = "0";
    };
  }, [motionOk]);

  if (!motionOk) return null;
  return <div ref={ringRef} aria-hidden className="evidence-cursor" />;
}
