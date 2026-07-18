import type { NextConfig } from "next";
import { legacyRedirects } from "./src/lib/legacy-redirects";

const nextConfig: NextConfig = {
  transpilePackages: ["three"],
  // Wix → new-site 301 migration (preserves the indexed recipe-archive equity on
  // the alonaeck.com domain). Map + rationale live in src/lib/legacy-redirects.ts.
  async redirects() {
    return legacyRedirects();
  },
};

export default nextConfig;
