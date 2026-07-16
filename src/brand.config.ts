// ============================================================================
// BRAND CONFIG — the single knob that reskins the whole template.
// Change these and the entire site re-themes (colors are injected as CSS vars
// in layout.tsx and consumed by globals.css @theme via var(--brand-*, default)).
//
// SEMANTIC ROLES (names kept from the reference build so component classes like
// `bg-navy` / `text-gold` keep working — read them as ROLES, not literal colors):
//   navy*  = PRIMARY dark   (section backgrounds, headline text, dark CTAs)
//   gold*  = ACCENT          (eyebrows, rules, ◆, accent buttons/links — used sparingly)
//   sand   = WARM panel      (the alternating light band between white & navy)
// ============================================================================

import { DUR, EASE, cssDur, cssEase } from "@/lib/motion-tokens";

export type Direction = "rtl" | "ltr";

export const brand = {
  name: "אלונה אקרלינג",                 // brand / firm name (wordmark fallback)
  lang: "he",                     // <html lang>
  direction: "rtl" as Direction,  // "rtl" (Hebrew/Arabic) | "ltr" (English/Latin)
  // Light | dark-kinetic POLARITY (see Mode below). Runtime-readable so surfaces
  // that must pick a per-polarity asset (e.g. the CMS desk's logo.png vs
  // logo-dark.png) can introspect it; applyMode(brand.mode) is composed in
  // layout.tsx. Default "light" — a light site pays nothing (applyMode("light")
  // emits an empty token map).
  mode: "light" as Mode,

  // Brandable palette (semantic roles above). Override per project to reskin.
  colors: {
    "navy": "#0a1e3f",
    "navy-800": "#0e2750",
    "navy-700": "#15355f",
    "navy-600": "#1d4474",
    "gold": "#c8a45c",
    "gold-dark": "#a9853f",
    "gold-soft": "#f3e8cf",
    "gold-ink": "#6f5320",        // AA-safe accent text on light bg — keep contrast ≥4.5:1
    "sand": "#efe7d6",
  },

  // Fonts are wired in layout.tsx via next/font. The DISPLAY font is the serif
  // voice (headlines), BODY is the sans (text). Swapping fonts = a scaffold-time
  // edit of the next/font imports in layout.tsx (documented in references/rtl-ltr-and-brand.md).
  fonts: {
    display: "Frank Ruhl Libre",  // serif display
    body: "Heebo",                // sans body
  },
} as const;

// Inline-style object for <html> — sets every --brand-* custom property so
// globals.css `var(--brand-x, default)` resolves to the configured value.
export function brandStyle(): React.CSSProperties {
  const s: Record<string, string> = {};
  for (const [k, v] of Object.entries(brand.colors)) s[`--brand-${k}`] = v;
  return s as React.CSSProperties;
}

// ============================================================================
// VERTICAL PRESETS — deliberate starting palettes/voices per vertical.
//
// INTAKE RULE (premium-tier.md ban list): shipping the navy-gold default
// WITHOUT an explicit client request is a cheap tell — the palette must be a
// deliberate intake choice. During intake (references/intake-questions.md,
// group D) pick ONE of these, a client-supplied palette, or — only on explicit
// request — the navy/gold default above.
//
// APPLYING a preset = three moves, all scaffold-time:
//   1. copy its `colors` over `brand.colors`;
//   2. copy its `fonts` over `brand.fonts` (then wire the fonts in layout.tsx
//      via next/font — see references/rtl-ltr-and-brand.md);
//   3. merge its MOTION PERSONALITY into the <html> style in layout.tsx:
//        style={{ ...brandStyle(), ...applyMotionPersonality("law") }}
//      (overrides the @theme motion tokens — see applyMotionPersonality below
//      and references/design-system.md → "Motion personality per vertical").
// The ACTIVE config above stays the template default; presets are raw
// material, never auto-applied.
// All font pairings carry Latin + Hebrew. Every `gold-ink` is AA-safe
// (≥4.5:1) as accent TEXT on the preset's light backgrounds.
// ============================================================================

