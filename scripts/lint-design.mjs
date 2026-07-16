#!/usr/bin/env node
// lint-design.mjs — design was DIRECTED, not defaulted. When DESIGN-DIRECTION.md exists it must be a real
// CONSTRUCTED language (a foundation + a per-page differentiation), never a thin stub or an un-chosen preset.
// Self-contained; runs IN the dest. Tolerant: absent → skip (a track that doesn't direct design here).
//   node scripts/lint-design.mjs

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const cands = [resolve("DESIGN-DIRECTION.md"), resolve("plan/DESIGN-DIRECTION.md")];
const f = cands.find((p) => existsSync(p));
if (!f) { console.log("• lint-design: no DESIGN-DIRECTION.md (skipped — design not directed for this track)"); process.exit(0); }

const txt = readFileSync(f, "utf8");
const fails = [];
if (!/foundation|פאונדיישן|פלטה|palette/i.test(txt)) fails.push("no foundation section (palette/type/scale) — the constructed base is missing");
if (!/per-page|differentiat|בידול|treatment|טיפול/i.test(txt)) fails.push("no per-page differentiation — About/Results/Contact/bios must each get a distinct treatment, not one template recolored");
if (txt.replace(/\s+/g, " ").trim().length < 400) fails.push(`too thin (${txt.length} chars) — CONSTRUCT the language at checkpoints, don't stub it`);

if (fails.length) {
  console.error("✗ lint-design: DESIGN-DIRECTION.md is incomplete — design must be built, not defaulted (design-direction.md):");
  for (const x of fails) console.error("   " + x);
  process.exit(1);
}
console.log("✓ lint-design: design directed — a constructed, differentiated visual language");
process.exit(0);
