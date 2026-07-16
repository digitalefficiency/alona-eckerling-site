"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useScroll, useMotionValueEvent } from "motion/react";
import { useMotionPrefs } from "@/lib/motion";

// The signature scroll moment for התחדשות עירונית — Emerald's pinned
// line-draw + photo-reveal, re-imagined for Barzilay:
//   • a building rises through 7 crossfaded construction stages (the photo),
//   • a gold blueprint tower line-DRAWS on top (SVG pathLength, scrubbed),
//   • the value story fades through in three chapters.
//
// SINGLE scroll owner: useScroll → apply(p) writes opacity / strokeDashoffset /
// transforms DIRECTLY to refs. Nothing is bound to a motion value (the WAAPI
// "monotonically non-decreasing" crash rule). SSR / no-JS / reduced-motion get a
// fully-built static fallback (final stage + drawn outline + stacked chapters).
//
// The cinematic tree lives in a CHILD component mounted only when active, so its
// useScroll target ref is ATTACHED before the hook's effects run (motion's
// useScroll calls start() once, in a layout/passive effect keyed only on a
// stable callback — if the ref is still null at that point, scrubbing never
// starts). Mounting the child after the gate guarantees a hydrated ref.

const STAGES = [1, 2, 3, 4, 5, 6, 7].map((n) => `/media/building/stage-${n}.webp`);

type Chapter = { kicker: string; title: string; story: string };
const CHAPTERS: Chapter[] = [
  {
    kicker: "השלב הראשון",
    title: "מה אתם מוסרים",
    story: "זכויות הבנייה הטמונות בקרקע ובנכס הקיים שלכם — הנכס שעליו נבנה כל הפרויקט.",
  },
  {
    kicker: "השלב השני",
    title: "מה אתם מקבלים",
    story: "דירה חדשה, תוספת שטח, ממ״ד, מרפסת וחניה — שווי שצריך לכמת במספרים, לא להבטיח במצגת.",
  },
  {
    kicker: "תפקיד השמאי",
    title: "לאזן את המשוואה",
    story: "אנחנו מתרגמים את ההבטחות למספרים ובודקים שהחלוקה בינכם ליזם הוגנת — לפני שחותמים.",
  },
];

// Blueprint tower: silhouette + 6 floor lines + door + crown, each with a scroll
// window [s,e] so they draw in sequence (pathLength normalized to 1).
const FLOORS = [40.3, 54.6, 68.9, 83.2, 97.5, 111.8];
const DRAW: { d: string; s: number; e: number; w: number }[] = [
  { d: "M34,126 L34,26 L66,26 L66,126", s: 0, e: 0.42, w: 1.1 },
  ...FLOORS.map((y, k) => ({
    d: `M34,${y} L66,${y}`,
    s: 0.34 + k * 0.085,
    e: 0.34 + k * 0.085 + 0.085,
    w: 0.7,
  })),
  { d: "M46,126 L46,114 L54,114 L54,126", s: 0.82, e: 0.92, w: 0.8 },
  { d: "M50,16 L54,20 L50,24 L46,20 Z", s: 0.88, e: 1, w: 0.9 },
];

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

