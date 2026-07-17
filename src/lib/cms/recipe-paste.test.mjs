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
