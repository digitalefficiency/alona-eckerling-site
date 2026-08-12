import { NextRequest } from "next/server";
import {
  SESSION_COOKIE,
  createSessionToken,
  isAllowed,
  sessionCookieOptions,
} from "@/lib/cms/session";
import { verifyPassword, tooManyFailures, recordFailure, clearFailures } from "@/lib/cms/password-core.mjs";

// POST /api/cms/auth/password — the password door into the desk.
//
// It answers ONE generic failure for every wrong thing: unknown email, wrong
// password, missing configuration. The magic-link route never reveals which
// addresses are allowed, and this door holds the same line — a login form that
// says "the password was wrong" has already confirmed the email was right.
//
// The session it mints is the SAME cms_session cookie the magic link mints.
// One session layer, two doors; when Supabase Auth arrives it becomes a third
// verification step behind the same cookie, not a parallel world.

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const generic = () => Response.json({ ok: false }, { status: 401 });

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";

  // The limiter answers BEFORE any verification work, so a flood costs us a
  // map lookup rather than a scrypt derivation per attempt.
  if (tooManyFailures(ip)) {
    return Response.json({ ok: false, slow: true }, { status: 429 });
  }

  let email = "";
  let password = "";
  try {
    const body = await request.json();
    email = String(body.email ?? "").trim().toLowerCase();
    password = String(body.password ?? "");
  } catch {
    return generic();
  }

  const stored = process.env.CMS_PASSWORD_HASH ?? "";

  // Both checks always run, in the same order, whatever failed — the response
  // time must not say which half was wrong.
  const emailOk = isAllowed(email);
  const passwordOk = verifyPassword(password, stored);

  if (!emailOk || !passwordOk) {
    recordFailure(ip);
    return generic();
  }

  clearFailures(ip);
  const token = createSessionToken(email);
  const o = sessionCookieOptions;
  const headers = new Headers({ "Content-Type": "application/json" });
  headers.append(
    "Set-Cookie",
    `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${o.maxAge}${o.secure ? "; Secure" : ""}`,
  );
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
}
