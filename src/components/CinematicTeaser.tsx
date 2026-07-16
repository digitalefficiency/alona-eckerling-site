import Link from "next/link";
import Image from "next/image";
import { SectionHeading } from "@/components/SectionHeading";
import { Reveal } from "@/components/Reveal";

// Compact homepage entry-point to the full cinematic on /story. A single navy
// "moment" (poster + heading + CTA) — NO scroll owner here (the page keeps a
// single scroll owner; the scrubbed experience lives only on /story).
export function CinematicTeaser() {
  return (
    <section className="relative isolate overflow-hidden bg-navy">
      <div className="absolute inset-0 -z-10">
        <Image
          src="/media/building/stage-7.webp"
          alt=""
          aria-hidden
          fill
          sizes="100vw"
          className="object-cover object-center opacity-35"
        />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(900px 400px at 50% 120%, rgba(200,164,92,.14), transparent 60%), linear-gradient(to bottom, rgba(10,30,63,.85), rgba(10,30,63,.6))",
          }}
        />
      </div>

      <div className="mx-auto flex min-h-[58vh] max-w-[var(--container-standard)] flex-col items-center justify-center px-6 py-24 text-center md:min-h-[66vh]">
        <SectionHeading
          tone="dark"
          align="center"
          eyebrow="חוויית גלילה"
          title="קומה אחר קומה"
          lead="הבניין עולה ככל שגוללים — וכל קומה מספרת פרק מהמשרד: מהמייסדת, דרך הדורות, אל השירותים."
        />
        <Reveal delay={140}>
          <Link
            href="/story"
            data-cta="cinematic-teaser"
            className="mt-9 inline-flex items-center gap-2 rounded-[4px] bg-gold px-7 py-3.5 font-bold text-navy transition hover:bg-gold-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy"
          >
            חוו את הסיפור ›
          </Link>
        </Reveal>
      </div>

      <span className="tick tick-1" aria-hidden />
      <span className="tick tick-2" aria-hidden />
      <span className="tick tick-3" aria-hidden />
      <span className="tick tick-4" aria-hidden />
    </section>
  );
}
