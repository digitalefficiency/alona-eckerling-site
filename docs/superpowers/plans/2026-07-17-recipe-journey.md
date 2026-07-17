# Recipe Journey CMS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat recipe editor with a 7-station single-page journey (paste-parser entry, structured ingredients/steps, chip catalog, SEO card) over the existing recipe markdown files — zero migration.

**Architecture:** Pure `.mjs` modules (body parse/serialize, paste parser, transliterator, station status) each with a `.d.mts` type surface and `node --test` unit tests; a new `RecipeJourney` client component tree that replaces `DocEditor` for the `recipes` collection only, reusing MediaPicker/PublishBar/autosave/actions/HistoryPanel unchanged. Spec: `docs/superpowers/specs/2026-07-17-recipe-journey-cms-design.md`.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind v4 tokens already in the repo, node:test for units. **No new dependencies.**

## Global Constraints

- Repo: `/Users/romkoren/Desktop/RomKaStudio/clients/alona-eckerling/site`. All paths below are repo-relative.
- All user-facing desk copy goes through `T("key")` from `@/lib/cms/desk-strings` — add keys to BOTH the `he` and `en` tables in `src/lib/cms/strings.mjs` (flat string keys; values are strings or `({param}) => string` builders — follow the file's existing shape exactly).
- **No em-dash (—) in any new Hebrew UI string** (house copy rule; `scripts/copy-banlist.mjs` gate). Use `·` or a comma.
- Pure logic modules: `src/lib/cms/*.mjs` + matching `*.d.mts` — ZERO `node:*` imports in anything reachable from client components (see header comment of `strings.mjs`).
- Styling: copy the existing admin idiom — `inputClass` pattern from `DocEditor.tsx` (`rounded-[4px] border border-line bg-bg2 px-4 py-3 text-ink focus-visible:ring-2 focus-visible:ring-gold`), cards `rounded-[10px] border border-line bg-card`, micro-transitions via `DUR`/`EASE` from `@/lib/motion-tokens`, logical RTL props (`ms-`/`me-`/`text-start`), `dir` comes from the shell (never hardcode `rtl`).
- Commit after every task: `git add <files> && git commit -m "studio: <what>"` ending the message with `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
- Unit tests run with: `node --test src/lib/cms/` (script added in Task 1: `pnpm test`).
- Type-check with `npx tsc --noEmit`; lint with `pnpm lint`.
- The recipe markdown files in `content/recipes/*.md` are the contract: frontmatter + body with `## רכיבים` / `## אופן הכנה` sections. Nothing in this plan changes file format, `actions.ts`, `validate.mjs`, `github.ts`, or the auth flow.
- Frontmatter keys the journey does NOT edit (e.g. `legacySlug`) must round-trip untouched — always spread the loaded record and only overwrite known keys.

---

### Task 1: `transliterate.mjs` — Hebrew→Latin slug suggestion (+ test infra)

**Files:**
- Create: `src/lib/cms/transliterate.mjs`
- Create: `src/lib/cms/transliterate.d.mts`
- Create: `src/lib/cms/transliterate.test.mjs`
- Modify: `package.json` (add `"test": "node --test src/lib/cms/"` to `scripts`)

**Interfaces:**
- Produces: `suggestSlug(title: string): string` — lowercase latin/digit/dash slug, possibly `""` for unmappable input. Consumed by Task 9 (`SourceStation`/new-recipe slug autofill).

- [ ] **Step 1: Write the failing test** — `src/lib/cms/transliterate.test.mjs`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { suggestSlug } from "./transliterate.mjs";

test("transliterates Hebrew consonantally", () => {
  assert.equal(suggestSlug("שקשוקה ירוקה"), "shkshvkh-yrvkh");
});
test("passes latin through, lowercased and dashed", () => {
  assert.equal(suggestSlug("Protein Pancakes!"), "protein-pancakes");
});
test("keeps digits", () => {
  assert.equal(suggestSlug("5 דקות"), "5-dkvt");
});
test("empty and symbol-only input yields empty string", () => {
  assert.equal(suggestSlug(""), "");
  assert.equal(suggestSlug("!!!"), "");
});
test("strips gershayim and collapses dashes", () => {
  assert.equal(suggestSlug('עוגת ד"ש'), "vgt-dsh");
});
```

- [ ] **Step 2: Run to verify failure** — `node --test src/lib/cms/transliterate.test.mjs` → FAIL (module not found).

- [ ] **Step 3: Implement** — `src/lib/cms/transliterate.mjs`:

```js
// transliterate.mjs — Hebrew→Latin slug suggestion for the recipe journey.
// Consonantal and deterministic, not pretty: the client edits the result, so a
// readable-ish prefill beats the old "post-<date>" placeholder. Pure, zero deps.
const MAP = {
  "א": "", "ב": "b", "ג": "g", "ד": "d", "ה": "h", "ו": "v", "ז": "z",
  "ח": "ch", "ט": "t", "י": "y", "כ": "k", "ך": "k", "ל": "l", "מ": "m",
  "ם": "m", "נ": "n", "ן": "n", "ס": "s", "ע": "", "פ": "p", "ף": "f",
  "צ": "ts", "ץ": "ts", "ק": "k", "ר": "r", "ש": "sh", "ת": "t",
};

export function suggestSlug(title) {
  let out = "";
  for (const ch of String(title ?? "").toLowerCase()) {
    out += MAP[ch] ?? ch;
  }
  return out
    .replace(/["'`׳״]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/, "");
}
```

And `src/lib/cms/transliterate.d.mts`:

```ts
// Type surface of transliterate.mjs (Hebrew→Latin slug suggestion).
export declare function suggestSlug(title: string): string;
```

- [ ] **Step 4: Run tests** — `node --test src/lib/cms/transliterate.test.mjs` → all PASS. Verify the expected strings by hand against MAP before adjusting either side; the test values above are computed from MAP and are correct.
- [ ] **Step 5: Add the test script** to `package.json` scripts: `"test": "node --test src/lib/cms/"`. Run `pnpm test` → PASS.
- [ ] **Step 6: Commit** — `git add src/lib/cms/transliterate.* package.json && git commit` (message per Global Constraints, e.g. `studio: cms journey · transliterate.mjs slug suggester + node:test infra`).

---

### Task 2: `recipe-body.mjs` — body ⇄ model parse/serialize

**Files:**
- Create: `src/lib/cms/recipe-body.mjs`
- Create: `src/lib/cms/recipe-body.d.mts`
- Create: `src/lib/cms/recipe-body.test.mjs`

**Interfaces:**
- Produces (consumed by Tasks 3, 8, 9):

```ts
export type RecipeBodyModel = {
  intro: string;          // prose before the first "## " heading
  ingredients: string[];  // items of the רכיבים/מצרכים section, markers stripped
  steps: string[];        // items of the הכנה/הוראות section, numbering stripped
  tip: string;            // prose of a טיפ section
  extra: string;          // every unrecognized "## " section, verbatim, original order
  headings: { ingredients: string; steps: string; tip: string }; // original heading text (round-trip fidelity)
};
export declare function emptyRecipeBody(): RecipeBodyModel;
export declare function parseRecipeBody(markdown: string): RecipeBodyModel;
export declare function serializeRecipeBody(model: RecipeBodyModel): string;
```

- [ ] **Step 1: Write the failing test** — `src/lib/cms/recipe-body.test.mjs`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { emptyRecipeBody, parseRecipeBody, serializeRecipeBody } from "./recipe-body.mjs";

const SAMPLE = `פתיח קצר ואישי.

עוד פסקה של פתיח.

## רכיבים

- קופסת תירס
- 1 ביצה

## אופן הכנה

1. מחממים תנור.
2. מערבבים הכל.

## טיפ

מגישים חם.`;

test("parses intro, ingredients, steps, tip", () => {
  const m = parseRecipeBody(SAMPLE);
  assert.equal(m.intro, "פתיח קצר ואישי.\n\nעוד פסקה של פתיח.");
  assert.deepEqual(m.ingredients, ["קופסת תירס", "1 ביצה"]);
  assert.deepEqual(m.steps, ["מחממים תנור.", "מערבבים הכל."]);
  assert.equal(m.tip, "מגישים חם.");
  assert.equal(m.extra, "");
});

test("serialize(parse(x)) is a fixpoint on the canonical form", () => {
  const once = serializeRecipeBody(parseRecipeBody(SAMPLE));
  const twice = serializeRecipeBody(parseRecipeBody(once));
  assert.equal(once, twice);
});

test("alternative headings and markers survive round-trip", () => {
  const alt = "## מצרכים\n\n* שני תפוחים\n\n## הוראות הכנה\n\n1) לקלף.";
  const m = parseRecipeBody(alt);
  assert.deepEqual(m.ingredients, ["שני תפוחים"]);
  assert.deepEqual(m.steps, ["לקלף."]);
  assert.equal(m.headings.ingredients, "מצרכים");
  assert.equal(m.headings.steps, "הוראות הכנה");
  const out = serializeRecipeBody(m);
  assert.ok(out.includes("## מצרכים"));
  assert.ok(out.includes("- שני תפוחים"));
  assert.ok(out.includes("1. לקלף."));
});

test("unknown sections are preserved verbatim in extra", () => {
  const withExtra = SAMPLE + "\n\n## ערכים תזונתיים\n\n55 קלוריות למנה.";
  const m = parseRecipeBody(withExtra);
  assert.equal(m.extra, "## ערכים תזונתיים\n\n55 קלוריות למנה.");
  assert.ok(serializeRecipeBody(m).trimEnd().endsWith("55 קלוריות למנה."));
});

test("a second ingredients-like section falls into extra, not data loss", () => {
  const dup = "## רכיבים\n\n- א\n\n## רכיבים לציפוי\n\n- ב";
  const m = parseRecipeBody(dup);
  assert.deepEqual(m.ingredients, ["א"]);
  assert.equal(m.extra, "## רכיבים לציפוי\n\n- ב");
});

test("empty body parses to empty model and serializes to empty string", () => {
  assert.deepEqual(parseRecipeBody(""), emptyRecipeBody());
  assert.equal(serializeRecipeBody(emptyRecipeBody()), "");
});
```

- [ ] **Step 2: Run to verify failure** — `node --test src/lib/cms/recipe-body.test.mjs` → FAIL.

- [ ] **Step 3: Implement** — `src/lib/cms/recipe-body.mjs`:

```js
// recipe-body.mjs — the recipe journey's body contract. The markdown files in
// content/recipes/ stay the source of truth (intro + "## רכיבים" bullets +
// "## אופן הכנה" numbered steps); the admin edits a structured model and this
// module converts both ways. Unrecognized "## " sections pass through `extra`
// VERBATIM so no hand-authored content can ever be lost by the editor.
// Pure string functions, zero deps, client-bundleable.
const ING_RE = /רכיבים|מצרכים|חומרים/;
const TIP_RE = /טיפ/;
const STEP_RE = /הכנה|הוראות/;

export function emptyRecipeBody() {
  return {
    intro: "",
    ingredients: [],
    steps: [],
    tip: "",
    extra: "",
    headings: { ingredients: "רכיבים", steps: "אופן הכנה", tip: "טיפ" },
  };
}

function itemize(lines, marker) {
  return lines
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.replace(marker, "").trim())
    .filter(Boolean);
}

export function parseRecipeBody(markdown) {
  const model = emptyRecipeBody();
  const lines = String(markdown ?? "").replace(/\r\n/g, "\n").split("\n");

  const sections = [];
  let cur = { heading: null, lines: [] };
  for (const line of lines) {
    const m = /^##\s+(.+?)\s*$/.exec(line);
    if (m) {
      sections.push(cur);
      cur = { heading: m[1], lines: [] };
    } else {
      cur.lines.push(line);
    }
  }
  sections.push(cur);

  const extras = [];
  for (const s of sections) {
    const text = s.lines.join("\n").replace(/^\n+|\n+$/g, "");
    if (s.heading === null) {
      model.intro = text;
      continue;
    }
    // Order matters: "טיפים להכנה" must classify as tip, not steps.
    if (ING_RE.test(s.heading) && !model.ingredients.length) {
      model.headings.ingredients = s.heading;
      model.ingredients = itemize(s.lines, /^[-*•]\s+/);
    } else if (TIP_RE.test(s.heading) && !model.tip) {
      model.headings.tip = s.heading;
      model.tip = text;
    } else if (STEP_RE.test(s.heading) && !model.steps.length) {
      model.headings.steps = s.heading;
      model.steps = itemize(s.lines, /^(?:\d+[.)]\s*|[-*•]\s+)/);
    } else {
      extras.push(text ? `## ${s.heading}\n\n${text}` : `## ${s.heading}`);
    }
  }
  model.extra = extras.join("\n\n");
  return model;
}

export function serializeRecipeBody(model) {
  const parts = [];
  if (model.intro.trim()) parts.push(model.intro.trim());
  if (model.ingredients.length) {
    parts.push(`## ${model.headings.ingredients}\n\n` + model.ingredients.map((i) => `- ${i}`).join("\n"));
  }
  if (model.steps.length) {
    parts.push(`## ${model.headings.steps}\n\n` + model.steps.map((s, i) => `${i + 1}. ${s}`).join("\n"));
  }
  if (model.tip.trim()) parts.push(`## ${model.headings.tip}\n\n${model.tip.trim()}`);
  if (model.extra.trim()) parts.push(model.extra.trim());
  return parts.join("\n\n");
}
```

And `src/lib/cms/recipe-body.d.mts` with exactly the Interfaces block above (plus a one-line header comment).

- [ ] **Step 4: Run tests** — `node --test src/lib/cms/recipe-body.test.mjs` → all PASS.
- [ ] **Step 5: Commit** — `studio: cms journey · recipe-body.mjs body⇄model parser/serializer`.

---

### Task 3: Corpus round-trip gate — prove it on all real recipes

**Files:**
- Create: `scripts/check-recipe-roundtrip.mjs`
- Possibly modify: `src/lib/cms/recipe-body.mjs` (+ its test) — hardening until the corpus passes.

**Interfaces:**
- Consumes: `parseRecipeBody` / `serializeRecipeBody` from Task 2.
- Produces: a zero-dep gate script (exit 0/1) run in Task 11 final gates.

- [ ] **Step 1: Write the gate** — `scripts/check-recipe-roundtrip.mjs`:

```js
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
```

- [ ] **Step 2: Run it** — `node scripts/check-recipe-roundtrip.mjs`. Expected on first run: mostly ✓; any ✗ shows the exact first differing line.
- [ ] **Step 3: Harden the parser until green.** Allowed changes are ONLY inside `recipe-body.mjs` (e.g. an extra heading synonym, a marker variant like `▪`, tolerance for `###`); every hardening gets a new unit test in `recipe-body.test.mjs` reproducing the corpus case first (TDD). Do NOT edit any content file.
- [ ] **Step 4: Full green** — `node scripts/check-recipe-roundtrip.mjs` exits 0 AND `pnpm test` passes.
- [ ] **Step 5: Commit** — `studio: cms journey · corpus round-trip gate green over all content/recipes`.

---

### Task 4: `recipe-paste.mjs` — the paste-anything parser

**Files:**
- Create: `src/lib/cms/recipe-paste.mjs`
- Create: `src/lib/cms/recipe-paste.d.mts`
- Create: `src/lib/cms/recipe-paste.test.mjs`

**Interfaces:**
- Consumes: `emptyRecipeBody` from `recipe-body.mjs` (heading defaults).
- Produces (consumed by Tasks 7 and 9):

```ts
export type PasteResult = {
  title: string;                 // "" when not confidently detected
  intro: string;
  ingredients: string[];
  steps: string[];
  tip: string;
  summary: { hasTitle: boolean; hasIntro: boolean; ingredients: number; steps: number; hasTip: boolean };
};
export declare function parsePaste(text: string): PasteResult;
export declare function splitPastedLines(text: string): string[]; // multi-line paste → clean items (markers stripped)
```

- [ ] **Step 1: Write the failing test** — `src/lib/cms/recipe-paste.test.mjs` (three realistic fixtures):

```js
import test from "node:test";
import assert from "node:assert/strict";
import { parsePaste, splitPastedLines } from "./recipe-paste.mjs";

test("splitPastedLines strips bullets, numbering and blanks", () => {
  assert.deepEqual(splitPastedLines("- ביצה\n2. קמח\n\n• מלח\n3) סוכר\n"), ["ביצה", "קמח", "מלח", "סוכר"]);
});

const WHATSAPP = `שקשוקה ירוקה מנצחת

מכינים בקלות, מבטיחה שכולם יבקשו עוד.

🥣 רכיבים:
2 ביצים
צרור תרד
1 בצל

👩‍🍳 אופן הכנה:
1. מטגנים בצל.
2. מוסיפים תרד.
3. יוצרים גומות ושוברים ביצים.

טיפ: מגישים עם לחם כפרי.`;

test("parses a WhatsApp-style paste with emoji section markers", () => {
  const r = parsePaste(WHATSAPP);
  assert.equal(r.title, "שקשוקה ירוקה מנצחת");
  assert.equal(r.intro, "מכינים בקלות, מבטיחה שכולם יבקשו עוד.");
  assert.deepEqual(r.ingredients, ["2 ביצים", "צרור תרד", "1 בצל"]);
  assert.deepEqual(r.steps, ["מטגנים בצל.", "מוסיפים תרד.", "יוצרים גומות ושוברים ביצים."]);
  assert.equal(r.tip, "מגישים עם לחם כפרי.");
  assert.deepEqual(r.summary, { hasTitle: true, hasIntro: true, ingredients: 3, steps: 3, hasTip: true });
});

const MARKDOWN = `## רכיבים\n\n- א\n- ב\n\n## אופן הכנה\n\n1. שלב ראשון.`;

test("parses markdown-style paste (no title, no intro)", () => {
  const r = parsePaste(MARKDOWN);
  assert.equal(r.title, "");
  assert.deepEqual(r.ingredients, ["א", "ב"]);
  assert.deepEqual(r.steps, ["שלב ראשון."]);
});

const BARE = `עוגת תפוחים

3 תפוחים
2 ביצים
כוס קמח

1. מקלפים את התפוחים.
2. מערבבים הכל.
3. אופים 40 דקות.`;

test("clusters a bare paste: short-line block before a numbered run = ingredients", () => {
  const r = parsePaste(BARE);
  assert.equal(r.title, "עוגת תפוחים");
  assert.deepEqual(r.ingredients, ["3 תפוחים", "2 ביצים", "כוס קמח"]);
  assert.deepEqual(r.steps, ["מקלפים את התפוחים.", "מערבבים הכל.", "אופים 40 דקות."]);
});

test("prose-only paste lands fully visible in intro, nothing invented", () => {
  const r = parsePaste("סתם פסקה ארוכה של טקסט שמסבירה משהו על אוכל בריא ואין בה מתכון בכלל, באמת שאין.");
  assert.equal(r.title, "");
  assert.ok(r.intro.includes("סתם פסקה"));
  assert.deepEqual(r.ingredients, []);
  assert.deepEqual(r.steps, []);
});
```

- [ ] **Step 2: Run to verify failure.**
- [ ] **Step 3: Implement** — `src/lib/cms/recipe-paste.mjs`:

```js
// recipe-paste.mjs — heuristics that turn a pasted "whole recipe" (WhatsApp,
// Word, markdown, bare text) into the journey's model. Deterministic, zero AI,
// zero deps. The contract with the user: nothing is ever DROPPED — anything the
// heuristics cannot place stays visible in `intro` for manual sorting.
const MARKER = /^\s*(?:[-*•▪◦]\s*|\d+[.)]\s*)/;

export function splitPastedLines(text) {
  return String(text ?? "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.replace(MARKER, "").trim())
    .filter(Boolean);
}

// A "section marker" line: optional emoji/symbols/## prefix, a known Hebrew
// section word, optionally a short tail and a colon. Tested against the TRIMMED line.
const SECTIONS = [
  { key: "ingredients", re: /^[^\p{L}\p{N}]*(?:##\s*)?[^\p{L}\p{N}]*(רכיבים|מצרכים|החומרים|חומרים)\s*:?\s*$/u },
  { key: "tip", re: /^[^\p{L}\p{N}]*(?:##\s*)?[^\p{L}\p{N}]*טיפ(?:ים)?\b/u },
  { key: "steps", re: /^[^\p{L}\p{N}]*(?:##\s*)?[^\p{L}\p{N}]*(אופן\s+ה?הכנה|הוראות(?:\s+הכנה)?|שלבי\s+הכנה|דרך\s+ההכנה|הכנה)\s*:?\s*$/u },
];

function sectionOf(line) {
  for (const s of SECTIONS) {
    if (s.re.test(line)) return s;
  }
  return null;
}

export function parsePaste(text) {
  const rawLines = String(text ?? "").replace(/\r\n/g, "\n").split("\n");
  const out = { title: "", intro: "", ingredients: [], steps: [], tip: "" };

  // Pass 1 — explicit section markers.
  let bucket = "top";
  const top = [];
  const tipLines = [];
  let sawSection = false;
  for (const raw of rawLines) {
    const line = raw.trim();
    const sec = line ? sectionOf(line) : null;
    if (sec) {
      sawSection = true;
      bucket = sec.key;
      // "טיפ: מגישים חם" carries content on the marker line itself.
      if (sec.key === "tip") {
        const inlineTip = line.replace(/^[^\p{L}\p{N}]*טיפ(?:ים)?\s*:?\s*/u, "").trim();
        if (inlineTip) tipLines.push(inlineTip);
      }
      continue;
    }
    if (!line) {
      if (bucket === "top") top.push("");
      continue;
    }
    if (bucket === "top") top.push(line);
    else if (bucket === "ingredients") out.ingredients.push(...splitPastedLines(line));
    else if (bucket === "steps") out.steps.push(...splitPastedLines(line));
    else if (bucket === "tip") tipLines.push(line);
  }
  out.tip = tipLines.join("\n").trim();

  // Title: first non-empty top line, if short and not itself a list item.
  const topClean = [];
  for (const l of top) topClean.push(l);
  const firstIdx = topClean.findIndex((l) => l.trim());
  if (firstIdx !== -1) {
    const first = topClean[firstIdx].trim();
    if (first.length <= 70 && !MARKER.test(first) && !first.startsWith("#")) {
      out.title = first;
      topClean.splice(0, firstIdx + 1);
    }
  }

  if (sawSection) {
    out.intro = topClean.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  } else {
    // Pass 2 — no markers: cluster the remaining lines.
    const rest = topClean.join("\n").split("\n");
    const groups = []; // { kind: "prose"|"bullet"|"number", lines: [] }
    for (const raw of rest) {
      const line = raw.trim();
      if (!line) { groups.push(null); continue; }
      const kind = /^\d+[.)]\s*/.test(line) ? "number" : /^[-*•▪◦]\s*/.test(line) ? "bullet" : "prose";
      const last = groups[groups.length - 1];
      if (last && last.kind === kind) last.lines.push(line);
      else groups.push({ kind, lines: [line] });
    }
    const clean = groups.filter(Boolean);
    const numberIdx = clean.findIndex((g) => g.kind === "number" && g.lines.length >= 2);
    const bulletIdx = clean.findIndex((g) => g.kind === "bullet" && g.lines.length >= 2);
    let ingredientsIdx = bulletIdx;
    // WhatsApp habit: ingredients as bare short lines right before the numbered steps.
    if (ingredientsIdx === -1 && numberIdx > 0) {
      const before = clean[numberIdx - 1];
      if (before.kind === "prose" && before.lines.length >= 2 && before.lines.every((l) => l.length <= 80)) {
        ingredientsIdx = numberIdx - 1;
      }
    }
    const introParts = [];
    clean.forEach((g, i) => {
      if (i === ingredientsIdx) out.ingredients = splitPastedLines(g.lines.join("\n"));
      else if (i === numberIdx) out.steps = splitPastedLines(g.lines.join("\n"));
      else introParts.push(g.lines.join("\n"));
    });
    out.intro = introParts.join("\n\n").trim();
  }

  return {
    ...out,
    summary: {
      hasTitle: Boolean(out.title),
      hasIntro: Boolean(out.intro),
      ingredients: out.ingredients.length,
      steps: out.steps.length,
      hasTip: Boolean(out.tip),
    },
  };
}
```

And `src/lib/cms/recipe-paste.d.mts` with the Interfaces block above.

- [ ] **Step 4: Run tests** — `node --test src/lib/cms/recipe-paste.test.mjs` → all PASS (adjust implementation, not fixtures, if red).
- [ ] **Step 5: Commit** — `studio: cms journey · recipe-paste.mjs heuristic paste parser`.

---

### Task 5: `journey-status.mjs` — station completeness

**Files:**
- Create: `src/lib/cms/journey-status.mjs`
- Create: `src/lib/cms/journey-status.d.mts`
- Create: `src/lib/cms/journey-status.test.mjs`

**Interfaces:**
- Produces (consumed by Task 8):

```ts
export type StationId = "dish" | "story" | "ingredients" | "steps" | "image" | "catalog" | "publish";
export declare const STATION_ORDER: readonly StationId[];
export type JourneyInput = {
  title: string; prepTime: string; intro: string;
  ingredients: string[]; steps: string[];
  image: string; imageAlt: string;
  category: string; tags: string[]; date: string;
  description: string; slug: string; isNew: boolean;
};
export declare function stationStatus(input: JourneyInput): Record<StationId, boolean>; // true = done
export declare function missingStations(input: JourneyInput): StationId[];
export declare const SLUG_RE: RegExp; // /^[a-z0-9]+(?:-[a-z0-9]+)*$/
```

- [ ] **Step 1: Write the failing test** (representative cases — all-empty → everything missing except none; full valid input → all done; description 69/161 chars → publish missing; existing doc (`isNew:false`) ignores slug shape):

```js
import test from "node:test";
import assert from "node:assert/strict";
import { stationStatus, missingStations, STATION_ORDER } from "./journey-status.mjs";

