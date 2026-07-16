import Link from "next/link";
import Image from "next/image";

type Item = { slug: string; title: string; short: string; detail: string };

// Emerald "WHAT WE DO" pattern: skewed image panels that expand on hover/focus to
// reveal a short lead + a scope detail (≈75% fill, with breathing room). Pure CSS
// (no JS): a 0fr→1fr grid row animates the height open. Desktop = horizontal skewed
// accordion; mobile = stacked image bars (no skew). Each panel links to the service.
export function ExpandingPanels({ items }: { items: Item[] }) {
  return (
    <div className="flex flex-col gap-2 overflow-hidden lg:h-[440px] lg:flex-row lg:gap-0 lg:rounded-[10px]">
      {items.map((s) => (
        <Link
          key={s.slug}
          href={`/services/${s.slug}`}
          aria-label={s.title}
          data-cta={`expanding-panel-${s.slug}`}
          className="group relative block h-[128px] overflow-hidden rounded-[10px] border-card transition-[flex-grow] duration-[calc(var(--dur-reveal)*0.6)] ease-[var(--ease-out)] focus:outline-none focus-visible:ring-2 focus-visible:ring-gold lg:h-auto lg:grow lg:basis-0 lg:rounded-none lg:border-x-2 lg:[transform:skewX(-6deg)] lg:hover:grow-[2.6] lg:focus:grow-[2.6]"
        >
          {/* image — counter-skewed + overscaled to fill the parallelogram */}
          <div className="absolute inset-0 lg:[transform:skewX(6deg)_scale(1.35)]">
            <Image
              src={`/media/services/${s.slug}.webp`}
              alt=""
              aria-hidden
              fill
              sizes="(max-width:1024px) 100vw, 60vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-navy/85 via-navy/35 to-navy/15" />
            {/* deepen the scrim on expand — more image shows, so keep text legible */}
            <div aria-hidden className="absolute inset-0 bg-navy/0 transition-colors duration-500 group-hover:bg-navy/45 group-focus:bg-navy/45" />
          </div>

          {/* content — counter-skewed back to upright */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center lg:[transform:skewX(6deg)] lg:px-8">
            <span className="rounded-[4px] border border-gold/50 bg-navy/80 px-4 py-2 font-serif text-lg font-bold text-gold-soft backdrop-blur lg:text-xl">
              {s.title}
            </span>

            {/* hover/focus detail — smooth 0fr→1fr open, ~75% fill with breathing room */}
            <div className="grid grid-rows-[0fr] opacity-0 transition-all duration-500 ease-[var(--ease-out)] group-hover:mt-4 group-hover:grid-rows-[1fr] group-hover:opacity-100 group-focus:mt-4 group-focus:grid-rows-[1fr] group-focus:opacity-100">
              <div className="overflow-hidden">
                <p className="mx-auto max-w-[40ch] font-semibold leading-snug text-white">{s.short}</p>
                <p className="mx-auto mt-2.5 max-w-[46ch] text-sm leading-relaxed text-slate-200">{s.detail}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 rounded-[4px] border border-gold/40 bg-navy/40 px-4 py-2 text-sm font-bold text-gold-soft">
                  למדריך המלא
                  <span aria-hidden className="text-gold">›</span>
                </span>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
