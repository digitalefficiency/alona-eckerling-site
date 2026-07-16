// ============================================================================
// contrast.mjs — WCAG contrast math, pure, so the desk's brand-adaptivity can be
// PROVEN, not asserted. The desk inherits the client's palette; "inherits" is
// only true if every text pair it renders stays readable on every palette the
// studio can ship AND in both polarities (light / dark-kinetic). This module is
// the arithmetic; a harness pin feeds it the actual token pairs and the preset
// grid, and fails the build if any pair drops below its WCAG floor.
//
// No colour library (zero new deps). Handles #rgb, #rrggbb, and the rgba(...)
// literals the dark-kinetic mode uses for hairlines — those get flattened over
// the surface they sit on, because a translucent border's real contrast is
// against what shows through it, not against nothing.
// ============================================================================

// #abc | #aabbcc → [r,g,b] 0-255. Throws on anything else so a typo in a token
// table is a loud failure, never a silently-wrong ratio.
export function parseHex(hex) {
  let h = String(hex).trim().replace(/^#/, "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) throw new Error(`not a hex colour: ${hex}`);
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

// "rgba(255,255,255,0.1)" over an opaque backdrop → the composited opaque rgb.
// A hairline at 10% white on a near-black card is really ~#242430, and THAT is
// what its contrast is measured against.
export function flattenOver(color, backdropRgb) {
  const m = /^rgba?\(([^)]+)\)$/.exec(String(color).trim());
  if (!m) return parseHex(color);
  const parts = m[1].split(",").map((s) => parseFloat(s.trim()));
  const [r, g, b] = parts;
  const a = parts.length > 3 ? parts[3] : 1;
  return [r, g, b].map((c, i) => Math.round(c * a + backdropRgb[i] * (1 - a)));
}

const channel = (c) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

export function luminance(rgb) {
  const [r, g, b] = rgb;
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

// WCAG contrast ratio in [1, 21]. `over` is the opaque backdrop used to flatten
// any translucent input first.
export function contrast(fg, bg, over) {
  const backdrop = over ? (Array.isArray(over) ? over : parseHex(over)) : null;
  const f = luminance(backdrop ? flattenOver(fg, backdrop) : parseHex(fg));
  const b = luminance(backdrop ? flattenOver(bg, backdrop) : parseHex(bg));
  const [hi, lo] = f > b ? [f, b] : [b, f];
  return (hi + 0.05) / (lo + 0.05);
}

// WCAG 2.1 thresholds. Normal body text = 4.5, large/bold ≥ 18.66px bold or
// 24px = 3.0, and a non-text UI boundary (a button edge vs the page, a focus
// ring) = 3.0 (WCAG 1.4.11).
export const AA_TEXT = 4.5;
export const AA_LARGE = 3.0;
export const AA_UI = 3.0;

// Check one pair, return a structured verdict rather than throwing — the caller
// collects every failure so a token regression reports ALL broken pairs at once.
export function check({ label, fg, bg, over, min = AA_TEXT }) {
  const ratio = contrast(fg, bg, over);
  return { label, ratio: Math.round(ratio * 100) / 100, min, pass: ratio >= min };
}
