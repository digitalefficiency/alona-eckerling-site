#!/usr/bin/env node
// parity.mjs — the gate for every section extraction.
//
// Moving copy out of a component and into data is only safe if the rendered
// output does not move. This captures a baseline, and then proves that after
// the extraction the HTML is byte-identical.
//
//   node scripts/parity.mjs snap        capture the baseline (BEFORE editing)
//   node scripts/parity.mjs check       compare against it
//   node scripts/parity.mjs check /about
//
// WHY IT NORMALISES: Next emits three things that change between two identical
// requests to the same build — the static chunk hashes, the streamed RSC
// payload, and `self.__next_r`, a per-request id. Comparing those would make
// the gate fail on every run and it would be switched off within a day.
//
// The normaliser is itself verified: every run first fetches the page TWICE and
// asserts the two are identical. If that control fails, the normaliser is
// missing something volatile and the comparison below it means nothing — so the
// script refuses to report a verdict rather than reporting a false one.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";

const BASE = process.env.PARITY_BASE ?? "http://127.0.0.1:3020";
const DIR = path.join(process.cwd(), ".parity");
const ROUTES = ["/", "/about", "/coaching", "/contact", "/testimonials", "/recipes"];

const norm = (s) =>
  s
    .replace(/\/_next\/static\/[^"']+/g, "<chunk>")
    .replace(/self\.__next_f\.push\([\s\S]*?\)<\/script>/g, "<rsc></script>")
    .replace(/"buildId":"[^"]*"/g, '"buildId":"<id>"')
    .replace(/self\.__next_r="[^"]*"/g, 'self.__next_r="<req>"')
    .replace(/<!--\$\?--><template id="B:[^"]*"><\/template>/g, "<suspense>");

const sha = (s) => createHash("sha256").update(s).digest("hex").slice(0, 16);
const fileFor = (route) => path.join(DIR, (route === "/" ? "home" : route.replace(/\//g, "_")) + ".html");

async function fetchNorm(route) {
  const res = await fetch(BASE + route, { headers: { "cache-control": "no-cache" } });
  if (!res.ok) throw new Error(`${route} → HTTP ${res.status}`);
  return norm(await res.text());
}

/** Two requests to the same build must normalise identically, or the gate is blind. */
async function control(route) {
  const a = await fetchNorm(route);
  const b = await fetchNorm(route);
  return { ok: a === b, body: a };
}

const cmd = process.argv[2] ?? "check";
const only = process.argv[3];
const routes = only ? [only] : ROUTES;

mkdirSync(DIR, { recursive: true });

let failed = 0;
for (const route of routes) {
  let body;
  try {
    const c = await control(route);
    if (!c.ok) {
      console.error(`  ${route.padEnd(14)} CONTROL FAILED — two identical requests differ.`);
      console.error(`                 The normaliser is missing something volatile; no verdict is possible.`);
      failed++;
      continue;
    }
    body = c.body;
  } catch (err) {
    console.error(`  ${route.padEnd(14)} ${err.message}`);
    failed++;
    continue;
  }

  const f = fileFor(route);

  if (cmd === "snap") {
    writeFileSync(f, body, "utf8");
    console.log(`  ${route.padEnd(14)} baseline captured  ${sha(body)}  ${body.length} chars`);
    continue;
  }

  if (!existsSync(f)) {
    console.log(`  ${route.padEnd(14)} no baseline — run: node scripts/parity.mjs snap`);
    continue;
  }

  const before = readFileSync(f, "utf8");
  if (before === body) {
    console.log(`  ${route.padEnd(14)} identical  ${sha(body)}`);
  } else {
    failed++;
    console.error(`  ${route.padEnd(14)} DIFFERS   before=${sha(before)} after=${sha(body)}`);
    // character-level, because the whole document is one line
    const at = [...before].findIndex((c, i) => c !== body[i]);
    if (at >= 0) {
      console.error(`     first difference at char ${at}:`);
      console.error(`       before: …${before.slice(Math.max(0, at - 70), at + 70)}…`);
      console.error(`       after : …${body.slice(Math.max(0, at - 70), at + 70)}…`);
    } else {
      console.error(`     one is a prefix of the other (${before.length} → ${body.length} chars)`);
    }
  }
}

if (failed) {
  console.error(`\n  ${failed} route(s) not identical.`);
  process.exit(1);
}
console.log(`\n  ${routes.length} route(s) ${cmd === "snap" ? "captured" : "identical"}.`);
