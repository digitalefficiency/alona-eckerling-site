import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { team, site, cta, responsePromise } from "@/lib/site";
import { Section } from "@/components/layout/Section";
import { SectionHeading } from "@/components/SectionHeading";
import { Reveal } from "@/components/Reveal";
import { SplitText } from "@/components/motion/SplitText";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Portrait, Monogram } from "@/components/media/Portrait";
import { CredentialStrip } from "@/components/trust/CredentialStrip";
import { ResponsePromise } from "@/components/trust/ResponsePromise";
import { FaqAccordion } from "@/components/FaqAccordion";
import { ContactLeadForm } from "@/components/ContactLeadForm";
import { JsonLd } from "@/components/JsonLd";
import { personFromBio } from "@/lib/schema-presets";

// ============================================================================
// BIO AS LANDING PAGE — the premium-tier skeleton (backlog #5): environmental
// portrait → one-line what-I-do → credential rows → recognition strip →
// narrative → personal Q&A → persistent CTA (hero → #lead + the global
// StickyContactBar) + lead form. All copy from lib/site.ts team fields; a
// section renders only when intake filled its field (never fabricate
// credentials or photos — YMYL). Members without a photo get a Monogram.
// ============================================================================

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return team.map((m) => ({ slug: m.slug }));
}

const getMember = (slug: string) => team.find((m) => m.slug === slug);

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const m = getMember(slug);
  if (!m) return {};
  return {
    title: `${m.name} — ${m.role}`,
    description: m.oneLiner ?? m.role,
    alternates: { canonical: `/team/${slug}` },
    openGraph: { title: `${m.name} — ${m.role}`, description: m.oneLiner ?? m.role, url: `/team/${slug}` },
  };
}

