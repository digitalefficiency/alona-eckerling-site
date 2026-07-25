import Link from "next/link";
import Image from "next/image";
import { HeroEntrance } from "@/components/HeroEntrance";
import { SplitText } from "@/components/motion/SplitText";
import { Breadcrumbs } from "@/components/Breadcrumbs";

type Cta = { label: string; href: string; variant?: "primary" | "ghost"; dataCta?: string };

// Split image hero for inner pages — the photo is an OBJECT, never a backdrop.
// Navy ink on an OPAQUE sand field (the house light-hero band), with the dish
// cropped into a double-framed plate that fills the inline-start column and
// bleeds off the screen edge — the same frame language as the /coaching hero —
// and a straight gold seam carrying the ◆ structure mark where the photo field
// meets the sand. No scrim: the dish is lit by the page, not veiled by it, so the
// text's contrast comes from the opaque field, never from a gradient poured over
// the food (this is the ONE page where the photos are the proof-of-craft).
//
// A CSS grid keeps the plate and the ink in one coordinate system, so the two
// fields never diverge on wide screens. Mobile stacks: the whole plate (frame +
// all four ticks) sits above the ink.
//
// LCP-safe: the plate's Image keeps `priority` and stays STATIC (an animated hero
// photo costs seconds of LCP — see globals.css); the hero's life comes from the
// eyebrow/lead/CTA choreography instead.
export function ImageHero({
  image,
  alt,
  eyebrow,
  title,
  lead,
  crumbs,
  ctas,
  ctaNote,
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
  /** optional micro line just above the CTA row (e.g. a question whose answer
      is the button) — keeps the button single-action instead of a framed
      paragraph; rides inside the .hero-cta block so it animates with it. */
  ctaNote?: string;
  minH?: "page" | "full";
  imagePosition?: string;
}) {
  const minHClass = minH === "full" ? "md:min-h-[86vh]" : "md:min-h-[58vh]";
  return (
    <HeroEntrance className="relative isolate overflow-hidden border-b border-line bg-sand">
      <div className={`grid grid-cols-1 md:grid-cols-[42%_1fr] ${minHClass}`}>
        {/* the dish as a framed plate. Mobile: complete object in flow (frame +
            all four ticks), margins intact. md+: fills the column and butts to the
            inline-start screen edge, rounded only on the inner side — the picture
            continues past the page instead of floating as a card. */}
        {/* md+: the plate grows to fill the grid track via flex — a percentage
            height (h-full) collapses against a stretched grid item, and the
            unlayered .frame-double{position:relative} blocks md:absolute. */}
        <div className="relative order-1 md:flex md:flex-col">
          <div className="frame-double relative mx-4 my-8 aspect-[3/2] rounded-[10px] [--frame-color:var(--color-gold)] [--frame-gap:6px] sm:mx-6 md:m-0 md:aspect-auto md:min-h-0 md:flex-1 md:rounded-none md:rounded-e-[10px]">
            {/* inner clip only — the plate itself must not hide frame-double's ::after */}
            <div className="absolute inset-0 overflow-hidden rounded-[inherit]">
              <Image
                src={image}
                alt={alt}
                fill
                priority
                fetchPriority="high"
                sizes="(max-width: 768px) 100vw, 45vw"
                className="object-cover"
                style={{ objectPosition: imagePosition }}
              />
              {/* the ONE shared image grade: brand tint + the shared grain token */}
              <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "var(--grade-tint)" }} />
              <div aria-hidden className="grain-overlay" />
            </div>
            <span className="tick tick-1" aria-hidden />
            <span className="tick tick-2" aria-hidden />
            <span className="tick tick-3" aria-hidden />
            <span className="tick tick-4" aria-hidden />
          </div>
        </div>

        {/* the ink field — navy ink on opaque sand */}
        <div className="order-2 flex flex-col justify-center px-6 py-14 md:py-20 md:ps-12 lg:ps-16">
          <div className="w-full max-w-[46ch]">
            {crumbs && (
              <div className="mb-6">
                <Breadcrumbs items={crumbs} />
              </div>
            )}
            {eyebrow && (
              <div className="hero-eyebrow flex items-center gap-2.5">
                <span className="text-[0.7rem] leading-none text-gold" aria-hidden>◆</span>
                <span className="text-xs font-bold tracking-eyebrow text-gold-ink">{eyebrow}</span>
              </div>
            )}
            <SplitText
              as="h1"
              autoplay
              text={title}
              baseDelay={140}
              className="mt-5 font-serif font-black leading-[1.05] text-navy"
              style={{ fontSize: "var(--text-hero)" }}
            />
            {lead && <p className="hero-lead mt-6 text-lg leading-relaxed text-muted">{lead}</p>}
            {ctas && ctas.length > 0 && (
              <div className="hero-cta mt-8">
                {ctaNote && <p className="mb-3 text-sm text-muted">{ctaNote}</p>}
                <div className="flex flex-wrap gap-3">
                  {ctas.map((c) => (
                    <Link
                      key={c.href}
                      href={c.href}
                      data-cta={c.dataCta ?? "hero-cta"}
                      className={
                        c.variant === "ghost"
                          ? "btn-chamfer inline-flex items-center rounded-[6px] border border-navy/20 px-7 py-3.5 text-[0.95rem] font-bold text-navy-700 transition hover:border-gold hover:text-gold-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-sand"
                          : "btn-chamfer inline-flex items-center rounded-[6px] bg-gold px-7 py-3.5 text-[0.95rem] font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-sand"
                      }
                    >
                      {c.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* the seam: a straight gold hairline in the gutter where the plate field
          meets the sand, the ◆ structure mark riding its centre (its sand box
          masks the line). Geometry only — it divides the two fields, never the
          photo. md+ only, since the fields stack on mobile. */}
      <span
        aria-hidden
        className="absolute inset-y-0 start-[42%] hidden w-px bg-gold/25 md:flex md:items-center md:justify-center"
      >
        <span className="bg-sand px-1.5 text-[0.7rem] leading-none text-gold">◆</span>
      </span>
    </HeroEntrance>
  );
}
