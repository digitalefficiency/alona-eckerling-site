"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useCapable3D } from "@/lib/capability";

export type ProgressRef = { current: number };

// Canvas is client-only (WebGL needs the DOM). Loaded only when the section is
// near the viewport AND the device is capable — otherwise the existing 2D layer
// (video + cutouts) remains the experience.
const StoryScene = dynamic(
  () => import("@/components/three/StoryScene").then((m) => m.StoryScene),
  { ssr: false }
);

export function Scene3D({ progressRef }: { progressRef: ProgressRef }) {
  const capable = useCapable3D();
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: "300px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} aria-hidden className="absolute inset-0 z-[5]">
      {capable && inView && <StoryScene progressRef={progressRef} />}
    </div>
  );
}
