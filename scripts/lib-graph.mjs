// lib-graph.mjs — the SHIPPED import graph + comment stripper, shared by lint-legal + lint-lead (was
// copy-pasted, drifting). A file the graph MISSES is falsely exonerated, so a prior-client leak or a
// void lead-endpoint behind dynamic() would ship as PASS. This walks from every Next.js ENTRY file
// (routes + the metadata/error/loading family + middleware/instrumentation) and follows EVERY import
// form that bundles: static `from`, `export … from`, dynamic `import()` (next/dynamic), bare `import()`,
// and side-effect `import "x"`.
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";

export const read = (p) => { try { return readFileSync(p, "utf8"); } catch { return ""; } };

// Strip /* block */ + // line comments — STRING-AWARE: a // inside "…"/'…'/`…` (a URL, "a//b") is kept,
// so neither a sentinel-after-a-real-slash nor a legit string is mangled. A small quote/escape machine.
export function stripComments(src) {
  let out = "", i = 0; const n = src.length;
  let q = null, block = false, line = false;
  while (i < n) {
    const c = src[i], d = i + 1 < n ? src[i + 1] : "";
    if (block) { if (c === "*" && d === "/") { block = false; i += 2; } else i++; continue; }
    if (line) { if (c === "\n") { line = false; out += c; } i++; continue; }
    if (q) { out += c; if (c === "\\") { out += d; i += 2; continue; } if (c === q) q = null; i++; continue; }
    if (c === '"' || c === "'" || c === "`") { q = c; out += c; i++; continue; }
    if (c === "/" && d === "*") { block = true; i += 2; continue; }
    if (c === "/" && d === "/") { line = true; i += 2; continue; }
    out += c; i++;
  }
  return out;
}

export const srcBase = (root) => (existsSync(join(root, "src")) ? join(root, "src") : root);
export const appDir = (root) => ["src/app", "app"].map((d) => join(root, d)).find(existsSync);

export function resolveImport(root, fromFile, spec) {
  let base = null;
  if (spec.startsWith("@/")) base = join(srcBase(root), spec.slice(2));
  else if (spec.startsWith("./") || spec.startsWith("../")) base = join(dirname(fromFile), spec);
  else return null; // a bare package — not ours
  const exts = [".tsx", ".ts", ".jsx", ".js", ".mjs", ".mdx"];
  const cands = [base, ...exts.map((e) => base + e), ...exts.map((e) => join(base, "index" + e))];
  for (const cand of cands) { try { if (statSync(cand).isFile()) return cand; } catch { /* keep trying */ } }
  return null;
}

// Next.js entry files that actually ship (routes + the metadata/error/loading family).
const ROOTS = /^(page|layout|route|not-found|template|error|global-error|loading|default|forbidden|unauthorized|opengraph-image|twitter-image|icon|apple-icon|sitemap|robots|manifest)\.(tsx|ts|jsx|js)$/;
// Every bundling import form (fresh lastIndex per file — module-level regexes are stateful with /g).
const IMPORT_FORMS = [
  /(?:import\s[^"'`]*?|export\s[^"'`]*?)from\s*["'`]([^"'`]+)["'`]/g, // static import / re-export
  /\bimport\s*\(\s*["'`]([^"'`]+)["'`]\s*\)/g,                        // dynamic import() + next/dynamic
  /(?:^|[;{}()\s])import\s+["'`]([^"'`]+)["'`]/g,                     // side-effect import "x"
];

// Returns { files, importedBy } — importedBy.get(dep) = Set of files that import it (one-level parents,
// for the ResponsePromise wrapper check).
export function shippedGraph(root) {
  const app = appDir(root);
  if (!app) return { files: [], importedBy: new Map() };
  const roots = [];
  (function walk(dir) {
    let entries; try { entries = readdirSync(dir); } catch { return; }
    for (const e of entries) {
      const p = join(dir, e);
      let st; try { st = statSync(p); } catch { continue; }
      if (st.isDirectory()) walk(p);
      else if (ROOTS.test(e)) roots.push(p);
    }
  })(app);
  for (const extra of ["src/middleware.ts", "middleware.ts", "src/instrumentation.ts", "instrumentation.ts"]) {
    const p = join(root, extra); if (existsSync(p)) roots.push(p);
  }
  const seen = new Set(roots), queue = [...roots], importedBy = new Map();
  while (queue.length) {
    const f = queue.pop();
    const txt = read(f);
    for (const re of IMPORT_FORMS) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(txt)) !== null) {
        const dep = resolveImport(root, f, m[1]);
        if (!dep) continue;
        if (!importedBy.has(dep)) importedBy.set(dep, new Set());
        importedBy.get(dep).add(f);
        if (!seen.has(dep)) { seen.add(dep); queue.push(dep); }
      }
    }
  }
  return { files: [...seen], importedBy };
}

export const shippedFiles = (root) => shippedGraph(root).files;
