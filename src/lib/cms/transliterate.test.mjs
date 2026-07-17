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
