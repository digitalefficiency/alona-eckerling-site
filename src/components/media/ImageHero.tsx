import Link from "next/link";
import Image from "next/image";
import { HeroEntrance } from "@/components/HeroEntrance";
import { SplitText } from "@/components/motion/SplitText";
import { Breadcrumbs } from "@/components/Breadcrumbs";

type Cta = { label: string; href: string; variant?: "primary" | "ghost"; dataCta?: string };

// Full-bleed image hero for inner pages — generalizes EditorialHero's pattern
// (bg photo + RTL navy scrim + corner ticks + choreographed entrance), with
// breadcrumbs + configurable height. LCP-safe: the bg Image keeps `priority`.
export function ImageHero({
  image,
  alt,
  eyebrow,
  title,
  lead,
  crumbs,
  ctas,
  minH = "page",
  imagePosition = "center",
}: {
  image: string;
  alt: string;
  eyebrow?: string;
  title: string; // supports \n for multi-line ink-wipe
  lead?: string;
  crumbs?: { label: string; href: string }[];
  ctas?: Cta[];
  minH?: "page" | "full";
  imagePosition?: string;
}) {
  const minHClass = minH === "full" ? "min-h-[78vh] md:min-h-[86vh]" : "min-h-[46vh] md:min-h-[58vh]";
  return (
    <HeroEntrance className="relative isolate overflow-hidden bg-navy">
      <div className="hero-bg absolute inset-0 -z-10">
        <div className="clip-scale absolute inset-0">
          <Image src={image} alt={alt} fill priority fetchPriority="high" sizes="100vw" className="object-cover" style={{ objectPosition: imagePosition }} />
        </div>
        {/* RTL scrim in BRAND ink (color-mix on --color-navy, never a template
            literal): the ≥45% protected zone now reaches the 85% mark so the
            eyebrow + lede stay legible over bright food photography. */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to left, color-mix(in srgb, var(--color-navy) 82%, transparent) 0%, color-mix(in srgb, var(--color-navy) 55%, transparent) 45%, color-mix(in srgb, var(--color-navy) 30%, transparent) 85%, transparent 100%), linear-gradient(to bottom, color-mix(in srgb, var(--color-navy) 50%, transparent), transparent 32%)",
          }}
        />
      </div>

      <div className={`mx-auto flex ${minHClass} max-w-[var(--container-wide)] flex-col justify-center px-6 py-16 text-right`}>
        {crumbs && (
          <div className="mb-6 flex justify-end">
            <Breadcrumbs items={crumbs} tone="dark" />
          </div>
        )}
        {eyebrow && (
          <div className="hero-eyebrow flex items-center justify-end gap-2.5">
            <span className="text-xs font-bold tracking-[.2em] text-gold-soft">{eyebrow}</span>
            <span className="text-[0.7rem] leading-none text-gold" aria-hidden>◆</span>
          </div>
        )}
        <SplitText
          as="h1"
          text={title}
          baseDelay={140}
          className="mt-5 font-serif font-black leading-[1.05] text-white"
          style={{ fontSize: "var(--text-hero)" }}
        />
        {lead && (
          <p className="hero-lead mt-6 max-w-[46ch] self-end text-lg leading-relaxed text-slate-200">{lead}</p>
        )}
        {ctas && ctas.length > 0 && (
          <div className="hero-cta mt-8 flex flex-wrap justify-end gap-3">
            {ctas.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                data-cta={c.dataCta ?? "hero-cta"}
                className={
                  c.variant === "ghost"
                    ? "rounded-[4px] border border-white/30 px-7 py-3.5 text-[0.95rem] font-bold text-white transition hover:border-gold hover:text-gold-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    : "rounded-[4px] bg-gold px-7 py-3.5 text-[0.95rem] font-bold text-navy transition hover:bg-gold-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy"
                }
              >
                {c.label}
              </Link>
            ))}
          </div>
        )}
      </div>

      <span className="tick tick-1" aria-hidden />
      <span className="tick tick-2" aria-hidden />
      <span className="tick tick-3" aria-hidden />
      <span className="tick tick-4" aria-hidden />
    </HeroEntrance>
  );
}
