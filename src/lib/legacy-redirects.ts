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
  "אורז-מטוגן-מוקפץ-אסיאתי-מכרובית": "cauliflower-fried-rice",
  "בורקס-גבינה-ותרד-מבצק-יוגורט": "spinach-cheese-bourekas",
  "בראוניז-ללא-קמח-מ4-מרכיבים": "flourless-brownies",
  "גרנולה-ביתית-ב10-דקות-הכנה": "homemade-granola",
  "דגים-מרוקאים-של-שישי": "moroccan-fish",
  "חומוס-ביתי": "homemade-hummus",
  "חטיפי-אנרגיה-ביתיים-עם-תמרים": "date-energy-bars",
  "טופו-ברוטב-חרדל-שום-ודבש": "tofu-honey-mustard",
  "טופו-חמוץ-מתוק": "sweet-and-sour-tofu",
  "כדורי-תמרים-מ3-מרכיבים": "three-ingredient-date-balls",
  "לביבות-תירס-אפויות": "baked-corn-fritters",
  "מוקפץ-קארי-ירוק-טבעוני-ללא-גלוטן": "green-curry-stir-fry",
  "מרק-אפונה-פשוט-וקל": "easy-pea-soup",
  "מרק-עגבניות-צלויות": "roasted-tomato-soup",
  "סלט-אטריות-סובה": "soba-noodle-salad",
  "סלט-אטריות-שעועית-עם-דג": "bean-noodle-fish-salad",
  "סלט-בורגול-ברוקולי-ומלא-דברים-טובים": "bulgur-broccoli-salad",
  "סלט-זוקיני-חי-עם-פטה-ושקדים": "zucchini-feta-salad",
  "סלט-טאבולה-כרובית-הכי-טעים-שתאכלו": "cauliflower-tabbouleh",
  "סלט-קינואה-ברוטב-ויניגרט-הדרים-דבש": "quinoa-citrus-salad",
  "עוגיות-שוקולד-צ-יפס-שיבולת-שועל": "oatmeal-chocolate-chip-cookies",
  "עוגת-בננה-מקמח-כוסמין": "spelt-banana-cake",
  "עוגת-גבינה-אפויה-דלת-קלוריות-ועשירה-בחלבון": "protein-cheesecake",
  "פנקייקים-בריאים-עשירים-בחלבון": "protein-pancakes",
  "פשטידת-תרד-וגבינות-רזות": "spinach-cheese-pie",
  "קינואה-ברוטב-אדום": "quinoa-in-red-sauce",
  "קיש-גבינות-בצל-וברוקולי": "broccoli-onion-quiche",
  "קציצות-דג-אמנון-ברוטב-מתקתק": "fish-patties-sweet-sauce",
  "קציצות-טונה-אפויות": "baked-tuna-patties",
  "שווארמה-טונה": "tuna-shawarma",
  "שווארמה-טופו": "tofu-shawarma",
  "שניצל-טופו-אפוי": "baked-tofu-schnitzel",
  "שקשוקה-ירוקה-שקשוקת-תרד-חלומית": "green-shakshuka",
  "תבשיל-בורגול-בסיר-אחד": "one-pot-bulgur-stew",
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
  ];
}
