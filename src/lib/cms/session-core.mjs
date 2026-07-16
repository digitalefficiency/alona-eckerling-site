// session-core.mjs — the token half of the CMS auth, as plain ESM so the
// regression harness exercises the REAL signing/verification code.
//
// Two token kinds, deliberately not interchangeable (the `purpose` claim):
//   magic   — 10 min, travels in a URL, bound to the nonce cookie of the browser
//             that requested it. A forwarded link, or a corporate mail scanner
//             that GETs every URL, cannot redeem it.
//   session — 7 days, httpOnly cookie. Break-glass revocation = rotate the secret.
//
// Accepted residual (no datastore → no jti): a magic token is replayable for its
// 10 minutes, from the same browser. Mitigations: short TTL + allowlist + browser
// binding. A KV store is the upgrade path. Documented in references/cms.md.
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "cms_session";
export const NONCE_COOKIE = "cms_nonce";
export const MAGIC_TTL_MS = 10 * 60 * 1000;
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const b64url = (b) => Buffer.from(b).toString("base64url");

export function secret(env = process.env) {
  const s = env.CMS_SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("CMS_SESSION_SECRET missing or shorter than 32 chars");
  return s;
}

// The allowlist lives in ENV, never in the repo: the CMS writes content files, so
// an in-repo allowlist would be self-editable (escalation / self-lockout) and would
// commit client PII to git history forever.
export function allowedEmails(env = process.env) {
  return String(env.CMS_ALLOWED_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export const isAllowed = (email, env = process.env) =>
  allowedEmails(env).includes(String(email ?? "").trim().toLowerCase());

export const newNonce = () => b64url(randomBytes(18));

function sign(payload, env) {
  const body = b64url(Buffer.from(JSON.stringify(payload), "utf8"));
  return `${body}.${b64url(createHmac("sha256", secret(env)).update(body).digest())}`;
}

function verify(token, purpose, env) {
  const [body, mac] = String(token ?? "").split(".");
  if (!body || !mac) return null;
  const expected = b64url(createHmac("sha256", secret(env)).update(body).digest());
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  let p;
  try {
    p = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (p.purpose !== purpose) return null; // a URL-visible magic token can never be replayed as a session
  if (typeof p.exp !== "number" || Date.now() > p.exp) return null;
  if (!p.email || !isAllowed(p.email, env)) return null; // removal from the allowlist revokes access at once
  return p;
}

export const createMagicToken = (email, nonce, env = process.env) =>
  sign({ email: String(email).trim().toLowerCase(), purpose: "magic", exp: Date.now() + MAGIC_TTL_MS, nonce }, env);

// Valid ONLY together with the nonce cookie of the browser that asked for the link.
export function verifyMagicToken(token, cookieNonce, env = process.env) {
  const p = verify(token, "magic", env);
  if (!p || !cookieNonce || p.nonce !== cookieNonce) return null;
  return p.email;
}

export const createSessionToken = (email, env = process.env) =>
  sign({ email, purpose: "session", exp: Date.now() + SESSION_TTL_MS, nonce: "" }, env);

export const verifySessionToken = (token, env = process.env) =>
  (token ? verify(token, "session", env)?.email : null) ?? null;

// An unvalidated post-login `next` is an open redirect (phish the client off their
// own domain). Only same-origin /admin paths are honored.
export function safeNext(next) {
  if (!next || typeof next !== "string" || !next.startsWith("/admin")) return "/admin";
  if (next.startsWith("//") || next.includes("\\") || next.includes("://")) return "/admin";
  return next;
}
