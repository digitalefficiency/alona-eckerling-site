import type { NextRequest } from "next/server";
import {
  NONCE_COOKIE,
  SESSION_COOKIE,
  createSessionToken,
  safeNext,
  sessionCookieOptions,
  verifyMagicToken,
} from "@/lib/cms/session";
import { site, i18n } from "@/lib/site";
import { t } from "@/lib/cms/strings.mjs";

// The desk language + its <html> lang/dir come from site i18n (a bidi choice, not a
// hardcoded RTL): an en/ltr site renders this confirm page in English, ltr, no Hebrew.
const LOCALE = i18n.defaultLocale as string;
const DIR = (i18n.dir as Record<string, string>)[LOCALE] ?? "rtl";
const HTML_LANG = (i18n.htmlLang as Record<string, string>)[LOCALE] ?? LOCALE;

// The magic-link landing.
//
// GET  — renders a confirm page. It does NOT consume the token. This is deliberate:
//        corporate mail scanners (Safe Links, Proofpoint, Barracuda) GET every URL
//        in an inbound email, so a GET-consumes link is dead before the human clicks.
// POST — consumes the token: it must be signed, unexpired, allowlisted, AND carry the
//        nonce of the browser that requested it. A forwarded or intercepted link has
//        no matching cookie and cannot be redeemed.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const HEADERS = {
  "Content-Type": "text/html; charset=utf-8",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow",
  "Cache-Control": "no-store",
};

function page(body: string): Response {
  return new Response(
    `<!doctype html><html lang="${esc(HTML_LANG)}" dir="${esc(DIR)}"><head><meta charset="utf-8">` +
      `<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">` +
      `<title>${esc(t(LOCALE, "auth.confirmTitle", { name: site.name }))}</title>` +
      `<style>body{font-family:system-ui,-apple-system,"Segoe UI",sans-serif;background:#F7F5F0;color:#17382C;` +
      `display:grid;place-items:center;min-height:100vh;margin:0}main{background:#fff;border:1px solid #E5E0D6;` +
      `border-radius:10px;padding:40px;max-width:420px;text-align:center}h1{font-size:1.4rem;margin:0 0 10px}` +
      `p{color:#5B6472;line-height:1.7;margin:0 0 24px}button{background:#17382C;color:#fff;border:0;` +
      `border-radius:4px;padding:14px 28px;font-size:1rem;font-weight:700;cursor:pointer}` +
      `a{color:#8A6D2F}</style></head><body><main>${body}</main></body></html>`,
    { status: 200, headers: HEADERS },
  );
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? "";
  const next = safeNext(request.nextUrl.searchParams.get("next"));
  if (!token) return page(`<h1>${t(LOCALE, "auth.invalidTitle")}</h1><p>${t(LOCALE, "auth.invalidBody")}</p>`);
  return page(
    `<h1>${t(LOCALE, "auth.confirmHeading")}</h1>` +
      `<p>${t(LOCALE, "auth.confirmBody", { name: esc(site.name) })}</p>` +
      `<form method="POST"><input type="hidden" name="token" value="${esc(token)}">` +
      `<input type="hidden" name="next" value="${esc(next)}">` +
      `<button type="submit">${t(LOCALE, "auth.enterButton")}</button></form>`,
  );
}

export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => null);
  const token = String(form?.get("token") ?? "");
  const next = safeNext(String(form?.get("next") ?? "/admin"));
  const nonce = request.cookies.get(NONCE_COOKIE)?.value;

  const email = verifyMagicToken(token, nonce);
  if (!email) {
    return page(
      `<h1>${t(LOCALE, "auth.expiredTitle")}</h1>` +
        `<p>${t(LOCALE, "auth.expiredBody")}</p>`,
    );
  }

  const secure = sessionCookieOptions.secure ? "; Secure" : "";
  const headers = new Headers({ Location: next, "Referrer-Policy": "no-referrer", "Cache-Control": "no-store" });
  headers.append(
    "Set-Cookie",
    `${SESSION_COOKIE}=${createSessionToken(email)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${sessionCookieOptions.maxAge}${secure}`,
  );
  headers.append("Set-Cookie", `${NONCE_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`);
  return new Response(null, { status: 303, headers });
}
