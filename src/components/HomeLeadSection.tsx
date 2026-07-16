import Link from "next/link";
import { site } from "@/lib/site";
import { Section } from "@/components/layout/Section";
import { Reveal } from "@/components/Reveal";
import { SplitText } from "@/components/motion/SplitText";
import { ContactLeadForm } from "@/components/ContactLeadForm";

// Closing conversion section for the homepage (Emerald "got a question?" layout):
// a "talk to us / our details" column beside the lead form. Navy band → footer.
export function HomeLeadSection() {
  return (
    <Section tone="navy" id="lead" seam>
      <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-10 lg:gap-16">
        {/* talk-to-us column */}
        <Reveal as="div" className="order-2 text-right md:order-1">
          <div className="flex items-center justify-end gap-2.5">
            <span className="text-xs font-bold tracking-[.2em] text-gold-soft">דברו איתנו</span>
            <span className="text-[0.7rem] leading-none text-gold" aria-hidden>◆</span>
          </div>

          <SplitText
            as="h2"
            text={"נשמח לשמוע\nעל המקרה שלכם."}
            lastLineClass="text-gold"
            baseDelay={140}
            className="mt-4 font-serif font-black leading-[1.12] text-white"
            style={{ fontSize: "clamp(1.6rem, 3.2vw, 2.5rem)" }}
          />

          <p className="mt-6 max-w-[46ch] self-end text-lg leading-relaxed text-slate-200">
            שיחת ייעוץ ראשונית, ללא התחייבות — נבין איפה אתם עומדים ונאמר לכם מה האפשרויות.
          </p>

          <div className="mt-8 border-t border-white/10 pt-6">
            <p className="text-sm font-semibold text-gold-soft">יש לכם שאלה? מוזמנים לפנות ישירות:</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-200">
              <li>{site.address.city}, {site.address.region}</li>
              {site.phone && (
                <li>
                  טלפון:{" "}
                  <a href={`tel:${site.phone}`} dir="ltr" data-cta="home-lead-phone" className="font-semibold text-white hover:text-gold-soft">
                    {site.phone}
                  </a>
                </li>
              )}
              {site.email && (
                <li>
                  דוא״ל:{" "}
                  <a href={`mailto:${site.email}`} data-cta="home-lead-email" className="font-semibold text-white hover:text-gold-soft">
                    {site.email}
                  </a>
                </li>
              )}
            </ul>
            <Link
              href="/contact"
              data-cta="home-lead-contact"
              className="mt-4 inline-block text-sm font-bold text-gold transition hover:text-gold-soft"
            >
              לעמוד יצירת הקשר ›
            </Link>
          </div>
        </Reveal>

        {/* the lead form (white card pops on navy) */}
        <Reveal className="order-1 md:order-2">
          <ContactLeadForm />
        </Reveal>
      </div>
    </Section>
  );
}
