import type { MetadataRoute } from "next";
import { site, services, team } from "@/lib/site";
import { collectionSitemapRoutes } from "@/lib/collections";

// Sitemap for the template: static routes + the converting detail routes
// (services/[slug], team/[slug]) + every published CMS-collection entry
// (content/cms/collections.json — contributes nothing while dormant).
export default function sitemap(): MetadataRoute.Sitemap {
  const base = site.url;
  const lastModified = new Date();
  // /styleguide is DELIBERATELY absent — internal demo page (noindex on the page itself).
  const routes = [
    "",
    "/services",
    ...services.map((s) => `/services/${s.slug}`),
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
    priority: route === "" ? 1 : route.startsWith("/services") ? 0.9 : 0.6,
  }));
}
