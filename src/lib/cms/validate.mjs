// ============================================================================
// validate.mjs — the CLIENT-CONTENT validator of the CMS substrate (zero-dep ESM).
// One module, three consumers, zero drift:
//   • the admin publish action (addons/cms) — BLOCKS a bad publish, shows the errors
//   • scripts/lint-content.mjs — the rail/CI gate over content/
//   • scripts/test/run-tests.mjs — regression pins
//
// IRON RULE (ops-leak): every rule here must be one the CLIENT can fix alone —
// field-anchored messages with a fix hint. Structural/owner rails (media manifest
// chains, route existence, i18n coverage) DO NOT belong here.
//
// i18n (Phase 2): messages are keyed by a stable CODE and rendered through the
// strings table (formatError). The error shape is ADDITIVE — { file, field, msg }
// is preserved (every .msg reader keeps working) and GAINS optional { code, params }.
// msg is rendered in the resolved locale (default he), so the he render is byte-for-
// byte today's copy and the en render is Hebrew-free. Codes are metadata; msg is the
// contract.
//
// Error shape: { file, field, msg, code?, params? } — field is the frontmatter key
// or "body"/"frontmatter".
// ============================================================================
import fs from "node:fs";
import path from "node:path";
import { PLACEHOLDER_MARKERS, BANNED_PHRASES, YMYL_MARKERS } from "../../../scripts/copy-banlist.mjs";
import { formatError } from "./strings.mjs";

// Push a CODED error, rendered into `locale` right now so .msg is always populated.
// This is the single choke point that keeps the additive contract: code+params are
// metadata; msg is the rendered contract string.
function push(errors, locale, file, field, code, params) {
  errors.push({ file, field, code, params, msg: formatError({ code, params }, locale) });
}

// URL-legal slug — ALSO the sole boundary between a client-typed name and a repo
// path (the publish action joins it under content/<collection>/), so it is
// deliberately strict: lowercase ascii + digits + inner hyphens, 1–80 chars.
export const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])?$/;
export const COLLECTION_ID_RE = SLUG_RE;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
// A real HTML tag: `<b>`, `</p>`, `<img src=…>` — but NOT a markdown autolink
// (`<https://…>` fails the attr/close shape) and NOT a bare `3 < 5` comparison.
const RAW_HTML_RE = /<\/?[a-zA-Z][a-zA-Z0-9-]*(?:\s[^>]*)?>/;
const EM_DASH_RE = /—/;

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// Same matching semantics as lint-copy: single ascii words get word boundaries,
// Hebrew/multi-word phrases match as substrings; case-insensitive.
const phraseRe = (p) => (/^[a-z]+$/i.test(p) ? new RegExp(`\\b${p}\\b`, "i") : new RegExp(escapeRe(p), "i"));
// Each phrase check now carries a stable CODE (phrase.placeholder/banned/ymyl) so
// the Hebrew label lives in the strings table, not embedded here.
const PHRASE_CHECKS = [
  ...PLACEHOLDER_MARKERS.map((p) => ({ code: "phrase.placeholder", p, re: phraseRe(p) })),
  ...BANNED_PHRASES.map((p) => ({ code: "phrase.banned", p, re: phraseRe(p) })),
  ...YMYL_MARKERS.map((p) => ({ code: "phrase.ymyl", p, re: new RegExp(escapeRe(p)) })),
];

