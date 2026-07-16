#!/usr/bin/env node
// lint-compose.mjs — the anti-orphan gate. Every COPY.md section block must appear in
// COMPOSE-MAP.md, so the studio's written copy actually reached the build (issue: "wrote
// tons, used none"). Self-contained (ships into the dest); runs IN the dest. Zero deps.
//   node scripts/lint-compose.mjs
// Tolerant: no COPY.md → skip (express/internal tracks). COPY.md present but no map → fail.

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const read = (f) => (existsSync(resolve(f)) ? readFileSync(resolve(f), "utf8") : null);
const copy = read("COPY.md");
if (copy === null) { console.log("• lint-compose: no COPY.md (skipped — non-copy track)"); process.exit(0); }
const map = read("COMPOSE-MAP.md");
if (map === null) {
  console.error("✗ lint-compose: COPY.md exists but COMPOSE-MAP.md is missing.");
  console.error("  The composer must emit COMPOSE-MAP.md (section → beat → component → COPY block) — bootstrap-rail.md §2.");
  process.exit(1);
}

const norm = (s) => s.replace(/[*_`#>–—•|-]/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
const mapN = norm(map);

// COPY blocks = "### …" section headings, scoped by their "## עמוד: <page>" context.
const blocks = [];
let page = "?";
for (const line of copy.split("\n")) {
  const p = line.match(/^##\s+(?:עמוד:|page:)\s*(.+)$/i);
  if (p) { page = p[1].trim(); continue; }
  const h = line.match(/^###\s+(.+)$/);
  if (h) blocks.push({ page, head: h[1].trim() });
}
if (!blocks.length) { console.log("• lint-compose: COPY.md has no ### section blocks (skipped)"); process.exit(0); }

const orphans = blocks.filter((b) => !mapN.includes(norm(b.head)));
if (orphans.length) {
  console.error(`✗ lint-compose: ${orphans.length}/${blocks.length} COPY block(s) never appear in COMPOSE-MAP.md — written but UNUSED:`);
  for (const o of orphans) console.error(`   [${o.page}] ${o.head}`);
  console.error("Fix: mount each block's section (copy its ### heading verbatim into COMPOSE-MAP), or delete the unused copy — never leave written work orphaned.");
  process.exit(1);
}
console.log(`✓ lint-compose: all ${blocks.length} COPY block(s) mapped in COMPOSE-MAP.md`);
process.exit(0);
