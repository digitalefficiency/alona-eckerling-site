"use client";

import { useState } from "react";
import { brand } from "@/brand.config";
import { site } from "@/lib/site";
import { BrandLockup } from "@/components/BrandLockup";

// Renders the brand logo, falling back through a chain rather than straight to a
// wordmark, so a client who supplied only one logo file still gets their MARK:
//   dark site:  logo-dark.png → logo.png (silhouetted white) → wordmark
//   light site: logo.png → wordmark
// `light` forces a flat-white treatment (for a navy/dark band on a light site).
// `dark`/`light` props still override for callers that know their surface; when
// neither is passed the component reads brand.mode so the desk (which renders on
// the page surface, not a fixed band) gets the right asset automatically.
export function BrandLogo({
  className = "h-7",
  light = false,
  dark = false,
  variant = "compact",
}: {
  className?: string;
  light?: boolean;
  dark?: boolean;
  /** "compact" (name + avocado) for tight chrome slots; "full" for the footer */
  variant?: "full" | "compact";
}) {
  const isDarkSurface = dark || (!light && brand.mode !== "light");
  // step 0 = preferred asset, 1 = the other asset silhouetted, 2 = wordmark.
  // No logo supplied yet (brand.logo.supplied=false) → straight to the wordmark:
  // no 404 chain, no broken-image flash while the client's original is pending.
  const [step, setStep] = useState(brand.logo?.supplied ? 0 : 2);

  if (step < 2) {
    const preferDark = isDarkSurface;
    const primary = preferDark ? "/media/logo-dark.png" : "/media/logo.png";
    const secondary = preferDark ? "/media/logo.png" : "/media/logo-dark.png";
    const src = step === 0 ? primary : secondary;
    // On a dark surface a flat-white knockout makes a light-only logo readable;
    // an explicit `light` band does the same on a light site.
    const knockout = (light && !dark) || (isDarkSurface && step === 1);
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={brand.name}
        className={className}
        style={knockout ? { filter: "brightness(0) invert(1)" } : undefined}
        onError={() => setStep((s) => s + 1)}
      />
    );
  }
  // Step 2 is no longer a bare name in the body serif — it is Alona's actual
  // two-line lockup, drawn as vector (components/BrandLockup). It keeps the same
  // `h-* w-auto` contract the <img> had, so every call site is untouched, and it
  // recolours per surface: sage on paper, white on the navy bands. The avocado
  // keeps its own palette on both, which a knocked-out raster could not do.
  return (
    <BrandLockup
      title={site.name}
      variant={variant}
      className={`${className} ${isDarkSurface || light ? "text-white" : "text-gold-ink"}`}
    />
  );
}
