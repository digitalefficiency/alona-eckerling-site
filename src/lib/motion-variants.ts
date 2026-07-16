// Motion variants — the NAMED CHOREOGRAPHY LAYER over src/lib/motion-tokens.ts.
// Every variant set here references EASE/DUR tokens ONLY (premium-tier "motion
// discipline" gate: no inline eases/durations anywhere else — enforced by
// scripts/lint-motion.mjs, which allowlists this file + motion-tokens.ts).
//
// House mechanism (see components/Reveal.tsx + motion/RevealHeading.tsx):
// SSR / no-JS / reduced-motion / html.a11y-stop-motion = the FINAL VISIBLE
// design. The M-primitives render `initial={false}` + animate="show" at rest,
// arm "hidden" pre-paint via a layout effect, then flip to "show" on first
// view. That is why every `hidden` state carries SNAP (duration 0): arming
// must be instant — only the way BACK to "show" is animated on the tokens.
//
// Naming contract: every set exposes `hidden` + `show` so variants propagate
// from an orchestrating parent (MOrchestrate / MStagger) to its children.

import type { Transition, Variants } from "motion/react";
import { DUR, EASE, type EaseTuple } from "./motion-tokens";

/** Readonly token tuple → the mutable bezier array motion's types expect.
 *  Exported so JS-driven callers (e.g. MCounter's animate()) can reference
 *  EASE tokens without an inline ease array (lint-motion would flag one). */
export const bezier = (e: EaseTuple): [number, number, number, number] => [e[0], e[1], e[2], e[3]];

/** Instant jump — used by every `hidden` state so pre-paint arming never animates. */
export const SNAP: Transition = { duration: 0 };

/** The house reveal transition (DUR.reveal on EASE.out). */
export const revealTransition: Transition = {
  duration: DUR.reveal,
  ease: bezier(EASE.out),
};

/** Softer/faster sibling for body content — 0.7 × DUR.reveal (mirrors Reveal's 700ms). */
export const softTransition: Transition = {
  duration: DUR.reveal * 0.7,
  ease: bezier(EASE.out),
};

/** Cinematic in-out for big panel moves (curtains, shutters). */
export const panelTransition: Transition = {
  duration: DUR.reveal * 0.45,
  ease: bezier(EASE.inOut),
};

/** Micro transition for small UI feedback. */
export const microTransition: Transition = {
  duration: DUR.micro,
  ease: bezier(EASE.micro),
};

// ---------------------------------------------------------------------------
// Entrance variant sets
// ---------------------------------------------------------------------------

/**
 * fadeUp — the generic entrance (motion-library sibling of <Reveal>).
 * Use for: body copy, cards, list items, CTAs — anything that is NOT a
 * statement headline (headlines get maskReveal / RevealHeading, never
 * opacity-only — premium-tier ban).
 */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24, transition: SNAP },
  show: { opacity: 1, y: 0, transition: softTransition },
};

/**
 * maskReveal — the premium masked line rise (JS twin of RevealHeading's CSS).
 * Use for: statement headlines/kickers INSIDE an `overflow-hidden` mask —
 * the element rises 110% → 0 out of the mask. Wrap it yourself:
 * `<span className="block overflow-hidden"><motion.span variants={maskReveal}>…`.
 */
export const maskReveal: Variants = {
  hidden: { y: "110%", transition: SNAP },
  show: { y: "0%", transition: revealTransition },
};

/**
 * clipWipe — the signature ink-wipe from the READING START (JS twin of
 * ClipReveal / .splittext). Direction-dependent, so it is a factory.
 * Use for: photos and media panels; default "rtl" matches the house sites.
 */
export const clipWipe = (direction: "rtl" | "ltr" = "rtl"): Variants => ({
  hidden: {
    clipPath: direction === "rtl" ? "inset(0 0 0 100%)" : "inset(0 100% 0 0)",
    transition: SNAP,
  },
  show: { clipPath: "inset(0 0 0 0)", transition: revealTransition },
});

/**
 * scaleSoft — quiet settle for media/cards (opacity + 0.96 → 1 scale).
 * Use for: images inside MediaFrame slots, stat cards, gallery tiles.
 */
export const scaleSoft: Variants = {
  hidden: { opacity: 0, scale: 0.96, transition: SNAP },
  show: { opacity: 1, scale: 1, transition: softTransition },
};

/**
 * drawLine — hairline rule that draws itself (scaleX 0 → 1).
 * Use for: gold hairlines/section rules. Set the origin to the reading start
 * via style: `style={{ originX: dir === "rtl" ? 1 : 0 }}`.
 */
export const drawLine: Variants = {
  hidden: { scaleX: 0, transition: SNAP },
  show: { scaleX: 1, transition: revealTransition },
};

/**
 * slideIn — the inline-axis side entrance ("a lean-in, never a flight").
 * Direction is LOGICAL: "inline-start"/"inline-end" resolve against the html
 * dir, so an RTL site slides from the correct visual side without callers
 * thinking in left/right. Distance stays 32–48px (the quiet register).
 * Use for: the rationed narrative side-moments ONLY (a card arriving beside a
 * half-bleed image, two futures approaching from opposite sides, process cards
 * stepping toward sticky media) — everything else stays block-axis (fadeUp).
 * SSR/no-JS/reduced-motion render the settled position (house `initial={false}`).
 */
export const slideIn = (
  from: "inline-start" | "inline-end" = "inline-start",
  distance = 40,
  dir: "rtl" | "ltr" = "rtl",
): Variants => {
  // logical → physical x: in RTL, inline-start is the RIGHT edge (positive x).
  const sign = (from === "inline-start") === (dir === "rtl") ? 1 : -1;
  return {
    hidden: { opacity: 0, x: sign * distance, transition: SNAP },
    show: { opacity: 1, x: 0, transition: softTransition },
  };
};

// ---------------------------------------------------------------------------
// Stagger helpers (containers)
// ---------------------------------------------------------------------------

/**
 * staggerChildren — container factory: no visual change of its own, only
 * choreographs children (any child motion element carrying a `hidden`/`show`
 * variant set inherits the timing). Step defaults to the DUR.stagger token;
 * keep steps 0.06–0.10s (the motion voice).
 * Use for: MOrchestrate (section entrances) + MStagger (grids/lists).
 */
export const staggerChildren = (step: number = DUR.stagger, delayChildren = 0): Variants => ({
  hidden: { transition: SNAP },
  show: { transition: { staggerChildren: step, delayChildren } },
});

// ---------------------------------------------------------------------------
// Page-transition variants (MPageTransition — per-site opt-in)
// ---------------------------------------------------------------------------

/**
 * pageShell — the route wrapper: quiet content fade on DUR.micro.
 * `out` is both the enter-from and exit-to state under AnimatePresence.
 */
export const pageShell: Variants = {
  out: { opacity: 0, transition: microTransition },
  in: { opacity: 1, transition: microTransition },
};

/**
 * pageCurtain — the subtle brand curtain (navy panel, transform-origin top):
 * grows to cover on exit, lifts away on enter — EASE.inOut, the curtain curve.
 */
export const pageCurtain: Variants = {
  out: { scaleY: 1, transition: panelTransition },
  in: { scaleY: 0, transition: panelTransition },
};

/** Static twins — instant swaps when motion is not allowed (reduced/a11y). */
export const pageShellStatic: Variants = {
  out: { opacity: 0, transition: SNAP },
  in: { opacity: 1, transition: SNAP },
};
export const pageCurtainStatic: Variants = {
  out: { scaleY: 0, transition: SNAP }, // never cover the page without motion
  in: { scaleY: 0, transition: SNAP },
};