const FULL = {
  title: "שקשוקה", prepTime: "20 דקות", intro: "פתיח",
  ingredients: ["ביצה"], steps: ["לטגן"],
  image: "/media/x.jpg", imageAlt: "שקשוקה",
  category: "בוקר", tags: ["צמחוני"], date: "2026-07-17",
  description: "א".repeat(80), slug: "green-shakshuka", isNew: true,
};

test("full valid input: every station done", () => {
  assert.deepEqual(missingStations(FULL), []);
});
test("station order is the journey order", () => {
  assert.deepEqual([...STATION_ORDER], ["dish", "story", "ingredients", "steps", "image", "catalog", "publish"]);
});
test("empty input: everything missing", () => {
  const empty = { ...FULL, title: "", prepTime: "", intro: "", ingredients: [], steps: [], image: "", imageAlt: "", category: "", tags: [], date: "", description: "", slug: "" };
  assert.equal(missingStations(empty).length, STATION_ORDER.length);
});
test("description length gates publish (70..160)", () => {
  assert.ok(!stationStatus({ ...FULL, description: "א".repeat(69) }).publish);
  assert.ok(!stationStatus({ ...FULL, description: "א".repeat(161) }).publish);
  assert.ok(stationStatus({ ...FULL, description: "א".repeat(70) }).publish);
});
test("bad slug gates publish only for NEW docs", () => {
  assert.ok(!stationStatus({ ...FULL, slug: "עברית" }).publish);
  assert.ok(stationStatus({ ...FULL, slug: "עברית", isNew: false }).publish);
});
test("image needs BOTH url and alt", () => {
  assert.ok(!stationStatus({ ...FULL, imageAlt: "" }).image);
});
```

- [ ] **Step 2: Run to verify failure.**
- [ ] **Step 3: Implement** — `src/lib/cms/journey-status.mjs`:

```js
// journey-status.mjs — per-station completeness for the recipe journey's
// progress rail and pre-publish checklist. Mirrors (does not replace) the
// server validator: the server stays the authority; this only paints the rail.
export const STATION_ORDER = ["dish", "story", "ingredients", "steps", "image", "catalog", "publish"];
export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const filled = (s) => Boolean(String(s ?? "").trim());

