import Link from "next/link";
import { site, services, responsePromise } from "@/lib/site";
import { ResponsePromise } from "@/components/trust/ResponsePromise";

// Branded, CONVERTING 404 — premium-tier back-of-house (a lost visitor is still a
// visitor): the big 404 mark, a warm one-liner, primary recovery CTAs, live quick-links
// derived from site.ts services (never hardcoded), and an uncertainty-reducing contact
// row with the site's response promise. Every link carries data-cta ("404-*") so
// recovery-from-404 shows up in the funnel. Server component, SSR-final-state, no JS.
export default function NotFound() {
  const quickLinks = [...services]
    .sort((a, b) => Number(b.flagship ?? false) - Number(a.flagship ?? false))
    .slice(0, 3);

  return (
    <section className="relative isolate overflow-hidden bg-navy text-white">
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.07]"
        style={{ backgroundImage: "url('/media/texture/blueprint.webp')", backgroundSize: "cover", backgroundPosition: "center" }}
      />
      <div className="relative mx-auto flex min-h-[70vh] max-w-[var(--container-standard)] flex-col items-center justify-center px-6 py-24 text-center">
        <span className="text-[0.7rem] leading-none text-gold" aria-hidden>◆</span>
        <p className="mt-5 font-serif font-black leading-none text-gold-soft" style={{ fontSize: "clamp(4rem, 14vw, 8rem)" }}>
          404
        </p>
        <h1 className="mt-6 font-serif text-2xl font-bold text-white md:text-3xl">העמוד לא נמצא</h1>
        <p className="mt-3 max-w-[44ch] leading-relaxed text-slate-300">
          ייתכן שהקישור השתנה או שהעמוד הוסר. נשמח לכוון אתכם למקום הנכון.
        </p>

        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            data-cta="404-home"
            className="rounded-[4px] bg-gold px-7 py-3.5 text-[0.95rem] font-bold text-navy transition hover:bg-gold-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy"
          >
            חזרה לעמוד הבית
          </Link>
          <Link
            href="/contact"
            data-cta="404-contact"
            className="rounded-[4px] border border-white/30 px-7 py-3.5 text-[0.95rem] font-bold text-white transition hover:border-gold hover:text-gold-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            דברו איתנו
          </Link>
        </div>

        {/* live recovery paths — derived from site.ts, never hardcoded (flagship first) */}
        {quickLinks.length > 0 && (
          <nav aria-label="קיצורי דרך" className="mt-12">
            <p className="text-xs font-bold tracking-[.2em] text-gold-soft">אולי חיפשתם</p>
            <ul className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {quickLinks.map((s) => (
                <li key={s.slug} className="flex items-center gap-2">
                  <span className="text-[0.55rem] leading-none text-gold" aria-hidden>◆</span>
                  <Link
                    href={`/services/${s.slug}`}
                    data-cta={`404-service-${s.slug}`}
                    className="text-sm font-medium text-slate-200 underline-offset-4 transition hover:text-gold-soft hover:underline"
                  >
                    {s.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {/* uncertainty reduction — the response promise, right where someone got lost */}
        <div className="mt-10">
          <ResponsePromise promise={responsePromise.promise} sub={responsePromise.sub} tone="dark" />
        </div>

        {site.phone && (
          <a
            href={`tel:${site.phone}`}
            data-cta="404-tel"
            className="mt-4 text-sm font-bold text-white/70 underline-offset-4 transition hover:text-gold-soft hover:underline"
          >
            או חייגו: {site.phone}
          </a>
        )}
      </div>
    </section>
  );
}
