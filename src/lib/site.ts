// ============================================================================
// SITE CONFIG — content/identity for THIS site (separate from brand.config.ts,
// which is colors/fonts/direction). The scaffold step rewrites this per project.
// Keep the export SHAPE — many components import { site, nav, services, team,
// cta, credentials } from here. Placeholder values below: replace them.
//
// The CMS substrate (opt-in) may override a NAP/hours subset from
// content/settings/business.json — see lib/settings.ts. That file ships `{}`,
// so `site` below is exactly what the site renders until a field is harvested.
// ============================================================================
import { business, withOverrides } from "./settings";

const siteBase = {
  name: "הסטודיו",
  legalName: "הסטודיו — שם העסק המלא",
  tagline: "משפט תדמית קצר וחד שמסכם את ההצעה.",
  description:
    "תיאור מטא קצר (עד ~155 תווים) של העסק והשירות — מה אתם עושים, למי, ולמה כדאי לפנות. ישמש למנועי חיפוש ולשיתופים.",
  foundingYear: 2015,
  url: "https://example.com",

  // NAP — fill per project (rows render only when non-empty; never fabricate).
  phone: "",
  whatsapp: "", // international format for wa.me, e.g. 9725XXXXXXXX
  email: "",
  address: { street: "", city: "", region: "", country: "IL" },
  hours: {
    weekdays: "א׳–ה׳ 09:00–18:00",
    friday: "ו׳ 09:00–13:00",
    saturday: "שבת — סגור",
  },
  areasServed: ["אזור א׳", "אזור ב׳", "אזור ג׳"],

  // Legal / compliance — shown on /privacy /terms /accessibility.
  legalUpdated: "01.01.2026",
  accessibilityCoordinator: { name: "", phone: "", email: "" },
  privacyOfficer: { name: "", email: "" },
};

export type SiteConfig = typeof siteBase;

// The shipped config: authored defaults + any client-edited overrides (empty by default).
export const site: SiteConfig = withOverrides(siteBase, business as Record<string, unknown>);

// Derived — keep honest over time (never hardcode a stale "years in business").
export const yearsOfExperience = () => new Date().getFullYear() - site.foundingYear;
export const currentYear = () => new Date().getFullYear();

// Indexing gate — NOINDEX until NEXT_PUBLIC_ALLOW_INDEXING="true" at real launch.
export const allowIndexing = process.env.NEXT_PUBLIC_ALLOW_INDEXING === "true";

// ── i18n — the bilingual ROUTING substrate (OPT-IN, config-driven) ──────────
// Single-locale by DEFAULT: the default locale lives at the site root, and lib/i18n's helpers +
// middleware go inert (no prefix, no hreflang, no geo-redirect). Go bilingual by adding a locale to
// `locales` and scaffolding its route tree (see references/i18n-substrate.md) — lib/i18n.ts,
// middleware.ts and lint-i18n then activate automatically. The register/compliance/pain DECISION lives
// in references/market-and-language.md; this config owns only URLs + <link rel=alternate hreflang>.
export const i18n = {
  locales: ["he"] as const,            // bilingual: ["he", "en"] as const
  defaultLocale: "he" as const,        // lives at the root ("/"); every other locale is /<code>-prefixed
  dir: { he: "rtl", en: "ltr" } as const,       // <html dir> per locale
  htmlLang: { he: "he", en: "en" } as const,    // <html lang> per locale
  hreflang: { he: "he-IL", en: "en-US" } as const, // rel=alternate hreflang value per locale
  geo: { US: "en" } as const,          // country (x-vercel-ip-country) → locale, for the middleware auto-route
};

export const nav = [
  { href: "/", label: "בית" },
  { href: "/services", label: "שירותים" },
  { href: "/about", label: "אודות" },
  { href: "/contact", label: "צור קשר" },
] as const;

// ── Converting service-page fields (app/services/[slug]) ────────────────────
// Optional, typed raw material for the problem→process→proof→FAQ→CTA skeleton.
// A section renders ONLY when its field is filled from intake — an empty field
// simply hides the section, so the skeleton never ships filler copy.
export type QaItem = { q: string; a: string };
export type ServiceStep = { t: string; d?: string }; // ProcessTimeline shape
export type ServiceProof = {
  testimonials?: readonly {
    quote: string;
    attribution: { name: string; context: string }; // context required — case type/city/company
    outcome?: string;
  }[];
  results?: readonly {
    title: string;
    story: string; // the narrative, never just a number
    outcome: string;
    matterType?: string;
    disclaimer: string; // required — always rendered with the result
  }[];
};

