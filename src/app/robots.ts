import type { MetadataRoute } from "next";
import { site, allowIndexing } from "@/lib/site";

// GEO: לא לחסום סורקי AI — אפשר GPTBot / Google-Extended / PerplexityBot.
// אך עד ההשקה הציבורית (allowIndexing=false) חוסמים את כולם, כדי שתוכן לא-גמור
// (סמני [לאימות], NAP חסר) לא ייכנס לאינדקס מוקדם.
export default function robots(): MetadataRoute.Robots {
  if (!allowIndexing) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
  // /admin (the opt-in CMS content desk) is a permanent disallow — belt to the
  // page's own noindex. It is absent from the sitemap for the same reason.
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: "/admin" },
      // AI answer-engine crawlers, split by role (2026): GPTBot trains, OAI-SearchBot
      // powers ChatGPT-search CITATIONS — a site is only citable if OAI-SearchBot can
      // crawl. PerplexityBot + ClaudeBot / Claude-SearchBot named explicitly for
      // auditability (all also covered by "*", but naming them documents intent).
      { userAgent: "GPTBot", allow: "/", disallow: "/admin" },
      { userAgent: "OAI-SearchBot", allow: "/", disallow: "/admin" },
      { userAgent: "ChatGPT-User", allow: "/", disallow: "/admin" },
      { userAgent: "Google-Extended", allow: "/", disallow: "/admin" },
      { userAgent: "PerplexityBot", allow: "/", disallow: "/admin" },
      { userAgent: "ClaudeBot", allow: "/", disallow: "/admin" },
      { userAgent: "Claude-SearchBot", allow: "/", disallow: "/admin" },
    ],
    sitemap: `${site.url}/sitemap.xml`,
  };
}
