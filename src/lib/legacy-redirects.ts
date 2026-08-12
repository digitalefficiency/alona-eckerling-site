// ============================================================================
// Legacy Wix → new-site 301 migration map.  See MARKETING.md §4b/§5.
//
// The old alonaeck.com (Wix) served the recipe archive at /post/<hebrew-slug>
// and paginated it under /blog/*.  ~93 of those recipe URLs plus the category/
// tag pagination are INDEXED in Google; when the new site goes live on the same
// domain they must 301 to the new routes or their accumulated equity 404s away.
//
// Sources are the URL-DECODED Hebrew pathnames — Next.js matches redirects on the
// decoded pathname, so `/post/%D7%93…` (encoded) matches source `/post/דגים…`.
// `permanent: true` emits a 308 (equity-passing, like a 301).
//
// RECIPE_MAP holds the 34 old→new pairs where the recipe was rebuilt on the new
// site (every current recipe has an archived counterpart).  Every other old
// /post/* and /blog/* URL falls through to the /recipes catch-all — NEVER a
// blanket redirect to the homepage (Google reads that as a soft-404 and the
// equity collapses).  Validated by legacy-redirects.test.mjs against the real
// recipe files + the recovered Wayback inventory.
// ============================================================================

export type LegacyRedirect = { source: string; destination: string; permanent: boolean };

// old Wix /post/<key> (URL-decoded Hebrew)  →  new /recipes/<value> (English slug)
export const RECIPE_MAP: Record<string, string> = {
  "בראוניז-ללא-קמח-מ4-מרכיבים": "flourless-brownies",
  "גרנולה-ביתית-ב10-דקות-הכנה": "homemade-granola",
  "טופו-חמוץ-מתוק": "sweet-and-sour-tofu",
  "כדורי-תמרים-מ3-מרכיבים": "three-ingredient-date-balls",
  "סלט-אטריות-סובה": "soba-noodle-salad",
  "פנקייקים-בריאים-עשירים-בחלבון": "protein-pancakes",
  "קציצות-טונה-אפויות": "baked-tuna-patties",
  "שווארמה-טופו": "tofu-shawarma",
  "שניצל-טופו-אפוי": "baked-tofu-schnitzel",
};

// old top-level Wix pages → nearest new route (real content pages only; never a 404).
export const PAGE_MAP: Record<string, string> = {
  "/צור-קשר": "/contact",
  "/תקנון-ומדיניות-פרטיות": "/privacy",
  "/copy-of-תקנון-ומדיניות-פרטיות": "/terms",
  "/מומלצים": "/",
  "/תזונה-להורדת-לחץ": "/",
};

export function legacyRedirects(): LegacyRedirect[] {
  const recipePosts = Object.entries(RECIPE_MAP).map(([he, en]) => ({
    source: `/post/${he}`,
    destination: `/recipes/${en}`,
    permanent: true,
  }));
  const pages = Object.entries(PAGE_MAP).map(([from, to]) => ({
    source: from,
    destination: to,
    permanent: true,
  }));
  return [
    // 1. specific rebuilt recipes FIRST (order matters — first match wins)
    ...recipePosts,
    // 2. named top-level pages
    ...pages,
    // 3. the rest of the recipe archive: every un-rebuilt /post/* + all the old
    //    /blog category/tag/page pagination → the new recipe index (NOT the home).
    //    `:path+` requires ≥1 segment so the new (designed) /blog route is left alone.
    { source: "/blog/:path+", destination: "/recipes", permanent: true },
    { source: "/post/:slug*", destination: "/recipes", permanent: true },
    // 4. Wix on-site search had its own indexed pages — no equivalent, land softly.
    { source: "/search", destination: "/", permanent: true },
    // 5b. RETIRED ROUTE (2026-07-30, Rom's call): /testimonials became the
    //    articles surface. The old path 308s to its replacement rather than
    //    404ing. The testimonials CAPABILITY is untouched — the CMS settings
    //    group and its consent trail stay, ready to be placed on another page.
    { source: "/testimonials", destination: "/articles", permanent: true },
    // 5. RETIRED ROUTE (2026-07-29, Rom's call): the standalone credentials page
    //    /team/<slug>. /about carries the bio and now owns the canonical Person
    //    node, so the old URL points at its own replacement rather than 404ing.
    //    `:slug*` covers /team itself as well as /team/alona.
    { source: "/team/:slug*", destination: "/about", permanent: true },
  ];
}
