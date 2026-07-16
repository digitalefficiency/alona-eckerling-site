import { NONCE_COOKIE, SESSION_COOKIE, sessionCookieOptions } from "@/lib/cms/session";

// POST /api/cms/auth/logout — clears the session cookie. POST-only so a stray
// <img src="/api/cms/auth/logout"> (or a link prefetch) cannot log the client out.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  const secure = sessionCookieOptions.secure ? "; Secure" : "";
  const headers = new Headers({ Location: "/admin", "Cache-Control": "no-store" });
  for (const name of [SESSION_COOKIE, NONCE_COOKIE]) {
    headers.append("Set-Cookie", `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`);
  }
  return new Response(null, { status: 303, headers });
}
