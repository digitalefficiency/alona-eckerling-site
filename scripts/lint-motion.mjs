#!/usr/bin/env node
/**
 * lint-motion.mjs — the tokens-only motion gate (site-foundry premium tier).
 *
 * Scans src/**\/*.tsx for inline motion sins (premium-tier.md "Motion
 * discipline": all transitions reference motion tokens only):
 *   - numeric `duration:` literals in motion transition props (use DUR.*)
 *   - inline `ease: [ … ]` bezier arrays / `ease: "easeInOut"` string
 *     literals (use EASE.* via lib/motion-variants `bezier()`)
 *   - inline-style transition strings with hardcoded ms/s times
 *   - `animation-duration` / `animationDuration` literals in inline styles
 *   - raw `cubic-bezier(…)` anywhere in a component (design-system.md → Motion:
 *     "No inline cubic-bezier(...) or raw durations in components")
 *
 * Allowlist: src/lib/motion-tokens.ts + src/lib/motion-variants.ts (the ONLY
 * homes for raw numbers/curves) and src/app/globals.css (the CSS mirror).
 * Every client deliverable must exit 0. Run from anywhere:
 * `node scripts/lint-motion.mjs`. `--warn-only` prints findings but exits 0.
 */
import { readdirSync, readFileSync, statSync, lstatSync, existsSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TARGET = join(ROOT, "src");
const WARN_ONLY = process.argv.includes("--warn-only");

// The only files allowed to hold raw eases/durations (relative to ROOT).
const ALLOWLIST = new Set([
  join("src", "lib", "motion-tokens.ts"),
  join("src", "lib", "motion-variants.ts"),
  join("src", "app", "globals.css"),
]);

// ---- The sins. Each check runs per line; `hint` says what to use instead. ----
const CHECKS = [
  {
    kind: "duration-literal",
    // transition={{ duration: 0.3 }} / { duration: 1, … } — numeric literal.
    // `duration: DUR.reveal` starts with "D", so tokens never match.
    re: /\bduration:\s*\d/,
    hint: "use DUR.* from lib/motion-tokens (or a variant set from lib/motion-variants)",
  },
  {
    kind: "ease-array-literal",
    // ease: [0.16, 1, 0.3, 1] — inline bezier tuple.
    re: /\bease:\s*\[/,
    hint: "use bezier(EASE.*) from lib/motion-variants",
  },
  {
    kind: "ease-string-literal",
    // ease: "easeInOut" / 'linear' / `easeOut` — named-ease string literal.
    re: /\bease:\s*["'`]/,
    hint: "use bezier(EASE.*) from lib/motion-variants — never library-default eases",
  },
  {
    kind: "css-time-literal",
    // transition: "transform 1200ms …" / transitionDuration: "0.3s" — a
    // hardcoded ms/s time on a line that sets a transition. Dynamic values
    // (`${delay}ms`) don't match: the regex needs a digit before ms/s.
    re: /transition[\w-]*["'`\]]*\s*[:=][^;\n]*?\b\d+(?:\.\d+)?m?s\b/,
    hint: "use var(--dur-*) / cssDur(DUR.*) from lib/motion-tokens",
  },
  {
    kind: "animation-duration-literal",
    // animationDuration: "2s" / animation-duration: 300ms in inline styles.
    re: /animation-?[dD]uration["'`\s]*[:=]\s*["'`]?\d/,
    hint: "use var(--dur-*) / cssDur(DUR.*) from lib/motion-tokens",
  },
  {
    kind: "cubic-bezier-literal",
    // Raw curve anywhere (inline style OR Tailwind ease-[cubic-bezier(…)]).
    re: /cubic-bezier\(/,
    hint: "use var(--ease-*) (globals.css @theme) / EASE.* from lib/motion-tokens",
  },
];

function collectFiles(path, out = []) {
  if (!existsSync(path)) return out;
  for (const entry of readdirSync(path)) {
    const full = join(path, entry);
    const st = lstatSync(full); // F4: lstat, not stat — a directory-symlink loop must not ELOOP-crash the gate
    if (st.isSymbolicLink()) continue;
    if (st.isDirectory()) collectFiles(full, out);
    else if (entry.endsWith(".tsx")) out.push(full);
  }
  return out;
}

const findings = [];
for (const file of collectFiles(TARGET)) {
  const rel = relative(ROOT, file);
  if (ALLOWLIST.has(rel)) continue;
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    for (const { kind, re, hint } of CHECKS) {
      if (re.test(line)) findings.push({ file: rel, line: i + 1, kind, hint });
    }
  });
}

if (findings.length === 0) {
  console.log("lint-motion: clean — every transition references the motion tokens.");
  process.exit(0);
}

for (const f of findings) {
  console.log(`${f.file}:${f.line}  [${f.kind}]  → ${f.hint}`);
}
console.log(
  `\nlint-motion: ${findings.length} finding(s). Premium-tier "Motion discipline" ` +
    `gate (references/premium-tier.md): all transitions reference motion tokens ` +
    `only — raw numbers/curves live ONLY in lib/motion-tokens.ts + ` +
    `lib/motion-variants.ts (+ the globals.css @theme mirror).`
);
process.exit(WARN_ONLY ? 0 : 1);
