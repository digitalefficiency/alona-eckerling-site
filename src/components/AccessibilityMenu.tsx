"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

// useLayoutEffect on the client (restores settings before paint), useEffect on the
// server render pass — avoids React's SSR "useLayoutEffect does nothing" warning.
const useIso = typeof window !== "undefined" ? useLayoutEffect : useEffect;

// Built-in accessibility menu (תקן ת״י 5568) — a floating button that opens a panel
// of adjustments applied to <html> and persisted in localStorage. Each setting is a
// class or inline style on the root element; the root-element `filter` exception keeps
// the fixed header/banner anchored to the viewport. No third-party widget, no cost.

// KEY + base px are shared with the pre-paint bootstrap script in layout.tsx
// (lib/a11y-boot) so the two can never drift apart.
import { A11Y_KEY as KEY, A11Y_BASE_PX } from "@/lib/a11y-boot";

const TEXT_STEPS = [100, 115, 130, 145] as const;

type Settings = {
  textPct: number;
  contrast: boolean;
  grayscale: boolean;
  links: boolean;
  readable: boolean;
  stopMotion: boolean;
  bigCursor: boolean;
};

const DEFAULTS: Settings = {
  textPct: 100,
  contrast: false,
  grayscale: false,
  links: false,
  readable: false,
  stopMotion: false,
  bigCursor: false,
};

function load(): Settings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {
    return DEFAULTS;
  }
}

function apply(s: Settings) {
  const root = document.documentElement;
  // Font size — inline overrides the @layer base html font-size (17px).
  root.style.fontSize = s.textPct !== 100 ? `${((A11Y_BASE_PX * s.textPct) / 100).toFixed(1)}px` : "";
  // Contrast + grayscale combine into one filter on the ROOT (does not reparent fixed).
  const filters: string[] = [];
  if (s.contrast) filters.push("contrast(1.4)");
  if (s.grayscale) filters.push("grayscale(1)");
  root.style.filter = filters.join(" ");
  root.classList.toggle("a11y-links", s.links);
  root.classList.toggle("a11y-readable", s.readable);
  root.classList.toggle("a11y-stop-motion", s.stopMotion);
  root.classList.toggle("a11y-big-cursor", s.bigCursor);
}

