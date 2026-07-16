import type { MetadataRoute } from "next";
import { site, team } from "@/lib/site";
import { collectionSitemapRoutes } from "@/lib/collections";

// Sitemap: the site's REAL routes — the two money pages (/coaching, /sane-voice),
// the trust pages, the bio routes (team/[slug]) + every published CMS-collection
// entry (content/cms/collections.json — contributes nothing while dormant).
export default function sitemap(): MetadataRoute.Sitemap {
  const base = site.url;
  const lastModified = new Date();
  // /styleguide is DELIBERATELY absent — internal demo page (noindex on the page itself).
  const routes = [
    "",
    "/coaching",
    "/sane-voice",
    "/testimonials",
    "/about",
    ...team.map((m) => `/team/${m.slug}`),
    ...collectionSitemapRoutes(),
    "/contact",
    "/privacy",
    "/terms",
    "/accessibility",
  ];
  return routes.map((route) => ({
    url: `${base}${route}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: route === "" ? 1 : route === "/coaching" || route === "/sane-voice" ? 0.9 : 0.6,
  }));
}
