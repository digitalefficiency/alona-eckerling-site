// session.ts — the cookie half of the CMS auth. All token logic lives in
// src/lib/cms/session-core.mjs (plain ESM, so the studio's regression harness
// exercises the real signing/verification code); this file only adds the cookie
// options the Next surfaces need. Re-exports keep one import site for callers.
export {
  NONCE_COOKIE,
  SESSION_COOKIE,
  SESSION_TTL_MS,
  MAGIC_TTL_MS,
  allowedEmails,
  createMagicToken,
  createSessionToken,
  isAllowed,
  newNonce,
  safeNext,
  verifyMagicToken,
  verifySessionToken,
} from "@/lib/cms/session-core.mjs";

import { MAGIC_TTL_MS, SESSION_TTL_MS } from "@/lib/cms/session-core.mjs";

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  // Lax: the magic-link redemption is a top-level navigation; server actions are
  // same-origin POSTs (Next verifies Origin against Host), so Lax is not a CSRF hole.
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_TTL_MS / 1000,
};

export const nonceCookieOptions = { ...sessionCookieOptions, maxAge: MAGIC_TTL_MS / 1000 };