export const wordCount = (s) =>
  s.replace(/[#>*_`[\]()|-]/g, " ").split(/\s+/).filter(Boolean).length;

// ── canonical frontmatter (the ONLY dialect the CMS reads/writes) ────────────
// A deliberate, tiny YAML subset: `key: value` scalars (always-quoted on write),
// inline ["a","b"] or indented `- item` lists, booleans. No nesting. The admin
// serializes THROUGH serializeFrontmatter, so round-trip is exact by construction.
//
// PROBLEMS are CODED ({ code, params }) — never raw strings — so no un-coded Hebrew
// leaks below the admin surface; validateDoc renders them in the resolved locale.

export function parseSimpleFrontmatter(raw) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw);
  if (!m) return { data: {}, body: raw, problems: [] };
  const problems = [];
  const data = {};
  let pendingKey = null;
  const parseScalar = (v) => {
    const s = v.trim();
    if (s === "true") return true;
    if (s === "false") return false;
    if (/^"(?:[^"\\]|\\.)*"$/.test(s)) return s.slice(1, -1).replace(/\\(.)/g, "$1");
    if (/^'[^']*'$/.test(s)) return s.slice(1, -1);
    return s;
  };
  for (const line of m[1].split("\n")) {
    if (!line.trim()) continue;
    const li = /^\s+-\s+(.*)$/.exec(line);
    if (li) {
      if (!pendingKey) {
        problems.push({ code: "frontmatter.orphanListItem" });
        continue;
      }
      data[pendingKey].push(parseScalar(li[1]));
      continue;
    }
    const kv = /^([A-Za-z_][\w-]*):\s*(.*)$/.exec(line);
    if (!kv) {
      problems.push({ code: "frontmatter.unrecognizedLine", params: { line: line.trim().slice(0, 40) } });
      continue;
    }
    const [, key, rest] = kv;
    if (rest === "") {
      pendingKey = key;
      data[key] = [];
      continue;
    }
    pendingKey = null;
    if (rest.startsWith("[")) {
      const inner = rest.replace(/^\[/, "").replace(/\]\s*$/, "");
      data[key] = inner.trim() === "" ? [] : inner.split(",").map(parseScalar);
    } else if (rest.startsWith("{")) {
      problems.push({ code: "frontmatter.nestedStructure", params: { key } });
    } else {
      data[key] = parseScalar(rest);
    }
  }
  return { data, body: m[2] ?? "", problems };
}

