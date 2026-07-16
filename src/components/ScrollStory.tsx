"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useScroll, useMotionValueEvent } from "motion/react";
import {
  Building2,
  Landmark,
  Award,
  GraduationCap,
  Compass,
  ShieldCheck,
  Layers,
  LayoutGrid,
  Phone,
  type LucideIcon,
} from "lucide-react";
import { Scene3D } from "@/components/three/Scene3D";
import { services } from "@/lib/site";

type Stat = { k: string; v: string };
type Card = {
  num: string;
  icon: LucideIcon;
  kicker: string;
  genLabel?: string;
  title: string;
  body?: string;
  stats?: Stat[];
  items?: string[];
  services?: typeof services[number][];
  cta?: boolean;
};

const CARDS: Card[] = [
  {
    num: "01",
    icon: Building2,
    kicker: "שמאות מקרקעין · מאז 1987",
    title: "שלושה דורות. אלפי תיקים. תשובה אחת נכונה.",
    body: "משרד ברזילי מלווה בעלי נכסים, יזמים ועורכי דין בכל שאלה של שווי מקרקעין — מהיטל השבחה ועד חוות דעת מומחה לבית המשפט. כל נכס מתחיל בהערכה אחת נכונה.",
  },
  {
    num: "02",
    icon: Landmark,
    kicker: "המשרד",
    title: "מורשת שנבנתה דור אחר דור",
    body: "מאז 1987 אנחנו מציבים אמת מידה אחת — שיקול דעת, יושרה ודיוק. שלושה דורות תחת קורת גג אחת, עם ניסיון אמיתי בשטח מאחורי כל חוות דעת.",
    stats: [
      { k: "1987", v: "EST." },
      { k: "3", v: "GEN" },
      { k: "אלפים", v: "תיקים" },
    ],
  },
  {
    num: "03",
    icon: Award,
    kicker: "השושלת",
    genLabel: "GEN 01 / 03",
    title: "שרונה ברזילי — המייסדת",
    body: "שרונה ברזילי הקימה את המשרד ב‑1987 והניחה את היסוד: מקצועיות ללא פשרות. מצטיינת העשור 1980–1990 מטעם לשכת שמאי המקרקעין — ממנה התחילה השושלת.",
    items: ["ייסדה את המשרד ב‑1987", "מצטיינת העשור מטעם הלשכה"],
  },
  {
    num: "04",
    icon: GraduationCap,
    kicker: "השושלת",
    genLabel: "GEN 02 / 03",
    title: "ד״ר בועז ברזילי — הסמכות",
    body: "ד״ר בועז ברזילי הפך את השם לסמכות מקצועית: העומק האקדמי שמאחורי כל חוות דעת, וניסיון של עשרות שנים מול ועדות, רשויות ובתי משפט.",
    items: [
      "דוקטור למקרקעין (אוניברסיטת ת״א)",
      "שמאי מכריע מטעם משרד המשפטים",
      "חבר ועדת ערר למס שבח · רישיון #307",
      "מחבר 8 ספרים מקצועיים",
    ],
  },
  {
    num: "05",
    icon: Compass,
    kicker: "השושלת",
    genLabel: "GEN 03 / 03",
    title: "רועי ברזילי — ההמשכיות",
    body: "רועי ברזילי מוביל את המשרד אל הדור הבא: אותה מורשת, בשפה של היום. מימון ויזמות נדל״ן, ליווי אישי וצמוד, ונוכחות מקצועית בכל ערוץ.",
    items: ["מומחה מטעם בתי משפט", "מימון ויזמות נדל״ן", "ליווי אישי לכל לקוח"],
  },
  {
    num: "06",
    icon: ShieldCheck,
    kicker: "למה ברזילי",
    title: "לא עוד שומה. תשובה.",
    body: "ההבדל בינינו לבין „מפעל שומות” הוא היחס. כל תיק מקבל ליווי אישי, וכל חוות דעת עומדת במבחן הוועדה, הרשות ובית המשפט.",
    items: [
      "אלפי חוות דעת בכל תחומי השמאות",
      "ליווי אישי וצמוד מתחילת התהליך",
      "מינויים כמומחים מטעם בתי משפט",
      "ניסיון רב‑דורי שאין לו תחליף",
    ],
  },
  {
    num: "07",
    icon: Layers,
    kicker: "תחומי התמחות",
    title: "מה אנחנו עושים",
    body: "לכל תחום מדריך מקצועי מקיף — לחצו לפרטים המלאים.",
    services: services.slice(0, 4) as unknown as typeof services[number][],
  },
  {
    num: "08",
    icon: LayoutGrid,
    kicker: "תחומי התמחות",
    title: "מקצה לקצה",
    services: services.slice(4, 8) as unknown as typeof services[number][],
  },
  {
    num: "09",
    icon: Phone,
    kicker: "הערכת שווי · ROOFTOP",
    title: "מוכנים לדעת כמה הנכס שלכם באמת שווה?",
    body: "השמאים שלנו מגיעים אליכם. שיחת ייעוץ ראשונית — ללא התחייבות. נבדוק את המקרה ונאמר לכם בדיוק איפה אתם עומדים.",
    cta: true,
  },
];

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
function ramp(p: number, a: number, b: number, c: number, d: number) {
  if (p <= a) return 0;
  if (p < b) return (p - a) / (b - a);
  if (p <= c) return 1;
  if (p < d) return 1 - (p - c) / (d - c);
  return 0;
}
const rv = (i: number) => ({ "--i": i }) as React.CSSProperties;