export function stationStatus(i) {
  return {
    dish: filled(i.title) && String(i.title).trim().length <= 70 && filled(i.prepTime),
    story: filled(i.intro),
    ingredients: i.ingredients.filter(filled).length >= 1,
    steps: i.steps.filter(filled).length >= 1,
    image: filled(i.image) && filled(i.imageAlt),
    catalog: filled(i.category) && i.tags.filter(filled).length >= 1 && filled(i.date),
    publish:
      String(i.description ?? "").trim().length >= 70 &&
      String(i.description ?? "").trim().length <= 160 &&
      (!i.isNew || SLUG_RE.test(i.slug)),
  };
}

export function missingStations(i) {
  const st = stationStatus(i);
  return STATION_ORDER.filter((id) => !st[id]);
}
```

And the `.d.mts` from the Interfaces block.

- [ ] **Step 4: Run tests** → PASS. **Step 5: Commit** — `studio: cms journey · journey-status.mjs station completeness`.

---

### Task 6: Chip catalog — config `options`, ChipSelect, DocEditor wiring, all new desk strings

**Files:**
- Modify: `src/lib/cms/config.ts` (FieldSpec)
- Modify: `content/cms/collections.json` (recipes category/tags fields)
- Modify: `src/lib/cms/strings.mjs` (ALL new keys for Tasks 6-10, he + en)
- Create: `src/components/admin/ChipSelect.tsx`
- Modify: `src/components/admin/DocEditor.tsx` (Field renders ChipSelect when `spec.options`)

**Interfaces:**
- Produces: `FieldSpec.options?: string[]`; `<ChipSelect label options value max single allowCustom onChange error />` with `value: string[]`, `onChange(next: string[])`. Consumed by Tasks 8-9 (CatalogStation).

- [ ] **Step 1: config.ts** — add to `FieldSpec` after `requiredAlt`:

```ts
  options?: string[]; // chip choices for text (single) / list (multi) fields; values outside the list still render as selected chips
