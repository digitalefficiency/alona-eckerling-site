import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { services, site, cta, responsePromise, type Service } from "@/lib/site";
import { Section } from "@/components/layout/Section";
import { SectionHeading } from "@/components/SectionHeading";
import { Reveal } from "@/components/Reveal";
import { SplitText } from "@/components/motion/SplitText";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ProcessTimeline } from "@/components/media/ProcessTimeline";
import { TestimonialCard } from "@/components/trust/TestimonialCard";
import { ResultCard } from "@/components/trust/ResultCard";
import { ResponsePromise } from "@/components/trust/ResponsePromise";
import { FaqAccordion } from "@/components/FaqAccordion";
import { ContactLeadForm } from "@/components/ContactLeadForm";
import { JsonLd, faqSchema } from "@/components/JsonLd";

// ============================================================================
// CONVERTING SERVICE PAGE — the premium-tier skeleton (backlog #5):
// H1 (service + city) → empathetic problem paragraph → "what happens" steps →
// proof (results + testimonials) → FAQ → conversion band (form + promise).
// Every word comes from lib/site.ts service fields; a section renders only
// when its field is filled from intake, so nothing here ever ships as filler.
// ============================================================================

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}

const getService = (slug: string) => services.find((s) => s.slug === slug);

// H1 = service + city (local-intent SEO) — falls back to the bare title until
// the NAP city is configured.
const h1For = (svc: Service) => (site.address.city ? `${svc.title} ב${site.address.city}` : svc.title);

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const svc = getService(slug);
  if (!svc) return {};
  return {
    title: h1For(svc),
    description: svc.short,
    alternates: { canonical: `/services/${slug}` },
    openGraph: { title: h1For(svc), description: svc.short, url: `/services/${slug}` },
  };
}

