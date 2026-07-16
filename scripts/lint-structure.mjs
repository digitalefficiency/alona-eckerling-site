#!/usr/bin/env node
// lint-structure.mjs — blocks shipping a page that was RESKINNED instead of recomposed.
// The scaffold ships the home as a stub with NO default rhythm; every page's structure must
// come from the client's STORY, not from a template that gets colour-swapped. Fails on:
//   (a) any `data-scaffold-stub` marker still present (a stub reached the gate uncomposed), or
//   (b) ≥2 template-default section fingerprints in one page (the demo rhythm was kept).
// Self-contained (ships into the dest); runs IN the dest. Zero deps.
//   node scripts/lint-structure.mjs

import { readdirSync, readFileSync, lstatSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const APP = resolve("src/app");
const FINGERPRINTS = [
  "===== HERO =====", "===== SERVICES =====", "===== WHY US =====",
  "===== PROCESS =====", "===== LEAD =====",
];
const pages = [];
const walk = (d) => {
  for (const e of readdirSync(d)) {
    const f = join(d, e);
    const st = lstatSync(f);
    if (st.isSymbolicLink()) continue;
    if (st.isDirectory()) walk(f);
    else if (e === "page.tsx") pages.push(f);
  }
};
try { walk(APP); } catch { console.log("• lint-structure: no src/app (skipped)"); process.exit(0); }

const fails = [];
for (const p of pages) {
  const txt = readFileSync(p, "utf8");
  const rel = relative(resolve("."), p);
  if (txt.includes("data-scaffold-stub"))
    fails.push(`${rel}: still a SCAFFOLD STUB — compose it from STORY (bootstrap-rail §2)`);
  const fp = FINGERPRINTS.filter((m) => txt.includes(m));
  if (fp.length >= 2)
    fails.push(`${rel}: ${fp.length} template-default section markers — reskinned, not recomposed (build from the STORY spine, don't keep the demo rhythm)`);
}
if (fails.length) {
  console.error("✗ lint-structure: page(s) not composed from STORY:");
  for (const f of fails) console.error("   " + f);
  process.exit(1);
}
console.log(`✓ lint-structure: ${pages.length} page(s) composed from STORY (no stubs, no default rhythm)`);
process.exit(0);
