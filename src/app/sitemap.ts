import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { listDocs } from "@/lib/collections";
import { testimonials } from "@/lib/settings";

// Sitemap: the site's REAL routes — the money page (/coaching),
// the trust pages + every published recipe, each carrying its dish photo as an
// image entry (Google Images + Discover surfacing). The bio routes are gone:
// /team/<slug> was removed 2026-07-29 and /about carries the bio.
//
// /blog is DELIBERATELY EXCLUDED while it has no published articles — a thin/empty
// index on a YMYL nutrition domain drags sitewide quality. Add it back (and flip its
// noindex) only once the blog holds real content. /styleguide + /admin stay absent
// (internal, noindex on the page itself).
//
// /testimonials is excluded for the SAME reason and by the same rule: the page
// declares `robots: { index: false }` until real, approved testimonials exist.
// Listing a noindex URL here contradicts that and surfaces in Search Console as
// a "Submitted URL marked noindex" coverage error on a brand-new YMYL domain.
// It rejoins the sitemap automatically on the SAME condition the page uses to
// flip its own robots — one source of truth, so the two can never disagree.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = site.url;
  const now = new Date();

  const hasTestimonials = testimonials.some(
    (t) => t.quote?.trim() && t.name?.trim() && t.context?.trim() && t.consentBy?.trim() && t.consentAt?.trim(),
  );

  const staticRoutes = [
    "",
    "/coaching",
    ...(hasTestimonials ? ["/testimonials"] : []),
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

  return [...staticEntries, ...recipeEntries];
}