```

- [ ] **Step 2: collections.json** — replace the recipes `category` and `tags` field objects with:

```json
{ "key": "category", "type": "text", "label": "קטגוריה", "required": true, "max": 30,
  "options": ["בוקר", "צהריים", "ערב", "מרקים", "סלטים", "מאפים", "מתוקים", "חטיפים"] },
{ "key": "tags", "type": "list", "label": "תגיות תזונה", "min": 1, "max": 5,
  "options": ["קל ומהיר", "צמחוני", "טבעוני", "עתיר חלבון", "ללא גלוטן", "דל קלוריות", "דל פחמימה"] }
```

(The options are the REAL vocabulary already used across `content/recipes/` — 8 categories including מרקים and חטיפים, 7 tags — so every existing doc opens with its chips selected.)

- [ ] **Step 3: strings.mjs** — add ALL of the following keys to the `he` table AND matching `en` entries (same flat-key shape as the file's existing entries; builders where a param appears). No em-dash in any value.

```
"chip.add": "הוספה" / "Add"
"chip.customPlaceholder": "ערך חדש..." / "New value..."
"journey.st.dish": "המנה" / "The dish"
"journey.st.story": "הסיפור" / "The story"
"journey.st.ingredients": "רכיבים" / "Ingredients"
"journey.st.steps": "אופן הכנה" / "Method"
"journey.st.image": "תמונה ותוספות" / "Photo & extras"
"journey.st.catalog": "קטלוג" / "Catalog"
"journey.st.publish": "כרטיס ביקור ופרסום" / "Search card & publish"
"journey.progress": ({ done, total }) => `הושלמו ${done} מתוך ${total} תחנות` / `${done} of ${total} stations done`
"journey.story.hint": "כמה משפטים אישיים בגובה העיניים: למה המתכון הזה, למי הוא מתאים" / "A few personal lines: why this recipe, who it fits"
"journey.ing.add": "הוספת רכיב" / "Add ingredient"
"journey.ing.placeholder": "למשל: 2 ביצים" / "e.g. 2 eggs"
"journey.ing.hint": "רכיב בכל שורה. אפשר להדביק רשימה שלמה, היא תתפצל לבד" / "One ingredient per line. Paste a whole list and it splits itself"
"journey.steps.add": "הוספת שלב" / "Add step"
"journey.steps.placeholder": "מה עושים בשלב הזה?" / "What happens in this step?"
"journey.steps.hint": "שלב בכל שורה. המספור נעשה לבד" / "One step per line. Numbering is automatic"
"journey.tip.label": "טיפ (רשות)" / "Tip (optional)"
"journey.advanced.toggle": "מתקדם: טקסט חופשי ותמונות בגוף" / "Advanced: free text & inline images"
"journey.advanced.hint": "מה שנכתב כאן נשמר כמו שהוא בסוף המתכון" / "Saved verbatim at the end of the recipe"
"journey.seo.preview": "כך זה ייראה בגוגל" / "How it looks on Google"
"journey.seo.count": ({ n }) => `${n} תווים (היעד: 70 עד 160)` / `${n} characters (target: 70 to 160)`
"journey.missing.title": "עוד לא מוכן לפרסום. חסר:" / "Not ready to publish yet. Missing:"
"journey.preview.title": "תצוגה מקדימה" / "Preview"
"journey.source.title": "מאיפה מתחילים?" / "Where do we start?"
"journey.source.pasteCard": "הדביקי מתכון מוכן" / "Paste a ready recipe"
"journey.source.pasteHint": "מוואטסאפ, מוורד, מכל מקום. המערכת תסדר אותו לתחנות" / "From WhatsApp or a doc. It will be sorted into the stations"
"journey.source.scratchCard": "כתיבה מאפס" / "Start from scratch"
"journey.source.scratchHint": "בונים את המתכון תחנה אחר תחנה" / "Build the recipe station by station"
"journey.source.pasteLabel": "כל המתכון, כמו שהוא" / "The whole recipe, as is"
"journey.source.parse": "סדרי לי אותו" / "Sort it for me"
"journey.source.parsed": ({ found }) => `זיהיתי: ${found}` / `Recognized: ${found}`
"journey.source.apply": "אישור והמשך" / "Apply and continue"
"journey.source.back": "חזרה לבחירה" / "Back to choice"
"journey.sum.title": "כותרת" / "title"
"journey.sum.intro": "פתיח" / "intro"
"journey.sum.ingredients": ({ n }) => `${n} רכיבים` / `${n} ingredients`
"journey.sum.steps": ({ n }) => `${n} שלבים` / `${n} steps`
"journey.sum.tip": "טיפ" / "tip"
"journey.sum.nothing": "לא זיהיתי מבנה, הכל נכנס לפתיח לסידור ידני" / "No structure recognized, everything went into the intro"
"journey.slug.locked": "כתובת העמוד קבועה אחרי הפרסום הראשון" / "The page address is fixed after first publish"
"list.noImage": "חסרה תמונה" / "No photo"
```

- [ ] **Step 4: ChipSelect** — create `src/components/admin/ChipSelect.tsx`:

```tsx
"use client";
import { useState } from "react";
import { DUR, EASE, cssDur, cssEase } from "@/lib/motion-tokens";
import { T } from "@/lib/cms/desk-strings";

