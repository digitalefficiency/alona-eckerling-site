"use client";
import { useEffect, useRef, useState } from "react";

// AgentMind — a self-running visualization of an automation/AI agent reasoning in real time:
// an event ARRIVES → the core THINKS → candidate actions are WEIGHED → one is DECIDED → it EXECUTES,
// then the loop resets to the next scenario. A canvas stage paired with a synced, human-readable
// activity log. This is a DEMONSTRATION OF THE PRINCIPLE, never a claim about a specific system —
// so the composer supplies the scenarios and the log copy; nothing is baked.
//
// PROP-DRIVEN: `scenarios` ({input, actions[], pick}) + `labels` (the log strings, in the site's
// language). PALETTE-AGNOSTIC: reads --color-gold (idle/chosen), --color-gold-dark (thinking),
// --color-good (executed), --color-muted/--color-ink via a probe → themes to any mode. DIRECTION-AWARE:
// reads computed `direction` — RTL flows input-from-right → core → actions-left; LTR mirrored.
// reduced-motion / no-JS → a static "decided & executed" frame + the fully-resolved log (never hidden).

type Scenario = { input: string; actions: string[]; pick: number };
type AgentLabels = {
  active: string; input: string; analyze: string; weigh: string; decide: string; exec: string;
  analyzing: string; found: string; waiting: string; right: string; doneTxt: string; note: string;
};

// Resolve a CSS var to [r,g,b] via a hidden probe that resolves var().
function readRgb(host: HTMLElement, cssVar: string, fallback: string): [number, number, number] {
  const probe = document.createElement("span");
  probe.style.cssText = `color:var(${cssVar},${fallback});position:absolute;opacity:0;pointer-events:none`;
  host.appendChild(probe);
  const m = getComputedStyle(probe).color.match(/[\d.]+/g);
  probe.remove();
  return m ? [Math.round(+m[0]), Math.round(+m[1]), Math.round(+m[2])] : [64, 224, 208];
}

// phase boundaries within one cycle (0..1)
const P = { input: 0.16, think: 0.38, evalP: 0.58, decide: 0.74, act: 0.92 };
function phaseOf(c: number) {
  if (c < P.input) return 0;   // input arriving
  if (c < P.think) return 1;   // thinking
  if (c < P.evalP) return 2;   // weighing options
  if (c < P.decide) return 3;  // deciding
  if (c < P.act) return 4;     // executing
  return 5;                    // done → reset
}
const CYCLE_MS = 7200; // one input→think→weigh→decide→act loop (canvas clock, not a CSS token)

