// ============================================================================
// settings.ts — the CLIENT-EDITABLE slice of the site config.
//
// site.ts stays the authored source of truth (types, structure, defaults). The
// fields a client may edit from /admin (hours, phone, address, prices…) live in
// content/settings/business.json, which the CMS writes with schema validation —
// so a client never edits TypeScript, and a bad value can never break the build.
//
// DORMANT by construction: the template ships `{}` and `[]`, so the spread is a
// no-op and the site behaves exactly as if this file did not exist. Harvest a
// field per project by moving its value out of site.ts into business.json and
// declaring it in content/cms/settings.schema.json (which drives BOTH the admin
// form and the lint-content gate).
// ============================================================================
import businessJson from "../../content/settings/business.json";
import testimonialsJson from "../../content/settings/testimonials.json";
import socialWallJson from "../../content/settings/social-wall.json";

export type BusinessOverrides = Partial<{
  phone: string;
  whatsapp: string;
  email: string;
  address: { street: string; city: string; region: string; country: string };
  hours: { weekdays: string; friday: string; saturday: string };
  areasServed: string[];
}>;

export const business = businessJson as BusinessOverrides;

export type Testimonial = {
  quote: string;
  name: string;
  context: string; // required — a testimonial without context is not proof
  outcome?: string;
  consentBy?: string; // who approved publishing this quote
  consentAt?: string; // yyyy-mm-dd — the consent trail for third-party PII
};

export const testimonials = testimonialsJson as Testimonial[];

// The dish ribbon's tiles, editable from /admin. Ships EMPTY and the home page
// falls back to the authored set, so an untouched site looks exactly as designed
// and the client can take the band over whenever she wants — she is not required
// to fill it before it works. `imageAlt` is the paired alt key the CMS writes
// beside every image field (see validateFields' requiredAlt), and `href` is
// optional: a tile without one links to her profile rather than to nothing.
export type SocialTile = {
  image: string;
  imageAlt?: string;
  href?: string;
};

export const socialWall = socialWallJson as SocialTile[];

// Deep-merge one level: `business.address = {city}` overrides only `city`.
export function withOverrides<T extends Record<string, unknown>>(base: T, over: Record<string, unknown>): T {
  const out: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(over)) {
    if (v === undefined || v === null || v === "") continue;
    const b = out[k];
    if (b && typeof b === "object" && !Array.isArray(b) && typeof v === "object" && !Array.isArray(v)) {
      out[k] = { ...(b as object), ...(v as object) };
    } else {
      out[k] = v;
    }
  }
  return out as T;
}