export type BrandColorRole = keyof typeof brand.colors; // the 9 brandable roles
export type FontPairing = { display: string; body: string };

// MOTION PERSONALITY — same gestures, different temperament per vertical.
// The scales multiply the motion-tokens.ts DUR values; the ease preference
// picks which EASE token leads reveals. Applied via applyMotionPersonality()
// (CSS-var overrides on <html>) — the CSS gesture family (RevealHeading,
// SplitText wipes, .rise, rules, hero choreography) rescales in one move
// because the legacy gesture durations calc-derive from --dur-reveal /
// --dur-stagger in globals.css. Deliberately NOT scaled: --dur-micro /
// --ease-micro — hover/press feedback stays universal; personality lives
// in reveals, not responsiveness.
export type MotionPersonality = {
  /** Multiplies --dur-reveal (and, via calc, --dur-wipe/--dur-settle/--dur-rule). Keep 0.85–1.25. */
  durScale: number;
  /** EASE token leading reveals — emitted as --ease-out + --ease-signature ("out" = the house expo, a value-identical no-op). */
  easePreference: keyof typeof EASE;
  /** Multiplies --dur-stagger (and the derived --stagger-line/--stagger-child). Keep ≤1.25 so the 80ms token stays in the 60–100ms line-stagger voice. */
  staggerScale: number;
  /** One-line temperament note — guides motion choices the scales can't express. */
  personality: string;
};

export type VerticalPreset = {
  /** All 9 semantic color roles (same keys as brand.colors). */
  colors: Record<BrandColorRole, string>;
  /** Font-pairing NAMES (display serif + body sans) — wired in layout.tsx. */
  fonts: FontPairing;
  /** One-line voice note — feeds the copy tone, not just the skin. */
  voice: string;
  /** Motion temperament — applied via applyMotionPersonality(). */
  motion: MotionPersonality;
};

export const verticalPresets = {
  // LAW — near-black/deep-forest primary + brass accents. Editorial gravitas.
  law: {
    colors: {
      "navy": "#0d1a15",      // near-black deep forest (primary dark)
      "navy-800": "#12241c",
      "navy-700": "#183024",
      "navy-600": "#20402f",
      "gold": "#ad8a4c",      // brass accent
      "gold-dark": "#8c6c33",
      "gold-soft": "#eee4cc",
      "gold-ink": "#6b5222",  // AA-safe brass text on light
      "sand": "#ece5d3",      // aged-ivory panel
    },
    fonts: { display: "David Libre", body: "Assistant" },
    voice: "Serif-display editorial: measured, authoritative, long-form counsel — precision over promises, zero 'fighting for you'.",
    motion: {
      durScale: 1.15,          // weighty — reveals take their time
      easePreference: "inOut", // slow commit, decisive settle (cinematic curve)
      staggerScale: 1.1,       // 88ms line stagger — still inside the 60–100ms voice
      personality: "Weighty and deliberate — reveals land like a signed document; nothing snaps or bounces.",
    },
  },
  // MEDICAL — calm deep-blue primary + warm-white panels. Humane, not sterile.
  medical: {
    colors: {
      "navy": "#123c5e",      // calm deep blue (primary dark)
      "navy-800": "#17466c",
      "navy-700": "#1e527c",
      "navy-600": "#27618f",
      "gold": "#4a9d97",      // soft sea-teal accent
      "gold-dark": "#357f7a",
      "gold-soft": "#ddefed",
      "gold-ink": "#20615c",  // AA-safe teal text on light
      "sand": "#f4efe6",      // warm-white panel
    },
    fonts: { display: "Frank Ruhl Libre", body: "Rubik" },
    voice: "Humane clinical: plain-language explanations, credentialed calm, named physicians — reassuring without 'compassionate care' filler.",
    motion: {
      durScale: 1.0,         // precise — the reference house tempo
      easePreference: "out", // the house expo, clean and exact
      staggerScale: 1.0,     // the 80ms token as-is
      personality: "Precise and even — the reference voice at clinical accuracy; zero flourish, zero drama.",
    },
  },
  // THERAPY — warm earth primary + cream panels. Quiet, private, unhurried.
  therapy: {
    colors: {
      "navy": "#382e26",      // deep warm earth (primary dark)
      "navy-800": "#42362c",
      "navy-700": "#4e4136",
      "navy-600": "#5d4e41",
      "gold": "#bc7f5f",      // muted clay accent
      "gold-dark": "#9a6347",
      "gold-soft": "#f2e2d7",
      "gold-ink": "#7d4b30",  // AA-safe clay text on light
      "sand": "#f3ecdf",      // cream panel
    },
    fonts: { display: "Bona Nova", body: "Assistant" },
    voice: "Soft and discreet: first-person warmth, confidentiality up front, gentle invitations — never urgency, never before/after claims.",
    motion: {
      durScale: 1.2,         // soft — the longest settles in the family
      easePreference: "out", // the house expo's soft landing, stretched
      staggerScale: 1.2,     // 96ms line stagger — wider breaths, still ≤100ms
      personality: "Soft and unhurried — longer settles, wider breaths between lines; never abrupt, never urgent.",
    },
  },
} as const satisfies Record<string, VerticalPreset>;