export function AccessibilityMenu() {
  const [open, setOpen] = useState(false);
  const [s, setS] = useState<Settings>(DEFAULTS);
  const panelRef = useRef<HTMLDivElement>(null);

  // Restore saved settings before paint (minimizes flash for returning users).
  useIso(() => {
    const loaded = load();
    setS(loaded);
    apply(loaded);
  }, []);

  const update = useCallback((patch: Partial<Settings>) => {
    setS((prev) => {
      const next = { ...prev, ...patch };
      apply(next);
      try {
        window.localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* best-effort */
      }
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    apply(DEFAULTS);
    setS(DEFAULTS);
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      /* best-effort */
    }
  }, []);

  const bumpText = (dir: 1 | -1) => {
    const i = TEXT_STEPS.indexOf(s.textPct as (typeof TEXT_STEPS)[number]);
    const idx = i === -1 ? 0 : i;
    const next = TEXT_STEPS[Math.min(TEXT_STEPS.length - 1, Math.max(0, idx + dir))];
    update({ textPct: next });
  };

  // Esc closes the panel.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const anyOn =
    s.textPct !== 100 || s.contrast || s.grayscale || s.links || s.readable || s.stopMotion || s.bigCursor;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="פתיחת תפריט נגישות"
        aria-expanded={open}
        aria-controls="a11y-panel"
        // Below md the StickyContactBar owns the bottom --chrome-bottom of the
        // viewport; anchoring at bottom-4 put this 51px button on top of the
        // «בואי נדבר» half of the conversion bar (a stolen tap strip, and a
        // mis-tap trap). Clear the bar on mobile, keep the original inset on md+
        // where the bar does not render. left-4 (physical) is deliberate and
        // documented — the RTL start corner belongs to WhatsAppFloat.
        className="fixed bottom-[calc(var(--chrome-bottom)+0.75rem)] left-4 z-[var(--z-a11y)] grid h-12 w-12 place-items-center rounded-full border border-gold/40 bg-navy text-gold-soft shadow-(--elevation-3) transition hover:bg-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 md:bottom-4"
      >
        {/* universal accessibility glyph */}
        <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden fill="currentColor">
          <circle cx="12" cy="4" r="2" />
          <path d="M21 8.5c-2.7.9-5.2 1.3-9 1.3S5.7 9.4 3 8.5l.5 2c2 .7 3.9 1 5.5 1.1v2.2L7.7 20l1.9.5L11 16h2l1.4 4.5 1.9-.5-1.3-6.2v-2.2c1.6-.1 3.5-.4 5.5-1.1z" />
        </svg>
      </button>

      {open && (
        <div
          id="a11y-panel"
          ref={panelRef}
          role="dialog"
          aria-label="הגדרות נגישות"
          className="fixed bottom-[calc(var(--chrome-bottom)+4.25rem)] left-4 z-[calc(var(--z-a11y)+1)] max-h-[75vh] w-[min(20rem,calc(100vw-2rem))] overflow-auto rounded-2xl border border-line bg-card p-4 text-right text-navy shadow-(--elevation-3) md:bottom-20"
        >
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="סגירת תפריט נגישות"
              className="grid h-8 w-8 place-items-center rounded-[6px] text-muted transition hover:bg-line/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              ✕
            </button>
            <p className="font-serif text-lg font-bold">תפריט נגישות</p>
          </div>

          {/* font size */}
          <div className="mt-4 flex items-center justify-between gap-2">
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => bumpText(-1)}
                aria-label="הקטנת טקסט"
                className="h-9 w-9 rounded-[6px] border border-line text-lg font-bold transition hover:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                −
              </button>
              <button
                type="button"
                onClick={() => bumpText(1)}
                aria-label="הגדלת טקסט"
                className="h-9 w-9 rounded-[6px] border border-line text-lg font-bold transition hover:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                +
              </button>
            </div>
            <span className="text-sm font-semibold">גודל טקסט · {s.textPct}%</span>
          </div>

          {/* toggles */}
          <ul className="mt-3 space-y-1.5">
            <Toggle label="ניגודיות גבוהה" on={s.contrast} onClick={() => update({ contrast: !s.contrast })} />
            <Toggle label="גווני אפור" on={s.grayscale} onClick={() => update({ grayscale: !s.grayscale })} />
            <Toggle label="הדגשת קישורים" on={s.links} onClick={() => update({ links: !s.links })} />
            <Toggle label="גופן קריא" on={s.readable} onClick={() => update({ readable: !s.readable })} />
            <Toggle label="עצירת אנימציות" on={s.stopMotion} onClick={() => update({ stopMotion: !s.stopMotion })} />
            <Toggle label="סמן עכבר מוגדל" on={s.bigCursor} onClick={() => update({ bigCursor: !s.bigCursor })} />
          </ul>

          <button
            type="button"
            onClick={reset}
            disabled={!anyOn}
            className="mt-4 w-full rounded-[6px] border border-line py-2.5 text-sm font-bold transition hover:border-gold disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            איפוס הגדרות
          </button>

          <Link
            href="/accessibility"
            onClick={() => setOpen(false)}
            className="mt-3 block text-center text-sm font-semibold text-gold-ink underline hover:text-gold-dark"
          >
            להצהרת הנגישות המלאה
          </Link>
        </div>
      )}
    </>
  );
}

function Toggle({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        aria-pressed={on}
        className={`flex w-full items-center justify-between rounded-[6px] border px-3 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
          on ? "border-gold bg-gold/10 text-navy" : "border-line text-navy-700 hover:border-gold/50"
        }`}
      >
        <span
          aria-hidden
          className={`grid h-5 w-9 items-center rounded-full px-0.5 transition ${on ? "bg-gold" : "bg-line"}`}
        >
          <span className={`h-4 w-4 rounded-full bg-white transition-transform ${on ? "" : "translate-x-4"}`} />
        </span>
        {label}
      </button>
    </li>
  );
}
