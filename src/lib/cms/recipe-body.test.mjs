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

// --- Task 3 corpus hardenings (each reproduces a real content/recipes case) ---

test("ingredient sub-labels and parentheticals round-trip verbatim (no bullet added)", () => {
  // from sweet-and-sour-tofu.md / broccoli-onion-quiche.md
  const src = "## רכיבים\n\n**לטופו:**\n\n- 300 גרם טופו\n- 2 כפות קורנפלור\n\n(תבנית פאי 20 ס\"מ)";
  const m = parseRecipeBody(src);
  assert.deepEqual(m.ingredients, ["**לטופו:**", "300 גרם טופו", "2 כפות קורנפלור", "(תבנית פאי 20 ס\"מ)"]);
  const out = serializeRecipeBody(m);
  assert.ok(out.includes("\n**לטופו:**\n"), "bold sub-label keeps no bullet");
  assert.ok(out.includes("\n- 300 גרם טופו\n"), "real item keeps its bullet");
  assert.ok(out.endsWith('(תבנית פאי 20 ס"מ)'), "parenthetical note keeps no bullet");
  assert.equal(serializeRecipeBody(parseRecipeBody(out)), out, "fixpoint");
});

test("trailing serving-suggestion note in ingredients stays verbatim", () => {
  // from tofu-honey-mustard.md / sweet-and-sour-tofu.md
  const src = "## רכיבים\n\n- מעט מלח ופלפל\n\nמומלץ להגיש על אורז ולהוסיף שומשום ובצל ירוק!";
  const m = parseRecipeBody(src);
  assert.deepEqual(m.ingredients, ["מעט מלח ופלפל", "מומלץ להגיש על אורז ולהוסיף שומשום ובצל ירוק!"]);
  const out = serializeRecipeBody(m);
  assert.ok(out.includes("\n- מעט מלח ופלפל\n"));
  assert.ok(out.includes("\nמומלץ להגיש על אורז ולהוסיף שומשום ובצל ירוק!"), "note keeps no bullet");
  assert.ok(!out.includes("- מומלץ"), "the serving note is never bulleted");
  assert.equal(serializeRecipeBody(parseRecipeBody(out)), out, "fixpoint");
});

test("### nutrition heading passes through extra with its level preserved", () => {
  // from baked-tuna-patties.md
  const src = "## אופן הכנה\n\n1. מחממים תנור.\n\n### ערכים תזונתיים עבור קציצה מתוך 13:\n\n55 קלוריות למנה.";
  const m = parseRecipeBody(src);
  assert.deepEqual(m.steps, ["מחממים תנור."]);
  assert.equal(m.extra, "### ערכים תזונתיים עבור קציצה מתוך 13:\n\n55 קלוריות למנה.");
  const out = serializeRecipeBody(m);
  assert.ok(out.includes("### ערכים תזונתיים עבור קציצה מתוך 13:"), "keeps ### level, not ##");
  assert.equal(serializeRecipeBody(parseRecipeBody(out)), out, "fixpoint");
});

test("content after the last numbered step is a trailing block, not renumbered steps", () => {
  // from date-energy-bars.md (nutrition list with no heading after the steps)
  const src = "## אופן הכנה\n\n1. שלב ראשון.\n2. שלב שני.\n\nערכים תזונתיים לחטיף מתוך 16:\n\n- קלוריות 112\n- חלבון 2.5";
  const m = parseRecipeBody(src);
  assert.deepEqual(m.steps, ["שלב ראשון.", "שלב שני."]);
  assert.equal(m.extra, "ערכים תזונתיים לחטיף מתוך 16:\n\n- קלוריות 112\n- חלבון 2.5");
  const out = serializeRecipeBody(m);
  assert.ok(out.includes("1. שלב ראשון."));
  assert.ok(out.includes("2. שלב שני."));
  assert.ok(!/3\.\s/.test(out), "the nutrition lines are never renumbered as step 3+");
  assert.equal(serializeRecipeBody(parseRecipeBody(out)), out, "fixpoint");
});
