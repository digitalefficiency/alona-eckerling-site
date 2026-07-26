import type { CSSProperties } from "react";
import Image from "next/image";

// PaperTexture — a DECORATIVE band of Alona's own kitchen material (baking paper,
// stone counter, granola, greens), pre-washed at build time toward --brand-bg with a
// sage breath, so it reads as WARM TEXTURE and never as a photograph competing for
// attention. This is layer A of MEDIA-PLAN §2: the answer to "photo as a section
// background" for 9:16 phone material that has no quiet zone of its own.
//
// WHY pre-washed rather than opacity-only: the sources are busy, warm-to-orange food
// shots; lowering opacity alone leaves hue that fights «ירוק צלול». The wash
// (lift 0.66 · desat 0.55 · sage tint 0.14 · grain) is baked into the asset, measured
// at 5.7:1–8.5:1 against --brand-ink, so text over it clears AA with room to spare.
//
// Contract: STATIC (no JS) → reduced-motion-safe by construction. Absolute layer —
// drop it inside a `relative` section and keep content in a higher layer. Lives in
// /media/texture/ (lint-media's sanctioned decorative home), NOT /media/client/:
// these are derived texture plates, not the client's photographs as content.
//
// Text rule (inherited from the rooms that already do this): headings still ride
// their own opaque/milky card whenever a band runs UNDER a long measure. The wash
// buys warmth, it does not buy permission to put small body text on a photo.

export type PaperTextureName = "marble" | "paper" | "granola" | "herbs" | "greens";

export function PaperTexture({
  name = "marble",
  className = "",
  opacity = 0.85,
  position = "center",
  fade = true,
}: {
  name?: PaperTextureName;
  className?: string;
  /** extra headroom on top of the baked-in wash; 1 = the plate as authored */
  opacity?: number;
  /** object-position, e.g. "center", "top", "50% 30%" */
  position?: string;
  /** radial mask so the band dissolves at its edges instead of cutting */
  fade?: boolean;
}) {
  const mask = "radial-gradient(ellipse 92% 78% at 50% 45%, #000 42%, transparent 92%)";
  const style: CSSProperties = fade
    ? { opacity, WebkitMaskImage: mask, maskImage: mask }
    : { opacity };

  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} style={style}>
      <Image
        src={`/media/texture/band-${name}.jpg`}
        alt=""
        fill
        quality={60}
        sizes="100vw"
        className="object-cover"
        style={{ objectPosition: position }}
      />
      {/* the house grain rides on top so the plate joins the site's one paper grade */}
      <div className="grain-overlay" style={{ "--grain-opacity": "0.03" } as CSSProperties} />
    </div>
  );
}
