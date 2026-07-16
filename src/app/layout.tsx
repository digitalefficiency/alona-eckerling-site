import type { Metadata } from "next";
import { Heebo, Frank_Ruhl_Libre } from "next/font/google";
import { MotionConfig } from "motion/react";
import "./globals.css";
import { brand, brandStyle, applyMode } from "@/brand.config";
import { site, allowIndexing } from "@/lib/site";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { StickyContactBar } from "@/components/StickyContactBar";
import { EvidenceCursor } from "@/components/EvidenceCursor";
import { MarketingBootstrap } from "@/components/MarketingBootstrap";
import { CookieConsent } from "@/components/CookieConsent";
import { AccessibilityMenu } from "@/components/AccessibilityMenu";
import { ChromeGate } from "@/components/ChromeGate";

// Fonts: DISPLAY (serif) + BODY (sans). Both carry Latin + Hebrew subsets, so they
// render correctly in rtl AND ltr. Swap here per brand (see brand.config.fonts).
const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-heebo",
  display: "swap",
});
const frankRuhl = Frank_Ruhl_Libre({
  subsets: ["hebrew", "latin"],
  weight: ["500", "700", "900"],
  variable: "--font-frank-ruhl",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.legalName, template: `%s | ${site.name}` },
  description: site.description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: brand.direction === "rtl" ? "he_IL" : "en_US",
    siteName: site.name,
    title: site.legalName,
    description: site.tagline,
    url: site.url,
  },
  // Gated: NOINDEX until NEXT_PUBLIC_ALLOW_INDEXING="true" at the real public launch.
  robots: allowIndexing ? { index: true, follow: true } : { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang={brand.lang}
      dir={brand.direction}
      data-scroll-behavior="smooth"
      // applyMode composed LAST so the polarity roles (bg/card/ink/sand/gold) win
      // over brandStyle's palette values. "light" emits {} — a no-op for light sites.
      style={{ ...brandStyle(), ...applyMode(brand.mode) }}
      className={`${heebo.variable} ${frankRuhl.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col overflow-x-hidden bg-bg text-ink font-sans">
        {/* The single global motion gate: every motion/react component (the
            M-primitives) inherits reducedMotion="user", so prefers-reduced-motion
            disables transform/layout animation library-wide. The a11y-menu gate
            (html.a11y-stop-motion) is enforced separately in lib/motion.ts.
            MotionConfig renders no DOM and is safe around server children. */}
        <MotionConfig reducedMotion="user">
          {/* ChromeGate: the public site's chrome, hidden on the CMS content desk
              (/admin) so an editing session never sees the marketing nav, the
              consent banner, or fires the analytics bootstrap. No-op elsewhere. */}
          <ChromeGate>
            <Header />
          </ChromeGate>
          <main className="flex-1">{children}</main>
          <ChromeGate>
            <Footer />
            <StickyContactBar />
            <EvidenceCursor />
            <AccessibilityMenu />
            <CookieConsent />
            <MarketingBootstrap />
          </ChromeGate>
        </MotionConfig>
      </body>
    </html>
  );
}
