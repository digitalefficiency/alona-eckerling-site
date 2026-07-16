#!/usr/bin/env node
// lint-pain.mjs — the anchor pain must reach screen 1. STORY.md ranks pains by ACUITY×FREQUENCY
// (story-psychology.md Step 1.5); the highest-weight "anchor" pain must appear in the HERO section's
// plan file (plan/sections/01*.md), or the site opens on the wrong beat. Self-contained, runs IN the
// dest. Tolerant: no STORY.md, no pain-hierarchy table, or no hero section file → skip (exit 0).
//   node scripts/lint-pain.mjs
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";

const story = resolve("STORY.md");
if (!existsSync(story)) { console.log("• lint-pain: no STORY.md (skipped)"); process.exit(0); }
const txt = readFileSync(story, "utf8");
if (!/painType|היררכיית.?הכאב/.test(txt)) { console.log("• lint-pain: no pain-hierarchy table (skipped)"); process.exit(0); }

// find the anchor row: a table data line carrying the ✅ anchor marker (the header "עוגן?" has no ✅).
const anchor = txt.split("\n").find((l) => l.includes("|") && l.includes("✅"));
if (!anchor) { console.log("• lint-pain: hierarchy present but no anchor row marked ✅ (skipped)"); process.exit(0); }
const cols = anchor.split("|").map((c) => c.trim()).filter(Boolean);
const painPhrase = (cols[0] || "").replace(/[«»]/g, "").trim();
const painType = (cols[1] || "").trim();
// a distinctive token from the phrase (longest word ≥3 chars) as a secondary signal
const phraseToken = painPhrase.split(/\s+/).filter((w) => w.replace(/[^֐-׿A-Za-z]/g, "").length >= 3).sort((a, b) => b.length - a.length)[0] || "";

const secDir = resolve("plan", "sections");
if (!existsSync(secDir)) { console.log("• lint-pain: no plan/sections (skipped)"); process.exit(0); }
const files = readdirSync(secDir).filter((f) => f.endsWith(".md"));
const hero = files.find((f) => /(^|[^0-9])0*1\b/.test(f) || /hero/i.test(f)) || files.sort()[0];
if (!hero) { console.log("• lint-pain: no hero section file (skipped)"); process.exit(0); }
const heroTxt = readFileSync(join(secDir, hero), "utf8");

const hasType = painType && new RegExp(`\\b${painType.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`).test(heroTxt);
const hasPhrase = phraseToken && heroTxt.includes(phraseToken);
if (!hasType && !hasPhrase) {
  console.error(`✗ lint-pain: the anchor pain ("${painPhrase}" · ${painType}) is absent from the hero section (${hero}).`);
  console.error("   The site's screen 1 must lead with the highest-weight pain (story-psychology.md Step 1.5a).");
  console.error("   Cite the anchor painType (or its phrase) in the hero section's layer 1/2.");
  process.exit(1);
}
console.log(`✓ lint-pain: anchor pain (${painType || painPhrase}) reaches the hero section (${hero})`);
process.exit(0);
