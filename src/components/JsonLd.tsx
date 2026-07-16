import { site, services } from "@/lib/site";

// Injects JSON-LD structured data. GEO-critical: אתרים עם Schema מצוטטים פי 3.2 ב-AI.
// JSON.stringify does NOT escape <, > or & — a "</script>" inside any schema value
// (business name, FAQ answer, testimonial) would break OUT of this script tag into
// executable markup. Once schema fields are CMS/client-editable that is stored XSS,
// so every angle bracket is re-emitted as a \uXXXX escape (still valid JSON).
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

// Schema ארגוני בסיסי — לשימוש ב-layout/דף הבית.
export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: site.legalName,
    foundingDate: String(site.foundingYear),
    url: site.url,
    areaServed: site.areasServed,
    // Derived from the site's configured services — updates per project automatically.
    knowsAbout: services.map((s) => s.title),
    ...(site.phone ? { telephone: site.phone } : {}),
    ...(site.email ? { email: site.email } : {}),
  };
}

// FAQPage schema מתוך מערך שאלות/תשובות.
export function faqSchema(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
}
