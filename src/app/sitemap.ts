import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { listDocs } from "@/lib/collections";

// Sitemap: the site's REAL routes — the money page (/coaching),
// the trust pages + every published recipe, each carrying its dish photo as an
// image entry (Google Images + Discover surfacing). The bio routes are gone:
// /team/<slug> was removed 2026-07-29 and /about carries the bio.
//
// /articles is EXCLUDED while it holds no published pieces — a thin/empty index
// on a YMYL nutrition domain drags sitewide quality, and the collection index
// already declares its own noindex when empty. Listing a noindex URL here would
// contradict that and surface in Search Console as a "Submitted URL marked
// noindex" coverage error on a brand-new domain. It joins the sitemap
// automatically on the SAME condition the page uses to flip its own robots —
// one source of truth, so the two can never disagree.
// /styleguide + /admin stay absent (internal, noindex on the page itself).
//
// /testimonials was retired 2026-07-30 (Rom's call): the route became /articles
// and now 308s there. The testimonials CAPABILITY is deliberately kept — the CMS
// settings group and its consent trail are intact for placement elsewhere.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = site.url;
  const now = new Date();

  const articles = listDocs("articles");

  const staticRoutes = [
    "",
    "/coaching",
    ...(articles.length > 0 ? ["/articles"] : []),
    "/about",
    // the /team/<slug> bio routes were removed 2026-07-29 (Rom's call) — /about
    // is the bio page now, so listing them here would sitemap a 404
    "/recipes",
    "/contact",
    "/privacy",
    "/terms",
    "/accessibility",
  ];

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${base}${route}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: route === "" ? 1 : route === "/coaching" ? 0.9 : 0.6,
  }));

  // One row per published recipe, with its photo declared for image search / Discover.
  const recipeEntries: MetadataRoute.Sitemap = listDocs("recipes").map((e) => ({
    url: `${base}/recipes/${e.slug}`,
    lastModified: /^\d{4}-\d{2}-\d{2}/.test(e.date) ? new Date(e.date) : now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
    ...(e.image ? { images: [`${base}${e.image}`] } : {}),
  }));

  // One row per published article. Same shape as the recipes above; the cover
  // image is optional on this collection, so it is only declared when present.
  const articleEntries: MetadataRoute.Sitemap = articles.map((e) => ({
    url: `${base}/articles/${e.slug}`,
    lastModified: /^\d{4}-\d{2}-\d{2}/.test(e.date) ? new Date(e.date) : now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
    ...(e.image ? { images: [`${base}${e.image}`] } : {}),
  }));

  return [...staticEntries, ...recipeEntries, ...articleEntries];
}
