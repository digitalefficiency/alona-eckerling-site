import type { Metadata, Viewport } from "next";
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
import { A11Y_BOOTSTRAP } from "@/lib/a11y-boot";

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

// Separate `viewport` export (Next 15+ moved themeColor out of `metadata`).
// Without it no <meta name="theme-color"> was emitted at all, so mobile Chrome
// and iOS Safari painted the browser chrome default grey on every visit while
// the PWA manifest declared a brand colour — two answers to the same question.
export const viewport: Viewport = {
  themeColor: brand.colors.navy,
  colorScheme: "light",
};

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.legalName, template: `%s | ${site.name}` },
  description: site.description,
  alternates: {
    canonical: "/",
    types: { "application/rss+xml": `${site.url}/feed.xml` },
  },
  openGraph: {
    type: "website",
    locale: brand.direction === "rtl" ? "he_IL" : "en_US",
    siteName: site.name,
    title: site.legalName,
    description: site.tagline,
    // NOTE: no hard-coded `url` here — a page-level openGraph.url would otherwise be
    // shadowed and every route would emit og:url=home. Each composed page sets its
    // own openGraph.url (resolved against metadataBase); routes without one simply
    // omit og:url (scrapers fall back to the fetched URL) rather than misreport it.
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
        {/* Pre-paint restore of saved accessibility settings. AccessibilityMenu
            can only re-apply them after hydration, so a returning visitor who
            saved 145% text was reading 17px for the whole FCP→hydration window
            and then watched the page jump. Synchronous, tiny, try/catch-guarded. */}
        <script dangerouslySetInnerHTML={{ __html: A11Y_BOOTSTRAP }} />
        {/* The single global motion gate: every motion/react component (the
            M-primitives) inherits reducedMotion="user", so prefers-reduced-motion
            disables transform/layout animation library-wide. The a11y-menu gate
            (html.a11y-stop-motion) is enforced separately in lib/motion.ts.
            MotionConfig renders no DOM and is safe around server children. */}
        <MotionConfig reducedMotion="user">
          {/* ChromeGate: the public site's chrome, hidden on the CMS content desk
              (/admin) so an editing session never sees the marketing nav, the
              consent banner, or fires the analytics bootstrap. No-op elsewhere. */}
          {/* Skip-link — WCAG 2.4.1. Without it every keyboard and switch user
              tabs through the logo, 6 nav links, the CTA and the hamburger
              before reaching content, on EVERY page. Lighthouse's `bypass`
              audit passes on the presence of a <main> landmark alone, which is
              why this stayed invisible while a11y scored 100.
              `start-3` (logical) not `left-3` — this is an RTL document.
              z above the consent banner, or the banner covers it on first
              visit, which is exactly when a first-time keyboard user arrives. */}
          <a
            href="#main"
            className="sr-only rounded-[6px] bg-navy px-4 py-2 font-bold text-white focus:not-sr-only focus:fixed focus:top-3 focus:start-3 focus:z-[var(--z-skip)]"
          >
            דילוג לתוכן הראשי
          </a>
          <ChromeGate>
            <Header />
          </ChromeGate>
          {/* tabIndex={-1} so the skip-link can actually move focus here (a bare
              landmark is a scroll target, not a focus target). */}
          <main id="main" tabIndex={-1} className="relative flex-1 overflow-x-clip outline-none">
            {children}
          </main>
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
