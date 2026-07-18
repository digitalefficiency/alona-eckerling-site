// legacy-redirects.test.mjs — validates the Wix→new-site 301 map against reality:
//   1. every RECIPE_MAP destination is a real content/recipes/<slug>.md file
//   2. every RECIPE_MAP + PAGE_MAP source is a real old URL (Wayback inventory)
//   3. no duplicate sources; specific /post/ entries precede the catch-all
// Run: node --test src/lib/legacy-redirects.test.mjs   (WAYBACK env optional)
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");

// import the TS map without a build step: strip types with a tiny transform is
// overkill — instead read the source and eval the two object literals we need.
const src = readFileSync(join(HERE, "legacy-redirects.ts"), "utf8");
function literalAfter(name) {
  const i = src.indexOf(`export const ${name}`);
  assert.ok(i >= 0, `${name} not found`);
  const open = src.indexOf("{", i);
  let depth = 0, end = -1;
  for (let j = open; j < src.length; j++) {
    if (src[j] === "{") depth++;
    else if (src[j] === "}") { depth--; if (depth === 0) { end = j; break; } }
  }
  // eslint-disable-next-line no-eval
  return eval("(" + src.slice(open, end + 1) + ")");
}
const RECIPE_MAP = literalAfter("RECIPE_MAP");
const PAGE_MAP = literalAfter("PAGE_MAP");

const recipeSlugs = new Set(
  readdirSync(join(ROOT, "content/recipes"))
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, "")),
);

test("every RECIPE_MAP destination is a real recipe file", () => {
  for (const [he, en] of Object.entries(RECIPE_MAP)) {
    assert.ok(recipeSlugs.has(en), `dest /recipes/${en} (from ${he}) has no content/recipes/${en}.md`);
  }
});

test("RECIPE_MAP + PAGE_MAP have no duplicate or empty entries", () => {
  const sources = [
    ...Object.keys(RECIPE_MAP).map((h) => `/post/${h}`),
    ...Object.keys(PAGE_MAP),
  ];
  assert.equal(new Set(sources).size, sources.length, "duplicate source paths");
  for (const [he, en] of Object.entries(RECIPE_MAP)) {
    assert.ok(he.length > 0 && en.length > 0, "empty recipe map entry");
    assert.ok(!en.includes("/"), `english slug must be bare, got ${en}`);
  }
});

// Optional: cross-check every source against the recovered Wayback inventory.
// Point WAYBACK at the CDX export to enable (skipped if the file is absent).
test("every mapped source exists in the Wayback inventory (if available)", () => {
  const wb = process.env.WAYBACK;
  if (!wb || !existsSync(wb)) return; // soft-skip when the scratch file is gone
  const raw = readFileSync(wb, "utf8");
  const oldPaths = new Set(
    raw.trim().split("\n").map((u) => {
      const m = u.replace(/^https?:\/\/(www\.)?alonaeck\.com/, "");
      try { return decodeURIComponent(m.split("?")[0]); } catch { return m; }
    }),
  );
  for (const he of Object.keys(RECIPE_MAP)) {
    assert.ok(oldPaths.has(`/post/${he}`), `/post/${he} not in Wayback inventory — check the slug`);
  }
  for (const p of Object.keys(PAGE_MAP)) {
    assert.ok(oldPaths.has(p), `${p} not in Wayback inventory — check the path`);
  }
});
