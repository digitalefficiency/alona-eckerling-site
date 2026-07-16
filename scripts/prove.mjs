#!/usr/bin/env node
// prove.mjs — the receipts machine (premium-tier: "invisible work made visible").
//
//   node scripts/prove.mjs [--port 3000] [--interior /services/service-1] [--skip-lighthouse]
//
// Runs IN a scaffolded site (dest). Collects, into RECEIPTS.md at the repo root:
//   1. gates      — lint-copy + lint-motion (+ validate-configs when the cinema addon ships)
//   2. schema     — JSON-LD blocks extracted from the running pages, parsed + typed
//   3. lighthouse — perf/SEO/a11y/best-practices for home + one interior (needs the site
//                   running: `pnpm build && pnpm start -p <port>` for honest numbers)
// Sections degrade gracefully (a skipped section says WHY + how to run it) — but the
// pre-delivery gate (premium-tier rubric) requires the Lighthouse row ≥90, so a skipped
// run is NOT a passing receipt. Zero deps; Lighthouse via `npx lighthouse` (Chrome needed).

import { execFileSync } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > -1 ? process.argv[i + 1] : d; };
const PORT = Number(arg("port", 3000));
const INTERIOR = arg("interior", "");
const SKIP_LH = process.argv.includes("--skip-lighthouse");
const BASE = `http://localhost:${PORT}`;
const lines = [];
const say = (s) => { console.log(s); };

const run = (cmd, cmdArgs) => {
  try { return { ok: true, out: execFileSync(cmd, cmdArgs, { stdio: "pipe" }).toString() }; }
  catch (e) { return { ok: false, out: (e.stdout?.toString() || "") + (e.stderr?.toString() || e.message) }; }
};

lines.push(`# RECEIPTS — ${new Date().toISOString().slice(0, 16).replace("T", " ")}`);
lines.push("");

// ---- 1. gates ---------------------------------------------------------------
say("▶ gates…");
lines.push("## שערים (gates)");
for (const [label, script, extra] of [
  ["lint-copy (אפס placeholder/ביטויים אסורים)", "scripts/lint-copy.mjs", []],
  ["lint-motion (טוקנים בלבד)", "scripts/lint-motion.mjs", []],
  ["lint-design (עיצוב דורכן — DESIGN-DIRECTION בנוי ומבודל)", "scripts/lint-design.mjs", []],
  ["lint-plan (תכנון שלם — WIREFRAME + קובץ עמוק פר-סקשן)", "scripts/lint-plan.mjs", []],
  ["lint-pain (הכאב-העוגן מגיע למסך-1 — סקשן ה-Hero)", "scripts/lint-pain.mjs", []],
  ["lint-compose (כל בלוק-COPY נצרך — אפס יתומים)", "scripts/lint-compose.mjs", []],
  ["lint-variety (גיוון-בתוך-אחדות — ארכיטיפ שונה פר-סקשן)", "scripts/lint-variety.mjs", []],
  ["lint-structure (הורכב מ-STORY, לא ריסקון של דיפולט)", "scripts/lint-structure.mjs", []],
  ["lint-media (מדיה מיוצרת/אמיתית — אפס ריסייקל של מדיה-תבנית)", "scripts/lint-media.mjs", []],
  ["lint-market (בניית-en — אפס מחרוזות-chrome עבריות שנשארו)", "scripts/lint-market.mjs", []],
  ["lint-seo (SELF-canonical פר-עמוד אינדקסבילי + sitemap/robots — הורג את באג ה-canonical-לבית)", "scripts/lint-seo.mjs", []],
  ["lint-i18n (אתר דו-לשוני — hreflang פר-עמוד + עץ-לוקאל + sitemap; רדום באתר חד-לשוני)", "scripts/lint-i18n.mjs", []],
  ["lint-legal (זהות-משפטית מפורמטרת + אפס זהות-לקוח-קודם בקבצים נשלחים)", "scripts/lint-legal.mjs", []],
  ["lint-lead (צינור-לידים — endpoint קיים · ResponsePromise צמוד · honeypot שמור)", "scripts/lint-lead.mjs", []],
  ["lint-content (תוכן-לקוח — סכימה פר-אוסף · אפס HTML גולמי · alt חובה; רדום בלי אוספים)", "scripts/lint-content.mjs", []],
  ["validate-configs (סרט)", "scripts/validate-configs.mjs", []],
]) {
  if (!existsSync(resolve(script))) { lines.push(`- ${label}: — (הסקריפט לא קיים בפרויקט זה)`); continue; }
  const r = run("node", [script, ...extra]);
  lines.push(`- ${label}: ${r.ok ? "✅ PASS" : "❌ FAIL"}${r.ok ? "" : `\n  \`\`\`\n${r.out.trim().split("\n").slice(-6).join("\n")}\n  \`\`\``}`);
}
lines.push("");

// ---- helper: is the site up? --------------------------------------------------
async function fetchText(url) {
  try { const res = await fetch(url, { redirect: "follow" }); return res.ok ? await res.text() : null; }
  catch { return null; }
}

// ---- 2. schema (JSON-LD) ------------------------------------------------------
say("▶ schema…");
lines.push("## סכימות (JSON-LD)");
const pages = ["/", ...(INTERIOR ? [INTERIOR] : [])];
let siteUp = false;
for (const p of pages) {
  const html = await fetchText(BASE + p);
  if (!html) { lines.push(`- \`${p}\`: — (השרת לא זמין על :${PORT} — הריצו \`pnpm build && pnpm start -p ${PORT}\` והריצו שוב)`); continue; }
  siteUp = true;
  if (p === "/" && /<meta[^>]+name="robots"[^>]+noindex/i.test(html))
    lines.push("- ℹ שער-ה-noindex דולק (טרום-השקה) — ציון ה-SEO של Lighthouse נענש על כך בעשרות נקודות; לציון האמיתי הריצו על staging עם NEXT_PUBLIC_ALLOW_INDEXING=true.");
  // F3: tolerant of attribute order, extra attrs (id/nonce), and single/double quotes —
  // a strict literal missed valid JSON-LD and produced a false "no JSON-LD" receipt.
  const blocks = [...html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  if (!blocks.length) { lines.push(`- \`${p}\`: ⚠ אין בלוקי JSON-LD`); continue; }
  const types = [];
  let valid = true;
  for (const [, raw] of blocks) {
    try { const j = JSON.parse(raw); types.push(j["@type"] || "?"); } catch { valid = false; }
  }
  lines.push(`- \`${p}\`: ${valid ? "✅" : "❌ JSON שבור"} — ${blocks.length} בלוק(ים): ${types.join(", ")} _(ולידציה מלאה: validator.schema.org)_`);
  // bonus receipt: SSR content sanity — no <canvas> in server HTML (cinema invariant)
  if (p === "/") lines.push(`- SSR בית: ${html.includes("<canvas") ? "❌ <canvas> בשרת!" : "✅ ללא <canvas>"} · ${html.length.toLocaleString()} בתים`);
}
lines.push("");