// Chip picker for fields that carry an `options` list in collections.json.
// `value` is always string[] (single-choice fields pass 0-1 items); values not
// present in `options` (legacy docs) render as selected chips so nothing ever
// disappears from an existing document.
export function ChipSelect({
  label,
  hint,
  options,
  value,
  onChange,
  single = false,
  max,
  allowCustom = false,
  error,
}: {
  label: string;
  hint?: string;
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
  single?: boolean;
  max?: number;
  allowCustom?: boolean;
  error?: string;
}) {
  const [custom, setCustom] = useState("");
  const micro = { transitionDuration: cssDur(DUR.micro), transitionTimingFunction: cssEase(EASE.micro) };
  const all = [...options, ...value.filter((v) => !options.includes(v))];
  const atMax = !single && typeof max === "number" && value.length >= max;

  const toggle = (opt: string) => {
    if (single) return onChange(value[0] === opt ? [] : [opt]);
    if (value.includes(opt)) return onChange(value.filter((v) => v !== opt));
    if (atMax) return;
    onChange([...value, opt]);
  };

  const addCustom = () => {
    const v = custom.trim();
    if (!v || value.includes(v) || atMax) return;
    onChange(single ? [v] : [...value, v]);
    setCustom("");
  };

  return (
    <div>
      <span className="text-sm font-semibold text-ink">{label}</span>
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
      <div className="mt-2 flex flex-wrap gap-2">
        {all.map((opt) => {
          const active = value.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(opt)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
                active ? "bg-ink text-bg" : "border border-line text-ink hover:border-gold"
              } ${!active && atMax ? "opacity-40" : ""}`}
              style={micro}
            >
              {opt}
            </button>
          );
        })}
        {allowCustom && (
          <span className="flex items-center gap-1">
            <input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }}
              placeholder={T("chip.customPlaceholder")}
              className="w-32 rounded-full border border-line bg-bg2 px-3 py-1.5 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            />
            <button type="button" onClick={addCustom} className="text-sm font-semibold text-gold-ink hover:underline" style={micro}>
              {T("chip.add")}
            </button>
          </span>
        )}
      </div>
      {error && <p className="mt-2 text-sm font-semibold text-ink">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 5: DocEditor wiring** — in `src/components/admin/DocEditor.tsx`'s `Field` component, BEFORE the `spec.type === "list"` branch, add (and import ChipSelect):

```tsx
  if (spec.options?.length) {
    const list = Array.isArray(value) ? (value as string[]) : typeof value === "string" && value ? [value] : [];
    return (
      <ChipSelect
        label={spec.label}
        options={spec.options}
        value={list}
        single={spec.type !== "list"}
        max={spec.type === "list" ? spec.max : undefined}
        allowCustom
        onChange={(next) => onChange(spec.key, spec.type === "list" ? next : (next[0] ?? ""))}
        error={error}
      />
    );
  }
```

- [ ] **Step 6: Verify** — `pnpm test` (strings.mjs must still parse), `npx tsc --noEmit`, `pnpm lint` → all clean.
- [ ] **Step 7: Commit** — `studio: cms journey · chip catalog (FieldSpec.options + ChipSelect) + all journey desk strings`.

---

### Task 7: `LineListEditor` — the row editor for ingredients/steps

**Files:**
- Create: `src/components/admin/recipe/LineListEditor.tsx`

**Interfaces:**
- Consumes: `splitPastedLines` from `recipe-paste.mjs` (Task 4).
- Produces: `<LineListEditor label hint items onChange numbered addLabel placeholder error />` with `items: string[]`, `onChange(items: string[])`. Consumed by Task 8.

- [ ] **Step 1: Implement** — `src/components/admin/recipe/LineListEditor.tsx`:

```tsx
"use client";
import { useRef } from "react";
import { DUR, EASE, cssDur, cssEase } from "@/lib/motion-tokens";
import { splitPastedLines } from "@/lib/cms/recipe-paste.mjs";

// One row per ingredient/step. Paste a whole block into any row and it splits
// into rows (splitPastedLines strips bullets/numbering); Enter inserts a row
// below; Backspace on an empty row removes it; ▲▼ reorder (buttons, not drag:
// keyboard-accessible and phone-friendly).
export function LineListEditor({
  label,
  hint,
  items,
  onChange,
  numbered = false,
  addLabel,
  placeholder,
  error,
}: {
  label: string;
  hint?: string;
  items: string[];
  onChange: (items: string[]) => void;
  numbered?: boolean;
  addLabel: string;
  placeholder?: string;
  error?: string;
}) {
  const micro = { transitionDuration: cssDur(DUR.micro), transitionTimingFunction: cssEase(EASE.micro) };
  const rowRefs = useRef<(HTMLInputElement | null)[]>([]);
  const rows = items.length ? items : [""];

  const set = (i: number, v: string) => onChange(rows.map((r, j) => (j === i ? v : r)));
  const insertAfter = (i: number) => {
    onChange([...rows.slice(0, i + 1), "", ...rows.slice(i + 1)]);
    requestAnimationFrame(() => rowRefs.current[i + 1]?.focus());
  };
  const remove = (i: number) => {
    const next = rows.filter((_, j) => j !== i);
    onChange(next.length ? next : [""]);
    requestAnimationFrame(() => rowRefs.current[Math.max(0, i - 1)]?.focus());
  };
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= rows.length) return;
    const next = [...rows];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const pasteAt = (i: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text");
    if (!text.includes("\n")) return; // single-line paste: default behavior
    e.preventDefault();
    const parts = splitPastedLines(text);
    if (!parts.length) return;
    const next = [...rows];
    if (!next[i].trim()) next.splice(i, 1, ...parts);
    else next.splice(i + 1, 0, ...parts);
    onChange(next);
  };

  return (
    <div>
      <span className="text-sm font-semibold text-ink">{label}</span>
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
      <ol className="mt-2 space-y-2">
        {rows.map((row, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="w-6 shrink-0 text-center text-sm font-bold text-gold-ink" aria-hidden>
              {numbered ? i + 1 : "·"}
            </span>
            <input
              ref={(el) => { rowRefs.current[i] = el; }}
              value={row}
              placeholder={placeholder}
              onChange={(e) => set(i, e.target.value)}
              onPaste={(e) => pasteAt(i, e)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); insertAfter(i); }
                if (e.key === "Backspace" && !row && rows.length > 1) { e.preventDefault(); remove(i); }
              }}
              className="w-full rounded-[4px] border border-line bg-bg2 px-4 py-2.5 text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            />
            <span className="flex shrink-0 gap-1">
              <RowBtn onClick={() => move(i, -1)} label="▲" disabled={i === 0} micro={micro} />
              <RowBtn onClick={() => move(i, 1)} label="▼" disabled={i === rows.length - 1} micro={micro} />
              <RowBtn onClick={() => remove(i)} label="✕" disabled={rows.length === 1 && !row} micro={micro} />
            </span>
          </li>
        ))}
      </ol>
      <button
        type="button"
        onClick={() => { onChange([...rows, ""]); requestAnimationFrame(() => rowRefs.current[rows.length]?.focus()); }}
        className="mt-3 text-sm font-semibold text-gold-ink hover:underline"
        style={micro}
      >
        + {addLabel}
      </button>
      {error && <p className="mt-2 text-sm font-semibold text-ink">{error}</p>}
    </div>
  );
}

function RowBtn({ onClick, label, disabled, micro }: { onClick: () => void; label: string; disabled?: boolean; micro: React.CSSProperties }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="rounded-[4px] border border-line px-2 py-1.5 text-xs text-ink transition-colors hover:border-gold disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
      style={micro}
    >
      {label}
    </button>
  );
}
```

Note: the component treats `items=[]` as one empty row for display, but `onChange` always reports the real rows (an all-empty list means "no items yet" — `journey-status` filters empties).

- [ ] **Step 2: Verify** — `npx tsc --noEmit && pnpm lint` → clean.
- [ ] **Step 3: Commit** — `studio: cms journey · LineListEditor row editor (paste-split, reorder, keyboard)`.

---

### Task 8: `RecipeJourney` vertical slice — stations 1-7 for EXISTING recipes + shell routing

**Files:**
- Create: `src/components/admin/recipe/RecipeJourney.tsx`
- Create: `src/components/admin/recipe/JourneyRail.tsx`
- Create: `src/components/admin/recipe/stations.tsx`
- Create: `src/components/admin/recipe/SeoCard.tsx`
- Modify: `src/components/admin/AdminShell.tsx` (route recipes → RecipeJourney)

**Interfaces:**
- Consumes: everything from Tasks 2, 4, 5, 6, 7 plus existing `fetchDoc/saveDoc/deleteDoc/setDocVisibility/previewMarkdown` (`@/lib/cms/actions`), `autosave.mjs`, `MediaPicker`, `InlineImageInserter`, `PublishBar`, `ConfirmDelete`, `HistoryPanel`, `T`.
- Produces: `<RecipeJourney collection file? onDone />` — the same props DocEditor takes. `SourceStation` slot arrives in Task 9; this task renders new-recipe mode WITHOUT station 0 (journey starts empty at station 1).

**State model (single source of truth in RecipeJourney):**

```ts
values: Record<string, unknown>   // FULL frontmatter incl. unknown keys (legacySlug…) — spread, never rebuilt
model: RecipeBodyModel            // parsed body
slug: string; slugTouched: boolean
baseSha: string | null; loading; result: ActionResult | null; preview: string; pending; confirmOpen; rescue
```

Derived: `body = serializeRecipeBody(model)`; `input: JourneyInput` assembled from values+model (`isNew = !file`); `status = stationStatus(input)`.

**Load (mirror DocEditor lines 80-110 exactly, with ONE change):** after `fetchDoc`, set `loadedRef.current.body = serializeRecipeBody(parseRecipeBody(r.body.trim()))` — dirty-tracking runs in canonical space so a cosmetic format difference never reads as an edit. `setModel(parseRecipeBody(r.body.trim()))`. New doc: `values.date` defaults to `new Date().toISOString().slice(0, 10)`, model = `emptyRecipeBody()`, slug = `""` (SeoCard falls back to `suggestSlug(title)` live until `slugTouched`; on save use `slug.trim() || suggestSlug(title) || "recipe-" + date`).

**Autosave/rescue/beforeunload/preview/submit/delete:** copy DocEditor's effects verbatim, substituting the serialized body. Preview debounce keys on `body`.

**Error→station map (module-level const):**

```ts
const FIELD_STATION: Record<string, StationId> = {
  title: "dish", prepTime: "dish", servings: "dish",
  body: "story",
  image: "image", imageAlt: "image",
  category: "catalog", tags: "catalog", date: "catalog",
  description: "publish", slug: "publish",
};
```

`errorFor(field)` like DocEditor; the rail marks a station "error" when a server error maps to it.

- [ ] **Step 1: JourneyRail** — `src/components/admin/recipe/JourneyRail.tsx`:

```tsx
"use client";
import { DUR, EASE, cssDur, cssEase } from "@/lib/motion-tokens";
import { T } from "@/lib/cms/desk-strings";
import { STATION_ORDER, type StationId } from "@/lib/cms/journey-status.mjs";

