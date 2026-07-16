import { NextResponse, type NextRequest } from "next/server";
import { locales, defaultLocale, isBilingual } from "@/lib/i18n";
import { i18n } from "@/lib/site";

// Bilingual auto-routing (INERT on a single-locale site). A visitor's locale is resolved as:
//   explicit choice (NEXT_LOCALE cookie, set by the toggle)  >  geo (country → locale, site.i18n.geo)  >  default.
// Only DEFAULT-locale (unprefixed) paths auto-redirect; an explicit /<locale> link is always respected,
// so a shared/bookmarked localized URL never bounces. The cookie ALWAYS wins over geo (user intent > IP).
const PREFIXED = (locales as readonly string[]).filter((l) => l !== defaultLocale);
// (?=[/?#]|$) anchors each token to a full path SEGMENT — without it "/enterprise" starts with the
// "en" locale token and would wrongly skip geo-routing (a US visitor served the Hebrew page). The
// blast radius grows with every locale added, so the segment anchor is mandatory, not cosmetic.
// "admin" is in the list for the CMS addon: /admin is a single, locale-less content
// desk. Without the skip, a bilingual site's geo-route would bounce an English-locale
// client to /en/admin — a 404 they cannot escape.
const SKIP = new RegExp(
  `^/(?:${[...PREFIXED, "api", "admin", "_next", "icon", "apple-icon", "opengraph-image", "twitter-image", "sitemap", "robots", "favicon", "manifest"].join("|")})(?=[/?#]|$)`
);

export function middleware(req: NextRequest) {
  if (!isBilingual) return NextResponse.next();
  const { pathname, searchParams } = req.nextUrl;
  const known = locales as readonly string[];

  // ?lang=<locale> — the NO-JS-SAFE switch: the language toggle carries its intent in the URL, and the
  // middleware writes the cookie ITSELF before redirecting to the clean path. Without this, a click on
  // the toggle before hydration (or with broken JS) navigates natively with the STALE cookie still set,
  // and the cookie branch below bounces the visitor straight back to the old locale — the "can't switch
  // language" trap (witnessed in production on the first bilingual client). Never on a PREFETCH — a
  // hover/viewport prefetch must not silently switch the visitor's language (toggle links also set
  // prefetch={false}, belt and suspenders).
  const isPrefetch = req.headers.get("next-router-prefetch") || req.headers.get("purpose") === "prefetch" || req.headers.get("sec-purpose")?.includes("prefetch");
  const forced = searchParams.get("lang");
  if (forced && known.includes(forced) && !isPrefetch) {
    const url = req.nextUrl.clone();
    url.searchParams.delete("lang");
    const res = NextResponse.redirect(url);
    res.cookies.set("NEXT_LOCALE", forced, { path: "/", maxAge: 31536000, sameSite: "lax" });
    return res;
  }

  if (SKIP.test(pathname) || pathname.includes(".")) return NextResponse.next();

  const cookie = req.cookies.get("NEXT_LOCALE")?.value;
  const country = (req.headers.get("x-vercel-ip-country") || "").toUpperCase();
  const geo = (i18n.geo as Record<string, string>)[country];

  let locale = defaultLocale as string;
  if (cookie && known.includes(cookie)) locale = cookie;          // explicit intent wins
  else if (geo && known.includes(geo)) locale = geo;              // else geo

  if (locale !== defaultLocale) {
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

// Skip static assets + files; the SKIP regex above handles route-level exclusions.
export const config = { matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"] };
