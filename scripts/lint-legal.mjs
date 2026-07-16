#!/usr/bin/env node
// lint-legal.mjs — the cross-client IDENTITY gate (audit #5). Two guarantees:
//   1. LEGAL PAGES ARE PARAMETERIZED — privacy/terms/accessibility exist, import the site config, and
//      interpolate site.name / site.legalName (checked in EVERY locale twin), so a scaffold can never
//      ship a prior client's legal identity (the witnessed leak: the template's legal trio hardcoded a
//      real prior client's name).
//   2. NO PRIOR-CLIENT IDENTITY SHIPS — walk the IMPORT GRAPH (shared lib-graph.mjs: static + dynamic +
//      side-effect imports, every entry-file family) from every page/layout/route; any REACHABLE file
//      containing a prior-client sentinel fails. An unreferenced brand exemplar (kept as a catalog
//      exemplar, tree-shaken away) passes — but the moment a page imports it, the gate blocks it.
// A sentinel that IS this dest's own identity (its site.ts name/legalName/url value) is skipped.
// Self-contained (+ ./lib-graph.mjs), runs IN the dest. Zero deps.  node scripts/lint-legal.mjs [--selftest]
import { existsSync, readdirSync, statSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { resolve, join, dirname, basename } from "node:path";
import { tmpdir } from "node:os";
import { read, stripComments, appDir, shippedFiles } from "./lib-graph.mjs";

const has = (k) => process.argv.includes("--" + k);

// Prior-client sentinels — APPEND ONE LINE PER HARVESTED CLIENT.
const PRIOR_CLIENTS = [
  "ברזילי", "barzilay", "שרונה",                     // origin client (real-estate appraisal)
  "digitalefficiency", "digital efficiency", "דיגיטל אפישנסי", // client #2 (automation studio)
];

function checkLegal(root) {
  const app = appDir(root);
  if (!app) return { skip: "no src/app", fails: [] };
  const fails = [];

  // 1. the legal trio is parameterized — in EVERY locale twin, on comment-stripped text
  const findPages = (name) => {
    const hits = [];
    (function walk(dir) {
      let entries; try { entries = readdirSync(dir); } catch { return; }
      for (const e of entries) {
        const p = join(dir, e);
        let st; try { st = statSync(p); } catch { continue; }
        if (st.isDirectory()) walk(p);
        else if (e === "page.tsx" && basename(dirname(p)) === name) hits.push(p);
      }
    })(app);
    return hits;
  };
  const rel = (p) => p.replace(root + "/", "");
  for (const name of ["privacy", "terms", "accessibility"]) {
    const pages = findPages(name);
    if (!pages.length) { fails.push(`no ${name}/page.tsx — the legal trio is a premium-client expectation`); continue; }
    for (const p of pages) {
      const txt = stripComments(read(p));
      if (!/from\s*["'`]@\/lib\/site["'`]/.test(txt)) fails.push(`${rel(p)} does not import the site config — its identity cannot flow from site.ts`);
      else if (!/(?:^|[^.\w])site\.(?:name|legalName)\b/.test(txt)) fails.push(`${rel(p)} never interpolates site.name/site.legalName — the business identity is hardcoded, not configured`);
    }
  }

  // 2. no prior-client identity in any SHIPPED (import-graph-reachable) file. The own-identity exemption
  // is scoped to the ACTUAL name/legalName/url VALUES in site.ts — not a whole-file substring (an
  // incidental testimonial/comment mentioning a sentinel must not disable it repo-wide).
  const siteTxt = stripComments(read(join(root, "src/lib/site.ts")) + "\n" + read(join(root, "lib/site.ts")));
  const ownValues = [...siteTxt.matchAll(/\b(?:name|legalName|url)\s*:\s*["'`]([^"'`]+)["'`]/g)].map((m) => m[1].toLowerCase());
  const sentinels = PRIOR_CLIENTS.filter((s) => !ownValues.some((v) => v.includes(s.toLowerCase())));
  const shipped = shippedFiles(root);
  for (const f of shipped) {
    const txt = stripComments(read(f)).toLowerCase();
    for (const s of sentinels) {
      if (txt.includes(s.toLowerCase())) {
        fails.push(`${rel(f)} ships "${s}" — a PRIOR CLIENT's identity is reachable from a page (rewrite the content for THIS client or remove the import)`);
        break;
      }
    }
  }
  return { fails, shipped: shipped.length };
}

// --selftest: reachable leak (static AND dynamic import) fails · unreferenced exemplar passes ·
// incidental site.ts mention does NOT disable the sentinel · unparameterized legal fails · clean passes.
function selftest() {
  const base = mkdtempSync(join(tmpdir(), "lint-legal-"));
  const mk = (root, over = {}) => {
    const files = {
      "src/lib/site.ts": 'export const site = { name: "מרפאת כהן", legalName: "מרפאת כהן בעמ", url: "https://cohen-clinic.co.il" };',
      "src/app/page.tsx": 'import { Hero } from "@/components/Hero";\nexport default function P(){ return <Hero/>; }',
      "src/components/Hero.tsx": "export function Hero(){ return <h1>שלום</h1>; }",
      "src/components/WhyOldClient.tsx": "export function W(){ return <p>משרד ברזילי — שלושה דורות</p>; }", // exemplar, NOT imported
      "src/app/privacy/page.tsx": 'import { site } from "@/lib/site";\nexport default function P(){ return <p>{`מדיניות של ${site.name}`}</p>; }',
      "src/app/terms/page.tsx": 'import { site } from "@/lib/site";\nexport default function P(){ return <p>{site.legalName}</p>; }',
      "src/app/accessibility/page.tsx": 'import { site } from "@/lib/site";\nexport default function P(){ return <p>{site.name}</p>; }',
      ...over,
    };
    for (const [p, body] of Object.entries(files)) { const fp = join(root, p); mkdirSync(dirname(fp), { recursive: true }); writeFileSync(fp, body); }
    return root;
  };
  const errs = [];
  if (checkLegal(mk(join(base, "clean"))).fails.length) errs.push("clean dest must pass");

  // a STATIC-imported prior-client exemplar fails
  if (!checkLegal(mk(join(base, "leak"), { "src/app/page.tsx": 'import { W } from "@/components/WhyOldClient";\nexport default function P(){ return <W/>; }' }))
    .fails.some((f) => /PRIOR CLIENT/.test(f))) errs.push("a statically-imported prior-client exemplar must fail");

  // a DYNAMIC-imported one must ALSO fail (the witnessed graph blind spot)
  if (!checkLegal(mk(join(base, "dyn"), { "src/app/page.tsx": 'import dynamic from "next/dynamic";\nconst W = dynamic(() => import("@/components/WhyOldClient"));\nexport default function P(){ return <W/>; }' }))
    .fails.some((f) => /PRIOR CLIENT/.test(f))) errs.push("a dynamically-imported prior-client exemplar must fail");

  // an incidental sentinel mention in site.ts (a testimonial/comment) must NOT disable the sentinel
  if (!checkLegal(mk(join(base, "incidental"), {
    "src/lib/site.ts": 'export const site = { name: "מרפאת כהן", legalName: "מרפאת כהן בעמ", testimonial: "שירות טוב יותר מברזילי" };',
    "src/app/page.tsx": 'import { W } from "@/components/WhyOldClient";\nexport default function P(){ return <W/>; }',
  })).fails.some((f) => /PRIOR CLIENT/.test(f))) errs.push("an incidental site.ts mention must not disable a sentinel repo-wide");

  // an unparameterized legal page fails
  if (!checkLegal(mk(join(base, "hard"), { "src/app/privacy/page.tsx": "export default function P(){ return <p>מדיניות של משרד פלוני</p>; }" }))
    .fails.some((f) => /privacy/.test(f))) errs.push("an unparameterized legal page must fail");

  rmSync(base, { recursive: true, force: true });
  if (errs.length) { console.error("✗ lint-legal --selftest:", errs.join("; ")); process.exit(1); }
  console.log("✓ lint-legal --selftest: static+dynamic prior-client leak fails · exemplar passes · incidental mention doesn't disable · hardcoded legal fails · clean passes");
  process.exit(0);
}

function main() {
  if (has("selftest")) return selftest();
  const r = checkLegal(resolve("."));
  if (r.skip) { console.log(`• lint-legal: ${r.skip} (skipped)`); process.exit(0); }
  if (r.fails.length) {
    console.error(`✗ lint-legal — ${r.fails.length} issue(s):`);
    r.fails.forEach((f) => console.error("  • " + f));
    console.error("  fix: legal pages interpolate site.name/site.legalName; prior-client exemplars stay UNIMPORTED (or get rewritten for this client).");
    process.exit(1);
  }
  console.log(`• lint-legal: legal trio parameterized · ${r.shipped} shipped file(s) carry no prior-client identity ✓`);
  process.exit(0);
}

export { checkLegal, PRIOR_CLIENTS };
import { fileURLToPath } from "node:url";
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) main();
