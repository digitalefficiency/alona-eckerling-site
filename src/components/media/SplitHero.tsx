import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Reveal } from "@/components/Reveal";
import { SplitText } from "@/components/motion/SplitText";
import { ClipReveal } from "@/components/motion/ClipReveal";
import { Breadcrumbs } from "@/components/Breadcrumbs";

type Cta = { label: string; href: string; variant?: "primary" | "ghost"; dataCta?: string };

// Half text / half image hero for inner pages (the DESIGN.md "Editorial Hero"
// composition, generalized). Sand band by default; image revealed with the
// signature clip-wipe; title with the RTL ink-wipe.
export function SplitHero({
  image,
  alt,
  eyebrow,
  title,
  lead,
  crumbs,
  ctas,
  imageSide = "end",
  ratio = "feature",
  tone = "sand",
}: {
  image: string;
  alt: string;
  eyebrow?: string;
  title: string;
  lead?: string;
  crumbs?: { label: string; href: string }[];
  ctas?: Cta[];
  imageSide?: "start" | "end";
  ratio?: "feature" | "portrait";
  tone?: "sand" | "white";
}) {
  const ar = ratio === "portrait" ? "var(--aspect-portrait)" : "var(--aspect-feature)";

  const imageCol = (
    <Reveal>
      <div
        className="relative overflow-hidden rounded-[10px] border border-line"
        style={{ aspectRatio: ar }}
      >
        <ClipReveal src={image} alt={alt} sizes="(max-width:768px) 100vw, 580px" priority />
        <span className="tick tick-1" aria-hidden />
        <span className="tick tick-2" aria-hidden />
        <span className="tick tick-3" aria-hidden />
        <span className="tick tick-4" aria-hidden />
      </div>
    </Reveal>
  );

  const textCol = (
    <div>
      {crumbs && (
        <div className="mb-6">
          <Breadcrumbs items={crumbs} />
        </div>
      )}
      {eyebrow && (
        <Reveal className="flex items-center gap-2.5">
          <span className="text-[0.7rem] leading-none text-gold" aria-hidden>◆</span>
          <span className="text-xs font-bold tracking-[.2em] text-gold-ink">{eyebrow}</span>
        </Reveal>
      )}
      <SplitText
        as="h1"
        text={title}
        baseDelay={120}
        className="mt-4 font-serif font-black leading-[1.05] text-navy"
        style={{ fontSize: "var(--text-hero)" }}
      />
      {lead && (
        <Reveal delay={120}>
          <p className="mt-5 max-w-[52ch] text-lg leading-relaxed text-muted">{lead}</p>
        </Reveal>
      )}
      {ctas && ctas.length > 0 && (
        <Reveal delay={180} className="mt-8 flex flex-wrap gap-3">
          {ctas.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              data-cta={c.dataCta ?? "hero-cta"}
              className={
                c.variant === "ghost"
                  ? "rounded-[4px] border border-navy/20 px-7 py-3.5 text-[0.95rem] font-bold text-navy-700 transition hover:border-gold hover:text-gold-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                  : "rounded-[4px] bg-navy px-7 py-3.5 text-[0.95rem] font-bold text-white transition hover:bg-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
              }
            >
              {c.label}
            </Link>
          ))}
        </Reveal>
      )}
    </div>
  );

  return (
    <section data-light-hero className={`border-b border-line ${tone === "sand" ? "bg-sand" : "bg-card"}`}>
      <Container className="grid grid-cols-1 items-center gap-12 py-14 md:grid-cols-2 md:py-20">
        {imageSide === "end" ? (
          <>
            {textCol}
            {imageCol}
          </>
        ) : (
          <>
            {imageCol}
            {textCol}
          </>
        )}
      </Container>
    </section>
  );
}
