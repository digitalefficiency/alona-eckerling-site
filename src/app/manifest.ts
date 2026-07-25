import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { brand } from "@/brand.config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.legalName,
    short_name: site.name,
    description: site.description,
    start_url: "/",
    display: "standalone",
    lang: "he",
    dir: "rtl",
    // Read from brand.config rather than hand-copied hexes — the previous
    // background_color (#FBF6F1) was a leftover from the palette that was
    // replaced on 2026-07-19 and existed nowhere else in the codebase.
    // NOTE: `bg` lives in brand.extra, not brand.colors (which holds only the
    // 9 semantic roles) — reading it from brand.colors would be undefined.
    background_color: brand.extra.bg,
    theme_color: brand.colors.navy,
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any" },
      { src: "/apple-icon.png", type: "image/png", sizes: "180x180" },
    ],
  };
}
