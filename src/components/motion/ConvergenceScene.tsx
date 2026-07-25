"use client";
import { useEffect, useRef, useState } from "react";

// ConvergenceScene — a SCROLL-DRIVEN canvas scrollytelling scene: scattered source nodes connect into
// a central hub, data flows, the hub goes "live", and beat captions advance with scroll. (Distinct
// from ConvergenceDiagram, which is the always-on LINEAR pipeline; this is the pinned CIRCULAR
// narrative.) PROP-DRIVEN — the composer supplies `sources` (node labels) + `beats` ({t,s} captions);
// no baked content. PALETTE-AGNOSTIC (reads --color-gold/good/muted/ink tokens). Pointer-reactive on a
// fine pointer. reduced-motion / no-JS → the final "live" frame + last beat (never hidden content).

type Beat = { t: string; s: string };

function readRgb(host: HTMLElement, cssVar: string, fallback: string): [number, number, number] {
  const probe = document.createElement("span");
  probe.style.cssText = `color:var(${cssVar},${fallback});position:absolute;opacity:0;pointer-events:none`;
  host.appendChild(probe);
  const m = getComputedStyle(probe).color.match(/[\d.]+/g);
  probe.remove();
  return m ? [Math.round(+m[0]), Math.round(+m[1]), Math.round(+m[2])] : [64, 224, 208];
}

