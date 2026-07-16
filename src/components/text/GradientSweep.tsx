"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { motion } from "motion/react";
import { motionAllowed } from "@/lib/motion";
import { DUR, EASE } from "@/lib/motion-tokens";
import { bezier } from "@/lib/motion-variants";

// Gradient-sweep — a single brass highlight glides across the text ONCE on view
// (the quiet luxury shimmer). The word is always fully legible: the sweep is a
// travelling gold band over an otherwise-solid base color, never a fade.
//
// House rule #1: the default (SSR / no-JS / reduced-motion / a11y-stop-motion)
// is SOLID `color` text — the `background-clip:text` transparent fill is applied
// ONLY once motion is confirmed allowed AND the element is in view, so text can
// never render invisible. `color` must match the surrounding text (explicit —
// currentColor can't be used while the fill is transparent).
export function GradientSweep({
  text,
  as = "span",
  className = "",
  style,
  color = "var(--color-ink, #ECE6D6)",
  highlight = "var(--color-gold, #C8A45C)",
}: {
  text: string;
  as?: "span" | "h1" | "h2" | "h3";
  className?: string;
  style?: CSSProperties;
  color?: string; // the solid base text color (match the section's text)
  highlight?: string; // the travelling band color
}) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!motionAllowed()) return; // reduced / a11y → stay solid, no sweep
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const Tag = motion[as];
  const swept: CSSProperties = shown
    ? {
        color: "transparent",
        backgroundImage: `linear-gradient(100deg, ${color} 38%, ${highlight} 50%, ${color} 62%)`,
        backgroundSize: "260% 100%",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
      }
    : { color };

  return (
    <Tag
      ref={ref as never}
      className={className}
      style={{ ...swept, ...style }}
      initial={false}
      animate={shown ? { backgroundPositionX: ["100%", "-60%"] } : undefined}
      transition={{ duration: DUR.reveal * 1.4, ease: bezier(EASE.out) }}
    >
      {text}
    </Tag>
  );
}