export type VerticalKey = keyof typeof verticalPresets;

// ============================================================================
// MOTION PERSONALITY → CSS-var overrides for the <html> style (preset apply
// procedure, step 3). Same mechanism as brandStyle(): inline style on <html>
// beats the `:root` declarations Tailwind emits from `@theme`, so these
// overrides re-voice every token consumer (RevealHeading, SplitText wipes,
// .rise, rule-draws, hero choreography — the legacy gesture vars calc-derive
// from --dur-reveal/--dur-stagger in globals.css and follow automatically).
// Values are COMPUTED from the motion-tokens.ts source of truth — no raw
// durations/curves live here. Scope note: JS-driven variant sets
// (lib/motion-variants.ts → M-primitives) read DUR/EASE from TS at the
// reference scale; the personality covers the CSS-token surface.
//
//   // layout.tsx (scaffold-time, when the intake picked a vertical):
//   <html style={{ ...brandStyle(), ...applyMotionPersonality("law") }} …>
// ============================================================================

/** Round to ms precision so emitted CSS times stay clean ("1.15s", not float noise). */
const round3 = (n: number) => Math.round(n * 1000) / 1000;

export function applyMotionPersonality(vertical: VerticalKey): React.CSSProperties {
  const m = verticalPresets[vertical].motion;
  return {
    "--ease-out": cssEase(EASE[m.easePreference]),
    "--ease-signature": cssEase(EASE[m.easePreference]), // legacy alias of the same curve
    "--dur-reveal": cssDur(round3(DUR.reveal * m.durScale)),
    "--dur-stagger": cssDur(round3(DUR.stagger * m.staggerScale)),
    // --dur-micro / --ease-micro deliberately untouched (see MotionPersonality).
  } as React.CSSProperties;
}

// ── Character — the per-site "soul" (references/style-library.md) ────────────────────────────
// Beyond the vertical preset (palette + voice), each site picks a CHARACTER that makes it unlike
// the last site in the same vertical. Character = HOW LOUD (motion intensity + the default
// background/text/archetype lean); the vertical personality above = the temperament. Compose:
//   <html style={{ ...brandStyle(), ...applyMotionPersonality("law"), ...applyCharacter("kinetic") }}>
// The design choices (background/text/archetypeLean) are READ by the composer and recorded in
// DESIGN-DIRECTION.md; the only runtime CSS effect is `--motion-scale` (a multiplier components
// that opt in may apply to their reveals — non-breaking; existing tokens untouched).
export type CharacterKey =
  | "editorial-calm"
  | "kinetic"
  | "mono-minimal"
  | "immersive"
  | "warm-craft";

