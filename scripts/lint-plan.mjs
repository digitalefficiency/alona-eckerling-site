#!/usr/bin/env node
// lint-plan.mjs — enforces the planning system (plan/). Every section listed in the one long
// WIREFRAME.md has a deep file; every file carries all 9 layers (0–8); no orphan files; nothing thin.
// Planning is the bar — a $5–10k site is not built on a thin plan. Self-contained; runs IN the dest.
// Tolerant: no plan/WIREFRAME.md → skip (a track that doesn't plan here).
//   node scripts/lint-plan.mjs

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";

const planDir = resolve("plan");
const wf = join(planDir, "WIREFRAME.md");
if (!existsSync(wf)) { console.log("• lint-plan: no plan/WIREFRAME.md (skipped)"); process.exit(0); }

// the client-media register (step 0m) — a layer-8 `asset: cl-###` choice must resolve here
const loadManifest = (p) => { try { return JSON.parse(readFileSync(p, "utf8")); } catch { return null; } };
const manifest = loadManifest(resolve("assets-manifest.json")) || loadManifest(resolve("materials", "assets-manifest.json"));
const assetById = new Map((manifest?.assets || []).map((a) => [a.id, a]));

const wfTxt = readFileSync(wf, "utf8");
const fails = [];
const refs = [...wfTxt.matchAll(/sections\/([A-Za-z0-9._-]+\.md)/g)].map((m) => m[1]);
if (!refs.length) fails.push("WIREFRAME.md lists no section files (expected rows ending `| sections/NN-….md |`)");

const LAYERS = ["0", "1", "2", "3", "4", "5", "6", "7", "8"];
// pipeline.md §B archetypes — layer 5 (the SHOT) must declare one (kept in sync with lint-variety/lint-tags)
const ARCHETYPES = [
  "full-bleed-hero", "asymmetric-split", "centered-prose", "card-grid",
  "horizontal-pin", "horizontal-scroll", "sticky-scroll", "background-art",
  "overlap-layered", "diagram", "giant-quote", "media-band", "timeline", "stat-row", "juxtapose",
  "bento-grid", "comparison", "marquee", "spotlight-card", "feature-alternating",
];
for (const r of [...new Set(refs)]) {
  const f = join(planDir, "sections", r);
  if (!existsSync(f)) { fails.push(`WIREFRAME references sections/${r} but the file is missing`); continue; }
  const txt = readFileSync(f, "utf8");
  const missing = LAYERS.filter((n) => !new RegExp(`^\\s*${n}\\.\\s`, "m").test(txt));
  if (missing.length) fails.push(`sections/${r}: missing layer(s) ${missing.join(",")} — need 0–8, each a full paragraph`);
  else if (txt.replace(/\s+/g, " ").trim().length < 500) fails.push(`sections/${r}: too thin (${txt.length} chars) — planning is the bar; expand every layer`);
  else {
    // layer 5 (the SHOT) must DECLARE a composition archetype from §B (feeds technique-matrix → lint-variety)
    const m = txt.match(/archetype:[\s`*_]*([a-z][a-z-]+)/i); // tolerate `archetype:` / **archetype:** / backtick-wrapped
    if (!m) fails.push(`sections/${r}: layer 5 declares no \`archetype:\` — name one from pipeline §B (technique-matrix.md)`);
    else if (!ARCHETYPES.includes(m[1].toLowerCase())) fails.push(`sections/${r}: layer-5 archetype "${m[1]}" is not in pipeline §B (typo/invented)`);
    // layer 8 may CHOOSE a real client asset instead of generating (section-bible "מפרט-יצירה או בחירה").
    // Tolerant: no asset ref = the generation branch, unchanged. An asset ref MUST resolve in the register.
    for (const am of txt.matchAll(/asset:[\s`*_]*(cl-\d{3})/gi) ) {
      const id = am[1].toLowerCase();
      if (!manifest) { fails.push(`sections/${r}: layer 8 picks ${id} but there is no assets-manifest.json — run /studio-ingest first`); continue; }
      const a = assetById.get(id);
      if (!a) fails.push(`sections/${r}: layer 8 picks ${id} but the manifest has no such asset`);
      else if (a.vision?.quality === "reject" || a.status === "rejected") fails.push(`sections/${r}: layer 8 picks ${id} but it was rejected (${a.vision?.quality || a.status}) — pick another or route to PHOTO-BRIEF`);
    }
  }
}

const sectionsDir = join(planDir, "sections");
if (existsSync(sectionsDir))
  for (const f of readdirSync(sectionsDir))
    if (f.endsWith(".md") && !refs.includes(f)) fails.push(`sections/${f} exists but WIREFRAME.md never lists it — add it to the long wireframe`);

if (fails.length) {
  console.error("✗ lint-plan: the plan is incomplete — do not build a premium site on a thin plan:");
  for (const x of fails) console.error("   " + x);
  process.exit(1);
}
console.log(`✓ lint-plan: ${new Set(refs).size} section(s) fully planned, stitched into one wireframe`);
process.exit(0);