// The journey's progress rail: side list on desktop, sticky chip row on mobile.
// Pure props: state computation lives in journey-status.mjs, scrollspy in RecipeJourney.
export function JourneyRail({
  status,
  errors,
  active,
  onJump,
}: {
  status: Record<StationId, boolean>;
  errors: Set<StationId>;
  active: StationId;
  onJump: (id: StationId) => void;
}) {
  const micro = { transitionDuration: cssDur(DUR.micro), transitionTimingFunction: cssEase(EASE.micro) };
  const done = STATION_ORDER.filter((s) => status[s]).length;
  return (
    <nav aria-label={T("journey.progress", { done, total: STATION_ORDER.length })}>
      <p className="mb-3 hidden text-xs font-bold tracking-[.15em] text-gold-ink lg:block">
        {T("journey.progress", { done, total: STATION_ORDER.length })}
      </p>
      <ol className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-1.5 lg:overflow-visible lg:pb-0">
        {STATION_ORDER.map((id, i) => {
          const isErr = errors.has(id);
          const isDone = status[id];
          return (
            <li key={id} className="shrink-0">
              <button
                type="button"
                onClick={() => onJump(id)}
                aria-current={active === id ? "step" : undefined}
                className={`flex w-full items-center gap-2 rounded-[6px] px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
                  active === id ? "bg-ink text-bg" : "text-ink hover:bg-bg2"
                }`}
                style={micro}
              >
                <span
                  aria-hidden
                  className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-bold ${
                    isErr ? "bg-ink text-bg" : isDone ? "bg-gold-ink text-bg" : active === id ? "bg-bg text-ink" : "border border-line text-muted"
                  }`}
                >
                  {isErr ? "!" : isDone ? "✓" : i + 1}
                </span>
                {T(`journey.st.${id}`)}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
```

- [ ] **Step 2: stations.tsx** — `src/components/admin/recipe/stations.tsx`. One `Station` shell + six presentational stations. Full file:

```tsx
"use client";
import { T } from "@/lib/cms/desk-strings";
import type { CollectionConfig } from "@/lib/cms/config";
import type { RecipeBodyModel } from "@/lib/cms/recipe-body.mjs";
import { type StationId } from "@/lib/cms/journey-status.mjs";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { InlineImageInserter } from "@/components/admin/InlineImageInserter";
import { ChipSelect } from "@/components/admin/ChipSelect";
import { LineListEditor } from "@/components/admin/recipe/LineListEditor";

// The journey's presentational stations. Every station is a dumb slice over the
// journey's state: RecipeJourney owns values/model and passes narrow setters.
// Labels come from collections.json fields (single source of truth for copy).

export const inputClass =
  "mt-2 w-full rounded-[4px] border border-line bg-bg2 px-4 py-3 text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold";

export function Station({
  id,
  index,
  done,
  children,
}: {
  id: StationId;
  index: number;
  done: boolean;
  children: React.ReactNode;
}) {
  return (
    <section id={`station-${id}`} className="scroll-mt-28 rounded-[10px] border border-line bg-card p-6 md:p-8">
      <header className="mb-5 flex items-center gap-3">
        <span
          aria-hidden
          className={`grid h-8 w-8 place-items-center rounded-full text-sm font-black ${done ? "bg-gold-ink text-bg" : "border border-line text-muted"}`}
        >
          {done ? "✓" : String(index).padStart(2, "0")}
        </span>
        <h2 className="font-serif text-xl font-black text-ink">{T(`journey.st.${id}`)}</h2>
      </header>
      {children}
    </section>
  );
}

const fieldLabel = (c: CollectionConfig, key: string) => c.fields.find((f) => f.key === key)?.label ?? key;

export function DishStation({
  collection, title, prepTime, servings, onSet, errorFor,
}: {
  collection: CollectionConfig;
  title: string; prepTime: string; servings: string;
  onSet: (key: string, v: string) => void;
  errorFor: (field: string) => string | undefined;
}) {
  const err = (f: string) => errorFor(f) && <p className="mt-2 text-sm font-semibold text-ink">{errorFor(f)}</p>;
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <label className="block md:col-span-2">
        <span className="text-sm font-semibold text-ink">{fieldLabel(collection, "title")} <span className="text-gold-ink">*</span></span>
        <input value={title} onChange={(e) => onSet("title", e.target.value)} className={inputClass} />
        {err("title")}
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-ink">{fieldLabel(collection, "prepTime")} <span className="text-gold-ink">*</span></span>
        <input value={prepTime} onChange={(e) => onSet("prepTime", e.target.value)} className={inputClass} />
        {err("prepTime")}
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-ink">{fieldLabel(collection, "servings")}</span>
        <input value={servings} onChange={(e) => onSet("servings", e.target.value)} className={inputClass} />
        {err("servings")}
      </label>
    </div>
  );
}

export function StoryStation({
  intro, onChange, error,
}: { intro: string; onChange: (v: string) => void; error?: string }) {
  return (
    <label className="block">
      <span className="block text-xs text-muted">{T("journey.story.hint")}</span>
      <textarea value={intro} onChange={(e) => onChange(e.target.value)} rows={5} className={`${inputClass} leading-loose`} />
      {error && <p className="mt-2 text-sm font-semibold text-ink">{error}</p>}
    </label>
  );
}

export function IngredientsStation({
  items, onChange,
}: { items: string[]; onChange: (items: string[]) => void }) {
  return (
    <LineListEditor
      label=""
      hint={T("journey.ing.hint")}
      items={items}
      onChange={onChange}
      addLabel={T("journey.ing.add")}
      placeholder={T("journey.ing.placeholder")}
    />
  );
}

export function StepsStation({
  items, onChange,
}: { items: string[]; onChange: (items: string[]) => void }) {
  return (
    <LineListEditor
      label=""
      hint={T("journey.steps.hint")}
      items={items}
      onChange={onChange}
      numbered
      addLabel={T("journey.steps.add")}
      placeholder={T("journey.steps.placeholder")}
    />
  );
}

export function ImageExtrasStation({
  collection, image, imageAlt, tip, extra, advancedOpen, onImage, onTip, onExtra, onToggleAdvanced, onInsertExtra, errorFor,
}: {
  collection: CollectionConfig;
  image: string; imageAlt: string; tip: string; extra: string; advancedOpen: boolean;
  onImage: (url: string, alt: string) => void;
  onTip: (v: string) => void;
  onExtra: (v: string) => void;
  onToggleAdvanced: () => void;
  onInsertExtra: (markdown: string) => void;
  errorFor: (field: string) => string | undefined;
}) {
  const err = (f: string) => errorFor(f) && <p className="mt-2 text-sm font-semibold text-ink">{errorFor(f)}</p>;
  return (
    <div className="space-y-6">
      <div>
        <span className="text-sm font-semibold text-ink">{fieldLabel(collection, "image")} <span className="text-gold-ink">*</span></span>
        <MediaPicker url={image} alt={imageAlt} onChange={onImage} />
        {err("image")}
        {err("imageAlt")}
      </div>
      <label className="block">
        <span className="text-sm font-semibold text-ink">{T("journey.tip.label")}</span>
        <textarea value={tip} onChange={(e) => onTip(e.target.value)} rows={2} className={inputClass} />
      </label>
      <div>
        <button type="button" onClick={onToggleAdvanced} className="text-sm font-semibold text-gold-ink hover:underline">
          {advancedOpen ? "▾" : "▸"} {T("journey.advanced.toggle")}
        </button>
        {advancedOpen && (
          <div className="mt-3">
            <span className="block text-xs text-muted">{T("journey.advanced.hint")}</span>
            <textarea value={extra} onChange={(e) => onExtra(e.target.value)} rows={6} dir="auto" className={`${inputClass} leading-loose`} />
            <InlineImageInserter onInsert={onInsertExtra} />
          </div>
        )}
      </div>
    </div>
  );
}

export function CatalogStation({
  collection, category, tags, date, onSet, errorFor,
}: {
  collection: CollectionConfig;
  category: string; tags: string[]; date: string;
  onSet: (key: string, v: unknown) => void;
  errorFor: (field: string) => string | undefined;
}) {
  const catField = collection.fields.find((f) => f.key === "category");
  const tagField = collection.fields.find((f) => f.key === "tags");
  const err = (f: string) => errorFor(f) && <p className="mt-2 text-sm font-semibold text-ink">{errorFor(f)}</p>;
  return (
    <div className="space-y-6">
      <div>
        <ChipSelect
          label={catField?.label ?? "קטגוריה"}
          options={catField?.options ?? []}
          value={category ? [category] : []}
          single
          allowCustom
          onChange={(next) => onSet("category", next[0] ?? "")}
          error={errorFor("category")}
        />
      </div>
      <div>
        <ChipSelect
          label={tagField?.label ?? "תגיות"}
          options={tagField?.options ?? []}
          value={tags}
          max={tagField?.max}
          allowCustom
          onChange={(next) => onSet("tags", next)}
          error={errorFor("tags")}
        />
      </div>
      <label className="block max-w-60">
        <span className="text-sm font-semibold text-ink">{fieldLabel(collection, "date")} <span className="text-gold-ink">*</span></span>
        <input type="date" value={date} onChange={(e) => onSet("date", e.target.value)} className={inputClass} />
        {err("date")}
      </label>
    </div>
  );
}
```

- [ ] **Step 3: SeoCard** — `src/components/admin/recipe/SeoCard.tsx`:

```tsx
"use client";
import { T } from "@/lib/cms/desk-strings";
import { site } from "@/lib/site";
import { inputClass } from "@/components/admin/recipe/stations";

// The "business card on Google" editor: description with a live counter and a
// search-result mock, plus the slug (editable on NEW docs only: a published URL
// never changes from the desk).
export function SeoCard({
  title, description, slug, isNew, slugPlaceholder, onDescription, onSlug, errorFor,
}: {
  title: string; description: string; slug: string; isNew: boolean; slugPlaceholder: string;
  onDescription: (v: string) => void;
  onSlug: (v: string) => void;
  errorFor: (field: string) => string | undefined;
}) {
  const n = description.trim().length;
  const ok = n >= 70 && n <= 160;
  const shownSlug = slug || slugPlaceholder;
  return (
    <div className="space-y-5">
      <div className="rounded-[10px] border border-line bg-bg2 p-5" dir="auto">
        <p className="text-xs text-muted">{T("journey.seo.preview")}</p>
        <p className="mt-2 truncate text-sm text-muted" dir="ltr">
          {site.url.replace(/^https?:\/\//, "")} › recipes › {shownSlug || "…"}
        </p>
        <p className="truncate font-serif text-lg font-bold text-gold-ink">{title || "…"}</p>
        <p className="line-clamp-2 text-sm leading-relaxed text-ink">{description || "…"}</p>
      </div>
      <label className="block">
        <span className="text-sm font-semibold text-ink">{T("journey.seo.count", { n })}</span>
        <textarea
          value={description}
          onChange={(e) => onDescription(e.target.value)}
          rows={3}
          className={`${inputClass} ${ok ? "" : "border-gold"}`}
        />
        {errorFor("description") && <p className="mt-2 text-sm font-semibold text-ink">{errorFor("description")}</p>}
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-ink">{T("editor.slugLabel")}</span>
        <span className="mt-1 block text-xs text-muted">{isNew ? T("editor.slugHint") : T("journey.slug.locked")}</span>
        {isNew ? (
          <input dir="ltr" value={slug} placeholder={slugPlaceholder} onChange={(e) => onSlug(e.target.value)} className={inputClass} />
        ) : (
          <p dir="ltr" className="mt-2 rounded-[4px] border border-line bg-bg2 px-4 py-3 text-muted">{slug}</p>
        )}
        {errorFor("slug") && <p className="mt-2 text-sm font-semibold text-ink">{errorFor("slug")}</p>}
      </label>
    </div>
  );
}
```

(Import path for `site`: `@/lib/site` exports `site` — used the same way in auth request route. If `site.url` is absent, fall back to the literal domain from `brand.config` — check at implementation time and use whichever the repo actually exports; do not invent a new config.)

- [ ] **Step 4: RecipeJourney** — `src/components/admin/recipe/RecipeJourney.tsx`. Full behavioral parity with DocEditor's chrome (back/delete/rescue/history/publish) around the stations. Structure:

```tsx
"use client";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { CollectionConfig } from "@/lib/cms/config";
import { DUR, EASE, cssDur, cssEase } from "@/lib/motion-tokens";
import { deleteDoc, fetchDoc, previewMarkdown, saveDoc, setDocVisibility, type ActionResult } from "@/lib/cms/actions";
import { AUTOSAVE_DEBOUNCE_MS, autosaveKey, isDirty, parseSnapshot, serializeSnapshot, shouldOfferRestore, type Loaded } from "@/lib/cms/autosave.mjs";
import { emptyRecipeBody, parseRecipeBody, serializeRecipeBody, type RecipeBodyModel } from "@/lib/cms/recipe-body.mjs";
import { stationStatus, missingStations, STATION_ORDER, type StationId } from "@/lib/cms/journey-status.mjs";
import { suggestSlug } from "@/lib/cms/transliterate.mjs";
import { ConfirmDelete } from "@/components/admin/ConfirmDelete";
import { HistoryPanel } from "@/components/admin/HistoryPanel";
import { PublishBar } from "@/components/admin/PublishBar";
import { JourneyRail } from "@/components/admin/recipe/JourneyRail";
import { SeoCard } from "@/components/admin/recipe/SeoCard";
import { Station, DishStation, StoryStation, IngredientsStation, StepsStation, ImageExtrasStation, CatalogStation } from "@/components/admin/recipe/stations";
import { T } from "@/lib/cms/desk-strings";

const FIELD_STATION: Record<string, StationId> = {
  title: "dish", prepTime: "dish", servings: "dish",
  body: "story",
  image: "image", imageAlt: "image",
  category: "catalog", tags: "catalog", date: "catalog",
  description: "publish", slug: "publish",
};

export function RecipeJourney({ collection, file, onDone }: { collection: CollectionConfig; file?: string; onDone: () => void }) {
  // ... state exactly per the "State model" block in the plan ...
}
```

Implementation requirements (each one is a concrete behavior; follow DocEditor's existing code for the mechanics):

1. Load/rescue/autosave/beforeunload effects mirrored from `DocEditor.tsx:80-145` with `body = serializeRecipeBody(model)` and canonical `loadedRef` (see State model above). Autosave snapshot stays `{values, body, slug, locale: "he"}` — restoring parses the body back into the model.
2. `values` is the FULL loaded frontmatter (minus `draft`/`slug` like DocEditor line 90); station setters write only their keys via `set(k, v)`.
3. New doc (`!file`): `values = { date: new Date().toISOString().slice(0, 10) }`, `model = emptyRecipeBody()`, `slug = ""`, `slugTouched = false`.
4. `slugPlaceholder = suggestSlug(String(values.title ?? ""))`; effective slug on submit: `slug.trim() || slugPlaceholder || \`recipe-${String(values.date ?? "")}\``. `onSlug` sets `slugTouched = true`.
5. `submit(draft)` mirrors DocEditor's, passing the effective slug and serialized body.
6. Preview effect mirrors DocEditor's (`previewMarkdown(body)` after 400ms) — shown in the publish station inside `prose-rtl` card, headed by a mock header (title + `category · prepTime · servings` meta line).
7. Scrollspy: a passive scroll listener (rAF-throttled) computes the active station: the LAST station section whose `getBoundingClientRect().top <= 140`; default first. `onJump(id)` → `document.getElementById(\`station-${id}\`)?.scrollIntoView({ behavior: "smooth", block: "start" })`.
8. Server errors: `errors = new Set((result?.ok === false ? result.errors : []).map((e) => FIELD_STATION[e.field]).filter(Boolean))`; rail shows `!` badges; general errors render above the stations like DocEditor.
9. Publish station content: `<SeoCard …/>` + preview card + missing-stations checklist (`missingStations(input)` → list of `T("journey.st." + id)` buttons that `onJump`) headed by `T("journey.missing.title")` (render only when list non-empty) + `<PublishBar …/>` + `<HistoryPanel …/>` (file mode only, same props as DocEditor).
10. Layout: `lg:grid lg:grid-cols-[220px_1fr] lg:gap-10`; rail in `<aside className="lg:sticky lg:top-24 lg:self-start">`, mobile rail sticky top under the shell header (`sticky top-0 z-10 -mx-6 bg-sand/95 px-6 py-2 backdrop-blur lg:static lg:m-0 lg:bg-transparent lg:p-0`); stations in `<div className="mt-6 space-y-6 lg:mt-0">` in `STATION_ORDER`, each wrapped in `<Station id index done>`.
11. Back/delete header row + ConfirmDelete + hideFromSite/deleteForever: copy DocEditor's verbatim (lines 188-234).
12. `ImageExtrasStation.onInsertExtra`: append `\n\n${markdown}` to `model.extra` and open the advanced box (`setAdvancedOpen(true)`).

- [ ] **Step 5: AdminShell routing** — in `src/components/admin/AdminShell.tsx`, import RecipeJourney and replace the edit branch:

```tsx
        ) : view.kind === "edit" && current ? (
          current.id === "recipes" ? (
            <RecipeJourney collection={current} file={view.file} onDone={() => setView({ kind: "list", collectionId: current.id })} />
          ) : (
            <DocEditor collection={current} file={view.file} onDone={() => setView({ kind: "list", collectionId: current.id })} />
          )
        ) : null}
```

- [ ] **Step 6: Verify** — `npx tsc --noEmit && pnpm lint && pnpm test` all clean; `pnpm build` compiles.
- [ ] **Step 7: Commit** — `studio: cms journey · RecipeJourney vertical slice (rail + 7 stations) wired for recipes`.

---

### Task 9: `SourceStation` — the new-recipe entry (paste / from scratch)

**Files:**
- Create: `src/components/admin/recipe/SourceStation.tsx`
- Modify: `src/components/admin/recipe/RecipeJourney.tsx`

**Interfaces:**
- Consumes: `parsePaste` (Task 4), strings (Task 6).
- Produces: `<SourceStation onApply(result: PasteResult) onScratch() />`.

- [ ] **Step 1: SourceStation** — `src/components/admin/recipe/SourceStation.tsx`:

```tsx
"use client";
import { useState } from "react";
import { parsePaste, type PasteResult } from "@/lib/cms/recipe-paste.mjs";
import { T } from "@/lib/cms/desk-strings";

// Station 0 — only for a NEW recipe: paste-the-whole-thing (heuristics sort it
// into the stations, summary shows what was recognized) or start from scratch.
export function SourceStation({ onApply, onScratch }: { onApply: (r: PasteResult) => void; onScratch: () => void }) {
  const [mode, setMode] = useState<"choice" | "paste">("choice");
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<PasteResult | null>(null);

  if (mode === "choice") {
    return (
      <section className="rounded-[10px] border border-line bg-card p-6 md:p-8">
        <h2 className="font-serif text-xl font-black text-ink">{T("journey.source.title")}</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <SourceCard title={T("journey.source.pasteCard")} hint={T("journey.source.pasteHint")} onClick={() => setMode("paste")} />
          <SourceCard title={T("journey.source.scratchCard")} hint={T("journey.source.scratchHint")} onClick={onScratch} />
        </div>
      </section>
    );
  }

  const summary = parsed
    ? [
        parsed.summary.hasTitle && T("journey.sum.title"),
        parsed.summary.hasIntro && T("journey.sum.intro"),
        parsed.summary.ingredients > 0 && T("journey.sum.ingredients", { n: parsed.summary.ingredients }),
        parsed.summary.steps > 0 && T("journey.sum.steps", { n: parsed.summary.steps }),
        parsed.summary.hasTip && T("journey.sum.tip"),
      ].filter(Boolean)
    : [];

  return (
    <section className="rounded-[10px] border border-line bg-card p-6 md:p-8">
      <h2 className="font-serif text-xl font-black text-ink">{T("journey.source.pasteCard")}</h2>
      <label className="mt-4 block">
        <span className="text-sm font-semibold text-ink">{T("journey.source.pasteLabel")}</span>
        <textarea
          value={text}
          onChange={(e) => { setText(e.target.value); setParsed(null); }}
          rows={12}
          className="mt-2 w-full rounded-[4px] border border-line bg-bg2 px-4 py-3 leading-loose text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        />
      </label>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {!parsed ? (
          <button
            type="button"
            disabled={!text.trim()}
            onClick={() => setParsed(parsePaste(text))}
            className="rounded-[4px] bg-ink px-6 py-3 font-bold text-bg transition-colors hover:opacity-90 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            {T("journey.source.parse")}
          </button>
        ) : (
          <>
            <p className="w-full text-sm font-semibold text-ink" role="status">
              {summary.length ? T("journey.source.parsed", { found: summary.join(" · ") }) : T("journey.sum.nothing")}
            </p>
            <button type="button" onClick={() => onApply(parsed)} className="rounded-[4px] bg-ink px-6 py-3 font-bold text-bg transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold">
              {T("journey.source.apply")}
            </button>
          </>
        )}
        <button type="button" onClick={() => { setMode("choice"); setParsed(null); }} className="text-sm font-semibold text-gold-ink hover:underline">
          {T("journey.source.back")}
        </button>
      </div>
    </section>
  );
}

function SourceCard({ title, hint, onClick }: { title: string; hint: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-[10px] border border-line bg-bg2 p-6 text-start transition-colors hover:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
    >
      <span className="block font-serif text-lg font-bold text-ink">{title}</span>
      <span className="mt-1 block text-sm leading-relaxed text-muted">{hint}</span>
    </button>
  );
}
```

- [ ] **Step 2: RecipeJourney integration** — new state `sourceDone: boolean` (init `Boolean(file)`; also set true when an autosave rescue is restored). While `!sourceDone`: render ONLY `<SourceStation …/>` (with the back/delete header hidden — nothing exists yet). Handlers:

```tsx
const applyPaste = (r: PasteResult) => {
  setValues((p) => ({ ...p, ...(r.title ? { title: r.title } : {}) }));
  setModel((m) => ({ ...m, intro: r.intro, ingredients: r.ingredients, steps: r.steps, tip: r.tip }));
  setSourceDone(true);
};
const startScratch = () => setSourceDone(true);
```

After `sourceDone`, the journey renders as in Task 8 (rail + stations), scrolled to top.

- [ ] **Step 3: Verify** — `npx tsc --noEmit && pnpm lint && pnpm build` clean.
- [ ] **Step 4: Commit** — `studio: cms journey · SourceStation paste/scratch entry for new recipes`.

---

### Task 10: Library completeness badge — `hasImage`

**Files:**
- Modify: `src/lib/cms/read.ts` (AdminDoc + toDoc)
- Modify: `src/components/admin/CollectionList.tsx`

**Interfaces:**
- Produces: `AdminDoc.hasImage: boolean`.

- [ ] **Step 1: read.ts** — add `hasImage: boolean;` to `AdminDoc`; in `toDoc` return, add:

```ts
    hasImage: typeof data.image === "string" && data.image.trim() !== "",
```

- [ ] **Step 2: CollectionList** — after the draft badge span, add (a collection that has no image field never shows it):

```tsx
                {collection.fields.some((f) => f.type === "image") && !d.hasImage && (
                  <span className="rounded-full border border-line bg-bg2 px-3 py-1 text-xs font-bold text-muted">{T("list.noImage")}</span>
                )}
```

- [ ] **Step 3: Verify** — `npx tsc --noEmit && pnpm lint` clean.
- [ ] **Step 4: Commit** — `studio: cms journey · library shows which recipes still lack a photo`.

---

### Task 11: Final gates + live end-to-end (integration pass)

Performed by the orchestrator (needs the live browser + dev login). Recorded here so the checklist is complete:

- [ ] `pnpm test` · `node scripts/check-recipe-roundtrip.mjs` · `pnpm lint` · `npx tsc --noEmit` · `pnpm build` — all green.
- [ ] `node scripts/copy-banlist.mjs` and `node scripts/lint-admin.mjs` (repo gates) — run; no new violations.
- [ ] Dev E2E: `PORT=3013 pnpm dev`; POST `/api/cms/auth/request` with the email from `CMS_ALLOWED_EMAILS` in `.env.local`; open the login link printed in the dev console; on `/admin`: (a) open an EXISTING recipe → all stations populated, chips selected, no dirty state on open; (b) edit an ingredient, reorder, watch preview; (c) new recipe → paste the WhatsApp fixture → stations fill, slug auto-suggests, publish with a missing image → error maps to the image station; (d) mobile 375px: chip rail sticky, stations usable. NOTE: local dev has no GitHub token, so a fully-valid publish ends with the generic publish-failed message at the COMMIT stage (validation passed) — that is the expected dev-mode outcome; the commit path itself is DocEditor's, unchanged.
- [ ] Final commit of any fixes.

---

## Self-Review (done at plan time)

- **Spec coverage:** stations 0-7 (Tasks 8-9), paste parser (4), hybrid advanced escape (8/ImageExtras), chips (6), same-files round-trip (2-3), rail + jump + missing-list (8), SEO card + slug rules (8/SeoCard), no-image badge (10), blog untouched, autosave/history/delete preserved (8). Slug read-only on existing docs per spec amendment. ✓
- **Placeholder scan:** none — every step carries real code or an exact command. The two "mirror DocEditor lines X-Y" references point at code that exists in the repo today (verified line numbers), which the implementer must read — that is the DRY choice, not a placeholder. ✓
- **Type consistency:** `RecipeBodyModel`/`PasteResult`/`StationId`/`JourneyInput` names match across Tasks 2/4/5/8/9; `ChipSelect` props match Task 6 ↔ 8 usage; `AdminDoc.hasImage` matches 10. `.mjs` imports from TSX follow the existing `autosave.mjs` pattern (allowed by the repo's module resolution). ✓
