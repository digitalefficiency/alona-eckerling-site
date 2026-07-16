#!/usr/bin/env node
// launch-verify.mjs — the GO-LIVE gate (journey step 7b). Run IN the dest at the launch
// moment, the last thing before the client flips noindex off:
//   node scripts/launch-verify.mjs [--json] [--selftest]
//
// prove.mjs proves the build is EXCELLENT; this proves it is SAFE TO EXPOSE PUBLICLY —
// the go-live-specific checks NO other gate covers: unresolved YMYL markers, indexing
// intentionality, a real metadataBase, a lead pipe that isn't a void, legal pages, a
// private-string leak guard (not-yet-public NAP/ids), and documented env. Then it PRINTS
// the human-confirm checklist (domain, credentials, deploy env, GSC, live Lighthouse,
// canary) that no machine can verify — so a passing run is "READY pending N confirmations",
// never a false all-clear. Zero deps (node builtins). Exit 1 only on a hard NO-GO.
import { readFileSync, existsSync, readdirSync, statSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { resolve, join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const has = (k) => process.argv.includes("--" + k);

// High-precision content blockers — every one is a launch-stopper that must never face the public.
const BLOCKERS = [
  { re: /\[לאימות\]/, label: "[לאימות] — an unverified YMYL fact is still in shipped content" },
  { re: /\[חסר\]/, label: "[חסר] — a missing-copy marker is still in shipped content" },
  { re: /lorem ipsum/i, label: "lorem ipsum placeholder text" },
  // a LINK to example.* (scheme // or a path after it) is a fake domain in content; a bare
  // `name@example.com` email input placeholder is legitimate (IANA-reserved) and must NOT flag.
  { re: /(?:https?:)?\/\/(?:www\.)?example\.(?:com|org|net)\b|\bexample\.(?:com|org|net)\/\S/i, label: "a link to example.com — placeholder domain in shipped content" },
  { re: /\byour-?domain(\.com)?\b/i, label: "your-domain placeholder" },
  { re: /\bchange[_-]?me\b/i, label: "changeme — an unset placeholder value/secret" },
];

// The app dir (for the route-file lookups: robots/sitemap/api) — supports both the template
// (src/app) and a hand-rolled dest (app/).
const appBase = (root) => (existsSync(join(root, "src/app")) ? "src/app" : "app");

// The SHIPPED surface — everything that reaches the browser or the deployed bundle, NOT just src/:
// public/ is served at the site root, and lib/ (where the site config + the real domain live) can
// sit outside app/. Scanning only src/app was the hole that let a [לאימות] or a leaked NAP hiding in
// public/*.html / public/*.json / lib/site.ts pass the gate as clean.
const SHIP_DIRS = ["src", "app", "lib", "components", "content", "config", "public"];
// Source dirs: client-authored code + content. public/: STATIC content only — NOT .js/.css, because
// public/ routinely holds third-party/minified vendor bundles (a tracker.min.js with a demo
// "example.com" URL would false-block the whole launch). Client content in public/ is html/json/md/txt.
const CODE_EXT = /\.(tsx?|jsx?|mjs|cjs|mdx?|json|html?|txt)$/i;
const PUBLIC_EXT = /\.(html?|json|mdx?|txt|xml)$/i;
// Only dirs that can NEVER be a URL route segment — build/out/dist/coverage are VALID App Router
// segments (app/build/page.tsx = /build), so skipping them by basename would hide a launch-blocker.
const SKIP_DIR = /^(node_modules|\.next|\.git|\.turbo|\.vercel)$/;
// launch.deny.json HOLDS the private strings by definition; the gate script embeds every blocker
// pattern + the deny example; a *.min.* bundle is un-editable vendor code — none may be scanned.
const SKIP_FILE = /^(launch\.deny\.json|launch-verify\.mjs)$/;

function walkShipped(root) {
  const out = [];
  const w = (d, isPublic) => {
    let entries; try { entries = readdirSync(d); } catch { return; } // unreadable dir (EACCES/ELOOP) → skip, never crash
    for (const e of entries) {
      if (SKIP_DIR.test(e) || SKIP_FILE.test(e) || /\.min\.\w+$/i.test(e)) continue;
      const p = join(d, e);
      let st; try { st = statSync(p); } catch { continue; }
      if (st.isDirectory()) w(p, isPublic);
      else if ((isPublic ? PUBLIC_EXT : CODE_EXT).test(e)) out.push(p);
    }
  };
  for (const base of SHIP_DIRS) { const b = join(root, base); if (existsSync(b)) w(b, base === "public"); }
  return out;
}

function mechanicalChecks(root) {
  const checks = [];
  const push = (name, verdict, value) => checks.push({ name, verdict, value });
  const files = walkShipped(root);
  const read = (p) => { try { return readFileSync(p, "utf8"); } catch { return ""; } };
  const rel = (p) => p.replace(root + "/", "");
  const APP = appBase(root);

  // 1. ymyl-markers — the final net: no unverified/missing/placeholder content faces the public
  const hits = [];
  for (const f of files) { const txt = read(f); for (const b of BLOCKERS) if (b.re.test(txt)) hits.push(`${rel(f)} — ${b.label}`); }
  push("ymyl-markers", hits.length ? "fail" : "pass",
    hits.length ? `${hits.length} found · ${hits[0]}${hits.length > 1 ? ` (+${hits.length - 1} more)` : ""}` : "no [לאימות]/[חסר]/lorem/example.com/changeme");

  // 2. indexing — robots + sitemap exist AND indexing is env-gated (intentional, not hardcoded)
  const robots = join(root, APP, "robots.ts"), sitemap = join(root, APP, "sitemap.ts");
  if (!existsSync(robots) || !existsSync(sitemap))
    push("indexing", "fail", `${!existsSync(robots) ? "robots.ts " : ""}${!existsSync(sitemap) ? "sitemap.ts " : ""}missing`);
  else {
    const rb = read(robots);
    // gated = a launch/live flag is referenced AND indexing is blocked at the ROOT (disallow "/") — the
    // pre-launch pattern. A disallow of a specific PATH (/admin) is a permanent block, not a launch gate,
    // so it must not count; an always-allow robots isn't gated either.
    const flag = /SITE_LIVE|ALLOW_INDEXING|allowIndexing|process\.env|isLive|\.live\b|NEXT_PUBLIC|published|prelaunch|launch/i.test(rb);
    const blocksAllPrelaunch = /disallow\s*:\s*\[?\s*["'`]\/["'`]/.test(rb);
    const gated = flag && blocksAllPrelaunch;
    push("indexing", gated ? "pass" : "warn", gated ? "robots + sitemap · indexing is flag-gated" : 'robots + sitemap present, but indexing is NOT flag-gated (no launch-flag-driven disallow of "/") — confirm it\'s intentional');
  }

  // 3. metadata-base — a REAL https host. A string-literal host is validated directly; a computed
  // `new URL(<ident>)` (e.g. new URL(SITE.url)) is RESOLVED by finding that identifier's literal in the
  // shipped source, then validated — a placeholder host must never pass as "real" just for being computed.
  const PLACEHOLDER_LABELS = new Set(["example", "placeholder", "yourdomain", "your-domain", "changeme", "mydomain", "mysite", "lorem", "todo", "tbd", "tk", "tktk"]);
  const badHost = (raw) => {
    let host = raw;
    try { host = new URL(raw).hostname || raw; } catch { /* not a full URL — test the raw token */ }
    host = host.toLowerCase().replace(/^www\./, "");
    if (["localhost", "127.0.0.1", "0.0.0.0"].includes(host)) return true;
    if (/\.(test|local|example|invalid|localhost)$/.test(host)) return true; // reserved / dev-only TLDs
    // ANY dot-label being a placeholder word catches example.co.il, placeholder.com, todo.com,
    // your-domain.co.il — which an anchored exact-set check (localhostel.com must still PASS) would miss.
    if (host.split(".").some((l) => PLACEHOLDER_LABELS.has(l))) return true;
    return ["example.com", "example.org", "example.net", "your-domain.com", "yourdomain.com", "domain.com"].includes(host);
  };
  let mbLiteral = null, mbId = null;
  for (const f of files) {
    if (!/layout\.tsx$/.test(f)) continue;
    const txt = read(f);
    const lit = txt.match(/metadataBase\s*:\s*new URL\(\s*["'`]([^"'`]+)["'`]/);
    if (lit) { mbLiteral = lit[1]; break; }
    const comp = txt.match(/metadataBase\s*:\s*new URL\(\s*([A-Za-z_$][\w.$]*)/);
    if (comp && !mbId) mbId = comp[1];
  }
  if (!mbLiteral && mbId) {
    // Resolve the identifier to the literal in ITS OWN object declaration — NOT any stray `url:` in
    // another file (a CDN/social link would resolve wrong and greenlight a placeholder metadataBase).
    const idRoot = mbId.split(".")[0], prop = mbId.split(".").pop();
    const declRe = new RegExp("(?:const|let|var|export\\s+const|export\\s+default)\\s+" + idRoot + "\\b[^={]*=\\s*\\{");
    const propRe = new RegExp("\\b" + prop + "\\s*[:=]\\s*[\"'`](https?://[^\"'`]+)[\"'`]");
    outer: for (const f of files) {
      const txt = read(f);
      const dm = txt.match(declRe);
      if (!dm) continue;
      // brace-match the identifier's object body, then read `prop` only from WITHIN it
      const i = txt.indexOf("{", dm.index);
      let depth = 0;
      for (let k = i; k >= 0 && k < txt.length; k++) {
        if (txt[k] === "{") depth++;
        else if (txt[k] === "}" && --depth === 0) { const pm = txt.slice(i, k + 1).match(propRe); if (pm) { mbLiteral = pm[1]; break outer; } break; }
      }
    }
  }
  if (mbLiteral) {
    let host = mbLiteral; try { host = new URL(mbLiteral).hostname; } catch { /* keep raw */ }
    if (badHost(mbLiteral)) push("metadata-base", "fail", `${mbLiteral} — placeholder/localhost host`);
    else if (/\.vercel\.app$/i.test(host)) push("metadata-base", "warn", `${mbLiteral} — a preview host, not the real domain`);
    else if (/^(staging|preview|dev|test|stg|uat)\./i.test(host)) push("metadata-base", "warn", `${mbLiteral} — looks like a non-production subdomain`);
    else push("metadata-base", "pass", mbLiteral);
  } else if (mbId) push("metadata-base", "warn", `computed metadataBase (${mbId}) — could not resolve its host in shipped source; verify it's the real domain`);
  else push("metadata-base", "warn", "no metadataBase in any layout — OG image + canonical URLs may resolve relative");

  // 4. lead-pipe — a lead route exists AND forwards to a webhook env (not a logs-only void)
  const apiDir = join(root, APP, "api");
  let leadRoute = null;
  if (existsSync(apiDir)) (function w(d) { let es; try { es = readdirSync(d); } catch { return; } for (const e of es) { const p = join(d, e); let st; try { st = statSync(p); } catch { continue; } if (st.isDirectory()) w(p); else if (/route\.(ts|js)$/.test(e) && /lead/i.test(p)) leadRoute = p; } })(apiDir);
  if (!leadRoute) push("lead-pipe", "warn", "no api/**/lead route found — confirm leads are captured somewhere");
  else {
    const wired = /LEAD_WEBHOOK_URL|process\.env\.\w*(WEBHOOK|CRM|ZAPIER|LEAD|RESEND|SMTP|SENDGRID|MAILGUN|POSTMARK|HUBSPOT|SLACK|NOTION|EMAIL|MAIL|API_KEY|SUPABASE)/i.test(read(leadRoute));
    push("lead-pipe", wired ? "pass" : "warn", wired ? `${rel(leadRoute)} · forwards to a webhook/email env` : `${rel(leadRoute)} present but no delivery env ref — leads may only be logged`);
  }

  // 5. legal — privacy + accessibility pages present (premium-client expectation)
  const hasRoute = (n) => files.some((f) => new RegExp(`[/\\\\]${n}[/\\\\]page\\.tsx$`).test(f));
  const miss = ["privacy", "accessibility"].filter((n) => !hasRoute(n));
  push("legal", miss.length ? "warn" : "pass", miss.length ? `missing: ${miss.join(", ")}` : "privacy + accessibility present");

  // 6. deny-leak — the generalized NAP guard: strings you marked not-yet-public must not ship
  const denyPath = join(root, "launch.deny.json");
  if (!existsSync(denyPath)) push("deny-leak", "pass", "no launch.deny.json — private-string guard OFF (add one to protect not-yet-public NAP/ids)");
  else {
    let deny; try { deny = JSON.parse(read(denyPath)); } catch { deny = null; }
    const list = deny && Array.isArray(deny.private) ? deny.private.filter((s) => typeof s === "string" && s.trim()) : null;
    if (!list) push("deny-leak", "fail", 'launch.deny.json is malformed — expected { "private": ["Weisel 6", "318163235", …] }');
    else {
      const leaks = [];
      for (const f of files) { const txt = read(f); for (const s of list) if (txt.includes(s)) leaks.push(`${rel(f)} leaks "${s}"`); }
      push("deny-leak", leaks.length ? "fail" : "pass", leaks.length ? `${leaks.length} leak(s) · ${leaks[0]}` : `${list.length} private string(s) guarded — none appear in shipped code`);
    }
  }

  // 7. env-example — the deploy env is documented (else a silent missing var at go-live)
  push("env-example", existsSync(join(root, ".env.example")) ? "pass" : "warn",
    existsSync(join(root, ".env.example")) ? ".env.example present" : "no .env.example — undocumented deploy env is a launch risk");

  return checks;
}

// Human-confirm items no machine can verify — always printed, never silently "done".
const MANUAL = [
  "דומיין בתוקף (לא בהשעיה/גריעה) ומחובר · domain renewed & connected",
  "כל סוד שדלף במקורות הישנים — בוטל וסובב · rotated every credential that leaked in old sources",
  "אמת-התוכן (YMYL) אושרה מול הלקוח — סיפור-מקור, שנה, מספרים · client confirmed all YMYL copy",
  "בדיפלוי: SITE_LIVE/ALLOW_INDEXING=true + LEAD_WEBHOOK_URL מוגדר · deploy env set",
  "sitemap.xml + robots.txt חיים ומאשרים אינדוקס · live & allow indexing on the deployed URL",
  "הוגש ל-Google Search Console · sitemap submitted to GSC",
  "Lighthouse על ה-URL החי ≥90 (`prove.mjs`) · live-URL Lighthouse pass",
  "הליד נבדק מקצה-לקצה + canary חמוש (`canary.mjs --url …`) · real lead tested, canary armed",
];

const verdictOf = (checks) =>
  checks.some((c) => c.verdict === "fail") ? "no-go"
    : checks.some((c) => c.verdict === "warn") ? "caution" : "ready";

function report(checks, verdict) {
  if (has("json")) { console.log(JSON.stringify({ ts: new Date().toISOString(), checks, verdict, manual: MANUAL })); return; }
  const ic = { pass: "✅", warn: "⚠️", fail: "❌" };
  console.log("launch-verify · GO-LIVE gate (journey 7b)\n");
  for (const c of checks) console.log(`  ${ic[c.verdict]} ${c.name.padEnd(14)} ${c.value}`);
  const V = { "no-go": "❌ NO-GO — a blocker above must be fixed before go-live", caution: "⚠️  CAUTION — review each ⚠️ before flipping noindex", ready: "✅ mechanical checks READY" };
  console.log(`\n  → ${V[verdict]}`);
  console.log(`\n  Human confirmations (no machine can verify these — go-live only when ALL are true):`);
  MANUAL.forEach((m) => console.log(`   ☐ ${m}`));
  console.log(`\n  Even on READY: go-live is NOT automatic — noindex flips off only after every box above is checked, per client approval.`);
}

// --selftest: two ephemeral fixtures prove the blocker + leak are caught EVEN outside src/app (the
// critical shipped-surface fix) and a clean dest is READY. Zero network, self-cleaning.
function selftest() {
  const base = mkdtempSync(join(tmpdir(), "launch-verify-"));
  const mk = (root) => {
    mkdirSync(join(root, "src/app"), { recursive: true });
    writeFileSync(join(root, "src/app/page.tsx"), "export default function P(){ return <p>שירות מקצועי</p>; }");
    writeFileSync(join(root, "src/app/robots.ts"), "export default function robots(){ if(!process.env.SITE_LIVE) return {rules:[{userAgent:'*',disallow:'/'}]}; return {rules:[{allow:'/'}]}; }");
    writeFileSync(join(root, "src/app/sitemap.ts"), "export default function sitemap(){ return []; }");
    writeFileSync(join(root, "src/app/layout.tsx"), 'export const metadata = { metadataBase: new URL("https://real-client.co.il") };');
    writeFileSync(join(root, ".env.example"), "LEAD_WEBHOOK_URL=\nSITE_LIVE=");
    writeFileSync(join(root, "launch.deny.json"), JSON.stringify({ private: ["318163235"] }));
  };
  const dirty = join(base, "dirty"), clean = join(base, "clean");
  mk(dirty); mk(clean);
  // The blocker + the leak hide OUTSIDE src/app — a public/ JSON and a lib/ file — so a src/-only
  // scan (the bug) would BLESS this dest. The widened shipped-surface scan must catch both.
  mkdirSync(join(dirty, "public"), { recursive: true });
  mkdirSync(join(dirty, "lib"), { recursive: true });
  writeFileSync(join(dirty, "public/content.json"), '{ "note": "מחיר: [לאימות]" }');
  writeFileSync(join(dirty, "lib/site.ts"), "export const SITE = { dealer: '318163235' };");

  const d = Object.fromEntries(mechanicalChecks(dirty).map((c) => [c.name, c.verdict]));
  const c = Object.fromEntries(mechanicalChecks(clean).map((c) => [c.name, c.verdict]));
  rmSync(base, { recursive: true, force: true });

  const fails = [];
  if (d["ymyl-markers"] !== "fail") fails.push(`dirty ymyl-markers (public/*.json) want fail got ${d["ymyl-markers"]}`);
  if (d["deny-leak"] !== "fail") fails.push(`dirty deny-leak (lib/*.ts) want fail got ${d["deny-leak"]}`);
  if (c["ymyl-markers"] !== "pass") fails.push(`clean ymyl-markers want pass got ${c["ymyl-markers"]}`);
  if (c["deny-leak"] !== "pass") fails.push(`clean deny-leak want pass got ${c["deny-leak"]}`);
  if (c["metadata-base"] !== "pass") fails.push(`clean metadata-base want pass got ${c["metadata-base"]}`);
  if (c["indexing"] !== "pass") fails.push(`clean indexing want pass got ${c["indexing"]}`);
  if (fails.length) { console.error("✗ launch-verify --selftest:", fails.join("; ")); process.exit(1); }
  console.log("✓ launch-verify --selftest: catches a [לאימות] in public/ + a leaked private string in lib/ (full shipped-surface scan); a clean dest is READY");
  process.exit(0);
}

function main() {
  if (has("selftest")) return selftest();
  const checks = mechanicalChecks(resolve("."));
  const verdict = verdictOf(checks);
  report(checks, verdict);
  process.exit(verdict === "no-go" ? 1 : 0);
}

// Run only when executed directly (`node launch-verify.mjs`) — NOT when imported by the harness,
// which pulls in mechanicalChecks/verdictOf/BLOCKERS to test the check logic against tmp fixtures.
export { mechanicalChecks, verdictOf, BLOCKERS };
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) main();
