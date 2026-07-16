#!/usr/bin/env node
// lint-content.mjs — the CLIENT-CONTENT gate of the CMS substrate. DORMANT while
// content/cms/collections.json declares no collections (and no settings schema ships),
// so it costs nothing until a site opts into the CMS. When active it walks content/
// and validates every collection entry + settings JSON with the SAME module the admin
// publish action runs (src/lib/cms/validate.mjs) — the rail and the publish button can
// never disagree. Client-actionable rules only: frontmatter schema per collection,
// banned/filler phrases (scripts/copy-banlist.mjs), long-dash ban, alt-text required,
// no raw HTML in bodies, slug/filename legality, settings-JSON schema.
//
// i18n (Phase 2): validator messages render in the site's DESK LOCALE, resolved from
// site.ts defaultLocale → brand.config lang → he (desk-locale.mjs, reusing lint-i18n's
// comment-stripped readLocales). This is the SUBSTRATE-level home of the ERRORS he/en
// parity + Hebrew-free-value guarantee: validate.mjs's messages are client-facing on
// substrate-only sites (no admin addon) via this gate + content.yml, so the language
// guard must live here, not only in the dormant-without-/admin lint-admin. An UNSUPPORTED
// site language (neither he nor en) FAILS LOUD rather than silently rendering Hebrew.
//
// Self-contained, runs IN the dest. Zero deps.  node scripts/lint-content.mjs  [--selftest]
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { resolve, join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { validateTree } from "../src/lib/cms/validate.mjs";
import { deskLocaleFromSite } from "../src/lib/cms/desk-locale.mjs";
import { STRINGS, ERRORS, SUPPORTED_LOCALES } from "../src/lib/cms/strings.mjs";

const has = (k) => process.argv.includes("--" + k);
const HEBREW = /[֐-׿]/;

export function checkContent(root) {
  const locale = deskLocaleFromSite(root);
  const supported = SUPPORTED_LOCALES.includes(locale);
  // Dormancy FIRST: a site that never opted into the CMS (collections=[] / absent, no
  // settings schema) is substrate-invisible and "behaves exactly as if this substrate
  // did not exist" — in ANY market language. The locale gate is a property of an ACTIVE
  // desk, so it must not fire on a dormant non-he/non-en site (a legitimate ru/ar/fr
  // routing-substrate site that never bought the CMS). Validate with he as a rendering
  // stand-in only to reach the dormant flag; a dormant tree carries no errors to render.
  const res = validateTree(root, { locale: supported ? locale : "he" });
  if (res.dormant) return res;
  if (!supported) {
    // Active desk in an unsupported language: never Hebrew-fallback — an unsupported
    // language is red CI, not a broken screen.
    return {
      dormant: false,
      files: 0,
      unsupportedLocale: locale,
      errors: [
        {
          file: "src/lib/site.ts",
          field: "i18n",
          msg: `desk has no "${locale}" string table (supported: ${SUPPORTED_LOCALES.join(", ")}). Add a translation or set defaultLocale to a supported locale.`,
        },
      ],
    };
  }
  return res;
}

// ── ERRORS he/en parity (substrate level) — the same guard lint-admin #10 keeps for
// UI strings, kept HERE for validator messages because they ship on sites without the
// admin addon. Keys must match; every non-he VALUE must be Hebrew-glyph-free (a Hebrew
// string mis-pasted into ERRORS.en would render Hebrew on an English screen). ────────
function checkErrorsParity() {
  const errs = [];
  const heKeys = Object.keys(ERRORS.he).sort();
  const proxy = new Proxy({}, { get: () => "x" });
  for (const loc of SUPPORTED_LOCALES) {
    if (loc === "he") continue;
    const locKeys = Object.keys(ERRORS[loc]).sort();
    if (heKeys.length !== locKeys.length || heKeys.some((k, i) => k !== locKeys[i])) {
      errs.push(`ERRORS.${loc} keys differ from ERRORS.he (parity broken)`);
    }
    // call every builder with a params proxy so a Hebrew literal accidentally left in a
    // non-he value is caught even though the keys line up (keys-only parity is blind to it).
    for (const k of locKeys) {
      const fn = ERRORS[loc][k];
      const out = typeof fn === "function" ? fn(proxy) : String(fn ?? "");
      if (HEBREW.test(out)) errs.push(`ERRORS.${loc}["${k}"] contains a Hebrew glyph (non-he value must be Hebrew-free)`);
    }
  }
  // STRINGS parity is lint-admin #10's job, but a substrate site never installs the addon,
  // so mirror the value-level Hebrew-free check for the non-he UI table here too.
  const heS = Object.keys(STRINGS.he).sort();
  for (const loc of SUPPORTED_LOCALES) {
    if (loc === "he") continue;
    for (const k of heS) {
      const v = STRINGS[loc]?.[k];
      const out = typeof v === "function" ? v(proxy) : String(v ?? "");
      if (HEBREW.test(out)) errs.push(`STRINGS.${loc}["${k}"] contains a Hebrew glyph (non-he value must be Hebrew-free)`);
    }
  }
  return errs;
}

// ── selftest: a dirty fixture must fail with a witness per rule class; a clean one
// passes; an empty config is dormant. Plus the i18n substrate guards: a he fixture
// prints Hebrew, an en fixture (site.ts defaultLocale:'en') prints Hebrew-free, an
// unsupported locale fails loud, and the ERRORS/STRINGS he/en tables stay in parity. ─
function selftest() {
  const base = mkdtempSync(join(tmpdir(), "lint-content-"));
  const cfg = JSON.stringify({
    mode: "direct",
    collections: [
      {
        id: "blog",
        label: "בלוג",
        fields: [
          { key: "title", type: "text", label: "כותרת", required: true, max: 70 },
          { key: "description", type: "text", label: "תיאור", required: true, min: 40, max: 160 },
          { key: "date", type: "date", label: "תאריך", required: true },
          { key: "image", type: "image", label: "תמונת שער", requiredAlt: true },
        ],
        body: { minWords: 10 },
      },
    ],
  });
  // an English-labelled collection for the en fixture — an en site configures en labels,
  // so a rendered en error interpolates English, not a Hebrew field label.
  const cfgEn = JSON.stringify({
    mode: "direct",
    collections: [
      {
        id: "blog",
        label: "Blog",
        fields: [
          { key: "title", type: "text", label: "Title", required: true, max: 70 },
          { key: "description", type: "text", label: "Description", required: true, min: 40, max: 160 },
          { key: "date", type: "date", label: "Date", required: true },
          { key: "image", type: "image", label: "Cover", requiredAlt: true },
        ],
        body: { minWords: 10 },
      },
    ],
  });
  const mk = (root, files, { config = cfg, siteLocale } = {}) => {
    mkdirSync(join(root, "content/cms"), { recursive: true });
    mkdirSync(join(root, "content/blog"), { recursive: true });
    writeFileSync(join(root, "content/cms/collections.json"), config);
    if (siteLocale) {
      mkdirSync(join(root, "src/lib"), { recursive: true });
      writeFileSync(
        join(root, "src/lib/site.ts"),
        `export const i18n = { locales: ["${siteLocale}"] as const, defaultLocale: "${siteLocale}" as const };`,
      );
    }
    for (const [name, body] of Object.entries(files)) writeFileSync(join(root, "content/blog", name), body);
  };

  const dirty = join(base, "dirty");
  mk(dirty, {
    // missing description + bad date + image without alt + raw HTML + long dash + short body + bad filename
    "Bad Name.md": '---\ntitle: "פוסט"\ndate: "לא-תאריך"\nimage: "/media/uploads/a.webp"\n---\nקצר <b>מודגש</b> — סוף\n',
  });
  const clean = join(base, "clean");
  mk(clean, {
    "first-post.md": [
      "---",
      'title: "איך בוחרים שירות נכון"',
      'description: "מדריך קצר ופרקטי שעוזר להבין מה חשוב לבדוק לפני שסוגרים, בלי מלכודות."',
      'date: "2026-07-10"',
      'image: "/media/uploads/a.webp"',
      'imageAlt: "שולחן עבודה עם מחשב פתוח"',
      "---",
      "פסקה ראשונה עם מספיק מילים כדי לעבור את סף המינימום של הגוף, כתובה בעברית פשוטה וברורה לגמרי.",
      "",
    ].join("\n"),
  });
  // the SAME command content.yml runs, but on an en/ltr site: printed errors must be Hebrew-free.
  const en = join(base, "en");
  mk(
    en,
    { "Bad Name.md": '---\ntitle: "A post"\ndate: "not-a-date"\nimage: "/media/uploads/a.webp"\n---\nshort <b>bold</b> — end\n' },
    { config: cfgEn, siteLocale: "en" },
  );
  // an unsupported site language must fail loud, never degrade to a Hebrew screen.
  const unsup = join(base, "unsup");
  mk(unsup, { "first-post.md": '---\ntitle: "x"\n---\nbody\n' }, { config: cfgEn, siteLocale: "ar" });

  const dormant = join(base, "dormant");
  mkdirSync(join(dormant, "content/cms"), { recursive: true });
  writeFileSync(join(dormant, "content/cms/collections.json"), '{ "mode": "direct", "collections": [] }');

  // WITNESS (substrate-invisibility): a site that NEVER opted into the CMS (empty
  // collections) but declares an UNSUPPORTED market language (a legitimate ru/ar/fr
  // i18n-routing site) must stay dormant — the locale gate belongs to an ACTIVE desk,
  // not to a dormant substrate. Pre-fix, checkContent resolved the locale and failed
  // loud BEFORE consulting dormancy, hard-breaking a non-CMS Russian site's build.
  const dormantUnsup = join(base, "dormant-unsup");
  mkdirSync(join(dormantUnsup, "content/cms"), { recursive: true });
  mkdirSync(join(dormantUnsup, "src/lib"), { recursive: true });
  writeFileSync(join(dormantUnsup, "content/cms/collections.json"), '{ "mode": "direct", "collections": [] }');
  writeFileSync(
    join(dormantUnsup, "src/lib/site.ts"),
    `export const i18n = { locales: ["ru"] as const, defaultLocale: "ru" as const };`,
  );

  const rd = checkContent(dirty);
  const rc = checkContent(clean);
  const re = checkContent(en);
  const ru = checkContent(unsup);
  const rz = checkContent(dormant);
  const rdu = checkContent(dormantUnsup);
  rmSync(base, { recursive: true, force: true });

  const errs = [];
  const hit = (re2) => rd.errors.some((e) => re2.test(e.msg) || re2.test(e.field));
  if (!hit(/חובה/)) errs.push("dirty: a missing required field must fail");
  if (!hit(/תאריך לא תקין/)) errs.push("dirty: a malformed date must fail");
  if (!hit(/alt/i)) errs.push("dirty: an image without alt must fail");
  if (!hit(/HTML/)) errs.push("dirty: raw HTML in the body must fail");
  if (!hit(/קו מפריד ארוך/)) errs.push("dirty: a long dash in the body must fail");
  if (!hit(/קצר מדי/)) errs.push("dirty: a too-short body must fail");
  if (!rd.errors.some((e) => e.field === "filename")) errs.push("dirty: an illegal filename must fail");
  if (!rd.errors.some((e) => HEBREW.test(e.msg))) errs.push("dirty (he site): errors must render in Hebrew");
  if (rc.errors.length) errs.push(`clean fixture must pass, got: ${rc.errors.map((e) => e.msg).join(" · ")}`);
  if (!rz.dormant) errs.push("an empty collections config must be dormant");
  if (!rdu.dormant || rdu.unsupportedLocale)
    errs.push("a non-CMS site in an unsupported language must stay dormant (substrate invisible), not fail the locale gate");

  // en fixture: the SAME rule classes fire, but every printed message is Hebrew-free.
  if (!re.errors.length) errs.push("en fixture: the dirty en content must still produce errors");
  const heLeak = re.errors.filter((e) => HEBREW.test(e.msg));
  if (heLeak.length) errs.push(`en fixture: printed errors must be Hebrew-free, leaked: ${heLeak.map((e) => e.msg).join(" · ")}`);

  // unsupported locale: loud failure, no Hebrew-fallback render.
  if (ru.unsupportedLocale !== "ar" || !ru.errors.length) errs.push("an unsupported site locale must fail loud, not render Hebrew");

  // ERRORS/STRINGS he/en parity + Hebrew-free non-he values (substrate-level guard).
  errs.push(...checkErrorsParity());

  if (errs.length) {
    console.error("✗ lint-content --selftest:", errs.join("; "));
    process.exit(1);
  }
  console.log(
    "✓ lint-content --selftest: every rule class caught on the dirty fixture · clean passes · empty config dormant · he prints Hebrew, en Hebrew-free, unsupported locale fails loud · ERRORS/STRINGS he↔en parity",
  );
  process.exit(0);
}

function main() {
  if (has("selftest")) return selftest();
  const r = checkContent(resolve("."));
  if (r.unsupportedLocale) {
    console.error(`✗ lint-content — ${r.errors[0].msg}`);
    process.exit(1);
  }
  if (r.dormant) {
    console.log("• lint-content: no collections configured — client-content gate dormant ✓");
    process.exit(0);
  }
  if (r.errors.length) {
    console.error(`✗ lint-content — ${r.errors.length} issue(s) in client content:`);
    for (const e of r.errors) console.error(`  • ${e.file} [${e.field}] ${e.msg}`);
    console.error("  fix: every message above is client-actionable — the admin shows the same errors before publish.");
    process.exit(1);
  }
  console.log(`• lint-content: ${r.files} content file(s) validate against the collections schema ✓`);
  process.exit(0);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) main();
