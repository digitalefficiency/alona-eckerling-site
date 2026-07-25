import type { NextConfig } from "next";
import { legacyRedirects } from "./src/lib/legacy-redirects";

const nextConfig: NextConfig = {
  // AVIF first, then WebP. Next's default is ["image/webp"] ONLY, so every
  // next/image on the site was serving WebP even to browsers advertising AVIF
  // support — roughly 20-30% more bytes than needed on a photo-heavy recipe
  // archive. `qualities` must list every quality value used in the codebase
  // (Next 16 rejects unlisted ones); 60 is used by the washed background
  // layers, 75 is the default for content images.
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [60, 75],
  },
  // Wix → new-site 301 migration (preserves the indexed recipe-archive equity on
  // the alonaeck.com domain). Map + rationale live in src/lib/legacy-redirects.ts.
  async redirects() {
    return legacyRedirects();
  },
};

export default nextConfig;
