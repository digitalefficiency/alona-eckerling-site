"use client";
import { useEffect, useRef } from "react";

// ConvergenceDiagram — a self-running "convergence engine" diagram: scattered source nodes stream data
// along converging wires into a central processing chip, which emits ONE clean output. A LIVE-canvas
// answer to the "diagrams are drawn, never generated" gate (media-studio.md §7) — an architecture /
// pipeline visual that never fakes labels. PALETTE-AGNOSTIC (reads --color-gold/gold-dark/good/card
// tokens → themes to any mode). DIRECTION-AWARE: sources on the reading-start side, output on the end
// (RTL: sources right → output left; LTR mirrored). Canvas 2D, no libs, IO-paused offscreen.
// reduced-motion → a static converged frame. PROP-DRIVEN (className, sources).

// Resolve a CSS var to [r,g,b] 0..255 (rgba-string ready) via a hidden probe that resolves var().
function readRgb(host: HTMLElement, cssVar: string, fallback: string): [number, number, number] {
  const probe = document.createElement("span");
  probe.style.cssText = `color:var(${cssVar},${fallback});position:absolute;opacity:0;pointer-events:none`;
  host.appendChild(probe);
  const m = getComputedStyle(probe).color.match(/[\d.]+/g);
  probe.remove();
  return m ? [Math.round(+m[0]), Math.round(+m[1]), Math.round(+m[2])] : [64, 224, 208];
}

