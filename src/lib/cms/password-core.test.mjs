// password-core.test.mjs — the pure half of the password door.
import test from "node:test";
import assert from "node:assert/strict";
import {
  hashPassword,
  verifyPassword,
  tooManyFailures,
  recordFailure,
  clearFailures,
} from "./password-core.mjs";

test("a password verifies against its own hash", () => {
  const h = hashPassword("סיסמה-ארוכה-מספיק");
  assert.equal(verifyPassword("סיסמה-ארוכה-מספיק", h), true);
});

test("the wrong password does not verify", () => {
  const h = hashPassword("הסיסמה הנכונה");
  assert.equal(verifyPassword("הסיסמה הלא נכונה", h), false);
});

test("two hashes of the same password differ (salt), and both verify", () => {
  const a = hashPassword("אותה סיסמה בדיוק");
  const b = hashPassword("אותה סיסמה בדיוק");
  assert.notEqual(a, b);
  assert.equal(verifyPassword("אותה סיסמה בדיוק", a), true);
  assert.equal(verifyPassword("אותה סיסמה בדיוק", b), true);
});

test("malformed stored values return false, never throw", () => {
  // a login endpoint must not turn a corrupted env var into a 500
  for (const bad of ["", "not-a-hash", "scrypt:x:y:z:!!:!!", "bcrypt:whatever", null, undefined, 42]) {
    assert.equal(verifyPassword("anything", bad), false);
  }
});

test("a tampered hash fails", () => {
  const h = hashPassword("סיסמה-ארוכה-מספיק");
  const parts = h.split(":");
  parts[5] = Buffer.from(Buffer.from(parts[5], "base64").map((b) => b ^ 1)).toString("base64");
  assert.equal(verifyPassword("סיסמה-ארוכה-מספיק", parts.join(":")), false);
});

test("the stored format contains no $ (dotenv-expand would eat it)", () => {
  // Next.js expands $VAR inside .env values; a hash with $ segments arrives
  // at the server mangled and every correct password fails. Pin the format.
  const h = hashPassword("סיסמה-ארוכה-מספיק");
  assert.equal(h.includes("$"), false);
});

test("short passwords are refused at hashing time", () => {
  assert.throws(() => hashPassword("קצר"));
});

test("the limiter opens after the window and closes after repeated failures", () => {
  const ip = "203.0.113.7";
  clearFailures(ip);
  const t0 = 1_000_000;
  assert.equal(tooManyFailures(ip, t0), false);
  for (let i = 0; i < 8; i++) recordFailure(ip, t0 + i);
  assert.equal(tooManyFailures(ip, t0 + 10), true);
  // the window expires and the door opens again
  assert.equal(tooManyFailures(ip, t0 + 11 * 60 * 1000), false);
  clearFailures(ip);
});
