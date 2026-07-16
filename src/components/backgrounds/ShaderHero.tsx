"use client";
import { useEffect, useRef } from "react";

// ShaderHero — a raw-WebGL generative "energy field" background (fbm domain-warp), pointer + scroll
// reactive. PALETTE-AGNOSTIC: reads the brand accent tokens (--color-gold / --color-gold-dark / the
// dark base --color-navy) at init, so it themes to the active palette — in the dark-kinetic MODE
// (design-system.md) that reads turquoise→violet on near-black; a different dark preset gets its own
// accents. No libraries (CSP-safe), DPR-capped, IntersectionObserver-paused offscreen. reduced-motion
// / no-WebGL → a static token-gradient poster (underneath; the live canvas covers it). A DARK-build
// hero background (character: kinetic). PROP-DRIVEN.

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p,0.0,1.0); }`;
const FRAG = `
precision highp float;
uniform vec2 u_res; uniform float u_time; uniform vec2 u_mouse; uniform float u_scroll;
uniform vec3 u_bg; uniform vec3 u_accent; uniform vec3 u_accent2;
float hash(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float noise(vec2 p){ vec2 i=floor(p),f=fract(p); vec2 u=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),u.x), mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0,1.0)),u.x), u.y); }
float fbm(vec2 p){ float v=0.0,a=0.5; for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.02; a*=0.5; } return v; }
void main(){
  vec2 uv = gl_FragCoord.xy/u_res.xy;
  vec2 p = uv; p.x *= u_res.x/u_res.y;
  float t = u_time*0.05 + u_scroll*0.6;
  vec2 q = vec2(fbm(p*1.6+t), fbm(p*1.6+vec2(5.2,1.3)-t));
  vec2 r = vec2(fbm(p*1.6+q*1.6+vec2(1.7,9.2)+t*0.5), fbm(p*1.6+q*1.6+vec2(8.3,2.8)-t*0.4));
  float f = fbm(p*1.6+r*1.3);
  vec2 m = u_mouse; m.x *= u_res.x/u_res.y;
  float glow = smoothstep(0.45, 0.0, distance(p, m));
  f += glow*0.28 + r.x*0.06;
  vec3 deep = mix(u_bg, u_accent, 0.35);
  vec3 col = mix(u_bg, deep, smoothstep(0.30,0.60,f));
  col = mix(col, u_accent, smoothstep(0.56,0.84,f)*0.66);
  col = mix(col, u_accent2, smoothstep(0.74,0.95,f)*0.46);
  col += u_accent*glow*0.22;
  float vig = smoothstep(1.15,0.15,distance(uv,vec2(0.5,0.42)));
  col *= mix(1.0,0.5,vig*0.65);
  col += (hash(uv*(u_time+1.0))-0.5)*0.018;
  gl_FragColor = vec4(col,1.0);
}`;

// Resolve a CSS-var colour to [r,g,b] in 0..1 via a hidden probe (resolves the var() chain reliably).
function readRgb(host: HTMLElement, cssVar: string, fallback: string): [number, number, number] {
  const probe = document.createElement("span");
  probe.style.cssText = `color:var(${cssVar},${fallback});position:absolute;opacity:0;pointer-events:none`;
  host.appendChild(probe);
  const m = getComputedStyle(probe).color.match(/[\d.]+/g);
  probe.remove();
  return m ? [+m[0] / 255, +m[1] / 255, +m[2] / 255] : [0, 0, 0];
}

export function ShaderHero({ className = "", opacity = 1 }: { className?: string; opacity?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return; // static poster shows
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" });
    if (!gl) return;

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; }
      return s;
    };
    const vs = compile(gl.VERTEX_SHADER, VERT), fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;
    const prog = gl.createProgram()!; gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { console.warn(gl.getProgramInfoLog(prog)); return; }
    gl.useProgram(prog);

    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uRes = gl.getUniformLocation(prog, "u_res"), uTime = gl.getUniformLocation(prog, "u_time"),
      uMouse = gl.getUniformLocation(prog, "u_mouse"), uScroll = gl.getUniformLocation(prog, "u_scroll");

    // palette from the active brand tokens — set once (static per build)
    const host = canvas.parentElement || document.body;
    gl.uniform3f(gl.getUniformLocation(prog, "u_bg"), ...readRgb(host, "--color-navy", "#0a0a0f"));
    gl.uniform3f(gl.getUniformLocation(prog, "u_accent"), ...readRgb(host, "--color-gold", "#40e0d0"));
    gl.uniform3f(gl.getUniformLocation(prog, "u_accent2"), ...readRgb(host, "--color-gold-dark", "#8b5cf6"));

    const dpr = Math.min(window.devicePixelRatio || 1, 1.6);
    let raf = 0, t0 = 0, running = true;
    const mouse = { x: 0.5, y: 0.55, tx: 0.5, ty: 0.55 };
    let scroll = 0;

    const size = () => {
      canvas.width = Math.round(canvas.clientWidth * dpr); canvas.height = Math.round(canvas.clientHeight * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.tx = (e.clientX - r.left) / r.width; mouse.ty = 1 - (e.clientY - r.top) / r.height;
    };
    const onScroll = () => { scroll = Math.min(window.scrollY / (window.innerHeight || 800), 1); };
    const io = new IntersectionObserver((es) => es.forEach((e) => { running = e.isIntersecting; if (running) raf = requestAnimationFrame(frame); }), { threshold: 0 });

    function frame(ts: number) {
      if (!running) return;
      const g = gl!, cv = canvas!; // narrowing lost across the hoisted closure; both const + guarded above
      if (!t0) t0 = ts;
      mouse.x += (mouse.tx - mouse.x) * 0.06; mouse.y += (mouse.ty - mouse.y) * 0.06;
      g.uniform2f(uRes, cv.width, cv.height);
      g.uniform1f(uTime, (ts - t0) / 1000);
      g.uniform2f(uMouse, mouse.x, mouse.y);
      g.uniform1f(uScroll, scroll);
      g.drawArrays(g.TRIANGLES, 0, 3);
      raf = requestAnimationFrame(frame);
    }

    size();
    window.addEventListener("resize", size);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    io.observe(canvas);
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf); io.disconnect();
      window.removeEventListener("resize", size); window.removeEventListener("pointermove", onMove); window.removeEventListener("scroll", onScroll);
      gl.deleteProgram(prog); gl.deleteShader(vs); gl.deleteShader(fs); gl.deleteBuffer(buf);
    };
  }, []);

  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} style={{ opacity }}>
      {/* static poster — reduced-motion / no-WebGL fallback (the live canvas covers it) */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(70% 55% at 30% 68%, color-mix(in oklab, var(--color-gold) 22%, transparent), transparent 60%)," +
            "radial-gradient(60% 50% at 72% 30%, color-mix(in oklab, var(--color-gold-dark) 20%, transparent), transparent 62%)," +
            "var(--color-navy, #0a0a0f)",
        }}
      />
      <canvas ref={ref} className="absolute inset-0 block h-full w-full" />
    </div>
  );
}
