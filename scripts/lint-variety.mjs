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

// scan in document (scroll) order; the first library token on a line is that section's archetype.
// PAGE-AWARE (2026-07-16): adjacency + the ≥3-distinct floor apply PER PAGE — §D is a per-scroll
// rule, and the last section of one page is never visually adjacent to the first of the next.
// A map whose table rows carry a page cell ("| n | <page> | <section>.md | …") groups by it;
// a map without one falls back to the original single-sequence scan (backward compatible).
const groups = new Map(); // page → archetype seq (insertion order preserved)
for (const line of txt.split("\n")) {
  const hit = ARCHETYPES.find((a) => new RegExp(`\\b${a}\\b`).test(line));
  if (!hit) continue;
  const cells = line.split("|").map((c) => c.trim()).filter(Boolean);
  const page =
    cells.length >= 4 && /^\d+$/.test(cells[0]) && !cells[1].includes(".md") && cells[1] !== hit
      ? cells[1]
      : "";
  if (!groups.has(page)) groups.set(page, []);
  groups.get(page).push(hit);
}
const seq = [...groups.values()].flat();

const fails = [];
if (seq.length < 2) fails.push("no per-section archetypes found — every COMPOSE-MAP row must name one from pipeline.md §B (typo/invented names don't count)");
for (const [page, s] of groups) {
  const tag = page ? ` (page: ${page})` : "";
  for (let i = 1; i < s.length; i++)
    if (s[i] === s[i - 1]) fails.push(`sections ${i} & ${i + 1}${tag} share archetype "${s[i]}" — adjacent sections must DIFFER (pipeline §D)`);
  const d = new Set(s).size;
  if (s.length >= 3 && d < 3)
    fails.push(`only ${d} distinct archetype(s) across ${s.length} sections${tag} — the variety floor is 3 (§D); the page reads monotonous`);
}
const distinct = new Set(seq).size;

if (fails.length) {
  console.error("✗ lint-variety: variety-within-unity broken —");
  for (const x of fails) console.error("   " + x);
  console.error("Vary the COMPOSITION per section (pipeline §B) while the LANGUAGE stays constant (§C).");
  process.exit(1);
}
console.log(`✓ lint-variety: ${seq.length} sections · ${distinct} distinct archetypes · no adjacent repeat`);
process.exit(0);
