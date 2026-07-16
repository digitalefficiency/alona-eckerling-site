import type { NextRequest } from "next/server";
import {
  NONCE_COOKIE,
  allowedEmails,
  createMagicToken,
  isAllowed,
  newNonce,
  nonceCookieOptions,
  safeNext,
} from "@/lib/cms/session";
import { site, i18n } from "@/lib/site";
import { t } from "@/lib/cms/strings.mjs";

// The email language + its <div dir> come from site i18n (a bidi choice): an en/ltr
// site sends an English, ltr, Hebrew-free login email.
const LOCALE = i18n.defaultLocale as string;
const DIR = (i18n.dir as Record<string, string>)[LOCALE] ?? "rtl";

// POST /api/cms/auth/request — "send me a login link".
//
// Two abuse controls, both mandatory:
//  • Resend is called ONLY for an allowlisted address. A non-allowlisted address
//    gets the identical 200 (no account enumeration) and costs zero email — so this
//    endpoint can never become a spam cannon that burns the studio's sending domain.
//  • A per-address cooldown, carried in the signed nonce cookie, blunts a refresh
//    loop. (Serverless instances don't share memory, so a global counter would be
//    theatre; the real ceiling is "allowlisted addresses only" above.)
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const COOLDOWN_MS = 60_000;

export async function POST(request: NextRequest) {
  let email = "";
  let next = "/admin";
  try {
    const body = (await request.json()) as { email?: string; next?: string };
    email = String(body.email ?? "").trim().toLowerCase();
    next = safeNext(body.next);
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }

  // Identical response either way — never reveal who is allowed.
  const generic = Response.json({ ok: true, sent: true });

  if (!email || !isAllowed(email)) return generic;
  if (!allowedEmails().length) return generic;

  const last = Number(request.cookies.get("cms_last_send")?.value ?? 0);
  if (Date.now() - last < COOLDOWN_MS) return generic;

  const nonce = newNonce();
  const token = createMagicToken(email, nonce);
  const origin = request.nextUrl.origin;
  const link = `${origin}/api/cms/auth/callback?token=${encodeURIComponent(token)}&next=${encodeURIComponent(next)}`;

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CMS_FROM_EMAIL;
  if (apiKey && from) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from,
          to: [email],
          subject: t(LOCALE, "auth.emailSubject", { name: site.name }),
          html:
            `<div dir="${DIR}" style="font-family:system-ui,sans-serif;line-height:1.7">` +
            `<p>${t(LOCALE, "auth.emailIntro", { name: site.name })}</p>` +
            `<p><a href="${link}" style="background:#0A1E3F;color:#fff;padding:12px 22px;border-radius:4px;text-decoration:none;display:inline-block">${t(LOCALE, "auth.emailButton")}</a></p>` +
            `<p style="color:#666;font-size:14px">${t(LOCALE, "auth.emailFootnote")}</p>` +
            `</div>`,
        }),
      });
    } catch {
      // Never leak delivery state to the caller (enumeration) — the client sees
      // "check your inbox" either way; a real failure surfaces in the server logs.
      console.error("[cms:auth] resend delivery failed");
    }
  } else {
    console.info("[cms:auth] RESEND_API_KEY/CMS_FROM_EMAIL not set — login link:", link);
  }

  const res = Response.json({ ok: true, sent: true });
  const headers = new Headers(res.headers);
  const cookie = (n: string, v: string, maxAge: number) =>
    `${n}=${v}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${nonceCookieOptions.secure ? "; Secure" : ""}`;
  headers.append("Set-Cookie", cookie(NONCE_COOKIE, nonce, nonceCookieOptions.maxAge));
  headers.append("Set-Cookie", cookie("cms_last_send", String(Date.now()), COOLDOWN_MS / 1000));
  headers.set("Referrer-Policy", "no-referrer");
  return new Response(res.body, { status: 200, headers });
}
