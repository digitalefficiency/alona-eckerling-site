// recipe-migrate.test.mjs — every case here is a REAL line from
// content/recipes/. The corpus is 34 files and it is finite, so the test can be
// exhaustive about shapes rather than representative.
import test from "node:test";
import assert from "node:assert/strict";
import {
  classifyIngredientLine,
  classifyIngredients,
  serializeIngredients,
  parsePrepMinutes,
  rawIngredientSection,
} from "./recipe-migrate.mjs";

// ── items ───────────────────────────────────────────────────────────────────

test("a bulleted line is an item, and the glyph is stripped", () => {
  for (const glyph of ["-", "*", "•", "▪", "◦"]) {
    assert.deepEqual(classifyIngredientLine(`${glyph} 1 כוס קמח`), [
      { kind: "item", text: "1 כוס קמח" },
    ]);
  }
});

test("a bullet with no text after it produces nothing rather than an empty item", () => {
  assert.deepEqual(classifyIngredientLine("-   "), []);
  assert.deepEqual(classifyIngredientLine(""), []);
});

// ── sub-labels ──────────────────────────────────────────────────────────────

test("a bold sub-label keeps its colon and loses its asterisks", () => {
  assert.deepEqual(classifyIngredientLine("**לרוטב:**"), [
    { kind: "sublabel", text: "לרוטב:" },
  ]);
});

test("a sub-label whose colon is not the last character still classifies", () => {
  // soba-noodle-salad.md — the parenthetical sits inside the bold
  assert.deepEqual(classifyIngredientLine("**שקדים מקורמלים: (לא לוותר)**"), [
    { kind: "sublabel", text: "שקדים מקורמלים: (לא לוותר)" },
  ]);
});

test("a long sentence sub-label classifies as a sub-label, not a note", () => {
  // tofu-shawarma.md
  assert.deepEqual(classifyIngredientLine("**או לחילופין הכנת תיבול שווארמה ביתי:**"), [
    { kind: "sublabel", text: "או לחילופין הכנת תיבול שווארמה ביתי:" },
  ]);
});

// ── the one split case ──────────────────────────────────────────────────────

test("a sub-label carrying ingredients on the same line splits into two entries", () => {
  // green-curry-stir-fry.md — the ONLY line in the corpus with this shape.
  // Today's JSON-LD filter (/^\s*[-*]\s+/) drops it entirely, so this split
  // ADDS one ingredient to the structured data. Intended.
  assert.deepEqual(
    classifyIngredientLine("**להגשה:** בצל ירוק, כוסברה, בוטנים גרוסים"),
    [
      { kind: "sublabel", text: "להגשה:" },
      { kind: "item", text: "בצל ירוק, כוסברה, בוטנים גרוסים", split: true },
    ],
  );
});

test("the split rule wins over the note-opener rule for «להגשה»", () => {
  // «להגשה» is in NOTE_OPENER. A bare «להגשה: ...» is a note; a bold
  // «**להגשה:** ...» is a labelled group of ingredients. Order matters.
  const [first] = classifyIngredientLine("להגשה: לפזר שומשום");
  assert.equal(first.kind, "note");
});

// ── notes ───────────────────────────────────────────────────────────────────

test("a fully parenthesised line is a note, kept verbatim", () => {
  for (const line of [
    "(עבור 12 בורקיטסים)",
    "(4-5 מנות)",
    "(תבנית פאי 20 ס\"מ)",
    "(מומלץ להכפיל כמות אם רוצים כמות גדולה)",
  ]) {
    assert.deepEqual(classifyIngredientLine(line), [{ kind: "note", text: line }]);
  }
});

test("a serving suggestion is a note, kept verbatim", () => {
  const line = "מומלץ להגיש על אורז ולהוסיף שומשום ובצל ירוק!";
  assert.deepEqual(classifyIngredientLine(line), [{ kind: "note", text: line }]);
});

test("an unrecognised shape becomes a note AND is flagged for review", () => {
  const [entry] = classifyIngredientLine("משהו שאף אחד לא צפה");
  assert.equal(entry.kind, "note");
  assert.equal(entry.needsReview, true);
});

// ── round trip ──────────────────────────────────────────────────────────────

