"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useScroll, useMotionValueEvent } from "motion/react";
import { useMotionPrefs } from "@/lib/motion";

type Chapter = { gen: string; name: string; story: string };

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

// Scroll-driven "move inside the image" experience: a pinned full-viewport photo
// that zooms + pans as you scroll, while the firm's three-generation story fades
// through in chapters. Single scroll owner — reads useScroll and writes
// transforms/opacity DIRECTLY to the DOM (the project's WAAPI-safe rule).
// SSR / no-JS / reduced-motion render a static, fully-readable fallback.
//
// The cinematic tree is a CHILD mounted only when active, so useScroll's target
// ref is attached before the hook's effects run and scrubbing reliably starts.
export function StoryJourney({
  image,
  alt,
  chapters,
}: {
  image: string;
  alt: string;
  chapters: Chapter[];
}) {
  const prefs = useMotionPrefs();
  const [cinematic, setCinematic] = useState(false);
  useEffect(() => setCinematic(!prefs.reduced), [prefs.reduced]);

  // ---- Static fallback (SSR / no-JS / reduced-motion) ----
  if (!cinematic) {
    return (
      <section className="relative overflow-hidden bg-navy text-white">
        <div className="absolute inset-0">
          <Image src={image} alt={alt} fill sizes="100vw" className="object-cover opacity-40" />
          <div aria-hidden className="absolute inset-0 bg-navy/70" />
        </div>
        <div className="relative mx-auto max-w-[var(--container-prose)] px-6 py-24 md:py-32">
          <p className="text-center text-xs font-bold tracking-[.2em] text-gold-soft">סיפור המשרד · שלושה דורות</p>
          <div className="mt-12 flex flex-col gap-12">
            {chapters.map((c) => (
              <div key={c.name} className="text-center">
                <span className="text-xs font-bold tracking-[.18em] text-gold-soft">{c.gen}</span>
                <h3 className="mt-2 font-serif text-2xl font-black text-white">{c.name}</h3>
                <p className="mt-3 text-lg leading-relaxed text-slate-200">{c.story}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return <StoryJourneyCinematic image={image} alt={alt} chapters={chapters} />;
}

// Mounted only when cinematic — guarantees outerRef is hydrated before useScroll.
function StoryJourneyCinematic({
  image,
  alt,
  chapters,
}: {
  image: string;
  alt: string;
  chapters: Chapter[];
}) {
  const outerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLDivElement>(null);
  const chapterRefs = useRef<(HTMLDivElement | null)[]>([]);
  const { scrollYProgress } = useScroll({
    target: outerRef,
    offset: ["start start", "end end"],
  });

  const apply = (p: number) => {
    const n = chapters.length;
    if (imgRef.current) {
      const scale = 1 + p * 0.55; // gentle, controlled zoom-in (max ~1.55)
      const tx = (0.5 - p) * 5; // subtle pan
      const ty = (0.5 - p) * 3.5;
      imgRef.current.style.transform = `translate3d(${tx}%, ${ty}%, 0) scale(${scale})`;
    }
    chapterRefs.current.forEach((el, i) => {
      if (!el) return;
      const center = (i + 0.5) / n;
      // window just shy of half the inter-chapter distance → clean one-at-a-time
      // hand-off (no two chapter texts visible at once), with a brief image-only beat.
      const half = (0.5 / n) * 0.82;
      const o = clamp01(1 - Math.abs(p - center) / half);
      el.style.opacity = String(o);
      el.style.transform = `translateY(${(1 - o) * 28}px)`;
      el.style.pointerEvents = o > 0.6 ? "auto" : "none";
    });
  };

  useMotionValueEvent(scrollYProgress, "change", apply);
  useEffect(() => {
    apply(scrollYProgress.get());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section ref={outerRef} className="relative bg-navy" style={{ height: `${chapters.length * 85 + 25}vh` }}>
      <div className="sticky top-0 h-screen overflow-hidden">
        <div ref={imgRef} className="absolute inset-0 will-change-transform">
          <Image src={image} alt={alt} fill sizes="100vw" className="object-cover" />
        </div>
        <div aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(rgba(10,30,63,.5), rgba(10,30,63,.5)), radial-gradient(120% 100% at 50% 50%, transparent 30%, rgba(10,30,63,.6) 100%)" }} />

        {chapters.map((c, i) => (
          <div
            key={c.name}
            ref={(el) => { chapterRefs.current[i] = el; }}
            className="absolute inset-0 flex items-center justify-center px-6"
            style={{ opacity: i === 0 ? 1 : 0 }}
          >
            <div className="max-w-[640px] text-center">
              <span className="text-xs font-bold tracking-[.22em] text-gold-soft">{c.gen}</span>
              <h3 className="mt-3 font-serif font-black leading-tight text-white" style={{ fontSize: "clamp(2.2rem, 6vw, 4rem)" }}>
                {c.name}
              </h3>
              <div className="mx-auto mt-5 h-px w-16 bg-gold/60" aria-hidden />
              <p className="mt-6 text-lg leading-relaxed text-slate-100 md:text-xl">{c.story}</p>
            </div>
          </div>
        ))}

        {/* progress dots */}
        <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 gap-2.5">
          {chapters.map((c) => (
            <span key={c.name} className="h-1.5 w-1.5 rounded-full bg-gold/50" aria-hidden />
          ))}
        </div>
      </div>
    </section>
  );
}
