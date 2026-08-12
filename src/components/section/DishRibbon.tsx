"use client";

import Image from "next/image";
import { useMotionAllowed } from "@/lib/motion";

// DishRibbon — the marquee archetype carrying PHOTOGRAPHS instead of words: a
// slow, continuous band of Alona's own dishes. Its job is proof-of-craft — "a
// dietitian who really cooks" made visible as a living wall of real food, not a
// stock grid. Sibling of <Marquee/> (which carries short text); kept separate
// because the image version needs uniform tiles, an edge mask, and a far slower
// pass than a credential ticker.
//
// SPEED IS THE DESIGN. A logo carousel runs ~20-40s and reads as a ticker; this
// site's register is "הקול השקט" (still-calm), so one pass is --dur-drift (96s).
// It drifts, it never runs. Slower than feels right in review — that is the point.
//
// The loop is CSS (.dish-ribbon-track in globals.css), not a JS animation:
//   • transform-only, so it runs on the compositor and costs no main-thread work
//     on a band that is always animating;
//   • it pauses on :hover AND :focus-within, so a reader who wants to look at one
//     dish can stop it — a real affordance, not decoration;
//   • its reduced-motion / a11y-stop-motion twins live beside every other
//     static twin in globals.css, which is the house pattern.
//
// House rule #1 (the reactive gate releases mid-flight): when motion is not
// allowed this renders a STATIC WRAPPED row — every tile visible, nothing left
// clipped off-canvas by overflow:hidden. Motion is the garnish, never the content.
//
// RTL NOTE (found by measuring the mockup, not by reading): the overflow
// container is forced dir="ltr". On an RTL page an overflowing child is anchored
// to the container's RIGHT edge, so a negative translateX walks the whole track
// off canvas and the band renders BLANK. The tiles carry no text, so an LTR track
// is invisible to the reader and makes the transform direction-independent.

export type DishTile = {
  src: string;
  alt: string;
  /** where this dish lives on her feed — omit and the tile stays a plain still */
  href?: string;
};

const TILE =
  "w-[152px] flex-none overflow-hidden rounded-[14px] bg-sand shadow-(--elevation-1) sm:w-[184px] md:w-[212px]";
// Spacing rides on each tile as margin-inline-end, NOT as flex `gap`. With `gap`
// a 2N-child track measures 2N·tile + (2N−1)·gap, so translateX(-50%) lands half
// a gap short of the seam and the loop visibly hitches once per pass. With a
// per-tile margin every child occupies exactly tile+margin, the track is exactly
// two repeats, and -50% is exactly one repeat. This is why the gap is not here.
const TILE_GAP = "me-3 sm:me-4 md:me-[18px]";
const STATIC_GAP = "gap-3 sm:gap-4 md:gap-[18px]";

export function DishRibbon({
  tiles,
  className = "",
  linkHint,
}: {
  tiles: readonly DishTile[];
  className?: string;
  /** appended to a linked tile's accessible name, e.g. "לצפייה באינסטגרם…" */
  linkHint?: string;
}) {
  const allowed = useMotionAllowed();

  // `dup` marks the DUPLICATE pass — a seamless -50% loop needs the tiles twice,
  // but a screen reader must hear each dish exactly once.
  const row = (dup: boolean, spaced = true) =>
    tiles.map((t, i) => {
      const key = `${dup ? "b" : "a"}-${i}`;
      const cls = `${TILE} ${spaced ? TILE_GAP : ""}`;
      const media = (
        <Image
          src={t.src}
          alt={dup ? "" : t.alt}
          width={424}
          height={530}
          // UNOPTIMIZED ON PURPOSE. The tiles are pre-cut to 424x530 — a true 2x of
          // the 212px slot — and land at ~52KB each, so the optimizer has nothing
          // left to win. Routing them through it instead cost 26 transform requests
          // on first paint (13 tiles × the duplicate pass), and under that burst the
          // optimizer returned 400 "internal response is invalid" for 9 of 13 —
          // measured, and reproducible: the same URLs all return 200 when requested
          // serially. Taking the optimizer out of the path fixes the burst rather
          // than hoping it holds.
          unoptimized
          loading={dup ? "lazy" : undefined}
          className="block h-full w-full object-cover transition-transform duration-[var(--dur-micro)] group-hover:scale-[1.04]"
        />
      );

      // A LINKED TILE, but only on the real pass. The duplicate exists solely to
      // make the -50% loop seamless; turning its tiles into anchors too would put
      // every dish in the tab order twice and announce it twice, which is exactly
      // the failure aria-hidden was already guarding against on the figure. So the
      // duplicate stays an inert, aria-hidden figure even when a href exists.
      if (t.href && !dup) {
        return (
          <a
            key={key}
            href={t.href}
            target="_blank"
            rel="noopener noreferrer"
            data-cta="ribbon-social"
            // the alt describes the dish; the hint says where the click goes, so
            // the link has a purpose in its accessible name rather than just a noun
            aria-label={linkHint ? `${t.alt}. ${linkHint}` : t.alt}
            className={`${cls} group relative block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2`}
          >
            {media}
          </a>
        );
      }

      return (
        <figure key={key} className={cls} {...(dup ? { "aria-hidden": true } : {})}>
          {media}
        </figure>
      );
    });

  // The mask dissolves both ends into the paper instead of cutting them — the
  // single detail that separates "editorial band" from "ticker".
  const mask =
    "[mask-image:linear-gradient(90deg,transparent,#000_9%,#000_91%,transparent)] [-webkit-mask-image:linear-gradient(90deg,transparent,#000_9%,#000_91%,transparent)]";

  if (!allowed) {
    // static twin: wrapped, centred, fully present. No mask — nothing is moving,
    // so a faded edge would just look like a rendering bug.
    return (
      <div dir="ltr" className={`flex flex-wrap justify-center ${STATIC_GAP} ${className}`}>
        {row(false, false)}
      </div>
    );
  }

  return (
    <div dir="ltr" className={`dish-ribbon overflow-hidden ${mask} ${className}`}>
      {/* ONE flat flex of 2N children — see TILE_GAP on why the spacing is a margin */}
      <div className="dish-ribbon-track flex w-max flex-nowrap">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