test("classify then serialize reproduces the source lines", () => {
  const source = [
    "(4-5 מנות)",
    "- 2 כוסות בורגול",
    "- 1 ברוקולי",
    "**לרוטב:**",
    "- 3 כפות טחינה",
    "מומלץ להגיש קר",
  ];
  const round = serializeIngredients(classifyIngredients(source));
  assert.equal(round, source.join("\n"));
});

test("only the split line differs on round trip, and it differs predictably", () => {
  const source = ["**להגשה:** בצל ירוק, כוסברה"];
  const round = serializeIngredients(classifyIngredients(source));
  assert.equal(round, "**להגשה:**\n- בצל ירוק, כוסברה");
});

test("bullet glyphs other than dash normalise to dash on serialize", () => {
  // A deliberate, harmless normalisation: the model stores text, not glyphs.
  assert.equal(serializeIngredients(classifyIngredients(["• 1 בצל"])), "- 1 בצל");
});

// ── prep time ───────────────────────────────────────────────────────────────

test("the four numeric shapes in the corpus parse", () => {
  assert.equal(parsePrepMinutes("10 דקות"), 10);
  assert.equal(parsePrepMinutes("20 דקות"), 20);
  assert.equal(parsePrepMinutes("35 דקות"), 35);
  assert.equal(parsePrepMinutes("2 דקות"), 2);
});

test("«לא צוין» is null, never zero", () => {
  // PT0M fails Google's Recipe validator and can drop the rich result for the
  // whole archive, so 0 must be unreachable.
  assert.equal(parsePrepMinutes("לא צוין"), null);
  assert.equal(parsePrepMinutes(""), null);
  assert.equal(parsePrepMinutes(null), null);
  assert.equal(parsePrepMinutes(undefined), null);
});

test("hours and combinations parse, for values she may type later", () => {
  assert.equal(parsePrepMinutes("שעה"), 60);
  assert.equal(parsePrepMinutes("שעה וחצי"), 90);
  assert.equal(parsePrepMinutes("שעתיים"), 120);
  assert.equal(parsePrepMinutes("3 שעות"), 180);
  assert.equal(parsePrepMinutes("שעה ו-20 דקות"), 80);
});

test("a range takes the upper bound", () => {
  // Never promise the faster number to someone planning dinner.
  assert.equal(parsePrepMinutes("40-50 דקות"), 50);
  assert.equal(parsePrepMinutes("40 – 50 דקות"), 50);
});

test("free text that carries no duration is null", () => {
  assert.equal(parsePrepMinutes("תלוי בתנור"), null);
  assert.equal(parsePrepMinutes("מהיר"), null);
});

// ── section extraction ──────────────────────────────────────────────────────

test("the raw ingredients section keeps its bullets and stops at the next heading", () => {
  const md = [
    "פתיח.",
    "",
    "## רכיבים",
    "",
    "- 1 בצל",
    "**לרוטב:**",
    "- 2 כפות",
    "",
    "## אופן הכנה",
    "",
    "1. לחתוך",
  ].join("\n");
  assert.deepEqual(
    rawIngredientSection(md).filter(Boolean),
    ["- 1 בצל", "**לרוטב:**", "- 2 כפות"],
  );
});

test("a deeper heading also closes the section", () => {
  const md = ["## רכיבים", "- 1 בצל", "### ערכים תזונתיים", "חלבון- 5 גרם"].join("\n");
  assert.deepEqual(rawIngredientSection(md).filter(Boolean), ["- 1 בצל"]);
});

test("only the first ingredients section is taken", () => {
  // Mirrors parseRecipeBody's `!model.ingredients.length` guard; without it a
  // second section would silently append to the first.
  const md = ["## רכיבים", "- א", "## אופן הכנה", "1. כן", "## מצרכים", "- ב"].join("\n");
  assert.deepEqual(rawIngredientSection(md).filter(Boolean), ["- א"]);
});

test("a file with no ingredients section yields nothing rather than throwing", () => {
  assert.deepEqual(rawIngredientSection("סתם טקסט").filter(Boolean), []);
  assert.deepEqual(rawIngredientSection("").filter(Boolean), []);
});