export function serializeFrontmatter(data) {
  const q = (v) => `"${String(v).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  const lines = [];
  for (const [k, v] of Object.entries(data)) {
    if (v === undefined || v === null || v === "") continue;
    if (Array.isArray(v)) {
      if (!v.length) continue;
      lines.push(`${k}:`);
      for (const item of v) lines.push(`  - ${q(item)}`);
    } else if (typeof v === "boolean") {
      lines.push(`${k}: ${v}`);
    } else {
      lines.push(`${k}: ${q(v)}`);
    }
  }
  return `---\n${lines.join("\n")}\n---\n`;
}

// ── shared string rules ──────────────────────────────────────────────────────
const stripFences = (s) => s.replace(/```[\s\S]*?```/g, "");

function checkText(text, file, field, errors, locale) {
  if (EM_DASH_RE.test(text)) push(errors, locale, file, field, "text.emDash", {});
  for (const { code, p, re } of PHRASE_CHECKS) {
    if (re.test(text)) push(errors, locale, file, field, code, { p });
  }
}

function checkScalarSafety(value, file, field, errors, locale) {
  if (/[<>]/.test(value)) push(errors, locale, file, field, "scalar.angleBrackets", {});
}

// ── field validation (frontmatter AND settings-JSON share this core) ─────────
export function validateFields(fields, data, file, errors, locale = "he") {
  for (const f of fields) {
    const v = data[f.key];
    const empty = v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0);
    if (empty) {
      if (f.required) push(errors, locale, file, f.key, "field.required", { label: f.label });
      continue;
    }
    switch (f.type) {
      case "date": {
        const s = String(v);
        if (!DATE_RE.test(s) || Number.isNaN(new Date(s).getTime())) {
          push(errors, locale, file, f.key, "field.badDate", { label: f.label });
        }
        break;
      }
      case "boolean": {
        if (typeof v !== "boolean") push(errors, locale, file, f.key, "field.notBoolean", { label: f.label });
        break;
      }
      case "list": {
        if (!Array.isArray(v)) {
          push(errors, locale, file, f.key, "field.notList", { label: f.label });
          break;
        }
        if (f.min && v.length < f.min) push(errors, locale, file, f.key, "field.listTooFew", { label: f.label, min: f.min });
        if (f.max && v.length > f.max) push(errors, locale, file, f.key, "field.listTooMany", { label: f.label, max: f.max });
        for (const item of v.map(String)) {
          checkScalarSafety(item, file, f.key, errors, locale);
          checkText(item, file, f.key, errors, locale);
        }
        break;
      }
      case "image": {
        const s = String(v);
        if (!s.startsWith("/media/")) push(errors, locale, file, f.key, "field.imageNotMedia", { label: f.label });
        if (f.requiredAlt) {
          const alt = data[`${f.key}Alt`] ?? data[`${f.key}_alt`];
          if (!alt || !String(alt).trim()) {
            push(errors, locale, file, `${f.key}Alt`, "field.imageAltMissing", { label: f.label });
          }
        }
        break;
      }
      case "gallery": {
        // TWO parallel string lists paired by index (the tags shape — round-trips
        // through gray-matter cleanly; see frontmatter-normalize.mjs). `<key>` holds
        // the /media/ urls, `<key>Alt` the descriptions. Every image needs its alt,
        // so the count of alts must MATCH the count of urls — a gallery image with no
        // description is exactly the inaccessible-image the whole system forbids.
        const urls = Array.isArray(v) ? v.map(String) : [];
        const alts = Array.isArray(data[`${f.key}Alt`]) ? data[`${f.key}Alt`].map(String) : [];
        if (f.min && urls.length < f.min) push(errors, locale, file, f.key, "field.galleryTooFew", { label: f.label, min: f.min });
        if (f.max && urls.length > f.max) push(errors, locale, file, f.key, "field.galleryTooMany", { label: f.label, max: f.max });
        for (const u of urls) {
          if (!u.startsWith("/media/")) push(errors, locale, file, f.key, "field.imageNotMedia", { label: f.label });
          checkScalarSafety(u, file, f.key, errors, locale);
        }
        if (alts.length !== urls.length) {
          push(errors, locale, file, `${f.key}Alt`, "field.galleryAltCount", { label: f.label });
        }
        for (const a of alts) {
          if (!a.trim()) push(errors, locale, file, `${f.key}Alt`, "field.galleryAltEmpty", { label: f.label });
          checkScalarSafety(a, file, `${f.key}Alt`, errors, locale);
          checkText(a, file, `${f.key}Alt`, errors, locale);
        }
        break;
      }
      default: {
        // text / textarea
        const s = String(v);
        if (f.min && s.length < f.min) push(errors, locale, file, f.key, "field.textTooShort", { label: f.label, min: f.min, len: s.length });
        if (f.max && s.length > f.max) push(errors, locale, file, f.key, "field.textTooLong", { label: f.label, max: f.max, len: s.length });
        checkScalarSafety(s, file, f.key, errors, locale);
        checkText(s, file, f.key, errors, locale);
      }
    }
  }
}

// ── the per-document rule set ────────────────────────────────────────────────
// opts.locale (default "he") resolves which language the .msg strings render in;
// the admin passes brand.lang, lint-content passes the site's resolved desk locale.
export function validateDoc(collection, data, body, file = "", opts = {}) {
  const locale = opts.locale ?? "he";
  const errors = [];
  const problems = Array.isArray(data.__problems) ? data.__problems : [];
  for (const p of problems) {
    if (p && typeof p === "object" && p.code) push(errors, locale, file, "frontmatter", p.code, p.params);
    else errors.push({ file, field: "frontmatter", msg: String(p) }); // legacy string problem, backward-compatible
  }

  validateFields(collection.fields ?? [], data, file, errors, locale);

  if (data.slug !== undefined && !SLUG_RE.test(String(data.slug))) {
    push(errors, locale, file, "slug", "doc.badSlug", {});
  }
  if (data.draft !== undefined && typeof data.draft !== "boolean") {
    push(errors, locale, file, "draft", "doc.draftNotBoolean", {});
  }

  const clean = stripFences(body);
  const htmlHit = RAW_HTML_RE.exec(clean);
  if (htmlHit) push(errors, locale, file, "body", "body.rawHtml", { found: htmlHit[0].slice(0, 30) });
  checkText(clean, file, "body", errors, locale);

  // Inline body images `![alt](/media/…)` must carry alt text — the "fresh alt on
  // reuse" the picker offers is a UI courtesy; this is the gate. An empty-alt inline
  // image would publish an inaccessible picture while every other image is required
  // to describe itself. (marked already gates the URL to /media,http(s),mailto,tel.)
  for (const m of clean.matchAll(/!\[([^\]]*)\]\(([^)\s]+)/g)) {
    if (!m[1].trim()) push(errors, locale, file, "body", "body.inlineImageNoAlt", { url: m[2].slice(0, 40) });
  }

  const words = wordCount(clean);
  const minW = collection.body?.minWords;
  const maxW = collection.body?.maxWords;
  if (minW && words < minW) push(errors, locale, file, "body", "body.tooFewWords", { min: minW, words });
  if (maxW && words > maxW) push(errors, locale, file, "body", "body.tooManyWords", { max: maxW, words });

  return errors;
}

// ── settings JSON (business info / testimonials — Phase-3 surface) ───────────
// schema shape: { "<name>": { "label": "…", "fields": [FieldSpec…], "array": bool } }
export function validateSettings(schema, name, json, file = "", locale = "he") {
  const errors = [];
  const spec = schema?.[name];
  if (!spec) return errors;
  const items = spec.array ? (Array.isArray(json) ? json : []) : [json];
  if (spec.array && !Array.isArray(json)) {
    push(errors, locale, file, name, "settings.mustBeList", { name });
    return errors;
  }
  items.forEach((item, i) => {
    const at = spec.array ? `${file}#${i + 1}` : file;
    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      push(errors, locale, at, name, "settings.itemNotObject", {});
      return;
    }
    validateFields(spec.fields ?? [], item, at, errors, locale);
  });
  return errors;
}