export function ConvergenceDiagram({ className = "", sources: N = 11 }: { className?: string; sources?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const reduce = !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const rtl = getComputedStyle(canvas).direction !== "ltr";
    let W = 0, H = 0, raf = 0, t = 0, running = true;

    // palette from the active tokens (rgba builders — set once)
    const host = canvas.parentElement || document.body;
    const acc = readRgb(host, "--color-gold", "#40e0d0");
    const vio = readRgb(host, "--color-gold-dark", "#8b5cf6");
    const live = readRgb(host, "--color-good", "#10b981");
    const surf = readRgb(host, "--color-card", "#14141f");
    const hi = (c: number[], n: number) => c.map((v) => Math.min(255, v + n));
    const accHi = hi(acc, 86), liveHi = hi(live, 100);
    const A = (a: number) => `rgba(${acc[0]},${acc[1]},${acc[2]},${a})`;
    const V = (a: number) => `rgba(${vio[0]},${vio[1]},${vio[2]},${a})`;
    const L = (a: number) => `rgba(${live[0]},${live[1]},${live[2]},${a})`;
    const S = (a: number) => `rgba(${surf[0]},${surf[1]},${surf[2]},${a})`;

    let srcs: { x: number; y: number; seed: number; c: { x: number; y: number } }[] = [];
    let chip = { x: 0, y: 0, s: 0, half: 0 };
    let out = { x: 0, y: 0 }, chipIn = { x: 0, y: 0 }, chipOut = { x: 0, y: 0 };

    const layout = () => {
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const side = Math.max(48, Math.min(W * 0.13, H * 0.34));
      chip = { x: W * 0.5, y: H * 0.5, s: side, half: side / 2 };
      chipIn = { x: chip.x + (rtl ? chip.half : -chip.half), y: chip.y };   // edge facing the sources
      chipOut = { x: chip.x + (rtl ? -chip.half : chip.half), y: chip.y };  // edge facing the output
      const sx = rtl ? W * 0.83 : W * 0.17;
      srcs = Array.from({ length: N }, (_, i) => {
        const y = H * 0.12 + H * 0.76 * (i / (N - 1));
        const c = { x: (sx + chipIn.x) / 2, y: chip.y + (y - chip.y) * 0.13 };
        return { x: sx, y, seed: (i * 0.37) % 1, c };
      });
      out = { x: rtl ? W * 0.12 : W * 0.88, y: H * 0.5 };
    };

    const bez = (p0: { x: number; y: number }, c: { x: number; y: number }, p1: { x: number; y: number }, u: number) => {
      const v = 1 - u;
      return { x: v * v * p0.x + 2 * v * u * c.x + u * u * p1.x, y: v * v * p0.y + 2 * v * u * c.y + u * u * p1.y };
    };
    const roundRect = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath(); ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
    };

    const drawSource = (x: number, y: number, lit: number) => {
      const s = 11;
      roundRect(x - s / 2, y - s / 2, s, s, 3); ctx.fillStyle = S(0.9); ctx.fill();
      ctx.strokeStyle = A(0.28 + lit * 0.5); ctx.lineWidth = 1.2; ctx.stroke();
      ctx.beginPath(); ctx.arc(x, y, 1.7, 0, 6.2832); ctx.fillStyle = A(0.5 + lit * 0.5); ctx.fill();
    };

    const drawChip = (intensity: number) => {
      const { x, y, s, half } = chip;
      const glow = ctx.createRadialGradient(x, y, 0, x, y, s * 1.5);
      glow.addColorStop(0, A(0.26 + intensity * 0.5)); glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(x, y, s * 1.5, 0, 6.2832); ctx.fill();
      const r = s * 0.24;
      roundRect(x - half, y - half, s, s, r); ctx.fillStyle = S(0.72); ctx.fill();
      ctx.strokeStyle = A(0.7 + intensity); ctx.lineWidth = 2; ctx.stroke();
      const ih = half * 0.58;
      roundRect(x - ih, y - ih, ih * 2, ih * 2, r * 0.6); ctx.strokeStyle = A(0.45 + intensity); ctx.lineWidth = 1.3; ctx.stroke();
      if (!reduce) { const a0 = t * 0.02; ctx.beginPath(); ctx.arc(x, y, ih * 0.66, a0, a0 + 1.5); ctx.strokeStyle = V(0.7); ctx.lineWidth = 1.5; ctx.stroke(); }
      ctx.beginPath(); ctx.arc(x, y, 3.5 + intensity * 7, 0, 6.2832); ctx.fillStyle = `rgba(${accHi[0]},${accHi[1]},${accHi[2]},.95)`; ctx.fill();
    };

    const draw = () => {
      if (!running) return;
      t += 1;
      ctx.clearRect(0, 0, W, H);
      // faint grid
      ctx.strokeStyle = A(0.045); ctx.lineWidth = 1;
      for (let x = (W % 46) / 2; x < W; x += 46) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = (H % 46) / 2; y < H; y += 46) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      let arrival = 0;
      srcs.forEach((s) => {
        ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.quadraticCurveTo(s.c.x, s.c.y, chipIn.x, chipIn.y);
        ctx.strokeStyle = A(0.15); ctx.lineWidth = 1.1; ctx.stroke();
        let lit = 0;
        if (!reduce) {
          for (let k = 0; k < 2; k++) {
            const ph = ((t * 0.006) + s.seed + k * 0.5) % 1;
            const pos = bez({ x: s.x, y: s.y }, s.c, chipIn, ph);
            ctx.beginPath(); ctx.arc(pos.x, pos.y, 2.2, 0, 6.2832); ctx.fillStyle = A(Math.sin(ph * Math.PI) * 0.9); ctx.fill();
            if (ph > 0.9) { arrival += 1; lit = Math.max(lit, (ph - 0.9) / 0.1); }
            if (ph < 0.12) lit = Math.max(lit, 1 - ph / 0.12);
          }
        } else lit = 0.6;
        drawSource(s.x, s.y, lit);
      });

      const breathe = reduce ? 0 : (Math.sin(t * 0.04) * 0.5 + 0.5) * 0.1;
      drawChip(0.16 + breathe + Math.min(arrival * 0.05, 0.28));

      // chip → single output
      ctx.beginPath(); ctx.moveTo(chipOut.x, chipOut.y); ctx.lineTo(out.x, out.y); ctx.strokeStyle = L(0.35); ctx.lineWidth = 2; ctx.stroke();
      let outArrive = 0;
      if (!reduce) {
        const gph = (t * 0.0055) % 1, gx = chipOut.x + (out.x - chipOut.x) * gph;
        ctx.beginPath(); ctx.arc(gx, chipOut.y, 3.4, 0, 6.2832); ctx.fillStyle = L(0.95); ctx.fill();
        ctx.beginPath(); ctx.arc(gx, chipOut.y, 7, 0, 6.2832); ctx.fillStyle = L(0.18); ctx.fill();
        if (gph > 0.88) outArrive = (gph - 0.88) / 0.12;
      } else outArrive = 1;

      const orr = 9 + outArrive * 5;
      const og = ctx.createRadialGradient(out.x, out.y, 0, out.x, out.y, orr * 2.4);
      og.addColorStop(0, L(0.3 + outArrive * 0.4)); og.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = og; ctx.beginPath(); ctx.arc(out.x, out.y, orr * 2.4, 0, 6.2832); ctx.fill();
      ctx.beginPath(); ctx.arc(out.x, out.y, orr, 0, 6.2832); ctx.fillStyle = L(0.16); ctx.fill();
      ctx.strokeStyle = L(0.9); ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.arc(out.x, out.y, 3.4, 0, 6.2832); ctx.fillStyle = `rgba(${liveHi[0]},${liveHi[1]},${liveHi[2]},1)`; ctx.fill();

      if (!reduce) raf = requestAnimationFrame(draw);
    };

    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting && !reduce) { if (!running) { running = true; raf = requestAnimationFrame(draw); } }
      else { running = false; cancelAnimationFrame(raf); }
    }), { threshold: 0 });

    layout();
    if (reduce) { running = false; draw(); } else { raf = requestAnimationFrame(draw); io.observe(canvas); }
    const onResize = () => { layout(); if (reduce) draw(); };
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(raf); io.disconnect(); window.removeEventListener("resize", onResize); };
  }, [N]);

  return (
    <div
      aria-hidden
      className={`relative ${className}`}
      style={{ background: "radial-gradient(120% 100% at 50% 46%, color-mix(in oklab, var(--color-gold) 6%, var(--color-navy, #0a0a0f)), var(--color-navy, #0a0a0f) 72%)" }}
    >
      <canvas ref={ref} className="block h-full w-full" />
    </div>
  );
}
