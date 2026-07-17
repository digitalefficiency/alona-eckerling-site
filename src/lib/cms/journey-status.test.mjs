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
