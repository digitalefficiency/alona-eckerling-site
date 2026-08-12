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

  // The last path we fired a page_view for — the fix for the swallowed-first-nav
  // bug: a boolean "skip first run" ref is set in THIS effect but read in the
  // per-navigation effect, and at mount that effect returns early (started=false,
  // consent flips a render later) so the flag was never consumed — the first real
  // navigation of every session ate it and fired nothing. Comparing paths instead
  // is immune to the ordering.
  const trackedPath = useRef<string | null>(null);

  // One-time bootstrap — runs only once consent is granted (idempotent via `started`).
  useEffect(() => {
    if (!consented || started.current) return;
    started.current = true;
    getDataLayer(); // ensure the queue exists immediately
    captureAttribution();
    initEngagement(pathname);
    trackPageView({ page: pathname });
    trackedPath.current = pathname; // record the landing page we just counted
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
      // Social profiles get their OWN event on top of cta_click (Rom, 2026-08-12:
      // «כמה אנשים לוחצים על האינסטגרם והטיקטוק») — detected by destination, so
      // every placement (header icons, footer chips, drawer, ribbon tiles) counts
      // under one stable GA4 event with `network` + `placement` dimensions.
      const dest = anchor.href || "";
      const network = dest.includes("instagram.com")
        ? "instagram"
        : dest.includes("tiktok.com")
          ? "tiktok"
          : null;
      if (network) {
        track("social_click", { network, placement: location, page: window.location.pathname });
      }
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  // Per-navigation: reset engagement + fire a fresh page_view. Skip only when this
  // path is the one the bootstrap already counted (not a blanket "first run" skip),
  // so the first genuine SPA navigation of the session fires correctly.
  useEffect(() => {
    if (!started.current) return; // gated until consent bootstrap has run
    if (pathname === trackedPath.current) return; // already counted (the landing page)
    trackedPath.current = pathname;
    resetPage(pathname);
    trackPageView({ page: pathname });
    track("page_change", { page: pathname });
  }, [pathname]);

  // Two tag doors, both consent-gated and either one optional:
  //  • NEXT_PUBLIC_GA_ID  — GA4 direct (gtag.js). send_page_view:false because
  //    lib/analytics mirrors page_view manually (SPA-correct, no double count);
  //    IPs anonymized. Every track() call is forwarded to GA4 via the mirror,
  //    so traffic sources, cta_click, social_click, scroll_depth, form_* and
  //    generate_lead all land in GA4 with no container to manage.
  //  • NEXT_PUBLIC_GTM_ID — the GTM container (for paid-marketing tags later).
  //    When BOTH are set, GTM must NOT also load a GA4 tag for the same
  //    property, or events double-count — the note lives in MARKETING.md.
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  if (!consented) return null;
  return (
    <>
      {gaId && (
        <>
          <Script
            id="ga4-src"
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${gaId}',{send_page_view:false,anonymize_ip:true});`}
          </Script>
        </>
      )}
      {gtmId && (
        <Script id="gtm-loader" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`}
        </Script>
      )}
    </>
  );
}
