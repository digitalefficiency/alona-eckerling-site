// ============================================================================
// SCHEMA PRESETS — vertical-correct JSON-LD builders (premium-tier.md → "SEO
// plumbing": LegalService / MedicalClinic / Person per bio, validating clean).
//
// Each builder derives ONLY from the lib/site.ts shapes and returns a plain
// object for the existing <JsonLd data={…}/> component (components/JsonLd.tsx):
//
//   import { JsonLd } from "@/components/JsonLd";
//   import { legalService } from "@/lib/schema-presets";
//   import { site } from "@/lib/site";
//   <JsonLd data={legalService(site)} />                    // in layout/home
//   <JsonLd data={personFromBio({ name, role, credentials, href })} />  // per bio
//
// Pick the builder that matches the intake vertical (schemaForVertical below
// mirrors brand.config.ts verticalPresets keys). Rows are emitted only when
// the config value is non-empty — never fabricate NAP/credentials.
// ============================================================================

import type { site as siteConfig, services as servicesConfig, team as teamConfig } from "@/lib/site";

/** The lib/site.ts `site` shape (structural — any object matching it works). */
export type SiteShape = typeof siteConfig;
export type ServicesShape = typeof servicesConfig;

/**
 * A team/bio member — the lib/site.ts `team` row keys (name/role), values
 * widened to string (the `as const` rows carry literal types), plus the
 * trust/BioCard extras. Both `team` entries and BioCard props satisfy it.
 */
export type BioShape = { [K in keyof Pick<(typeof teamConfig)[number], "name" | "role">]: string } & {
  credentials?: readonly string[]; // license, education, affiliations (BioCard's required rows)
  narrative?: string;              // BioCard narrative → schema description
  href?: string;                   // full bio page (absolute, or path resolved against site.url)
  photo?: { src: string; alt: string };
};

// Shared LocalBusiness-flavored base — the vertical builders override "@type".
function organizationBase(site: SiteShape, services?: ServicesShape) {
  const { street, city, region, country } = site.address;
  return {
    "@context": "https://schema.org",
    name: site.legalName,
    description: site.description,
    url: site.url,
    foundingDate: String(site.foundingYear),
    areaServed: [...site.areasServed],
    ...(services && services.length ? { knowsAbout: services.map((s) => s.title) } : {}),
    ...(site.phone ? { telephone: site.phone } : {}),
    ...(site.email ? { email: site.email } : {}),
    ...(street && city
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: street,
            addressLocality: city,
            ...(region ? { addressRegion: region } : {}),
            addressCountry: country,
          },
        }
      : {}),
  };
}

/** LAW — schema.org/LegalService (law firms, notaries, appraisers-at-law). */
export function legalService(site: SiteShape, services?: ServicesShape) {
  return { ...organizationBase(site, services), "@type": "LegalService" };
}

/** MEDICAL — schema.org/MedicalClinic (clinics, practices, allied health). */
export function medicalClinic(site: SiteShape, services?: ServicesShape) {
  return { ...organizationBase(site, services), "@type": "MedicalClinic" };
}

/**
 * GENERIC / THERAPY — schema.org/ProfessionalService. Therapy practices use
 * this deliberately: it carries the trust signals without exposing a medical
 * entity type on a privacy-sensitive vertical.
 */
export function professionalService(site: SiteShape, services?: ServicesShape) {
  return { ...organizationBase(site, services), "@type": "ProfessionalService" };
}

/**
 * Person schema for a provider bio (one per BioCard / team landing page).
 * Credentials map to hasCredential — emit only real, named credentials.
 * Pass `site` to resolve a relative `href` and attach worksFor.
 */
export function personFromBio(member: BioShape, site?: SiteShape) {
  const url =
    member.href && site && member.href.startsWith("/")
      ? `${site.url}${member.href}`
      : member.href;
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: member.name,
    jobTitle: member.role,
    ...(member.narrative ? { description: member.narrative } : {}),
    ...(url ? { url } : {}),
    ...(member.photo?.src ? { image: member.photo.src } : {}),
    ...(member.credentials && member.credentials.length
      ? {
          hasCredential: member.credentials.map((c) => ({
            "@type": "EducationalOccupationalCredential",
            name: c,
          })),
        }
      : {}),
    ...(site ? { worksFor: { "@type": "Organization", name: site.legalName, url: site.url } } : {}),
  };
}

/** Org builder per intake vertical — keys mirror brand.config.ts verticalPresets. */
export const schemaForVertical = {
  law: legalService,
  medical: medicalClinic,
  therapy: professionalService, // deliberate: ProfessionalService, see note above
  default: professionalService,
} as const;

export type SchemaVertical = keyof typeof schemaForVertical;
