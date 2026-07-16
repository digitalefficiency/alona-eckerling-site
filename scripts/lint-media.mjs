#!/usr/bin/env node
// lint-media.mjs — no reused client media. Real pixels have exactly three sanctioned homes:
//   /media/generated/ — created for THIS client per plan/ section-bible layer 8 (existence = generated)
//   /media/client/    — the client's OWN photography, entering ONLY via `ingest-assets.mjs install`:
//                       every file needs a row in the dest-root assets-manifest.json with a matching
//                       hash, status approved/installed, and a brief-confirmed license (materials-intake.md)
//   /media/cinema/    — film bundles delivered by scroll-cinema
// Any other /media/<dir>/ is an unsanctioned home and fails EVEN IF the file exists — mere existence
// is exactly how prior-client media used to launder through. Self-contained; runs IN the dest. Zero deps.
//   node scripts/lint-media.mjs

import { readdirSync, readFileSync, existsSync, lstatSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, resolve, relative, basename } from "node:path";

const SRC = resolve("src");
const PUBLIC = resolve("public");
// chrome that degrades gracefully — exempt: logo → name wordmark on 404; decorative texture bg; client logo strip
const EXEMPT = [/\/media\/logo(-dark)?\.png$/, /\/media\/texture\//, /\/media\/logos\//];
// examples-only, never composed — don't scan: the brandSpecific reference components
// AND the internal /styleguide page (noindex, absent from sitemap, exempt from lint-copy —
// its media are demo placeholders for the living design/motion reference, never delivered).
const BRAND = /EditorialHero|WhyBarzilay|OurStory|BooksArticles|ProcessSteps|StatCounters|UrbanRenewal|ScrollStory|StoryJourney|HeroShutter|CinematicTeaser|LevyDiagram|styleguide/;
const HOMES = /^\/media\/(generated|client|cinema)\//;

const files = [];
const walk = (d) => {
  for (const e of readdirSync(d)) {
    const f = join(d, e);
    const st = lstatSync(f);
    if (st.isSymbolicLink()) continue;
    if (st.isDirectory()) walk(f);
    else if (/\.(tsx?|ts)$/.test(e)) files.push(f);
  }
};
try { walk(SRC); } catch { console.log("• lint-media: no src (skipped)"); process.exit(0); }

// the client-media register: dest-root manifest written by ingest-assets.mjs install (NEVER under public/)
let manifest = null;
try { manifest = JSON.parse(readFileSync(resolve("assets-manifest.json"), "utf8")); } catch { /* absent is fine until /media/client/ is used */ }
const register = new Map((manifest?.assets || []).map((a) => [a.installPath, a]));
const sha256 = (p) => createHash("sha256").update(readFileSync(p)).digest("hex");
const INGEST_HINT = "client media enters ONLY via ingest-assets.mjs — this file was not ingested for THIS client";

const problems = new Set();
for (const f of files) {
  if (BRAND.test(f)) continue;
  const txt = readFileSync(f, "utf8");
  for (const m of txt.matchAll(/["'`](\/media\/[A-Za-z0-9/._-]+\.(?:webp|jpg|jpeg|png|mp4|avif))["'`]/g)) {
    const ref = m[1], at = `${relative(resolve("."), f)} → ${ref}`;
    if (EXEMPT.some((re) => re.test(ref))) continue;
    if (!HOMES.test(ref)) { problems.add(`${at} — unsanctioned media home (allowed: generated/, client/, cinema/)`); continue; }
    if (!existsSync(join(PUBLIC, ref))) { problems.add(`${at} — file does not exist`); continue; }
    if (ref.startsWith("/media/client/")) {
      const a = register.get(ref);
      if (!manifest) problems.add(`${at} — /media/client/ used but no assets-manifest.json at the dest root (${INGEST_HINT})`);
      else if (!a) problems.add(`${at} — no manifest row (${INGEST_HINT})`);
      else if (sha256(join(PUBLIC, ref)) !== a.optimized?.sha256) problems.add(`${at} — on-disk hash ≠ manifest optimized.sha256 (tampered or stale copy)`);
      else if (!["approved", "installed"].includes(a.status)) problems.add(`${at} — status "${a.status}" (only approved/installed ship)`);
      else if (a.license?.status !== "client-confirmed") problems.add(`${at} — license "${a.license?.status}" not brief-confirmed`);
    }
  }
}

// disk sweep: every physical file under public/media/client/ must be registered — referenced or not
const clientDir = join(PUBLIC, "media", "client");
if (existsSync(clientDir)) {
  const onDisk = readdirSync(clientDir).filter((e) => !e.startsWith(".") && e !== "README.md" && !lstatSync(join(clientDir, e)).isDirectory());
  if (onDisk.length && !manifest) problems.add(`public/media/client/ holds ${onDisk.length} file(s) but there is no dest-root assets-manifest.json (${INGEST_HINT})`);
  else for (const e of onDisk) if (!register.has(`/media/client/${e}`)) problems.add(`public/media/client/${e} is on disk but unregistered — no laundering (${INGEST_HINT})`);
  // same-client seal: a prior client's manifest can't be carried wholesale
  if (onDisk.length && manifest && manifest.client?.slug !== basename(resolve(".")))
    problems.add(`assets-manifest client.slug "${manifest.client?.slug}" ≠ this dest "${basename(resolve("."))}" — re-run ingest-assets.mjs install for THIS client`);
}

if (problems.size) {
  console.error(`✗ lint-media: ${problems.size} media problem(s).`);
  console.error("  Generated media → public/media/generated/ per plan/ section-bible layer 8 (premium-generation.md).");
  console.error("  Client-owned media → ingest-assets.mjs install only (manifest + hash + confirmed license).");
  for (const x of problems) console.error("   " + x);
  process.exit(1);
}
console.log("✓ lint-media: every media reference is sanctioned, present, and (client/) registered with a confirmed license");
process.exit(0);
