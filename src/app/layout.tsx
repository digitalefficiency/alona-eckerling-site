import type { Metadata } from "next";
import { Assistant, Frank_Ruhl_Libre } from "next/font/google";
import { MotionConfig } from "motion/react";
import "./globals.css";
import { brand, brandStyle, applyMode, applyMotionPersonality, applyCharacter } from "@/brand.config";
import { site, allowIndexing } from "@/lib/site";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { StickyContactBar } from "@/components/StickyContactBar";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";
import { EvidenceCursor } from "@/components/EvidenceCursor";
import { MarketingBootstrap } from "@/components/MarketingBootstrap";
import { CookieConsent } from "@/components/CookieConsent";
import { AccessibilityMenu } from "@/components/AccessibilityMenu";
import { ChromeGate } from "@/components/ChromeGate";

// Fonts: DISPLAY (serif) + BODY (sans). Both carry Latin + Hebrew subsets, so they
// render correctly in rtl AND ltr. Swap here per brand (see brand.config.fonts).
// Alona: Assistant — the peer-close humanist sans (DESIGN-DIRECTION "הקול השקט").
const assistant = Assistant({
  subsets: ["hebrew", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-body",
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
      // Composition order: palette → motion temperament (still-calm: therapy's soft,
      // unhurried scales — the closest personality to "הקול השקט") → character
      // (warm-craft) → mode LAST so polarity roles win. "light" emits {} — no-op.
      style={{ ...brandStyle(), ...applyMotionPersonality("therapy"), ...applyCharacter("warm-craft"), ...applyMode(brand.mode) }}
      className={`${assistant.variable} ${frankRuhl.variable} h-full antialiased`}
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
            <WhatsAppFloat />
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
