"use client";

import Link from "next/link";
import { useRef } from "react";
import { useMotionPrefs } from "@/lib/motion";

// A primary CTA that gently pulls toward the cursor (≤12px) and springs back.
// Writes transform directly to the DOM. Disabled under reduced-motion AND on
// coarse pointers (touch). Never shifts layout or hides the focus ring.
export function MagneticButton({
  href,
  className = "",
  children,
  dataCta,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
  dataCta?: string; // marketing tag picked up by the site-wide CTA tracker
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const { reduced, coarse } = useMotionPrefs();
  const enabled = !reduced && !coarse;

  const onMove = (e: React.MouseEvent) => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const clamp = (v: number) => Math.max(-12, Math.min(12, v * 0.3));
    const x = clamp(e.clientX - (r.left + r.width / 2));
    const y = clamp(e.clientY - (r.top + r.height / 2));
    el.style.transform = `translate(${x}px, ${y}px)`;
  };
  const reset = () => {
    if (ref.current) ref.current.style.transform = "";
  };

  return (
    <Link
      ref={ref}
      href={href}
      data-cta={dataCta}
      onMouseMove={onMove}
      onMouseLeave={reset}
      className={`inline-block transition-transform duration-[var(--dur-micro)] ease-[var(--ease-micro)] ${className}`}
    >
      {children}
    </Link>
  );
}
