"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { track, trackPageView, trackCtaClick, getDataLayer } from "@/lib/analytics";
import { captureAttribution } from "@/lib/attribution";
import { initEngagement, resetPage } from "@/lib/engagement";
import { hasAnalyticsConsent, onConsentChange } from "@/lib/consent";

// Site-wide marketing substrate (mounted once in the root layout):
//  • initializes window.dataLayer + (optionally) the GTM container,
//  • captures first/last-touch attribution from the URL,
//  • tracks engagement (time-on-page, scroll-depth milestones),
//  • fires page_view on every (client) navigation,
//  • delegates CTA-click tracking for any [data-cta] element and for
//    tel:/wa.me/mailto links — so future CTAs are tracked just by tagging them.
//
// Paid-marketing tags are wired by setting NEXT_PUBLIC_GTM_ID (no code change).
export function MarketingBootstrap() {
  const pathname = usePathname();
  const started = useRef(false);
  // Analytics is OFF until the visitor opts in via the cookie banner. `consented`
  // flips true on grant (now or later in the session), unlocking the bootstrap + GTM.
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    setConsented(hasAnalyticsConsent());
    return onConsentChange(setConsented);
  }, []);

  // One-time bootstrap — runs only once consent is granted (idempotent via `started`).
  useEffect(() => {
    if (!consented || started.current) return;
    started.current = true;
    getDataLayer(); // ensure the queue exists immediately
    captureAttribution();
    initEngagement(pathname);
    trackPageView({ page: pathname });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consented]);

  // Site-wide CTA-click delegation — its OWN effect with real add/remove cleanup
  // (NOT gated by `started`, so it survives React Strict Mode's setup→cleanup→setup
  // in dev and any future remount).
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!started.current) return; // no analytics consent yet → don't record
      const el = (e.target as HTMLElement | null)?.closest?.(
        "[data-cta], a[href^='tel:'], a[href^='mailto:'], a[href*='wa.me'], a[href*='whatsapp']",
      ) as HTMLElement | null;
      if (!el) return;
      const anchor = el as HTMLAnchorElement;
      const location =
        el.getAttribute("data-cta") ||
        anchor.getAttribute("href") ||
        el.textContent?.trim().slice(0, 60) ||
        "unknown";
      const channel = anchor.href?.startsWith("tel:")
        ? "phone"
        : anchor.href?.includes("wa.me") || anchor.href?.includes("whatsapp")
          ? "whatsapp"
          : anchor.href?.startsWith("mailto:")
            ? "email"
            : "link";
      trackCtaClick(location, { channel, page: window.location.pathname });
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  // Per-navigation: reset engagement + fire a fresh page_view (skip first run,
  // already handled in the bootstrap effect).
  const first = useRef(true);
  useEffect(() => {
    if (!started.current) return; // gated until consent bootstrap has run
    if (first.current) {
      first.current = false;
      return;
    }
    resetPage(pathname);
    trackPageView({ page: pathname });
    track("page_change", { page: pathname });
  }, [pathname]);

  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;
  if (!gtmId || !consented) return null;
  return (
    <Script id="gtm-loader" strategy="afterInteractive">
      {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`}
    </Script>
  );
}