// ── the whole content/ tree (what lint-content runs) ─────────────────────────
// opts.locale threads the resolved desk locale through every error this produces,
// so lint-content prints Hebrew on a he site and Hebrew-free copy on an en site.
export function validateTree(root, opts = {}) {
  const locale = opts.locale ?? "he";
  const errors = [];
  const cfgPath = path.join(root, "content", "cms", "collections.json");
  let cfg = null;
  if (fs.existsSync(cfgPath)) {
    try {
      cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
    } catch (e) {
      push(errors, locale, "content/cms/collections.json", "config", "tree.collectionsNotJson", { message: e.message });
      return { dormant: false, files: 0, errors };
    }
  }
  const cols = cfg?.collections ?? [];
  let files = 0;

  const seen = new Set();
  for (const c of cols) {
    if (!COLLECTION_ID_RE.test(String(c.id ?? ""))) {
      push(errors, locale, "content/cms/collections.json", "id", "tree.badCollectionId", { id: c.id });
      continue;
    }
    if (seen.has(c.id)) push(errors, locale, "content/cms/collections.json", "id", "tree.dupCollectionId", { id: c.id });
    seen.add(c.id);

    const dir = path.join(root, "content", c.id);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) {
      if (!f.endsWith(".md")) continue;
      files++;
      const rel = `content/${c.id}/${f}`;
      let base = f.replace(/\.md$/, "");
      if (c.i18n) {
        const m = /^(.+)\.([a-z]{2})$/.exec(base);
        if (!m) {
          push(errors, locale, rel, "filename", "tree.i18nFilename", {});
          continue;
        }
        base = m[1];
      }
      if (!SLUG_RE.test(base)) push(errors, locale, rel, "filename", "tree.badFilename", {});
      const { data, body, problems } = parseSimpleFrontmatter(fs.readFileSync(path.join(dir, f), "utf8"));
      errors.push(...validateDoc(c, { ...data, __problems: problems }, body, rel, { locale }));
    }
  }

  // settings surface (business.json / testimonials.json) — validated only for the
  // keys the schema declares. An EMPTY schema (`{}`, how the template ships) means
  // the business-info surface was never opened up, so nothing here is enforced.
  const schemaPath = path.join(root, "content", "cms", "settings.schema.json");
  let schemaKeys = [];
  if (fs.existsSync(schemaPath)) {
    try {
      const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
      schemaKeys = Object.keys(schema);
      for (const name of schemaKeys) {
        const p = path.join(root, "content", "settings", `${name}.json`);
        if (!fs.existsSync(p)) continue;
        files++;
        try {
          errors.push(...validateSettings(schema, name, JSON.parse(fs.readFileSync(p, "utf8")), `content/settings/${name}.json`, locale));
        } catch (e) {
          push(errors, locale, `content/settings/${name}.json`, name, "tree.settingsNotJson", { message: e.message });
        }
      }
    } catch (e) {
      push(errors, locale, "content/cms/settings.schema.json", "schema", "tree.schemaNotJson", { message: e.message });
    }
  }

  return { dormant: cols.length === 0 && schemaKeys.length === 0, files, errors };
}