export default async function TeamMemberPage({ params }: Params) {
  const { slug } = await params;
  const m = getMember(slug);
  if (!m) notFound();

  return (
    <>
      <JsonLd
        data={personFromBio(
          {
            name: m.name,
            role: m.role,
            credentials: m.credentials,
            narrative: m.narrative?.join(" "),
            href: `/team/${slug}`,
            photo: m.photo,
          },
          site,
        )}
      />

      {/* ===== HERO — environmental portrait + name + what-I-do + credentials + CTA ===== */}
      <Section tone="sand" border>
        <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
          <div>
            <Breadcrumbs
              items={[
                // «עליי» — the label the nav uses for /about. It said «אודות»
                // here, so the same URL carried two different names across the
                // site and inside the BreadcrumbList JSON-LD.
                { label: "עליי", href: "/about" },
                { label: m.name, href: `/team/${slug}` },
              ]}
            />
            <div className="mt-6 flex items-center gap-2.5">
              <span className="text-[0.7rem] leading-none text-gold" aria-hidden>◆</span>
              <span className="text-xs font-bold tracking-eyebrow text-gold-ink">{m.role}</span>
            </div>
            <SplitText
              as="h1"
              text={m.name}
              baseDelay={120}
              className="mt-4 font-serif font-black leading-[1.05] text-navy"
              style={{ fontSize: "var(--text-hero)" }}
            />
            {m.oneLiner && (
              <Reveal delay={120}>
                <p className="mt-5 max-w-[52ch] text-lg leading-relaxed text-muted">{m.oneLiner}</p>
              </Reveal>
            )}
            {m.credentials && m.credentials.length > 0 && (
              <Reveal delay={160}>
                <ul className="mt-6 grid gap-2">
                  {m.credentials.map((c) => (
                    <li key={c} className="flex items-start gap-2.5 text-sm leading-relaxed text-muted">
                      <span className="mt-1.5 text-[0.55rem] leading-none text-gold" aria-hidden>◆</span>
                      {c}
                    </li>
                  ))}
                </ul>
              </Reveal>
            )}
            <Reveal delay={200} className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="#lead"
                data-cta={`team-hero-${slug}`}
                className="rounded-[4px] bg-navy px-7 py-3.5 text-[0.95rem] font-bold text-white transition hover:bg-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
              >
                {cta.primary.short}
              </a>
              {site.phone && (
                <a
                  href={`tel:${site.phone}`}
                  data-cta={`team-hero-call-${slug}`}
                  dir="ltr"
                  className="rounded-[4px] border border-navy/20 px-7 py-3.5 text-[0.95rem] font-bold text-navy-700 transition hover:border-gold hover:text-gold-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                >
                  {site.phone}
                </a>
              )}
            </Reveal>
          </div>
          <Reveal>
            {m.photo ? (
              <Portrait src={m.photo.src} alt={m.photo.alt} variant="portrait" />
            ) : (
              <Monogram initial={m.name.trim().charAt(0)} variant="portrait" />
            )}
          </Reveal>
        </div>
      </Section>

      {/* ===== RECOGNITION — quiet monochrome logo strip (≤7) ===== */}
      {m.recognition && m.recognition.length > 0 && (
        <Section tone="white" pad="tight" border>
          <Reveal>
            <CredentialStrip items={[...m.recognition]} />
          </Reveal>
        </Section>
      )}

      {/* ===== NARRATIVE — the personal story, prose width ===== */}
      {m.narrative && m.narrative.length > 0 && (
        <Section tone="sand" width="prose" seam>
          <Reveal>
            <SectionHeading eyebrow="הסיפור" title={`הדרך של ${m.name}`} />
          </Reveal>
          <Reveal className="mt-8">
            <div className="space-y-5">
              {m.narrative.map((p) => (
                <p key={p.slice(0, 40)} className="text-[1.08rem] leading-relaxed text-muted">
                  {p}
                </p>
              ))}
            </div>
          </Reveal>
        </Section>
      )}

      {/* ===== Q&A — personal questions, native details/summary ===== */}
      {m.qa && m.qa.length > 0 && (
        <Section tone="white" width="prose" border>
          <Reveal>
            <SectionHeading eyebrow="היכרות אישית" title="שאלות ותשובות" />
          </Reveal>
          <Reveal className="mt-10">
            <FaqAccordion items={[...m.qa]} />
          </Reveal>
        </Section>
      )}

      {/* ===== CONVERT — navy band: direct contact + response promise + lead form ===== */}
      <Section tone="navy" id="lead" seam>
        <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-10 lg:gap-16">
          <Reveal as="div" className="order-2 md:order-1">
            <div className="flex items-center gap-2.5">
              <span className="text-[0.7rem] leading-none text-gold" aria-hidden>◆</span>
              <span className="text-xs font-bold tracking-eyebrow text-gold-soft">{m.name}</span>
            </div>
            <SplitText
              as="h2"
              // נקבה-יחיד, גוף ראשון — כמו כל מחרוזת אחרת באתר. הנוסח הקודם
              // («רוצים להתייעץ? דברו איתנו») היה זכר-רבים בקול של משרד, שריד
              // מהתבנית, והוא יושב בדיוק בבאנד ההמרה ש-/about שולח אליו את
              // הספקנית — הרגע שבו קול לא-אישי עולה הכי יקר.
              text={"רוצה לשמוע עוד?\nבואי נדבר."}
              lastLineClass="text-gold-soft"
              baseDelay={140}
              className="mt-4 font-serif font-black leading-[1.12] text-white"
              style={{ fontSize: "clamp(1.6rem, 3.2vw, 2.5rem)" }}
            />
            <ul className="mt-6 space-y-2 text-sm text-on-navy">
              {site.phone && (
                <li>
                  טלפון:{" "}
                  <a
                    href={`tel:${site.phone}`}
                    dir="ltr"
                    data-cta={`team-lead-phone-${slug}`}
                    className="font-semibold text-white hover:text-gold-soft"
                  >
                    {site.phone}
                  </a>
                </li>
              )}
              {site.email && (
                <li>
                  דוא״ל:{" "}
                  <a
                    href={`mailto:${site.email}`}
                    data-cta={`team-lead-email-${slug}`}
                    className="font-semibold text-white hover:text-gold-soft"
                  >
                    {site.email}
                  </a>
                </li>
              )}
            </ul>
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
