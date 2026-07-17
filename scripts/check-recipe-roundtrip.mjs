// check-recipe-roundtrip.mjs — proves the journey's parser is lossless over the
// REAL corpus: for every content/recipes/*.md, serialize(parse(body)) must keep
// the exact sequence of significant lines (numbering and bullet glyphs are
// presentational and normalized before compare), and parse must be a fixpoint.
import fs from "node:fs";
import path from "node:path";
import { deepStrictEqual } from "node:assert";
import { parseRecipeBody, serializeRecipeBody } from "../src/lib/cms/recipe-body.mjs";

const DIR = path.join(process.cwd(), "content", "recipes");

// frontmatter split (gate-local, mirrors parseSimpleFrontmatter's contract)
const splitDoc = (text) => {
  const m = /^---\n[\s\S]*?\n---\n?/.exec(text);
  return m ? text.slice(m[0].length) : text;
};

const significant = (text) =>
  text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.replace(/^[*•]\s+/, "- ").replace(/^\d+[.)]\s*/, "#. "));

let failures = 0;
for (const f of fs.readdirSync(DIR).filter((f) => f.endsWith(".md"))) {
  const body = splitDoc(fs.readFileSync(path.join(DIR, f), "utf8"));
  const model = parseRecipeBody(body);
  const out = serializeRecipeBody(model);
  const a = significant(body);
  const b = significant(out);
  let lineDiff = -1;
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i] !== b[i]) { lineDiff = i; break; }
  }
  let fixpoint = true;
  try { deepStrictEqual(parseRecipeBody(out), model); } catch { fixpoint = false; }
  if (lineDiff !== -1 || !fixpoint) {
    failures++;
    console.error(`✗ ${f}${!fixpoint ? " (model not a fixpoint)" : ""}`);
    if (lineDiff !== -1) console.error(`  first diff @${lineDiff}:\n    orig: ${a[lineDiff]}\n    out:  ${b[lineDiff]}`);
  } else {
    console.log(`✓ ${f}`);
  }
}
console.log(failures ? `\n${failures} file(s) failed` : "\nall recipes round-trip clean");
process.exit(failures ? 1 : 0);
