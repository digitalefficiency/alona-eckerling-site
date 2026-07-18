import type { MetadataRoute } from "next";
import { site, team } from "@/lib/site";
import { listDocs } from "@/lib/collections";

// Sitemap: the site's REAL routes — the two money pages (/coaching, /sane-voice),
// the trust pages, the bio routes (team/[slug]) + every published recipe, each
// carrying its dish photo as an image entry (Google Images + Discover surfacing).
//
// /blog is DELIBERATELY EXCLUDED while it has no published articles — a thin/empty
// index on a YMYL nutrition domain drags sitewide quality. Add it back (and flip its
// noindex) only once the blog holds real content. /styleguide + /admin stay absent
// (internal, noindex on the page itself).
export default function sitemap(): MetadataRoute.Sitemap {
  const base = site.url;
  const now = new Date();

  const staticRoutes = [
    "",
    "/coaching",
    "/sane-voice",
    "/testimonials",
    "/about",
    ...team.map((m) => `/team/${m.slug}`),
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
    priority: route === "" ? 1 : route === "/coaching" || route === "/sane-voice" ? 0.9 : 0.6,
  }));

  // One row per published recipe, with its photo declared for image search / Discover.
  const recipeEntries: MetadataRoute.Sitemap = listDocs("recipes").map((e) => ({
    url: `${base}/recipes/${e.slug}`,
    lastModified: /^\d{4}-\d{2}-\d{2}/.test(e.date) ? new Date(e.date) : now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
    ...(e.image ? { images: [`${base}${e.image}`] } : {}),
  }));

  return [...staticEntries, ...recipeEntries];
}