export function ConvergenceScene({
  sources, beats, className = "", heightVh,
}: { sources: string[]; beats: Beat[]; className?: string; heightVh?: number }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [beat, setBeat] = useState(0);
  const [pinned, setPinned] = useState(false);
  const beatRef = useRef(0), pinnedRef = useRef(false);
  const AT = beats.map((_, i) => (i / beats.length) * 0.9); // beat thresholds along the scroll
  const vh = heightVh ?? Math.max(240, beats.length * 72);

  useEffect(() => {
    const wrap = wrapRef.current, canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const reduce = !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const fine = !!window.matchMedia?.("(pointer: fine)").matches;
    const rtl = getComputedStyle(canvas).direction !== "ltr";
    let W = 0, H = 0, raf = 0, prog = reduce ? 1 : 0, t = 0;
    const ptr = { x: 0, y: 0, tx: 0, ty: 0, on: 0 };

    const host = canvas.parentElement || document.body;
    const acc = readRgb(host, "--color-gold", "#40e0d0");
    const live = readRgb(host, "--color-good", "#10b981");
    const mut = readRgb(host, "--color-muted", "#a8b0bf");
    const ink = readRgb(host, "--color-ink", "#f5f7fa");
    const A = (a: number) => `rgba(${acc[0]},${acc[1]},${acc[2]},${a})`;
    const M = (a: number) => `rgba(${mut[0]},${mut[1]},${mut[2]},${a})`;
    const I = (a: number) => `rgba(${ink[0]},${ink[1]},${ink[2]},${a})`;
    const lerp = (x: number, y: number, g: number) => Math.round(x + (y - x) * g);
    const col = (aa: number, green: number) => `rgba(${lerp(acc[0], live[0], green)},${lerp(acc[1], live[1], green)},${lerp(acc[2], live[2], green)},${aa})`;

    const beatIndex = (p: number) => { let i = 0; for (let k = 0; k < AT.length; k++) if (p >= AT[k]) i = k; return i; };

    const size = () => { W = canvas.clientWidth; H = canvas.clientHeight; canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    const onMove = (e: PointerEvent) => { const r = canvas.getBoundingClientRect(); ptr.tx = e.clientX - r.left - r.width / 2; ptr.ty = e.clientY - r.top - r.height / 2; ptr.on = 1; };
    const onLeave = () => { ptr.on = 0; ptr.tx = 0; ptr.ty = 0; };
    const readProg = () => {
      if (reduce) return;
      const r = wrap.getBoundingClientRect();
      prog = Math.min(Math.max(-r.top / (wrap.offsetHeight - window.innerHeight), 0), 1);
      const isPinned = r.top <= 8;
      if (isPinned !== pinnedRef.current) { pinnedRef.current = isPinned; setPinned(isPinned); }
    };

    const draw = () => {
      t += 1;
      ctx.clearRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2, R = Math.min(W, H) * 0.33, n = sources.length;
      ptr.x += (ptr.tx - ptr.x) * 0.07; ptr.y += (ptr.ty - ptr.y) * 0.07;
      const lx = fine && !reduce ? Math.max(-1, Math.min(1, ptr.x / (W / 2))) * 26 : 0;
      const ly = fine && !reduce ? Math.max(-1, Math.min(1, ptr.y / (H / 2))) * 20 : 0;
      if (ptr.on && fine && !reduce) {
        const g = ctx.createRadialGradient(cx + ptr.x, cy + ptr.y, 0, cx + ptr.x, cy + ptr.y, 150);
        g.addColorStop(0, A(0.1)); g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx + ptr.x, cy + ptr.y, 150, 0, 6.2832); ctx.fill();
      }
      const nodes = sources.map((_, i) => {
        const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
        const jit = prog < 0.24 ? Math.sin(t * 0.05 + i) * 6 * (1 - prog / 0.24) : 0;
        return { x: cx + Math.cos(a) * (R + jit) + lx, y: cy + Math.sin(a) * (R + jit) + ly };
      });
      const cf = Math.min(Math.max((prog - 0.2) / 0.26, 0), 1);
      nodes.forEach((nd) => { const ex = cx + (nd.x - cx) * cf, ey = cy + (nd.y - cy) * cf; ctx.strokeStyle = A(0.12 + cf * 0.5); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(nd.x, nd.y); ctx.lineTo(ex, ey); ctx.stroke(); });
      const flow = Math.min(Math.max((prog - 0.42) / 0.36, 0), 1);
      if (flow > 0 && !reduce) nodes.forEach((nd, i) => { for (let k = 0; k < 3; k++) { const ph = (t * 0.012 + i * 0.2 + k * 0.33) % 1; ctx.beginPath(); ctx.arc(nd.x + (cx - nd.x) * ph, nd.y + (cy - nd.y) * ph, 2.6, 0, 6.2832); ctx.fillStyle = A((1 - ph) * flow); ctx.fill(); } });
      else if (reduce) nodes.forEach((nd) => { ctx.beginPath(); ctx.arc(nd.x + (cx - nd.x) * 0.5, nd.y + (cy - nd.y) * 0.5, 2.6, 0, 6.2832); ctx.fillStyle = A(0.7); ctx.fill(); });
      nodes.forEach((nd, i) => {
        const lit = cf > 0.1;
        ctx.beginPath(); ctx.arc(nd.x, nd.y, 6, 0, 6.2832); ctx.fillStyle = lit ? A(0.9) : M(0.6); ctx.fill();
        if (lit) { ctx.beginPath(); ctx.arc(nd.x, nd.y, 12, 0, 6.2832); ctx.strokeStyle = A(0.25); ctx.lineWidth = 1; ctx.stroke(); }
        ctx.font = "600 13px ui-monospace, Menlo, monospace"; ctx.fillStyle = lit ? I(0.9) : M(0.7);
        ctx.textAlign = "center"; ctx.direction = rtl ? "rtl" : "ltr";
        ctx.fillText(sources[i], nd.x, nd.y + (nd.y < cy ? -20 : 26));
      });
      const hub = Math.min(Math.max((prog - 0.55) / 0.25, 0), 1);
      const liveG = Math.min(Math.max((prog - 0.85) / 0.12, 0), 1);
      if (hub > 0) {
        const hr = 22 + hub * 16 + Math.sin(t * 0.06) * (liveG > 0 ? 2.5 : 0);
        const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, hr * 3);
        glow.addColorStop(0, col(0.4 * hub, liveG)); glow.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(cx, cy, hr * 3, 0, 6.2832); ctx.fill();
        ctx.beginPath(); ctx.arc(cx, cy, hr, 0, 6.2832); ctx.fillStyle = col(0.16 + hub * 0.2, liveG); ctx.fill();
        ctx.strokeStyle = col(0.6 + hub * 0.4, liveG); ctx.lineWidth = 2; ctx.stroke();
        ctx.beginPath(); ctx.arc(cx, cy, 5 + liveG * 2, 0, 6.2832); ctx.fillStyle = col(0.95, liveG); ctx.fill();
      }
      const b = beatIndex(prog);
      if (b !== beatRef.current) { beatRef.current = b; setBeat(b); }
      if (!reduce) raf = requestAnimationFrame(draw);
    };

    const onScroll = () => readProg();
    size(); readProg();
    if (reduce) { setBeat(beats.length - 1); setPinned(true); draw(); }
    else {
      raf = requestAnimationFrame(draw);
      window.addEventListener("scroll", onScroll, { passive: true });
      if (fine) { canvas.addEventListener("pointermove", onMove, { passive: true }); canvas.addEventListener("pointerleave", onLeave); }
    }
    const onResize = () => size();
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onResize); canvas.removeEventListener("pointermove", onMove); canvas.removeEventListener("pointerleave", onLeave); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sources, beats]);

  const B = beats[beat] ?? beats[0];
  return (
    <div ref={wrapRef} className={`relative ${className}`} style={{ height: `${vh}vh` }}>
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        <canvas ref={canvasRef} aria-hidden className="absolute inset-0 block h-full w-full" />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-[11vh] px-6 text-center"
          style={{ opacity: pinned ? 1 : 0, transition: "opacity var(--dur-reveal)" }}
        >
          <span className="font-mono text-xs tracking-eyebrow text-gold" dir="ltr">
            {String(beat + 1).padStart(2, "0")} / {String(beats.length).padStart(2, "0")}
          </span>
          <h3 key={beat} className="mx-auto mt-3.5 max-w-[22ch] text-[clamp(1.6rem,3.6vw,2.7rem)] font-extrabold leading-tight text-ink" style={{ textWrap: "balance" }}>{B?.t}</h3>
          <p className="mx-auto mt-3 max-w-[44ch] text-muted">{B?.s}</p>
          <div aria-hidden className="mt-6 flex justify-center gap-2">
            {beats.map((_, i) => (
              <i key={i} className="h-[3px] w-8 rounded-sm" style={{ background: i === beat ? "var(--color-gold)" : i < beat ? "color-mix(in oklab, var(--color-gold) 40%, transparent)" : "color-mix(in oklab, var(--color-ink) 14%, transparent)" }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