export function AgentMind({
  scenarios, labels, className = "",
}: { scenarios: Scenario[]; labels: AgentLabels; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cycle, setCycle] = useState(0);
  const [phase, setPhase] = useState(0);
  const sc = scenarios[cycle % scenarios.length];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const reduce = !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const rtl = getComputedStyle(canvas).direction !== "ltr";
    let W = 0, H = 0, raf = 0, running = true, t0 = 0, cyc = 0, ph = -1;

    // palette from the active tokens (rgba builders — set once)
    const host = canvas.parentElement || document.body;
    const acc = readRgb(host, "--color-gold", "#40e0d0");
    const thk = readRgb(host, "--color-gold-dark", "#8b5cf6");
    const live = readRgb(host, "--color-good", "#10b981");
    const mut = readRgb(host, "--color-muted", "#9aa3b2");
    const ink = readRgb(host, "--color-ink", "#e6eaf0");
    const S = (c: number[]) => `${c[0]},${c[1]},${c[2]}`;
    const A = (a: number) => `rgba(${S(acc)},${a})`;
    const V = (a: number) => `rgba(${S(thk)},${a})`;
    const L = (a: number) => `rgba(${S(live)},${a})`;
    const M = (a: number) => `rgba(${S(mut)},${a})`;
    const I = (a: number) => `rgba(${S(ink)},${a})`;

    const size = () => {
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const lerp = (a: number, b: number, x: number) => a + (b - a) * Math.max(0, Math.min(1, x));
    const eas = (x: number) => 1 - Math.pow(1 - Math.max(0, Math.min(1, x)), 3);

    const scene = (c: number, ts: number) => {
      ctx.clearRect(0, 0, W, H);
      const scen = scenarios[cyc % scenarios.length];
      const coreX = W * (rtl ? 0.66 : 0.34), coreY = H * 0.5; // core on the reading-start side
      const nodeX = W * (rtl ? 0.24 : 0.76);                  // actions fan on the reading-end side
      const inStartX = W * (rtl ? 0.98 : 0.02);               // input enters from the far edge
      const N = scen.actions.length;
      const nodes = scen.actions.map((_, i) => {
        const spread = Math.min(H * 0.32, 150);
        const y = coreY + (N > 1 ? (i - (N - 1) / 2) * (spread * 2 / (N - 1)) : 0);
        return { x: nodeX, y };
      });
      const p = phaseOf(c);

      // ---- ambient thought particles while thinking/weighing/deciding ----
      if (!reduce && p >= 1 && p <= 3) {
        for (let k = 0; k < 10; k++) {
          const a = ts * 0.001 + k * 0.63;
          const rr = 30 + (k % 3) * 9 + Math.sin(ts * 0.002 + k) * 4;
          const x = coreX + Math.cos(a) * rr, y = coreY + Math.sin(a) * rr * 0.7;
          ctx.beginPath(); ctx.arc(x, y, 1.6, 0, 6.2832);
          ctx.fillStyle = V(0.25 + 0.2 * Math.sin(ts * 0.004 + k)); ctx.fill();
        }
      }

      // ---- branches core → action nodes (draw-in during think→weigh) ----
      const bf = reduce ? 1 : eas((c - P.input) / (P.evalP - P.input));
      nodes.forEach((nd, i) => {
        const midX = (coreX + nd.x) / 2, midY = (coreY + nd.y) / 2 - 26;
        const ex = lerp(coreX, nd.x, bf), ey = lerp(coreY, nd.y, bf);
        ctx.beginPath(); ctx.moveTo(coreX, coreY); ctx.quadraticCurveTo(midX, midY, ex, ey);
        const chosen = p >= 3 && i === scen.pick;
        const dim = p >= 3 && i !== scen.pick;
        ctx.strokeStyle = chosen ? A(0.85) : dim ? M(0.16) : A(0.2 + bf * 0.3);
        ctx.lineWidth = chosen ? 2.4 : 1.3; ctx.stroke();
      });

      // ---- executing packet core → chosen (during act) ----
      if (!reduce && p === 4) {
        const af = (c - P.decide) / (P.act - P.decide);
        const nd = nodes[scen.pick];
        const midX = (coreX + nd.x) / 2, midY = (coreY + nd.y) / 2 - 26;
        const tt = eas(af), u = 1 - tt;
        const x = u * u * coreX + 2 * u * tt * midX + tt * tt * nd.x;
        const y = u * u * coreY + 2 * u * tt * midY + tt * tt * nd.y;
        ctx.beginPath(); ctx.arc(x, y, 4, 0, 6.2832); ctx.fillStyle = L(0.95); ctx.fill();
      }

      // ---- action nodes + labels ----
      nodes.forEach((nd, i) => {
        const chosen = p >= 3 && i === scen.pick;
        const done = p >= 4 && i === scen.pick && (reduce || (c - P.decide) / (P.act - P.decide) > 0.9);
        const dim = p >= 3 && i !== scen.pick;
        const evalPulse = p === 2 && !reduce ? 1 + Math.sin(ts * 0.006 + i * 1.4) * 0.12 : 1;
        const r = 7 * evalPulse;
        if (p === 2 && !reduce) { // weighing score arc
          const sfrac = Math.max(0, Math.min(1, (c - P.think) / (P.evalP - P.think) - i * 0.05));
          ctx.beginPath(); ctx.arc(nd.x, nd.y, 13, -Math.PI / 2, -Math.PI / 2 + sfrac * 6.2832);
          ctx.strokeStyle = V(0.6); ctx.lineWidth = 2; ctx.stroke();
        }
        ctx.beginPath(); ctx.arc(nd.x, nd.y, r, 0, 6.2832);
        ctx.fillStyle = done ? L(0.95) : chosen ? A(0.95) : dim ? M(0.35) : A(0.55); ctx.fill();
        if (chosen || done) {
          ctx.beginPath(); ctx.arc(nd.x, nd.y, r + 7, 0, 6.2832);
          ctx.strokeStyle = done ? L(0.4) : A(0.35); ctx.lineWidth = 1.5; ctx.stroke();
        }
        ctx.font = `600 ${W < 560 ? 11.5 : 12.5}px ui-monospace, Menlo, monospace`;
        ctx.textAlign = "center"; ctx.direction = rtl ? "rtl" : "ltr";
        ctx.fillStyle = done ? L(1) : chosen ? I(1) : dim ? M(0.5) : I(0.75);
        const labelY = nd.y - 18 < 20 ? nd.y + 24 : nd.y - 18; // flip below if it'd clip the top edge
        ctx.fillText((done ? "✓ " : "") + scen.actions[i], nd.x, labelY);
      });

      // ---- input token travelling from the far edge → core (during input) ----
      if (!reduce && p === 0) {
        const f = eas(c / P.input);
        const x = lerp(inStartX, coreX, f);
        ctx.beginPath(); ctx.arc(x, coreY, 4.5, 0, 6.2832); ctx.fillStyle = A(0.95); ctx.fill();
        ctx.beginPath(); ctx.moveTo(inStartX, coreY); ctx.lineTo(x, coreY);
        ctx.strokeStyle = A(0.25); ctx.lineWidth = 1.2; ctx.stroke();
      }

      // ---- the agent CORE ----
      const thinking = p >= 1 && p <= 3, acting = p === 4;
      const pulse = reduce ? 0 : Math.sin(ts * (thinking ? 0.012 : 0.005)) * (thinking ? 3.5 : 1.6);
      const cr = 20 + pulse;
      const core = acting ? live : thinking ? thk : acc;
      const glow = ctx.createRadialGradient(coreX, coreY, 0, coreX, coreY, cr * 3.4);
      glow.addColorStop(0, `rgba(${S(core)},.34)`); glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(coreX, coreY, cr * 3.4, 0, 6.2832); ctx.fill();
      ctx.beginPath(); ctx.arc(coreX, coreY, cr, 0, 6.2832); ctx.fillStyle = `rgba(${S(core)},.16)`; ctx.fill();
      ctx.strokeStyle = `rgba(${S(core)},.9)`; ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.arc(coreX, coreY, 6, 0, 6.2832); ctx.fillStyle = `rgba(${S(core)},1)`; ctx.fill();
      if (thinking && !reduce) { // rotating thinking ring
        const a0 = ts * 0.004;
        ctx.beginPath(); ctx.arc(coreX, coreY, cr + 9, a0, a0 + 1.7);
        ctx.strokeStyle = V(0.75); ctx.lineWidth = 2; ctx.stroke();
      }
    };

    const frame = (ts: number) => {
      if (!running) return;
      if (!t0) t0 = ts;
      const elapsed = ts - t0;
      const c = (elapsed % CYCLE_MS) / CYCLE_MS;
      const newCyc = Math.floor(elapsed / CYCLE_MS);
      if (newCyc !== cyc) { cyc = newCyc; setCycle(cyc); }
      const p = phaseOf(c);
      if (p !== ph) { ph = p; setPhase(p); }
      scene(c, ts);
      raf = requestAnimationFrame(frame);
    };

    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting && !running && !reduce) { running = true; raf = requestAnimationFrame(frame); }
      else if (!e.isIntersecting) { running = false; cancelAnimationFrame(raf); }
    }), { threshold: 0.05 });

    size();
    if (reduce) { setPhase(4); scene(P.decide + 0.05, 0); }
    else { raf = requestAnimationFrame(frame); io.observe(canvas); }
    window.addEventListener("resize", size);
    return () => { cancelAnimationFrame(raf); io.disconnect(); window.removeEventListener("resize", size); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenarios]);

  const chosen = sc.actions[sc.pick];
  const fade = { transition: "opacity var(--dur-reveal)" } as const;
  const row = (on: boolean) => ({ opacity: on ? 1 : 0.4, ...fade });
  return (
    <div className={`grid gap-6 md:grid-cols-[1.5fr_0.9fr] md:items-stretch ${className}`}>
      <div className="relative min-h-[clamp(320px,46vh,480px)] overflow-hidden rounded-2xl border border-line bg-card">
        <canvas ref={canvasRef} aria-hidden className="absolute inset-0 block h-full w-full" />
        <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-line bg-black/25 px-2.5 py-1 font-mono text-[11px] tracking-wide text-muted backdrop-blur">
          <i className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-good" />{labels.active}
        </span>
      </div>

      <div className="flex flex-col rounded-2xl border border-line bg-card p-5">
        <div className="mb-4 flex items-center gap-2 font-mono text-xs tracking-wide text-muted">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-good" /> {labels.active}
        </div>
        <ul className="flex flex-1 flex-col gap-3 text-sm">
          <li className="grid grid-cols-[auto_1fr] items-baseline gap-3" style={row(phase >= 0)}>
            <span className="font-mono text-[11px] uppercase tracking-wider text-muted">{labels.input}</span>
            <span className="text-ink">{phase >= 0 ? `"${sc.input}"` : "…"}</span>
          </li>
          <li className="grid grid-cols-[auto_1fr] items-baseline gap-3" style={row(phase >= 1)}>
            <span className="font-mono text-[11px] uppercase tracking-wider text-muted">{labels.analyze}</span>
            <span className="text-ink">{phase === 1 ? labels.analyzing : phase >= 2 ? labels.found : labels.waiting}</span>
          </li>
          <li className="grid grid-cols-[auto_1fr] items-baseline gap-3" style={row(phase >= 2)}>
            <span className="font-mono text-[11px] uppercase tracking-wider text-muted">{labels.weigh}</span>
            <span className="flex flex-wrap gap-1.5">
              {sc.actions.map((a, i) => (
                <em
                  key={i}
                  className={`rounded-md border px-2 py-0.5 font-mono text-[11px] not-italic ${
                    phase >= 3
                      ? i === sc.pick ? "border-gold text-gold" : "border-line text-muted opacity-55"
                      : "border-line text-ink/75"
                  }`}
                  style={phase >= 3 && i === sc.pick ? { background: "color-mix(in oklab, var(--color-gold) 14%, transparent)" } : undefined}
                >{a}</em>
              ))}
            </span>
          </li>
          <li className="grid grid-cols-[auto_1fr] items-baseline gap-3" style={row(phase >= 3)}>
            <span className="font-mono text-[11px] uppercase tracking-wider text-muted">{labels.decide}</span>
            <span className="text-ink">{phase >= 3 ? <><b className="text-gold">{chosen}</b> {labels.right}</> : "…"}</span>
          </li>
          <li className="grid grid-cols-[auto_1fr] items-baseline gap-3" style={row(phase >= 4)}>
            <span className="font-mono text-[11px] uppercase tracking-wider text-muted">{labels.exec}</span>
            <span className="text-ink">{phase >= 4 ? <><span className="text-good">✓</span> {chosen} {labels.doneTxt}</> : "…"}</span>
          </li>
        </ul>
        <p className="mt-5 text-xs leading-relaxed text-muted">{labels.note}</p>
      </div>
    </div>
  );
}