// ---- 3. lighthouse ------------------------------------------------------------
lines.push("## Lighthouse (הרף: ≥90 בביצועים/SEO/נגישות)");
if (SKIP_LH) {
  lines.push("- דולג (--skip-lighthouse) — **קבלה חסרה**, אין לצרף למסירה בלי השורה הזו.");
} else if (!siteUp) {
  lines.push(`- דולג — השרת לא רץ על :${PORT}. להרצה אמיתית: \`pnpm build && pnpm start -p ${PORT}\` ואז \`node scripts/prove.mjs\`.`);
} else {
  say("▶ lighthouse (זה לוקח דקה)…");
  for (const p of pages) {
    try {
      // F5: argv array, not an interpolated shell string — the --interior value reaches
      // lighthouse as one argument and cannot break out into the shell.
      const out = execFileSync("npx", [
        "--yes", "lighthouse", `${BASE}${p}`,
        "--output=json", "--quiet",
        "--only-categories=performance,accessibility,best-practices,seo",
        "--chrome-flags=--headless=new --no-sandbox",
      ], { stdio: ["ignore", "pipe", "ignore"], timeout: 180000 }).toString();
      const j = JSON.parse(out);
      const s = (c) => Math.round((j.categories[c]?.score ?? 0) * 100);
      const perf = s("performance"), a11y = s("accessibility"), seo = s("seo"), bp = s("best-practices");
      const lcp = j.audits?.["largest-contentful-paint"]?.displayValue ?? "?";
      const cls = j.audits?.["cumulative-layout-shift"]?.displayValue ?? "?";
      const pass = perf >= 90 && a11y >= 90 && seo >= 90;
      lines.push(`- \`${p}\`: ${pass ? "✅" : "❌"} ביצועים **${perf}** · נגישות **${a11y}** · SEO **${seo}** · best-practices ${bp} · LCP ${lcp} · CLS ${cls}`);
    } catch (e) {
      lines.push(`- \`${p}\`: ⚠ Lighthouse נכשל (${String(e.message).slice(0, 80)}…) — ודאו Chrome מותקן ונסו שוב.`);
    }
  }
}
lines.push("");
lines.push("_הקבלות האלו מצורפות ל-HANDOFF.md — מספרים אמיתיים מהריצה, לעולם לא הערכות._");

writeFileSync(resolve("RECEIPTS.md"), lines.join("\n") + "\n");
say(`\n✓ RECEIPTS.md נכתב (${lines.length} שורות)`);
const failed = lines.some((l) => l.includes("❌"));
process.exit(failed ? 1 : 0);
