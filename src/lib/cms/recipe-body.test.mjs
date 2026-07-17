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