function Elevation({ idx, total }: { idx: number; total: number }) {
  const y = (k: number) => 8 + k * (344 / (total - 1));
  return (
    <svg
      viewBox="0 0 56 360"
      className="floor-elevation hidden h-full w-full md:block"
      aria-hidden
      fill="none"
      preserveAspectRatio="xMidYMid meet"
    >
      <line x1="40" y1="8" x2="40" y2="352" stroke="var(--color-gold)" strokeOpacity=".22" />
      {Array.from({ length: total }).map((_, k) => {
        const on = k === idx;
        return (
          <g key={k}>
            <line
              x1={on ? 22 : 32}
              y1={y(k)}
              x2="40"
              y2={y(k)}
              stroke="var(--color-gold)"
              strokeOpacity={on ? ".9" : ".28"}
            />
            {on && <circle cx="40" cy={y(k)} r="3.5" fill="var(--color-gold)" />}
          </g>
        );
      })}
      <text
        x="6"
        y={y(idx) + 3}
        fill="var(--color-gold-soft)"
        fontFamily="var(--font-mono)"
        fontSize="8"
      >
        +{(idx * 3).toFixed(1)}m
      </text>
    </svg>
  );
}

function CardPanel({ card, idx, total }: { card: Card; idx: number; total: number }) {
  const Icon = card.icon;
  let n = 2;
  return (
    <article className="floor-plate group relative grid w-full max-w-[40rem] gap-x-5 overflow-hidden rounded-[14px] border border-gold/25 p-7 [grid-template-columns:3rem_1fr] shadow-[0_30px_90px_-30px_rgba(0,0,0,.9),inset_0_1px_0_rgba(243,232,207,.14)] md:p-9 md:[grid-template-columns:3.25rem_1fr_4.25rem]">
      {/* base fill */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{ background: "linear-gradient(150deg, rgba(15,42,86,.72), rgba(10,30,63,.5))" }}
      />
      {/* blueprint grid */}
      <div
        aria-hidden
        className="grid-bg absolute inset-0 -z-10 opacity-[.06]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg,var(--color-gold) 0 1px,transparent 1px 26px),repeating-linear-gradient(90deg,var(--color-gold) 0 1px,transparent 1px 26px)",
          WebkitMaskImage: "radial-gradient(130% 100% at 85% 12%, #000 22%, transparent 78%)",
          maskImage: "radial-gradient(130% 100% at 85% 12%, #000 22%, transparent 78%)",
        }}
      />
      {/* corner ticks */}
      <span aria-hidden className="tick tick-1" />
      <span aria-hidden className="tick tick-2" />
      <span aria-hidden className="tick tick-3" />
      <span aria-hidden className="tick tick-4" />
      {/* sheet tag */}
      <span
        aria-hidden
        dir="ltr"
        className="pointer-events-none absolute left-4 top-3 font-mono text-[10px] tracking-[.25em] text-gold-soft/45"
      >
        SHEET A-{card.num}
      </span>

      {/* GUTTER (right in RTL) */}
      <div className="floor-gutter relative flex flex-col items-center" aria-hidden dir="ltr">
        <span className="font-mono text-[9px] tracking-[.35em] text-gold/45 [writing-mode:vertical-rl] rotate-180">
          FLOOR
        </span>
        <span className="floor-num mt-1 font-serif text-[3rem] font-black leading-none tabular-nums text-gold xl:text-[3.5rem]">
          {card.num}
        </span>
        <div className="mt-3 flex flex-1 flex-col items-center gap-1.5">
          {Array.from({ length: total }).map((_, k) => (
            <span
              key={k}
              className={`h-1.5 w-1.5 rounded-full ${
                k === idx
                  ? "bg-gold shadow-[0_0_8px_var(--color-gold)]"
                  : k < idx
                    ? "bg-gold/30"
                    : "bg-white/15"
              }`}
            />
          ))}
        </div>
      </div>

      {/* CONTENT */}
      <div className="relative min-w-0">
        <span aria-hidden className="ghost-num">
          {card.num}
        </span>

        <div className="reveal flex items-center gap-3" style={rv(0)}>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-gold/10 text-gold">
            <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          </span>
          <span className="whitespace-nowrap text-[11px] font-bold tracking-[.15em] text-gold-soft">
            {card.kicker}
          </span>
          <span className="dim-line" aria-hidden>
            <i className="dim-cap" />
            <i className="dim-run" />
            <i className="dim-cap" />
          </span>
        </div>

        {card.genLabel && (
          <span
            dir="ltr"
            className="reveal mt-5 inline-block rounded-[3px] border border-gold/40 bg-gold/10 px-2.5 py-1 font-mono text-[10px] tracking-[.2em] text-gold-soft"
            style={rv(1)}
          >
            {card.genLabel}
          </span>
        )}

        <h2
          className={`reveal font-serif text-3xl font-black leading-[1.1] text-white md:text-[2.5rem] ${
            card.genLabel ? "mt-3" : "mt-5"
          }`}
          style={rv(1)}
        >
          {card.title}
        </h2>

        {card.body && (
          <p className="reveal mt-4 text-[1.05rem] leading-relaxed text-slate-200" style={rv(n++)}>
            {card.body}
          </p>
        )}

        {card.stats && (
          <div className="mt-6 grid grid-cols-3 gap-4">
            {card.stats.map((s) => (
              <div key={s.v} className="reveal border-b border-gold/30 px-1 py-2 text-center" style={rv(n++)}>
                <div className="font-serif text-3xl font-black tabular-nums text-gold">{s.k}</div>
                <div className="mt-1 font-mono text-[10px] tracking-wider text-slate-300" dir="ltr">
                  {s.v}
                </div>
              </div>
            ))}
          </div>
        )}

        {card.items && (
          <ul className="mt-5 space-y-3">
            {card.items.map((it) => (
              <li key={it} className="reveal flex items-start gap-3 text-slate-100" style={rv(n++)}>
                <span className="mt-1 font-mono text-gold" aria-hidden>
                  ▸
                </span>
                <span className="leading-snug">{it}</span>
              </li>
            ))}
          </ul>
        )}

        {card.services && (
          <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {card.services.map((s, k) => {
              const flagship = "flagship" in s && s.flagship;
              return (
                <Link
                  key={s.slug}
                  href={`/services/${s.slug}`}
                  className={`reveal group/svc relative rounded-[8px] border bg-white/5 p-3.5 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
                    flagship ? "border-gold/60" : "border-white/10 hover:border-gold/50"
                  }`}
                  style={rv(n++)}
                >
                  <span
                    dir="ltr"
                    className="absolute left-3 top-2.5 font-mono text-[9px] tracking-wider text-gold-soft/40"
                  >
                    R-0{idx === 6 ? k + 1 : k + 5}
                  </span>
                  <span className="block font-bold text-white group-hover/svc:text-gold-soft">
                    {s.title}
                  </span>
                  <span className="mt-0.5 block text-xs leading-snug text-slate-300">{s.short}</span>
                </Link>
              );
            })}
            <Link
              href="/services"
              className="reveal text-sm font-semibold text-gold-soft hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold sm:col-span-2"
              style={rv(n++)}
            >
              כל תחומי ההתמחות ›
            </Link>
          </div>
        )}

        {card.cta && (
          <div className="reveal mt-7 flex flex-wrap gap-3" style={{ ...rv(n++), transform: "translateZ(20px)" }}>
            <Link
              href="/contact"
              data-cta="story-consult"
              className="rounded-xl bg-gold px-6 py-3.5 font-bold text-navy transition hover:bg-gold-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              שיחת ייעוץ ראשונית
            </Link>
            <Link
              href="/services/improvement-levy"
              data-cta="story-guide"
              className="rounded-xl border border-white/30 px-6 py-3.5 font-semibold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              מדריך היטל השבחה 2026
            </Link>
          </div>
        )}
      </div>

      {/* ELEVATION (left in RTL) */}
      <Elevation idx={idx} total={total} />
    </article>
  );
}