export type Service = {
  slug: string;
  title: string;
  short: string; // one sentence of value — also the detail-page lead + meta description
  flagship?: boolean;
  problem?: string; // empathetic problem paragraph — the visitor's situation, in their words
  steps?: readonly ServiceStep[]; // 3–5 "what happens" steps
  faq?: readonly QaItem[]; // semantic FAQ (also emitted as FAQPage JSON-LD)
  proof?: ServiceProof; // TestimonialCard / ResultCard raw material
};

// Service offerings — title + short blurb (detail fields above are filled from
// intake per project; until then each detail page shows hero + CTA band only).
export const services: readonly Service[] = [
  { slug: "service-1", title: "שירות ראשון", short: "משפט קצר שמסביר את הערך של השירות הזה.", flagship: true },
  { slug: "service-2", title: "שירות שני", short: "משפט קצר שמסביר את הערך של השירות הזה." },
  { slug: "service-3", title: "שירות שלישי", short: "משפט קצר שמסביר את הערך של השירות הזה." },
  { slug: "service-4", title: "שירות רביעי", short: "משפט קצר שמסביר את הערך של השירות הזה." },
  { slug: "service-5", title: "שירות חמישי", short: "משפט קצר שמסביר את הערך של השירות הזה." },
  { slug: "service-6", title: "שירות שישי", short: "משפט קצר שמסביר את הערך של השירות הזה." },
];

// ── Bio-as-landing fields (app/team/[slug]) ──────────────────────────────────
// Same rule as Service: every field optional → its section renders only when
// intake provides it. Never fabricate credentials or photos (YMYL).
export type TeamMember = {
  slug: string;
  name: string;
  role: string; // short title line
  generation?: number;
  file?: string;
  photo?: { src: string; alt: string }; // environmental portrait — real photo only
  oneLiner?: string; // one line: what this person does for clients
  credentials?: readonly string[]; // license / education / affiliations (◆ rows + Person schema)
  recognition?: readonly { src: string; alt: string }[]; // CredentialStrip logos (≤7, monochrome)
  narrative?: readonly string[]; // story paragraphs
  qa?: readonly QaItem[]; // personal Q&A
};

export const team: readonly TeamMember[] = [
  { slug: "person-1", name: "שם איש צוות", role: "תפקיד / תואר", generation: 1, file: "person-1" },
  { slug: "person-2", name: "שם איש צוות", role: "תפקיד / תואר", generation: 2, file: "person-2" },
  { slug: "person-3", name: "שם איש צוות", role: "תפקיד / תואר", generation: 3, file: "person-3" },
];

export const cta = {
  primary: { label: "דברו איתנו — שיחת ייעוץ ראשונית", short: "שיחת ייעוץ ראשונית", href: "/contact" },
  secondary: { label: "לכל השירותים", href: "/services" },
} as const;

// Stated response-time commitment (trust/ResponsePromise) — rendered beside
// every lead form. Fill with a promise the office actually keeps; while empty
// the component simply doesn't render (never invent a commitment).
export const responsePromise: { promise: string; sub?: string } = {
  promise: "",
  sub: "",
};

// Contact-form config — the subject <select> options and the brand name used in
// the consent line ("אני מאשר/ת ש<consentBrandName> ייצור עמי קשר…").
// REQUIRED per project: replace `subjects` with the client's actual service lines
// (from services[] / COPY.md) and `consentBrandName` with the client's legal name.
// These placeholders exist so the build compiles — lint-copy flags them until filled.
export const contactForm: { subjects: readonly string[]; consentBrandName: string } = {
  subjects: [
    "נושא הפנייה 1",
    "נושא הפנייה 2",
    "נושא הפנייה 3",
    "אחר",
  ],
  consentBrandName: "שם העסק המלא",
};

// Verifiable trust signals (never fabricate). Replace per project.
export const credentials = [
  { t: "אסמכתא 1", d: "פרט תומך" },
  { t: "אסמכתא 2", d: "פרט תומך" },
  { t: "אסמכתא 3", d: "פרט תומך" },
] as const;
