"use client";

import { useEffect, useState } from "react";

// Decides whether to mount the WebGL 3D layer. Falls back to the 2D experience
// when: reduced-motion, save-data, low memory, small touch device, or no WebGL.
export function useCapable3D(): boolean {
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const nav = navigator as Navigator & {
      connection?: { saveData?: boolean };
      deviceMemory?: number;
    };
    if (nav.connection?.saveData) return;
    if (typeof nav.deviceMemory === "number" && nav.deviceMemory < 4) return;

    const coarse = window.matchMedia("(pointer: coarse)").matches;
    if (coarse && window.innerWidth < 1024) return; // skip phones/small touch

    try {
      const c = document.createElement("canvas");
      const gl = c.getContext("webgl2") || c.getContext("webgl");
      if (!gl) return;
    } catch {
      return;
    }

    setOk(true);
  }, []);

  return ok;
}
