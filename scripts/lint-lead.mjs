#!/usr/bin/env node
// lint-lead.mjs — the compose-time LEAD-PIPE gate. launch-verify checks the pipe at go-live; this
// catches the same class months earlier, while composing. Three guarantees on the SHIPPED import graph
// (shared lib-graph.mjs — static + dynamic + side-effect imports, so a dynamically-loaded lead section
// is NOT invisible):
//   1. NO FORM POSTS INTO A VOID — every fetch("/api/…") in a shipped file resolves to an existing
//      route.ts (a composed form whose endpoint was never scaffolded silently drops every lead).
//   2. RESPONSE-PROMISE ADJACENCY — every shipped file that RENDERS a lead form (<…LeadForm/ContactForm>)
//      renders <ResponsePromise> too, OR its composing PARENT does (the wrapper pattern) — the trust recipe.
//   3. HONEYPOT KEPT — every api/**/lead route.ts carries honeypot handling. Derived by walking the api
//      tree DIRECTLY (not from the fetch regex), so a dynamic/template-literal fetch can't disable it.
// Self-contained (+ ./lib-graph.mjs), runs IN the dest. Zero deps.  node scripts/lint-lead.mjs [--selftest]
import { existsSync, readdirSync, statSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { read, stripComments, appDir, shippedGraph } from "./lib-graph.mjs";

const has = (k) => process.argv.includes("--" + k);

function checkLead(root) {
  const app = appDir(root);
  if (!app) return { skip: "no src/app", fails: [] };
  const fails = [];
  const rel = (p) => p.replace(root + "/", "");
  const { files: shipped, importedBy } = shippedGraph(root);

  // 1. every shipped fetch("/api/…") literal resolves to a real route.ts
  const routeFor = (apiPath) => {
    const seg = apiPath.replace(/^\/api\//, "").replace(/\/$/, "");
    return ["src/app/api", "app/api"].map((d) => join(root, d, seg, "route.ts")).find(existsSync);
  };
  for (const f of shipped) {
    const txt = stripComments(read(f));
    for (const m of txt.matchAll(/fetch\(\s*["'`](\/api\/[\w\-/]+)["'`]/g)) {
      if (!routeFor(m[1])) fails.push(`${rel(f)} POSTs to ${m[1]} but no route.ts exists there — every lead submitted vanishes`);
    }
  }

  // 2. ResponsePromise adjacency — in the file that renders the form, OR in a direct importing parent
  const promiseRenders = (txt) => /<ResponsePromise\b/.test(txt);
  for (const f of shipped) {
    const txt = stripComments(read(f));
    if (!/<\w*(?:LeadForm|ContactForm)\b/.test(txt)) continue;
    if (promiseRenders(txt)) continue;
    const parents = importedBy.get(f) || new Set();
    if ([...parents].some((p) => promiseRenders(stripComments(read(p))))) continue;
    fails.push(`${rel(f)} renders a lead form with no ResponsePromise beside it (nor in its importing parent) — the trust recipe (a stated response commitment adjacent to every form)`);
  }

  // 3. every lead route keeps its honeypot — walk the api tree directly, on comment-stripped text
  const apiDir = ["src/app/api", "app/api"].map((d) => join(root, d)).find(existsSync);
  const leadRoutes = [];
  if (apiDir) (function w(d) { let es; try { es = readdirSync(d); } catch { return; } for (const e of es) { const p = join(d, e); let st; try { st = statSync(p); } catch { continue; } if (st.isDirectory()) w(p); else if (/route\.(ts|js)$/.test(e) && /lead/i.test(p)) leadRoutes.push(p); } })(apiDir);
  // Detect the honeypot MECHANISM on comment-stripped code, not the word "honeypot" (a real honeypot
  // reads a trap FIELD — `company`/`_hp`/`gotcha` — and short-circuits; the word often lives only in a
  // comment). A route whose honeypot survives only as a comment (no field access) fails.
  for (const route of leadRoutes) {
    const code = stripComments(read(route));
    const hasHoneypot = /\bhoneypot\b/i.test(code) || /\.\s*(company|_?hp|_?gotcha|botfield)\b/i.test(code);
    if (!hasHoneypot) fails.push(`${rel(route)} has no honeypot handling — the lead pipe is open to bot spam from day one`);
  }

  return { fails, shipped: shipped.length, leadRoutes: leadRoutes.length };
}

// --selftest: void endpoint (static+dynamic) fails · missing-promise fails · WRAPPER composition passes ·
// honeypot-in-a-comment fails · wired passes.
function selftest() {
  const base = mkdtempSync(join(tmpdir(), "lint-lead-"));
  const ROUTE_OK = "export async function POST(req){ const honeypot = (await req.json()).company; if (honeypot) return Response.json({ok:true}); return Response.json({ok:true}); }";
  const mk = (root, over = {}) => {
    const files = {
      "src/app/page.tsx": 'import { Form } from "@/components/Form";\nexport default function P(){ return <Form/>; }',
      "src/components/Form.tsx": 'import { ResponsePromise } from "@/components/ResponsePromise";\nexport function Form(){ const go=()=>fetch("/api/lead",{method:"POST"}); return <><MyLeadForm onGo={go}/><ResponsePromise/></>; }\nfunction MyLeadForm(){ return null; }',
      "src/components/ResponsePromise.tsx": "export function ResponsePromise(){ return <p>נחזור תוך יום עסקים</p>; }",
      "src/app/api/lead/route.ts": ROUTE_OK,
      ...over,
    };
    for (const [p, body] of Object.entries(files)) { const fp = join(root, p); mkdirSync(dirname(fp), { recursive: true }); writeFileSync(fp, body); }
    return root;
  };
  const errs = [];
  if (checkLead(mk(join(base, "clean"))).fails.length) errs.push(`clean dest must pass: ${checkLead(mk(join(base, "clean2"))).fails.join("; ")}`);

  // void endpoint via STATIC import
  const v = mk(join(base, "void")); rmSync(join(v, "src/app/api"), { recursive: true, force: true });
  if (!checkLead(v).fails.some((f) => /vanishes/.test(f))) errs.push("a fetch to a nonexistent /api route must fail");

  // void endpoint behind a DYNAMIC import (the graph blind spot)
  const dyn = mk(join(base, "dyn"), {
    "src/app/page.tsx": 'import dynamic from "next/dynamic";\nconst Lead = dynamic(() => import("@/components/LeadSection"));\nexport default function P(){ return <Lead/>; }',
    "src/components/LeadSection.tsx": 'export function LeadSection(){ const go=()=>fetch("/api/nowhere",{method:"POST"}); return <MyLeadForm onGo={go}/>; }\nfunction MyLeadForm(){ return null; }',
  });
  if (!checkLead(dyn).fails.some((f) => /vanishes/.test(f))) errs.push("a void endpoint behind dynamic() must fail");

  // WRAPPER composition: page renders <Form/> and <ResponsePromise/> siblings; Form has only the form → PASS
  const wrap = mk(join(base, "wrap"), {
    "src/app/page.tsx": 'import { Form } from "@/components/Form";\nimport { ResponsePromise } from "@/components/ResponsePromise";\nexport default function P(){ return <><Form/><ResponsePromise/></>; }',
    "src/components/Form.tsx": 'export function Form(){ const go=()=>fetch("/api/lead",{method:"POST"}); return <MyLeadForm onGo={go}/>; }\nfunction MyLeadForm(){ return null; }',
  });
  if (checkLead(wrap).fails.some((f) => /ResponsePromise/.test(f))) errs.push("wrapper composition (promise in the parent) must PASS");

  // form with NO promise anywhere → fail
  const noProm = mk(join(base, "noprom"), {
    "src/app/page.tsx": 'import { Form } from "@/components/Form";\nexport default function P(){ return <Form/>; }',
    "src/components/Form.tsx": 'export function Form(){ const go=()=>fetch("/api/lead",{method:"POST"}); return <MyLeadForm onGo={go}/>; }\nfunction MyLeadForm(){ return null; }',
  });
  if (!checkLead(noProm).fails.some((f) => /ResponsePromise/.test(f))) errs.push("a lead form with no promise anywhere must fail");

  // honeypot only in a COMMENT (no field mechanism) → fail
  const fakeHoney = mk(join(base, "fakehoney"), { "src/app/api/lead/route.ts": "export async function POST(){ /* honeypot handled elsewhere */ return Response.json({ok:true}); }" });
  if (!checkLead(fakeHoney).fails.some((f) => /honeypot/i.test(f))) errs.push("a honeypot mentioned only in a comment must fail");

  // honeypot as a FIELD mechanism with the word only in a comment (the real template pattern) → PASS
  const fieldHoney = mk(join(base, "fieldhoney"), { "src/app/api/lead/route.ts": "export async function POST(req){ const b = await req.json(); /* honeypot */ if (b.company && b.company.trim()) return Response.json({ok:true}); return Response.json({ok:true}); }" });
  if (checkLead(fieldHoney).fails.some((f) => /honeypot/i.test(f))) errs.push("a real field-based honeypot (word only in a comment) must PASS");

  rmSync(base, { recursive: true, force: true });
  if (errs.length) { console.error("✗ lint-lead --selftest:", errs.join("; ")); process.exit(1); }
  console.log("✓ lint-lead --selftest: void endpoint (static+dynamic) fails · wrapper promise passes · comment-only honeypot fails · wired passes");
  process.exit(0);
}

function main() {
  if (has("selftest")) return selftest();
  const r = checkLead(resolve("."));
  if (r.skip) { console.log(`• lint-lead: ${r.skip} (skipped)`); process.exit(0); }
  if (r.fails.length) {
    console.error(`✗ lint-lead — ${r.fails.length} issue(s):`);
    r.fails.forEach((f) => console.error("  • " + f));
    console.error("  fix: scaffold the missing /api route, put ResponsePromise beside every form (or in its wrapper), keep the honeypot in the lead route.");
    process.exit(1);
  }
  console.log(`• lint-lead: ${r.shipped} shipped file(s) · every form endpoint exists · ResponsePromise adjacency holds · ${r.leadRoutes} lead route(s) honeypotted ✓`);
  process.exit(0);
}

export { checkLead };
import { fileURLToPath } from "node:url";
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) main();
