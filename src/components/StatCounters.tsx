"use client";

import { useEffect, useRef, useState } from "react";
import { yearsOfExperience } from "@/lib/site";

type Stat = { to?: number; suffix?: string; text?: string; label: string };

// Editorial stat band — large display numerals that roll up on an odometer when
// scrolled into view. YMYL: only honest durations/counts animate (experience
// years, generations, books). "שנות ניסיון" is DERIVED from the founding year
// so it never goes stale. Reduced-motion → final value, no roll.
const STATS: Stat[] = [
  { to: yearsOfExperience(), label: "שנות ניסיון" },
  { to: 3, label: "דורות במקצוע" },
  { to: 8, label: "ספרים מקצועיים" },
  { text: "אלפי", label: "חוות דעת ושומות" },
];

function DigitColumn({ digit, active, reduce, delay }: { digit: number; active: boolean; reduce: boolean; delay: number }) {
  const y = active || reduce ? -digit * 10 : 0;
  return (
    <span
      aria-hidden
      className="relative inline-block overflow-hidden align-baseline tabular-nums"
      style={{ height: "1em", width: "0.62em" }}
    >
      <span
        className="block"
        style={{
          transform: `translateY(${y}%)`,
          transition: reduce ? "none" : "transform calc(var(--dur-reveal) * 1.2) var(--ease-out)",
          transitionDelay: reduce ? undefined : `${delay}ms`,
        }}
      >
        {Array.from({ length: 10 }, (_, n) => (
          <span key={n} className="flex items-center justify-center" style={{ height: "1em" }}>
            {n}
          </span>
        ))}
      </span>
    </span>
  );
}

function DigitRoll({ value, active, reduce }: { value: number; active: boolean; reduce: boolean }) {
  const digits = String(value).split("");
  return (
    <span className="inline-flex" dir="ltr">
      <span className="sr-only">{value}</span>
      {digits.map((d, i) => (
        <DigitColumn key={i} digit={Number(d)} active={active} reduce={reduce} delay={i * 90} />
      ))}
    </span>
  );
}

function StatItem({ stat, active, reduce }: { stat: Stat; active: boolean; reduce: boolean }) {
  const numeric = stat.to != null;
  return (
    <div className="text-center" data-shown={active ? "" : undefined}>
      <div className="font-serif font-black leading-none text-white" style={{ fontSize: "var(--text-stat)" }}>
        {numeric ? (
          <>
            <DigitRoll value={stat.to as number} active={active} reduce={reduce} />
            {stat.suffix}
          </>
        ) : (
          stat.text
        )}
      </div>
      <span className="rule-draw mx-auto mt-4 block h-px w-10 bg-gold/60" aria-hidden />
      <div className="mt-3 text-sm font-semibold tracking-wide text-gold-soft/90">{stat.label}</div>
    </div>
  );
}

export function StatCounters() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(false);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    setReduce(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setActive(true);
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section className="relative overflow-hidden bg-navy text-white">
      {/* A blueprint texture used to sit here, inherited from the source design
          system. /media/texture/ was never provisioned for this site, so it
          fetched a 404 and painted nothing. Removed rather than provisioned:
          the palette here is the client's own, not the one that texture was cut
          for. Same removal as Monogram in media/Portrait.tsx. */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: "radial-gradient(720px 300px at 50% -30%, rgba(200,164,92,.14), transparent 60%)" }}
      />
      <div
        ref={ref}
        className="relative mx-auto grid max-w-[var(--container-standard)] grid-cols-2 gap-y-12 px-6 py-20 md:grid-cols-4 md:py-24"
      >
        {STATS.map((s) => (
          <StatItem key={s.label} stat={s} active={active} reduce={reduce} />
        ))}
      </div>
    </section>
  );
}