export function ScrollStory() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  const total = CARDS.length;
  const seg = 1 / total;

  const apply = (p: number) => {
    progressRef.current = p;

    const vid = videoRef.current;
    if (vid && vid.duration) {
      const t = clamp(p) * (vid.duration - 0.04);
      if (Math.abs(vid.currentTime - t) > 0.02) vid.currentTime = t;
    }

    for (let i = 0; i < total; i++) {
      const a = i === 0 ? -1 : i * seg - 0.06;
      const b = i === 0 ? 0 : i * seg + 0.04;
      const c = (i + 1) * seg - 0.04;
      const d = i === total - 1 ? 2 : (i + 1) * seg + 0.06;
      const op = ramp(p, a, b, c, d);
      const lp = clamp((p - a) / 0.12);
      const dock = clamp((op - 0.55) / 0.35);
      const ty = (1 - op) * 54;
      const tx = (1 - op) * 26;
      const settle = lp > 0.82 ? ((1 - lp) / 0.18) * (i === total - 1 ? -6 : -4) : 0;
      const scale = 0.955 + op * 0.045;
      const el = cardRefs.current[i];
      if (!el) continue;
      el.style.opacity = op.toFixed(3);
      el.style.setProperty("--card-ty", `${(ty + settle).toFixed(1)}px`);
      el.style.setProperty("--card-tx", `${tx.toFixed(1)}px`);
      el.style.setProperty("--card-scale", scale.toFixed(3));
      el.style.setProperty("--lp", lp.toFixed(3));
      el.style.setProperty("--dock", dock.toFixed(3));
      el.style.setProperty("--reveal", `${(lp * 100).toFixed(0)}%`);
      el.style.setProperty("--blur", op > 0.05 ? "16px" : "0px");
      el.inert = op <= 0.5;
      el.style.pointerEvents = op > 0.5 ? "auto" : "none";
      el.style.willChange = op > 0.05 ? "transform, opacity" : "auto";
    }

    if (barRef.current) barRef.current.style.width = `${(p * 100).toFixed(2)}%`;
  };

  useMotionValueEvent(scrollYProgress, "change", apply);
  useEffect(() => {
    apply(scrollYProgress.get());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pointer-tilt — single rAF-throttled listener on the host; gated to fine pointers.
  useEffect(() => {
    const host = stickyRef.current;
    if (!host) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    let raf = 0;
    const target = { x: 0, y: 0 };
    const cur = { x: 0, y: 0 };
    const loop = () => {
      cur.x += (target.x - cur.x) * 0.12;
      cur.y += (target.y - cur.y) * 0.12;
      host.style.setProperty("--mx", cur.x.toFixed(3));
      host.style.setProperty("--my", cur.y.toFixed(3));
      raf =
        Math.abs(target.x - cur.x) > 0.001 || Math.abs(target.y - cur.y) > 0.001
          ? requestAnimationFrame(loop)
          : 0;
    };
    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      target.x = (e.clientX - r.left) / r.width - 0.5;
      target.y = (e.clientY - r.top) / r.height - 0.5;
      if (!raf) raf = requestAnimationFrame(loop);
    };
    const onLeave = () => {
      target.x = 0;
      target.y = 0;
      if (!raf) raf = requestAnimationFrame(loop);
    };
    host.addEventListener("pointermove", onMove, { passive: true });
    host.addEventListener("pointerleave", onLeave);
    return () => {
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative bg-navy"
      style={{ height: `${total * 120}vh` }}
      aria-label="חוויית הבנייה של משרד ברזילי"
    >
      <div ref={stickyRef} className="sticky top-0 h-screen overflow-hidden">
        {/* Building animation — scroll-scrubbed Higgsfield time-lapse */}
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          muted
          playsInline
          preload="auto"
          poster="/media/building/stage-1.webp"
          aria-hidden="true"
        >
          <source src="/media/story/building-scrub.mp4" type="video/mp4" />
        </video>

        <Scene3D progressRef={progressRef} />

        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10"
          style={{
            background:
              "linear-gradient(to left, rgba(10,30,63,.82) 0%, rgba(10,30,63,.5) 38%, rgba(10,30,63,.18) 70%, rgba(10,30,63,.45) 100%)",
          }}
        />

        {/* Floor-plate cards — dock into place from the right */}
        {CARDS.map((card, i) => (
          <div
            key={card.title}
            className="absolute inset-0 z-20 flex items-center justify-center px-6 md:justify-start md:px-20"
          >
            <div
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              className="floor-slot-card"
              style={{ opacity: i === 0 ? 1 : 0 }}
            >
              <CardPanel card={card} idx={i} total={total} />
            </div>
          </div>
        ))}

        <div className="absolute inset-x-0 bottom-0 z-30 h-1 bg-white/10">
          <div ref={barRef} className="h-full bg-gold" style={{ width: "0%" }} />
        </div>
      </div>
    </section>
  );
}
