#!/usr/bin/env node
// lint-admin.mjs — the CMS-addon integrity gate. Runs in a dest that INSTALLED the
// addon (dormant/skip everywhere else). It re-asserts the invariants that, if they
// silently regressed, would each be a security, SEO, or honesty incident:
//
//   1. /admin is noindex             — else the client's content desk gets crawled.
//   2. middleware SKIPs /admin       — else a bilingual site geo-redirects /admin → /en/admin (404).
//   3. no raw motion in admin TSX    — the design system's tokens-only law covers the addon too.
//   4. safe-path.mjs keeps its boundary — the slug regex + writable-prefix allowlist are the
//      ONLY thing between a client-typed slug and an arbitrary repo write.
//   5. the email allowlist stays in env — never a repo file the CMS itself can rewrite.
//   6. the desk never claims "live" without the site saying so — a draft must not poll the
//      liveness endpoint, the endpoint must authenticate, and an unverifiable deployment
//      must resolve to "cannot verify" rather than to success.
//   7. unsaved work is mirrored to the browser (the "nothing is lost" promise is real).
//   8. brand polarity — the desk uses only tokens that flip with the site's light/dark
//      brand; a hard-coded light role (text-navy/bg-navy/bg-white/text-white) is invisible
//      on a dark-kinetic site, the colour analogue of a raw motion duration.
//   9. glyph-leak — on an LTR/non-he build, a raw Hebrew literal in the admin TS/TSX means
//      a Hebrew desk shipping on an English site. Every string must go through T()/t()
//      (strings.mjs), so on a non-he site NO Hebrew glyph may appear in a non-comment
//      admin source line. strings.mjs (the one Hebrew-allowed table) is exempt — but it
//      is template-owned and never in the admin scan set anyway.
//   10. strings parity — Object.keys(STRINGS.he) deep-equals every other locale's keys AND
//      every non-he VALUE is Hebrew-glyph-free. Keys-only parity is blind to a Hebrew
//      string mis-pasted into the en table (the cardinal lie: Hebrew on an English screen),
//      so the per-value check closes it. (ERRORS parity is the substrate lint-content's
//      job, because it ships on sites without the admin addon.)
//
// Zero deps. `node scripts/lint-admin.mjs [--selftest]`
import { existsSync, readFileSync, readdirSync, statSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { resolve, join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";

const has = (k) => process.argv.includes("--" + k);
const read = (p) => (existsSync(p) ? readFileSync(p, "utf8") : "");
const HEBREW = /[֐-׿]/;

// Strip /* block */ + // line comments (but NOT the // in a URL), so Hebrew inside a
// comment does not trip the glyph-leak scan and a commented locale line cannot shadow
// the real one. Same shape lint-i18n uses.
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");

// The build's desk locale, for #9's non-he gating: site.ts defaultLocale → brand lang → he.
// A minimal comment-stripped read (a dormancy decision only — the real desk-locale sniff,
// which reuses lint-i18n's readLocales, is separately pinned in the harness).
function siteDefaultLocale(root) {
  for (const rel of ["src/lib/site.ts", "lib/site.ts"]) {
    const p = join(root, rel);
    if (!existsSync(p)) continue;
    const m = stripComments(readFileSync(p, "utf8")).match(/defaultLocale\s*[:=]\s*["'`]([\w-]+)["'`]/);
    if (m) return m[1];
  }
  for (const rel of ["src/brand.config.ts", "brand.config.ts"]) {
    const p = join(root, rel);
    if (!existsSync(p)) continue;
    const m = stripComments(readFileSync(p, "utf8")).match(/\blang\s*:\s*["'`]([\w-]+)["'`]/);
    if (m) return m[1];
  }
  return "he";
}

// The addon-owned TS/TSX surface #9 scans (recursively for the route/component trees,
// plus the four lib/cms actions/transport files). strings.mjs is template-owned and not
// here, so it is exempt by construction.
function adminSourceFiles(root) {
  const out = [];
  const walk = (d) => {
    if (!existsSync(d)) return;
    for (const e of readdirSync(d)) {
      const p = join(d, e);
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.tsx?$/.test(e)) out.push(p);
    }
  };
  for (const r of ["src/components/admin", "src/app/admin", "src/app/api/cms"]) walk(join(root, r));
  for (const f of ["actions.ts", "read.ts", "github.ts", "session.ts"]) {
    const p = join(root, "src/lib/cms", f);
    if (existsSync(p)) out.push(p);
  }
  return out;
}

export function checkAdmin(root) {
  const adminDir = join(root, "src/app/admin");
  if (!existsSync(adminDir)) return { dormant: true, fails: [] };

  const fails = [];

  // 1. noindex on the admin page
  const pages = [];
  (function walk(d) {
    for (const e of readdirSync(d)) {
      const p = join(d, e);
      if (statSync(p).isDirectory()) walk(p);
      else if (e === "page.tsx") pages.push(p);
    }
  })(adminDir);
  if (!pages.length) fails.push("src/app/admin has no page.tsx");
  for (const p of pages) {
    if (!/robots\s*:\s*\{[^}]*index\s*:\s*false/s.test(read(p))) {
      fails.push(`${p.replace(root + "/", "")} — the admin page must declare robots: { index: false }`);
    }
  }

  // 2. the proxy must not locale-redirect /admin.
  // Next 16 renamed the `middleware` file convention to `proxy` — read whichever
  // this project ships so the gate survives the rename in either direction.
  const proxyPath = ["src/proxy.ts", "src/middleware.ts"]
    .map((p) => join(root, p))
    .find((p) => existsSync(p));
  const mw = proxyPath ? read(proxyPath) : "";
  if (mw && !/["']admin["']/.test(mw)) {
    fails.push(
      `${proxyPath.replace(root + "/", "")} — add "admin" to the SKIP token list, or a bilingual site redirects /admin to /<locale>/admin (404)`,
    );
  }

  // 3. tokens-only motion in the admin components (mirror of lint-motion's law)
  const compDir = join(root, "src/components/admin");
  if (existsSync(compDir)) {
    for (const f of readdirSync(compDir).filter((f) => f.endsWith(".tsx"))) {
      const txt = read(join(compDir, f));
      if (/cubic-bezier\(/.test(txt)) fails.push(`src/components/admin/${f} — raw cubic-bezier(); use cssEase(EASE.*)`);
      if (/(transitionDuration|animationDuration)\s*:\s*["'][\d.]+m?s["']/.test(txt)) {
        fails.push(`src/components/admin/${f} — hardcoded duration; use cssDur(DUR.*)`);
      }
    }
  }

  // 4. the publish boundary
  const paths = read(join(root, "src/lib/cms/safe-path.mjs"));
  if (!paths) fails.push("src/lib/cms/safe-path.mjs is missing — the publish path boundary");
  else {
    if (!/WRITABLE_PREFIXES/.test(paths)) fails.push("src/lib/cms/safe-path.mjs — the writable-prefix allowlist is gone");
    if (!/SLUG_RE/.test(paths)) fails.push("src/lib/cms/safe-path.mjs — slug validation is gone");
    if (!/unsupported image type/.test(paths)) {
      fails.push("src/lib/cms/safe-path.mjs — the image sniffer must reject anything it does not explicitly allow (SVG executes in-origin)");
    }
  }

  // 5. the allowlist must never live in the repo
  const session = read(join(root, "src/lib/cms/session-core.mjs"));
  if (session && !/CMS_ALLOWED_EMAILS/.test(session)) {
    fails.push("src/lib/cms/session-core.mjs — the email allowlist must come from env (CMS_ALLOWED_EMAILS), never a committed file");
  }

  // 6. the desk must never announce something is live unless the SITE says it is.
  // Three regressions this catches, two of which shipped once: a saved draft polling
  // the liveness endpoint and eventually rendering "פורסם ✓"; an unauthenticated
  // status endpoint (it spends the GitHub token and leaks the serving commit); and a
  // missing deployment sha being rounded up to "live" instead of "cannot verify".
  const bar = read(join(root, "src/components/admin/PublishBar.tsx"));
  if (bar && !/result\.kind === "publish"/.test(bar)) {
    fails.push('src/components/admin/PublishBar.tsx — the liveness poll must be gated on `result.kind === "publish"`; a draft has no live state to announce');
  }
  const status = read(join(root, "src/app/api/cms/status/route.ts"));
  if (status && !/verifySessionToken/.test(status)) {
    fails.push("src/app/api/cms/status/route.ts — the status endpoint must verify the session before spending the GitHub token");
  }
  const liveness = read(join(root, "src/lib/cms/liveness.mjs"));
  if (liveness && !/no-vercel-metadata/.test(liveness)) {
    fails.push("src/lib/cms/liveness.mjs — an unverifiable deployment must resolve to 'cannot verify', never to 'live'");
  }

  // 7. the desk promises "nothing you wrote is ever lost". Before a first save the
  // only store is the browser, so that promise is a lie unless the editor mirrors
  // the draft locally. A phone that evicts a backgrounded tab is the common case.
  const editor = read(join(root, "src/components/admin/DocEditor.tsx"));
  if (editor && !/localStorage\.setItem/.test(editor)) {
    fails.push("src/components/admin/DocEditor.tsx — unsaved work must be mirrored to localStorage, or the desk's 'nothing is lost' promise is false");
  }

  // 8. POLARITY — the desk must adapt to the site it is installed on, including a
  // dark-kinetic brand. The LIGHT-only palette roles are invisible when applyMode
  // flips the polarity (text-navy measured 1.03:1 on a dark card). Use the tokens
  // that flip with the brand: text-ink / bg-ink / bg-bg2 / text-bg. This is the
  // motion-gate discipline applied to colour: a hard-coded light role fails here.
  if (existsSync(compDir)) {
    const POLARITY = [
      [/\btext-navy(?:-\d{3})?\b/, "text-navy* dies on a dark brand — use text-ink (flips with the polarity)"],
      [/\bbg-navy(?:-\d{3})?\b/, "bg-navy* is a fixed dark — a primary surface must be bg-ink (flips)"],
      [/\bbg-white\b/, "bg-white stays white on a dark brand — use bg-card or bg-bg2 (flips)"],
      [/\btext-white\b/, "text-white is invisible on a light brand — use text-bg (the polarity inverse)"],
    ];
    for (const f of readdirSync(compDir).filter((f) => f.endsWith(".tsx"))) {
      const txt = read(join(compDir, f));
      for (const [re, hint] of POLARITY) {
        if (re.test(txt)) fails.push(`src/components/admin/${f} — ${hint}`);
      }
    }
  }

  // 9. GLYPH-LEAK — on an LTR/non-he build, no Hebrew glyph may appear in a non-comment
  // admin source line. Every string goes through T()/t() (strings.mjs). This forces every
  // new admin component to be i18n-correct instead of silently shipping a Hebrew desk on an
  // English site. Dormant on a he site (Hebrew is the right language there); the substrate
  // gate (lint-content) is what guards validator language regardless of locale.
  const locale = siteDefaultLocale(root);
  if (locale !== "he") {
    for (const p of adminSourceFiles(root)) {
      if (HEBREW.test(stripComments(read(p)))) {
        fails.push(`${p.replace(root + "/", "")} — raw Hebrew literal on a non-he (${locale}) build; move the copy to strings.mjs and render via T()/t() (glyph-leak)`);
      }
    }
  }

  // 11. SMOKE — the editor's permanent delete must be the ConfirmDelete modal, never a
  // bare window.confirm(): confirm() is unstyleable, English-only, and reads to a
  // non-technical client as a browser error. (The real concurrency guard is deleteDoc's
  // tsc-required sha, not this grep — this only keeps the destructive UI on-brand.)
  if (editor && /\bconfirm\s*\(/.test(stripComments(editor))) {
    fails.push("src/components/admin/DocEditor.tsx — bare confirm() for delete; use the ConfirmDelete modal (a styled two-tier remove/delete surface)");
  }

  return { dormant: false, pages: pages.length, locale, fails };
}

// 10. STRINGS PARITY — dynamic-imports the dest's strings.mjs (pure ESM, zero-dep) and
// asserts the UI table keys match across locales AND every non-he value is Hebrew-free.
// Separate from checkAdmin because the import is async; the addon's main()/selftest await it.
export async function checkStrings(root) {
  const p = join(root, "src/lib/cms/strings.mjs");
  if (!existsSync(p)) return { dormant: true, fails: [] };
  let mod;
  try {
    mod = await import(pathToFileURL(p).href);
  } catch (e) {
    return { dormant: false, fails: [`src/lib/cms/strings.mjs — could not be imported: ${e.message}`] };
  }
  const { STRINGS } = mod;
  const fails = [];
  if (!STRINGS || !STRINGS.he) return { dormant: false, fails: ["src/lib/cms/strings.mjs — STRINGS.he is missing"] };
  const heKeys = Object.keys(STRINGS.he).sort();
  const proxy = new Proxy({}, { get: () => "x" });
  for (const loc of Object.keys(STRINGS)) {
    if (loc === "he") continue;
    const locKeys = Object.keys(STRINGS[loc]).sort();
    if (heKeys.length !== locKeys.length || heKeys.some((k, i) => k !== locKeys[i])) {
      fails.push(`src/lib/cms/strings.mjs — STRINGS.${loc} keys differ from STRINGS.he (parity broken)`);
    }
    for (const k of locKeys) {
      const v = STRINGS[loc][k];
      const out = typeof v === "function" ? v(proxy) : String(v ?? "");
      if (HEBREW.test(out)) fails.push(`src/lib/cms/strings.mjs — STRINGS.${loc}["${k}"] contains a Hebrew glyph (non-he value must be Hebrew-free)`);
    }
  }
  return { dormant: false, fails };
}

async function selftest() {
  const base = mkdtempSync(join(tmpdir(), "lint-admin-"));
  const mk = (root, { noindex, mwSkip, motion, truthful }) => {
    mkdirSync(join(root, "src/app/admin"), { recursive: true });
    mkdirSync(join(root, "src/app/api/cms/status"), { recursive: true });
    mkdirSync(join(root, "src/components/admin"), { recursive: true });
    mkdirSync(join(root, "src/lib/cms"), { recursive: true });
    writeFileSync(
      join(root, "src/app/admin/page.tsx"),
      noindex ? "export const metadata = { robots: { index: false, follow: false } };" : "export const metadata = { title: 'x' };",
    );
    writeFileSync(join(root, "src/middleware.ts"), mwSkip ? 'const SKIP = ["admin","api"];' : 'const SKIP = ["api"];');
    writeFileSync(
      join(root, "src/components/admin/X.tsx"),
      // the BAD fixture carries a motion sin AND both polarity sins (a primary
      // button on the frozen-light palette + a -700 variant, which the \d{3}
      // branch must also catch); the GOOD one is tokens-only and polarity-safe.
      motion
        ? 'export const s = { transitionDuration: "0.3s" }; const c = "bg-navy text-white hover:bg-navy-700 text-navy-700 bg-white";'
        : 'export const s = { transitionDuration: cssDur(DUR.micro) }; const c = "bg-ink text-bg hover:opacity-90 text-ink bg-bg2";',
    );
    writeFileSync(join(root, "src/lib/cms/safe-path.mjs"), "export const WRITABLE_PREFIXES=[]; import { SLUG_RE } from './validate.mjs'; // unsupported image type");
    writeFileSync(join(root, "src/lib/cms/session-core.mjs"), "process.env.CMS_ALLOWED_EMAILS");
    // the truthfulness trio: a draft must not poll, the status route must authenticate,
    // and an unverifiable deployment must not be reported as live
    writeFileSync(
      join(root, "src/components/admin/PublishBar.tsx"),
      truthful ? 'const sha = result.kind === "publish" ? result.sha : undefined;' : "const sha = result.sha;",
    );
    writeFileSync(
      join(root, "src/app/api/cms/status/route.ts"),
      truthful ? "verifySessionToken(jar.get(SESSION_COOKIE)?.value)" : "export async function GET(){ return Response.json({}); }",
    );
    writeFileSync(
      join(root, "src/lib/cms/liveness.mjs"),
      truthful ? 'export const R = "no-vercel-metadata";' : "export const R = 1;",
    );
    writeFileSync(
      join(root, "src/components/admin/DocEditor.tsx"),
      // truthful: mirrors to localStorage AND uses the modal (no bare confirm). bad:
      // no mirror AND a bare confirm() for delete.
      truthful ? "localStorage.setItem(key, snap); setConfirmOpen(true);" : "const [body, setBody] = useState(''); if (!confirm('x')) return;",
    );
    return root;
  };
  const bad = checkAdmin(mk(join(base, "bad"), { noindex: false, mwSkip: false, motion: true, truthful: false }));
  const good = checkAdmin(mk(join(base, "good"), { noindex: true, mwSkip: true, motion: false, truthful: true }));
  const off = checkAdmin(join(base, "absent"));

  // #9 glyph-leak fixtures: on an en/ltr build a raw Hebrew admin literal fails; a T()-only
  // component passes; on a he build the SAME Hebrew literal is dormant (right language there).
  const mk9 = (root, hebrew, siteLocale) => {
    mkdirSync(join(root, "src/components/admin"), { recursive: true });
    mkdirSync(join(root, "src/app/admin"), { recursive: true });
    mkdirSync(join(root, "src/lib"), { recursive: true });
    writeFileSync(join(root, "src/app/admin/page.tsx"), "export const metadata = { robots: { index: false, follow: false } };");
    writeFileSync(join(root, "src/lib/site.ts"), `export const i18n = { locales: ["${siteLocale}"] as const, defaultLocale: "${siteLocale}" as const };`);
    writeFileSync(
      join(root, "src/components/admin/Y.tsx"),
      hebrew
        ? 'export const x = "כניסה"; // a raw Hebrew literal, not routed through T()'
        : 'import { T } from "@/lib/cms/desk-strings"; export const x = T("admin.deskTitle");',
    );
    return root;
  };
  const glyphBad = checkAdmin(mk9(join(base, "glyph-bad"), true, "en"));
  const glyphGood = checkAdmin(mk9(join(base, "glyph-good"), false, "en"));
  const glyphHe = checkAdmin(mk9(join(base, "glyph-he"), true, "he"));

  // #10 strings-parity fixtures (checkStrings is async — dynamic-imports strings.mjs).
  const mkStrings = (root, body) => {
    mkdirSync(join(root, "src/lib/cms"), { recursive: true });
    writeFileSync(join(root, "src/lib/cms/strings.mjs"), body);
    return root;
  };
  const sGood = await checkStrings(mkStrings(join(base, "s-good"), 'export const STRINGS = { he: { a: "x", b: "y" }, en: { a: "x", b: "y" } };'));
  const sMissing = await checkStrings(mkStrings(join(base, "s-missing"), 'export const STRINGS = { he: { a: "x", b: "y" }, en: { a: "x" } };'));
  const sHebrew = await checkStrings(mkStrings(join(base, "s-hebrew"), 'export const STRINGS = { he: { a: "x" }, en: { a: "שלום" } };'));

  rmSync(base, { recursive: true, force: true });

  const errs = [];
  if (!bad.fails.some((f) => /index: false/.test(f))) errs.push("an indexable admin page must fail");
  if (!bad.fails.some((f) => /SKIP/.test(f))) errs.push("a middleware without the admin skip must fail");
  if (!bad.fails.some((f) => /hardcoded duration/.test(f))) errs.push("raw motion in an admin component must fail");
  if (!bad.fails.some((f) => /kind === "publish"/.test(f))) errs.push("a PublishBar that polls a draft must fail");
  if (!bad.fails.some((f) => /verify the session/.test(f))) errs.push("an unauthenticated status endpoint must fail");
  if (!bad.fails.some((f) => /cannot verify/.test(f))) errs.push("a liveness rule without the unverifiable state must fail");
  if (!bad.fails.some((f) => /nothing is lost/.test(f))) errs.push("an editor without a local draft mirror must fail");
  if (!bad.fails.some((f) => /bare confirm/.test(f))) errs.push("an editor using bare confirm() for delete must fail");
  if (good.fails.some((f) => /bare confirm/.test(f))) errs.push("the modal-based delete must pass the confirm gate");
  if (!bad.fails.some((f) => /text-navy\* dies/.test(f))) errs.push("a light-only text role must fail the polarity check");
  if (!bad.fails.some((f) => /bg-navy\* is a fixed dark/.test(f))) errs.push("a fixed-dark bg (incl -700) must fail the polarity check");
  if (!bad.fails.some((f) => /bg-white stays white/.test(f))) errs.push("bg-white must fail the polarity check");
  if (!bad.fails.some((f) => /text-white is invisible/.test(f))) errs.push("text-white must fail the polarity check");
  if (good.fails.length) errs.push(`a wired dest must pass, got: ${good.fails.join("; ")}`);
  if (!off.dormant) errs.push("a dest without the addon must be dormant");

  // #9 glyph-leak
  if (!glyphBad.fails.some((f) => /glyph-leak/.test(f))) errs.push("a raw Hebrew admin literal on an en build must fail glyph-leak #9");
  if (glyphGood.fails.some((f) => /glyph-leak/.test(f))) errs.push("a T()-only admin component on an en build must pass glyph-leak #9");
  if (glyphHe.fails.some((f) => /glyph-leak/.test(f))) errs.push("glyph-leak #9 must be dormant on a he build (Hebrew is the right language there)");

  // #10 strings parity
  if (sGood.fails.length) errs.push(`a parity-clean strings.mjs must pass #10, got: ${sGood.fails.join("; ")}`);
  if (!sMissing.fails.some((f) => /parity broken/.test(f))) errs.push("a missing en key must fail strings-parity #10");
  if (!sHebrew.fails.some((f) => /Hebrew glyph/.test(f))) errs.push("a Hebrew value mis-pasted into en must fail strings-parity #10 (keys-only would miss it)");

  if (errs.length) {
    console.error("✗ lint-admin --selftest:", errs.join("; "));
    process.exit(1);
  }
  console.log("✓ lint-admin --selftest: noindex · middleware skip · motion tokens · path boundary · truthful publish-state · brand polarity · glyph-leak (non-he) · strings he/en parity all enforced; dormant without the addon");
  process.exit(0);
}

async function main() {
  if (has("selftest")) return selftest();
  const root = resolve(".");
  const r = checkAdmin(root);
  if (r.dormant) {
    console.log("• lint-admin: CMS addon not installed — gate dormant ✓");
    process.exit(0);
  }
  const s = await checkStrings(root);
  const fails = [...r.fails, ...s.fails];
  if (fails.length) {
    console.error(`✗ lint-admin — ${fails.length} issue(s):`);
    fails.forEach((f) => console.error("  • " + f));
    process.exit(1);
  }
  console.log(`• lint-admin: admin noindex · middleware skips /admin · motion tokens · publish boundary · glyph-leak · strings parity intact ✓`);
  process.exit(0);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) main();