export const characterPresets: Record<
  CharacterKey,
  { intensity: number; background: string; text: string; archetypeLean: string[]; note: string }
> = {
  "editorial-calm": { intensity: 1.0, background: "grain", text: "RevealHeading", archetypeLean: ["centered-prose", "asymmetric-split"], note: "authority, gravitas — quiet default" },
  "kinetic": { intensity: 1.15, background: "beam-sweep", text: "word-stagger", archetypeLean: ["horizontal-pin", "sticky-scroll"], note: "modern, energetic" },
  "mono-minimal": { intensity: 0.75, background: "none", text: "letter-mask", archetypeLean: ["full-bleed-hero", "giant-quote"], note: "luxury restraint, high-end" },
  "immersive": { intensity: 1.1, background: "background-art", text: "mask-reveal", archetypeLean: ["background-art", "media-band"], note: "story-led, experiential" },
  "warm-craft": { intensity: 1.05, background: "grain", text: "ink-wipe", archetypeLean: ["media-band", "sticky-scroll"], note: "human, hand-made feel" },
};

export function applyCharacter(character: CharacterKey): React.CSSProperties {
  return { "--motion-scale": String(characterPresets[character].intensity) } as React.CSSProperties;
}

// ── Mode (polarity) — light | dark-kinetic, chosen at intake ABOVE the character filter ──────────
// The vertical sets palette VALUES, the character sets HOW LOUD; MODE sets the light/dark POLARITY.
// Default = light (editorial-luxury). A dark build picks a dark mode at intake: the polarity tokens
// (--brand-bg/bg2/card/ink/muted/line/line2/sand — made overridable in globals.css @theme) flip in
// ONE move via applyMode(), and color-scheme flips native controls/scrollbars. The neon/purple ban
// (premium-tier.md) is scoped to LIGHT editorial-luxury; a DELIBERATE dark-kinetic direction may use
// a luminous cool accent (turquoise/violet) — in-system now, not off-template.
// NOTE: a dark build styles TEXT with the polarity token (`text-ink`/`text-muted`), never the light
// role `text-navy` (dark ink → invisible on a dark bg). `bg-navy` bands stay dark (fine).
export type Mode = "light" | "dark-kinetic";

export const modePresets = {
  light: { colorScheme: "light", tokens: {} as Record<string, string>, note: "editorial-luxury default — light bands (white/sand), navy ink, gold accent." },
  "dark-kinetic": {
    colorScheme: "dark",
    tokens: {
      "bg": "#0a0a0f", "bg2": "#14141f", "card": "#1a1a2e", "sand": "#14141f",
      "ink": "#f5f7fa", "muted": "#a8b0bf",
      "line": "rgba(255,255,255,0.10)", "line2": "rgba(255,255,255,0.06)",
      // accent role (gold*) → a luminous cool for dark UIs; gold-ink is AA-safe accent TEXT on dark.
      "gold": "#40e0d0", "gold-dark": "#8b5cf6", "gold-soft": "#173a3a", "gold-ink": "#7fe9dd",
    } as Record<string, string>,
    note: "Dark-first, GPU/canvas-friendly (Vercel/Linear register). Accent = turquoise→violet, deep near-black bg. For hi-tech / SaaS / product.",
  },
} as const satisfies Record<string, { colorScheme: string; tokens: Record<string, string>; note: string }>;

export type ModeKey = keyof typeof modePresets;

// Inline-style overrides for <html> — flips the polarity tokens + color-scheme. Compose LAST so it
// wins over brandStyle()/preset values for the polarity roles:
//   <html style={{ ...brandStyle(), ...applyMotionPersonality("law"), ...applyCharacter("kinetic"), ...applyMode("dark-kinetic") }}>
export function applyMode(mode: ModeKey): React.CSSProperties {
  const p = modePresets[mode];
  const s: Record<string, string> = { colorScheme: p.colorScheme };
  for (const [k, v] of Object.entries(p.tokens)) s[`--brand-${k}`] = v;
  return s as React.CSSProperties;
}
