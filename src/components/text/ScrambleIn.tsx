"use client";

import { createElement, useEffect, useRef, useState, type CSSProperties } from "react";
import { motionAllowed } from "@/lib/motion";
import { DUR } from "@/lib/motion-tokens";

// Scramble-in — the line "resolves" from noise to the final text on first view
// (a restrained decode, not a slot-machine). Characters settle left→right; each
// unsettled slot flickers through a script-matched pool (Hebrew glyphs for
// Hebrew, A–Z for Latin) so the noise reads native. Whitespace never scrambles.
//
// House rule #1: the default (SSR / no-JS / reduced-motion / a11y) is the FINAL
// text, immediately — scrambling runs ONLY client-side when motion is allowed.
// Accessibility: the real text is the element's aria-label; the flickering layer
// is aria-hidden, so assistive tech always reads the settled line.
const HE = "אבגדהוזחטיכלמנסעפצקרשת";
const LAT = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const isHe = (c: string) => c >= "֐" && c <= "׿";

function noiseFor(ch: string, tick: number, i: number): string {
  if (/\s/.test(ch)) return ch;
  const pool = isHe(ch) ? HE : LAT;
  return pool[(tick * 7 + i * 13) % pool.length]; // deterministic churn (no Math.random)
}

export function ScrambleIn({
  text,
  as = "span",
  className = "",
  style,
}: {
  text: string;
  as?: "span" | "h1" | "h2" | "h3" | "p";
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLElement>(null);
  const [display, setDisplay] = useState(text); // SSR + rest = final text
  const chars = Array.from(text);

  useEffect(() => {
    if (!motionAllowed()) return; // reduced / a11y → stay final
    const el = ref.current;
    if (!el) return;
    let timer: ReturnType<typeof setInterval> | null = null;
    const STEP = 40; // ms per tick
    const ticks = Math.max(8, Math.round((DUR.reveal * 1000) / STEP));
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        let tick = 0;
        timer = setInterval(() => {
          tick += 1;
          const settled = Math.floor((tick / ticks) * chars.length);
          if (tick >= ticks) {
            setDisplay(text);
            if (timer) clearInterval(timer);
            return;
          }
          setDisplay(chars.map((c, i) => (i < settled ? c : noiseFor(c, tick, i))).join(""));
        }, STEP);
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      if (timer) clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return createElement(
    as,
    { ref, className, style, "aria-label": text },
    createElement("span", { "aria-hidden": true }, display),
  );
}
