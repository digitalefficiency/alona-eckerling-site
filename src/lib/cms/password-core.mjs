// password-core.mjs — hashing and verification for the desk's password login.
//
// WHY A PASSWORD AT ALL: the magic-link flow depends on email delivery, and an
// editor locked out because a mail key expired is an editor whose site says
// "sent" while nothing arrives. A password is the path that depends on nothing
// but this server. The magic link stays as the second door.
//
// WHAT IS STORED: never the password. `CMS_PASSWORD_HASH` in the environment
// holds `scrypt:N:r:p:saltB64:hashB64`. scrypt (memory-hard, in node:crypto,
// zero new dependencies) rather than a bare HMAC, because a leaked env file
// should not hand an offline attacker a cheap brute force.
//
// The separator is `:` and MUST NOT become `$`: Next.js runs dotenv-expand
// over .env files, so `$16384` in a value is read as a variable reference and
// silently deleted — measured here, an 87-char hash arrived as 55 mangled
// chars and every correct password failed. `:` never appears in base64 and
// expands nowhere (dotenv, pm2 env files, shells).
//
// Pure ESM, same discipline as session-core.mjs: the tests exercise the real
// functions, not a mock of them.

import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LEN = 32;

/** Produce the value to store in CMS_PASSWORD_HASH. */
export function hashPassword(password) {
  if (typeof password !== "string" || password.length < 8) {
    throw new Error("password must be at least 8 characters");
  }
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, KEY_LEN, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P });
  return ["scrypt", SCRYPT_N, SCRYPT_R, SCRYPT_P, salt.toString("base64"), hash.toString("base64")].join(":");
}

/**
 * Constant-time verification. Returns false for ANY malformed input rather
 * than throwing: a login endpoint must not turn a corrupted env var into a
 * 500 that reveals which half of the credentials was wrong.
 */
export function verifyPassword(password, stored) {
  try {
    if (typeof password !== "string" || typeof stored !== "string") return false;
    const [scheme, n, r, p, saltB64, hashB64] = stored.split(":");
    if (scheme !== "scrypt") return false;
    const salt = Buffer.from(saltB64, "base64");
    const expected = Buffer.from(hashB64, "base64");
    if (salt.length < 8 || expected.length < 16) return false;
    const actual = scryptSync(password, salt, expected.length, {
      N: Number(n),
      r: Number(r),
      p: Number(p),
    });
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

// ── attempt limiting ────────────────────────────────────────────────────────
// In-memory on purpose. The production topology is ONE Node process (pm2 fork
// mode, decided when the PM2-cluster revalidation bug was found), so a map here
// is complete; on a platform that scales instances it degrades to per-instance
// limiting, which still caps the rate an attacker gets from any one address.

const attempts = new Map(); // ip → { count, first }
const WINDOW_MS = 10 * 60 * 1000;
const MAX_FAILURES = 8;

export function tooManyFailures(ip, now = Date.now()) {
  const rec = attempts.get(ip);
  if (!rec) return false;
  if (now - rec.first > WINDOW_MS) {
    attempts.delete(ip);
    return false;
  }
  return rec.count >= MAX_FAILURES;
}

export function recordFailure(ip, now = Date.now()) {
  const rec = attempts.get(ip);
  if (!rec || now - rec.first > WINDOW_MS) {
    attempts.set(ip, { count: 1, first: now });
  } else {
    rec.count += 1;
  }
  // an unbounded map is a slow leak; the window makes old entries meaningless
  if (attempts.size > 10000) {
    for (const [k, v] of attempts) if (now - v.first > WINDOW_MS) attempts.delete(k);
  }
}

export function clearFailures(ip) {
  attempts.delete(ip);
}
