#!/usr/bin/env node
// lint-variety.mjs — VARIETY within UNITY. Every section is built on a composition ARCHETYPE (pipeline.md §B);
// adjacent sections must DIFFER and a page must use ≥3 distinct archetypes — so no page reads as one block
// recolored six times. (Unity — palette/grade/motion staying constant — is enforced by lint-motion + brand.config.)
// Reads the archetype sequence from COMPOSE-MAP.md in scroll order. Self-contained; runs IN the dest.
// Tolerant: no COMPOSE-MAP or no archetype column → skip.
//   node scripts/lint-variety.mjs

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const ARCHETYPES = [
  "full-bleed-hero", "asymmetric-split", "centered-prose", "card-grid",
  "horizontal-pin", "horizontal-scroll", "sticky-scroll", "background-art", // scroll-craft.md advanced patterns
  "overlap-layered", "diagram", "giant-quote", "media-band", "timeline", "stat-row", "juxtapose",
  "bento-grid", "comparison", "marquee", "spotlight-card", "feature-alternating", // style-library.md wave-4 archetypes
];
const p = resolve("COMPOSE-MAP.md");
if (!existsSync(p)) { console.log("• lint-variety: no COMPOSE-MAP.md (skipped)"); process.exit(0); }
const txt = readFileSync(p, "utf8");
if (!/archetype/i.test(txt)) { console.log("• lint-variety: COMPOSE-MAP has no archetype column (skipped — older map)"); process.exit(0); }

// scan in document (scroll) order; the first library token on a line is that section's archetype
const seq = [];
for (const line of txt.split("\n")) {
  const hit = ARCHETYPES.find((a) => new RegExp(`\\b${a}\\b`).test(line));
  if (hit) seq.push(hit);
}

const fails = [];
if (seq.length < 2) fails.push("no per-section archetypes found — every COMPOSE-MAP row must name one from pipeline.md §B (typo/invented names don't count)");
for (let i = 1; i < seq.length; i++)
  if (seq[i] === seq[i - 1]) fails.push(`sections ${i} & ${i + 1} share archetype "${seq[i]}" — adjacent sections must DIFFER (pipeline §D)`);
const distinct = new Set(seq).size;
if (seq.length >= 3 && distinct < 3)
  fails.push(`only ${distinct} distinct archetype(s) across ${seq.length} sections — the variety floor is 3 (§D); the page reads monotonous`);

if (fails.length) {
  console.error("✗ lint-variety: variety-within-unity broken —");
  for (const x of fails) console.error("   " + x);
  console.error("Vary the COMPOSITION per section (pipeline §B) while the LANGUAGE stays constant (§C).");
  process.exit(1);
}
console.log(`✓ lint-variety: ${seq.length} sections · ${distinct} distinct archetypes · no adjacent repeat`);
process.exit(0);
