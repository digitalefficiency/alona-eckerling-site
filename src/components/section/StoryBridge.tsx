import Image from "next/image";
import { MScrollScene } from "@/components/motion/MScrollScene";
import { MStagger } from "@/components/motion/MStagger";
import { slideIn, fadeUp } from "@/lib/motion-variants";

// StoryBridge — the story-short between the hero room and the scroll film
// («חדרים מצולמים», Rom's call 2026-07-20): three photo BEATS, each a
// non-pinned MScrollScene room (the page's single pin stays the film) with
// ONE thought-card arriving from a meaningful side. Beat 3 is generated with
// the film's opening frame as reference, so the next scroll into the film
// reads as a match-cut, not a jump.
//
// Prop-driven, ZERO copy inside (the SequenceFilm house rule) — beats come
// from COPY.md « סקשן 1ב » via page consts. Static twin is built into the
// primitives: SSR / no-JS / reduced-motion render finished rooms + cards.

export type BridgeBeat = {
  src: string;
  alt: string; // decorative rooms still get a described alt in COPY (rendered aria-hidden here)
  side: "inline-start" | "inline-end" | "center";
  big: string;
  small?: string;
};

export function StoryBridge({ beats }: { beats: readonly BridgeBeat[] }) {
  return (
    <section className="relative">
      {beats.map((b) => (
        <MScrollScene
          key={b.src}
          amplitude={5}
          className="flex min-h-[72svh] items-center"
          media={
            <>
              <Image src={b.src} alt="" fill sizes="100vw" quality={60} className="object-cover" />
              <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "var(--grade-tint)" }} />
              {/* mid-page material diet */}
              <div aria-hidden className="grain-overlay" style={{ "--grain-opacity": "0.035" } as React.CSSProperties} />
            </>
          }
          contentClassName="w-full"
        >
          <div className="mx-auto w-full max-w-[var(--container-wide)] px-4 py-20 sm:px-6 md:py-24">
            <MStagger
              variants={b.side === "center" ? fadeUp : slideIn(b.side, 48)}
              className={
                // the card LANDS on the side it entered from (logical, RTL-safe):
                // start-entrance rests at the start edge, end at end, beat 3 centers
                b.side === "center"
                  ? "flex justify-center"
                  : b.side === "inline-end"
                    ? "flex justify-end"
                    : "flex justify-start"
              }
            >
              {/* the thought-card — paper over the room, never bare text on photo */}
              <figure className="max-w-[440px] rounded-[14px] border border-line bg-bg/95 p-6 shadow-[var(--elevation-2)] md:bg-bg/90 md:p-7 md:backdrop-blur-md">
                <span className="text-[0.6rem] leading-none text-gold" aria-hidden>◆</span>
                <blockquote className="mt-2.5 font-serif text-xl font-bold leading-snug text-navy md:text-2xl">
                  {b.big}
                </blockquote>
                {b.small && (
                  <figcaption className="mt-2.5 text-[0.95rem] leading-relaxed text-muted">{b.small}</figcaption>
                )}
              </figure>
            </MStagger>
          </div>
        </MScrollScene>
      ))}
    </section>
  );
}
