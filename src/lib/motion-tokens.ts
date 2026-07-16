// Motion voice tokens — the SINGLE SOURCE OF TRUTH for every ease, duration
// and spring in the design system (premium-tier "motion discipline" gate:
// all transitions reference motion tokens only; no inline eases/durations;
// no opacity-only headline reveals — see references/premium-tier.md).
//
// Two mirrored surfaces, one voice:
//   TS  (this file)             → JS-driven motion (springs, rAF, WAAPI).
//   CSS (globals.css `@theme`)  → class/keyframe motion via custom props.
// The `@theme` block in globals.css must stay identical to the documented
// snippet at the bottom of this file. Legacy gesture-specific vars
// (--ease-signature/--ease-cinematic/--ease-tilt, --dur-wipe/--dur-settle/
// --dur-rule) remain in globals.css `:root`, alias these curves and
// calc-derive their durations from --dur-reveal/--dur-stagger — so a vertical
// MOTION PERSONALITY (src/brand.config.ts → applyMotionPersonality, values
// computed from THESE tokens) rescales the whole CSS gesture family by
// overriding the tokens inline on <html>.

export type EaseTuple = readonly [x1: number, y1: number, x2: number, y2: number];

export const EASE = {
  /** House ease-out ("signature" expo) — reveals, wipes, entrances. */
  out: [0.16, 1, 0.3, 1],
  /** Strong in-out ("cinematic") — shutters, curtains, big panel moves. */
  inOut: [0.77, 0, 0.175, 1],
  /** Quick settle ("tilt") — hover/press micro-interactions. */
  micro: [0.2, 0.7, 0.2, 1],
  /** True linear — for constant-speed loops (marquees, ken-burns drift); never library "linear" strings. */
  linear: [0, 0, 1, 1],
} as const satisfies Record<string, EaseTuple>;

/** Durations in SECONDS. */
export const DUR = {
  /** Premium reveals — masked headline lines, clip wipes. */
  reveal: 1.0,
  /** Hover/press micro-interactions. */
  micro: 0.25,
  /** Per-line / per-child stagger step (keep line staggers 0.06–0.10). */
  stagger: 0.08,
} as const satisfies Record<string, number>;

export type SpringPreset = Readonly<{ stiffness: number; damping: number; mass: number }>;

/** Springs for JS-driven interactions (e.g. magnetic pulls, drag settles). */
export const SPRING = {
  /** Calm settle for large surfaces (panels, images). */
  gentle: { stiffness: 120, damping: 20, mass: 1 },
  /** Default UI response (magnetic CTAs, chips) — slightly under-damped. */
  standard: { stiffness: 210, damping: 22, mass: 1 },
  /** Tight, immediate micro feedback (icons, toggles). */
  snappy: { stiffness: 320, damping: 26, mass: 0.9 },
} as const satisfies Record<string, SpringPreset>;

/** EaseTuple → CSS `cubic-bezier(…)` string. */
export const cssEase = (e: EaseTuple): string => `cubic-bezier(${e.join(", ")})`;

/** Seconds → CSS time (`0.25` → `"0.25s"`). */
export const cssDur = (s: number): string => `${s}s`;

/** The CSS custom properties these tokens emit (mirrored in globals.css `@theme`). */
export const MOTION_CSS_VARS = {
  "--ease-out": cssEase(EASE.out),
  "--ease-in-out": cssEase(EASE.inOut),
  "--ease-micro": cssEase(EASE.micro),
  "--dur-reveal": cssDur(DUR.reveal),
  "--dur-micro": cssDur(DUR.micro),
  "--dur-stagger": cssDur(DUR.stagger),
} as const satisfies Record<`--${string}`, string>;

// ============================================================
// globals.css `@theme` snippet — keep VALUE-identical to the block
// under "Motion voice tokens" in template/src/app/globals.css.
// Note: --ease-out / --ease-in-out deliberately OVERRIDE Tailwind's
// default `ease-out` / `ease-in-out` utilities with the house curves,
// so even utility classes resolve to the tokens.
//
//   --ease-out: cubic-bezier(0.16, 1, 0.3, 1);      (EASE.out — house ease-out, = --ease-signature)
//   --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1); (EASE.inOut, = --ease-cinematic)
//   --ease-micro: cubic-bezier(0.2, 0.7, 0.2, 1);   (EASE.micro, = --ease-tilt)
//   --dur-reveal: 1s;      (DUR.reveal — premium reveals: RevealHeading lines, wipes)
//   --dur-micro: 0.25s;    (DUR.micro — hover/press micro-interactions)
//   --dur-stagger: 0.08s;  (DUR.stagger — per-line/per-child stagger step)
// ============================================================