export default async function ServicePage({ params }: Params) {
  const { slug } = await params;
  const svc = getService(slug);
  if (!svc) notFound();

  const hasResults = Boolean(svc.proof?.results?.length);
  const hasTestimonials = Boolean(svc.proof?.testimonials?.length);

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: svc.title,
    description: svc.short,
    url: `${site.url}/services/${slug}`,
    provider: { "@type": "Organization", name: site.legalName, url: site.url },
    areaServed: [...site.areasServed],
  };

  return (
    <>
      <JsonLd data={serviceSchema} />
      {svc.faq && svc.faq.length > 0 && <JsonLd data={faqSchema([...svc.faq])} />}

      {/* ===== HERO — text-first sand band: crumbs + ink-wipe H1 + lead + CTA ===== */}
      <Section tone="sand" border>
        <div className="max-w-[72ch]">
          <Breadcrumbs
            items={[
              { label: "שירותים", href: "/services" },
              { label: svc.title, href: `/services/${slug}` },
            ]}
          />
          <div className="mt-6 flex items-center gap-2.5">
            <span className="text-[0.7rem] leading-none text-gold" aria-hidden>◆</span>
            <span className="text-xs font-bold tracking-[.2em] text-gold-ink">שירותים</span>
          </div>
          <SplitText
            as="h1"
            text={h1For(svc)}
            baseDelay={120}
            className="mt-4 font-serif font-black leading-[1.05] text-navy"
            style={{ fontSize: "var(--text-hero)" }}
          />
          <Reveal delay={120}>
            <p className="mt-5 max-w-[52ch] text-lg leading-relaxed text-muted">{svc.short}</p>
          </Reveal>
          <Reveal delay={180} className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#lead"
              data-cta={`service-hero-${slug}`}
              className="rounded-[4px] bg-navy px-7 py-3.5 text-[0.95rem] font-bold text-white transition hover:bg-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
            >
              {cta.primary.short}
            </a>
            {site.phone && (
              <a
                href={`tel:${site.phone}`}
                data-cta={`service-hero-call-${slug}`}
                dir="ltr"
                className="rounded-[4px] border border-navy/20 px-7 py-3.5 text-[0.95rem] font-bold text-navy-700 transition hover:border-gold hover:text-gold-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                {site.phone}
              </a>
            )}
          </Reveal>
        </div>
      </Section>

      {/* ===== THE PROBLEM — empathetic paragraph, the visitor's situation ===== */}
      {svc.problem && (
        <Section tone="white" width="prose" border>
          <Reveal>
            <p className="flex items-start gap-3">
              <span className="mt-3 text-[0.65rem] leading-none text-gold" aria-hidden>◆</span>
              <span className="font-serif text-[1.35rem] font-medium leading-relaxed text-navy md:text-2xl">
                {svc.problem}
              </span>
            </p>
          </Reveal>
        </Section>
      )}

      {/* ===== WHAT HAPPENS — 3–5 numbered steps ===== */}
      {svc.steps && svc.steps.length > 0 && (
        <Section tone="sand" seam>
          <Reveal>
            <SectionHeading eyebrow="איך זה עובד" title="מה קורה, שלב אחרי שלב" />
          </Reveal>
          <Reveal className="mt-12">
            <ProcessTimeline steps={[...svc.steps]} headingAs="h3" />
          </Reveal>
        </Section>
      )}

      {/* ===== PROOF — results as stories + specific testimonials ===== */}
      {(hasResults || hasTestimonials) && (
        <Section tone="white" border>
          <Reveal>
            <SectionHeading eyebrow="מהשטח" title="תוצאות ולקוחות" />
          </Reveal>
          {hasResults && (
            <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {svc.proof!.results!.map((r, i) => (
                <Reveal as="div" key={r.title} delay={(i % 3) * 80}>
                  <ResultCard {...r} />
                </Reveal>
              ))}
            </div>
          )}
          {hasTestimonials && (
            <div className={`${hasResults ? "mt-8" : "mt-12"} grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3`}>
              {svc.proof!.testimonials!.map((t, i) => (
                <Reveal as="div" key={t.attribution.name} delay={(i % 3) * 80}>
                  <TestimonialCard {...t} />
                </Reveal>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* ===== FAQ — native details/summary, crawlable, works without JS ===== */}
      {svc.faq && svc.faq.length > 0 && (
        <Section tone="sand" width="prose" seam>
          <Reveal>
            <SectionHeading eyebrow="שאלות נפוצות" title="מה שחשוב לדעת" />
          </Reveal>
          <Reveal className="mt-10">
            <FaqAccordion items={[...svc.faq]} />
          </Reveal>
        </Section>
      )}

      {/* ===== CONVERT — navy CTA band: heading + response promise + lead form ===== */}
      <Section tone="navy" id="lead" seam>
        <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-10 lg:gap-16">
          <Reveal as="div" className="order-2 md:order-1">
            <div className="flex items-center gap-2.5">
              <span className="text-[0.7rem] leading-none text-gold" aria-hidden>◆</span>
              <span className="text-xs font-bold tracking-[.2em] text-gold-soft">{svc.title}</span>
            </div>
            <SplitText
              as="h2"
              text={"נשמח לעזור.\nהשאירו פרטים."}
              lastLineClass="text-gold"
              baseDelay={140}
              className="mt-4 font-serif font-black leading-[1.12] text-white"
              style={{ fontSize: "clamp(1.6rem, 3.2vw, 2.5rem)" }}
            />
            <p className="mt-6 max-w-[46ch] text-lg leading-relaxed text-slate-200">
              שיחה ראשונית בנושא {svc.title} — בלי התחייבות.
            </p>
            {responsePromise.promise && (
              <div className="mt-8 border-t border-white/10 pt-6">
                <ResponsePromise promise={responsePromise.promise} sub={responsePromise.sub} tone="dark" />
              </div>
            )}
          </Reveal>
          <Reveal className="order-1 md:order-2">
            <ContactLeadForm />
          </Reveal>
        </div>
      </Section>
    </>
  );
}
