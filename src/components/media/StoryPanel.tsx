import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/layout/Container";
import { Reveal } from "@/components/Reveal";
import { SplitText } from "@/components/motion/SplitText";

// Emerald "OUR STORY" pattern, generalized: a full-bleed architectural image with
// a floating octagon-chamfered navy panel — ◆ + English supertitle + body + a
// pill CTA. Reusable across pages; the panel sits on `panelSide` (RTL default
// "start" = right), and the image scrim deepens toward the panel for legibility.
const CHAMFER = 22;
const clip = `polygon(${CHAMFER}px 0, calc(100% - ${CHAMFER}px) 0, 100% ${CHAMFER}px, 100% calc(100% - ${CHAMFER}px), calc(100% - ${CHAMFER}px) 100%, ${CHAMFER}px 100%, 0 calc(100% - ${CHAMFER}px), 0 ${CHAMFER}px)`;

export function StoryPanel({
  kicker,
  image,
  alt,
  cta,
  panelSide = "start",
  imagePosition = "center",
  children,
}: {
  kicker: string;
  image: string;
  alt: string;
  cta: { label: string; href: string; external?: boolean; dataCta?: string };
  panelSide?: "start" | "end";
  imagePosition?: string;
  children: React.ReactNode;
}) {
  // RTL: "start" = right → scrim darkens toward the right (to left). "end" = left.
  const scrim =
    panelSide === "start"
      ? "linear-gradient(to left, rgba(10,30,63,.92) 0%, rgba(10,30,63,.6) 34%, rgba(10,30,63,.15) 64%, transparent 100%)"
      : "linear-gradient(to right, rgba(10,30,63,.92) 0%, rgba(10,30,63,.6) 34%, rgba(10,30,63,.15) 64%, transparent 100%)";

  const ctaClass =
    "mt-9 inline-flex items-center gap-2 rounded-full border border-gold/50 bg-gold-soft/10 px-6 py-3 text-sm font-bold text-gold-soft transition hover:bg-gold-soft/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-navy";

  return (
    <section className="relative overflow-hidden bg-navy">
      <div className="absolute inset-0">
        <Image src={image} alt={alt} fill sizes="100vw" className="object-cover" style={{ objectPosition: imagePosition }} />
        <div aria-hidden className="absolute inset-0" style={{ background: scrim }} />
      </div>

      <Container className="relative py-16 md:py-24">
        <Reveal className={`md:max-w-[600px] ${panelSide === "end" ? "md:ms-auto" : ""}`}>
          <div className="relative" style={{ clipPath: clip }}>
            <div className="relative bg-navy/92 px-8 py-10 backdrop-blur-sm md:px-12 md:py-14">
              <div
                aria-hidden
                className="absolute inset-0 opacity-[0.06]"
                style={{ backgroundImage: "url('/media/texture/blueprint.webp')", backgroundSize: "cover" }}
              />
              <div className="relative">
                <div className="flex items-center justify-end gap-3">
                  <span className="text-[0.7rem] leading-none text-gold" aria-hidden>◆</span>
                  <span className="h-px w-16 bg-gold/40" aria-hidden />
                  <SplitText as="p" text={kicker} className="font-serif tracking-wide text-gold-soft" style={{ fontSize: "clamp(1.6rem, 3.2vw, 2.4rem)" }} />
                </div>

                <div className="mt-7 space-y-4 text-right text-[1.05rem] leading-relaxed text-on-navy">
                  {children}
                </div>

                {cta.external ? (
                  <a href={cta.href} target="_blank" rel="noopener noreferrer" data-cta={cta.dataCta ?? "storypanel-cta"} className={ctaClass}>
                    <span aria-hidden>←</span>
                    {cta.label}
                  </a>
                ) : (
                  <Link href={cta.href} data-cta={cta.dataCta ?? "storypanel-cta"} className={ctaClass}>
                    <span aria-hidden>←</span>
                    {cta.label}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