export function BuildingAssemblyScene() {
  const prefs = useMotionPrefs();
  const [cinematic, setCinematic] = useState(false);
  useEffect(() => setCinematic(!prefs.reduced), [prefs.reduced]);

  // ---- Static fallback (SSR / no-JS / reduced-motion) ----
  if (!cinematic) {
    return (
      <section className="relative overflow-hidden bg-navy text-white">
        <div className="absolute inset-0">
          <Image src={STAGES[STAGES.length - 1]} alt="מגדל מגורים חדש שנבנה בפרויקט התחדשות עירונית" fill sizes="100vw" className="object-cover opacity-45" />
          <div aria-hidden className="absolute inset-0 bg-navy/70" />
        </div>
        <div className="relative mx-auto max-w-[var(--container-prose)] px-6 py-24 md:py-32">
          <p className="text-center text-xs font-bold tracking-[.2em] text-gold-soft">משוואת הערך בהתחדשות עירונית</p>
          <div className="mt-12 flex flex-col gap-12">
            {CHAPTERS.map((c) => (
              <div key={c.title} className="text-center">
                <span className="text-xs font-bold tracking-[.18em] text-gold-soft">{c.kicker}</span>
                <h3 className="mt-2 font-serif text-2xl font-black text-white">{c.title}</h3>
                <p className="mt-3 text-lg leading-relaxed text-slate-200">{c.story}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return <CinematicScene />;
}

// Mounted only when cinematic — so outerRef is attached before useScroll's
// effects fire and scrubbing reliably starts.
function CinematicScene() {
  const outerRef = useRef<HTMLDivElement>(null);
  const drawWrapRef = useRef<HTMLDivElement>(null);
  const stageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const chapterRefs = useRef<(HTMLDivElement | null)[]>([]);
  const barRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: outerRef,
    offset: ["start start", "end end"],
  });

  const apply = (p: number) => {
    // 1) building stages crossfade — building rises stage-1 → stage-7.
    const sp = p * (STAGES.length - 1);
    stageRefs.current.forEach((el, i) => {
      if (el) el.style.opacity = clamp01(1 - Math.abs(sp - i)).toFixed(3);
    });

    // 2) blueprint line-draw — each segment fills across its [s,e] window.
    DRAW.forEach((seg, i) => {
      const el = pathRefs.current[i];
      if (!el) return;
      const t = clamp01((p - seg.s) / (seg.e - seg.s));
      el.style.strokeDashoffset = String(1 - t);
    });
    // outline also wipes upward (construction rising from the ground).
    if (drawWrapRef.current) {
      drawWrapRef.current.style.setProperty("--reveal", `${(clamp01(p * 1.5) * 100).toFixed(0)}%`);
    }

    // 3) chapters fade through, one at a time.
    const n = CHAPTERS.length;
    chapterRefs.current.forEach((el, i) => {
      if (!el) return;
      const center = (i + 0.5) / n;
      const half = (0.5 / n) * 0.82;
      const o = clamp01(1 - Math.abs(p - center) / half);
      el.style.opacity = String(o);
      el.style.transform = `translateY(${(1 - o) * 24}px)`;
      el.style.pointerEvents = o > 0.6 ? "auto" : "none";
    });

    if (barRef.current) barRef.current.style.width = `${(p * 100).toFixed(2)}%`;
  };

  useMotionValueEvent(scrollYProgress, "change", apply);
  useEffect(() => {
    apply(scrollYProgress.get());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section
      ref={outerRef}
      className="relative bg-navy"
      style={{ height: `${CHAPTERS.length * 95 + 30}vh` }}
      aria-label="כיצד נבנה ערך בפרויקט התחדשות עירונית"
    >
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* building stages */}
        {STAGES.map((src, i) => (
          <div
            key={src}
            ref={(el) => { stageRefs.current[i] = el; }}
            className="absolute inset-0 will-change-[opacity]"
            style={{ opacity: i === 0 ? 1 : 0 }}
          >
            <Image src={src} alt="" fill sizes="100vw" className="object-cover" loading="lazy" />
          </div>
        ))}

        {/* scrim — deepens toward the reading start (right) for chapter legibility */}
        <div
          aria-hidden
          className="absolute inset-0 z-10"
          style={{
            background:
              "linear-gradient(to left, rgba(10,30,63,.86) 0%, rgba(10,30,63,.55) 42%, rgba(10,30,63,.2) 72%, rgba(10,30,63,.5) 100%)",
          }}
        />

        {/* blueprint line-draw tower */}
        <div
          ref={drawWrapRef}
          aria-hidden
          className="absolute inset-0 z-20 grid place-items-center"
          style={{
            ["--reveal" as string]: "0%",
            WebkitMaskImage: "linear-gradient(to top, #000 var(--reveal), transparent calc(var(--reveal) + 12%))",
            maskImage: "linear-gradient(to top, #000 var(--reveal), transparent calc(var(--reveal) + 12%))",
          }}
        >
          <svg viewBox="0 0 100 140" className="h-[72vh] w-auto" fill="none" preserveAspectRatio="xMidYMid meet">
            {DRAW.map((seg, i) => (
              <path
                key={i}
                ref={(el) => { pathRefs.current[i] = el; }}
                d={seg.d}
                stroke="var(--color-gold)"
                strokeWidth={seg.w}
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={1}
                vectorEffect="non-scaling-stroke"
                style={{ opacity: 0.85 }}
              />
            ))}
          </svg>
        </div>

        {/* chapters */}
        {CHAPTERS.map((c, i) => (
          <div
            key={c.title}
            ref={(el) => { chapterRefs.current[i] = el; }}
            className="absolute inset-0 z-30 flex items-center px-6 md:px-20"
            style={{ opacity: i === 0 ? 1 : 0 }}
          >
            <div className="max-w-[34rem] text-right">
              <span className="text-xs font-bold tracking-[.22em] text-gold-soft">{c.kicker}</span>
              <h3 className="mt-3 font-serif font-black leading-tight text-white" style={{ fontSize: "clamp(2rem, 5vw, 3.4rem)" }}>
                {c.title}
              </h3>
              <span className="mt-5 block h-px w-16 bg-gold/60" aria-hidden />
              <p className="mt-6 text-lg leading-relaxed text-slate-100 md:text-xl">{c.story}</p>
            </div>
          </div>
        ))}

        {/* progress bar */}
        <div className="absolute inset-x-0 bottom-0 z-40 h-1 bg-white/10">
          <div ref={barRef} className="h-full bg-gold" style={{ width: "0%" }} />
        </div>
      </div>
    </section>
  );
}
