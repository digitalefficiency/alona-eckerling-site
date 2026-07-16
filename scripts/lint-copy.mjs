#!/usr/bin/env node
/**
 * lint-copy.mjs — the no-placeholder-copy gate (site-foundry premium tier).
 *
 * Scans src/app/**\/*.tsx + src/lib/site.ts for (a) placeholder/template
 * markers and (b) banned stock phrases from references/premium-tier.md.
 * Every client deliverable must exit 0 — copy comes from group-H intake,
 * never from filler. Run from anywhere: `node scripts/lint-copy.mjs`.
 * `--warn-only` prints findings but exits 0 (internal/demo builds).
 */
import { readdirSync, readFileSync, statSync, lstatSync, existsSync } from "node:fs";
import { join, relative, dirname, sep } from "node:path";
import { fileURLToPath } from "node:url";
// The lists live in scripts/copy-banlist.mjs (EDIT THERE) — one source of truth
// shared with the client-content validator (validate.mjs / lint-content.mjs).
import { PLACEHOLDER_MARKERS, BANNED_PHRASES } from "./copy-banlist.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TARGETS = [join(ROOT, "src", "app"), join(ROOT, "src", "lib", "site.ts")];
// Internal demo pages — never client deliverables. The styleguide
// (src/app/styleguide/) deliberately carries sample Hebrew copy to demo the
// design/motion system; it is noindex'd and absent from sitemap.ts, so it is
// exempt from the no-placeholder gate.
const EXEMPT_DIRS = [join(ROOT, "src", "app", "styleguide")];
const WARN_ONLY = process.argv.includes("--warn-only");

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// Single ASCII words get word boundaries (so "todos"/"TodoList" don't fire);
// multi-word and Hebrew phrases match as substrings. All case-insensitive.
const toRegex = (phrase) =>
  /^[a-z]+$/i.test(phrase)
    ? new RegExp(`\\b${phrase}\\b`, "i")
    : new RegExp(escape(phrase), "i");

const CHECKS = [
  ...PLACEHOLDER_MARKERS.map((p) => ({ kind: "placeholder", phrase: p, re: toRegex(p) })),
  ...BANNED_PHRASES.map((p) => ({ kind: "banned-phrase", phrase: p, re: toRegex(p) })),
];

function collectFiles(path, out = []) {
  if (!existsSync(path)) return out;
  const stat = statSync(path);
  if (stat.isFile()) {
    out.push(path);
  } else if (stat.isDirectory()) {
    for (const entry of readdirSync(path)) {
      const full = join(path, entry);
      const st = lstatSync(full); // F4: lstat, not stat — a directory-symlink loop must not ELOOP-crash the gate
      if (st.isSymbolicLink()) continue;
      if (st.isDirectory()) collectFiles(full, out);
      else if (entry.endsWith(".tsx")) out.push(full);
    }
  }
  return out;
}

const findings = [];
for (const file of TARGETS.flatMap((t) => collectFiles(t))) {
  if (EXEMPT_DIRS.some((d) => file.startsWith(d + sep))) continue;
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((raw, i) => {
    // The JSX `placeholder=` attribute is legit form UI, not filler copy.
    const line = raw.replace(/\bplaceholder\s*[=:]/gi, "");
    for (const { kind, phrase, re } of CHECKS) {
      if (re.test(line)) {
        findings.push({ file: relative(ROOT, file), line: i + 1, kind, phrase });
      }
    }
  });
}

if (findings.length === 0) {
  console.log("lint-copy: clean — no placeholder markers or banned phrases found.");
  process.exit(0);
}

for (const f of findings) {
  console.log(`${f.file}:${f.line}  [${f.kind}]  "${f.phrase}"`);
}
const placeholders = findings.filter((f) => f.kind === "placeholder").length;
const banned = findings.length - placeholders;
console.log(
  `\nlint-copy: ${findings.length} finding(s) — ${placeholders} placeholder marker(s), ` +
    `${banned} banned phrase(s). Copy must come from group-H intake ` +
    `(references/intake-questions.md); ban list: references/premium-tier.md.`
);
process.exit(WARN_ONLY ? 0 : 1);
