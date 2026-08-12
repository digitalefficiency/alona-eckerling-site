// Lightweight, GTM-ready analytics layer.
//
// Every event is pushed to window.dataLayer (the Google Tag Manager convention),
// so paid-marketing tags (Google Ads, Meta Pixel, etc.) can be wired in LATER
// without touching code — the client just drops a container id into
// NEXT_PUBLIC_GTM_ID and maps these events to conversions inside GTM.
//
// All functions are SSR-safe no-ops on the server.

export type DataLayerEvent = Record<string, unknown> & { event: string };

declare global {
  interface Window {
    dataLayer?: DataLayerEvent[];
    /** set ONLY by our own GA4 loader (MarketingBootstrap, NEXT_PUBLIC_GA_ID) */
    gtag?: (...args: unknown[]) => void;
  }
}

// Ensures window.dataLayer exists (events queue here even before GTM loads).
export function getDataLayer(): DataLayerEvent[] {
  if (typeof window === "undefined") return [];
  window.dataLayer = window.dataLayer || [];
  return window.dataLayer;
}

// Core push. Keep PERSONAL data (name/phone/email) OUT of the dataLayer — PII
// travels only to the server via the form POST. City / project-type / source
// attribution are marketing dimensions, not PII, and are fine to push.
//
// GA4-direct mirror: when NEXT_PUBLIC_GA_ID is set, MarketingBootstrap loads
// gtag.js and defines window.gtag — a dataLayer.push alone is a GTM convention
// that direct GA4 never reads, so every event is ALSO forwarded through
// gtag('event', …). page_view maps to GA4's own page_view shape (the config is
// send_page_view:false, so this manual fire is the only one — no double count,
// and SPA navigations are counted correctly). With GTM instead of GA-direct,
// window.gtag is undefined and this mirror is a no-op.
export function track(event: string, params: Record<string, unknown> = {}): void {
  if (typeof window === "undefined") return;
  getDataLayer().push({ event, ...params });
  if (typeof window.gtag === "function") {
    if (event === "page_view") {
      const page = typeof params.page === "string" ? params.page : window.location.pathname;
      window.gtag("event", "page_view", {
        page_path: page,
        page_location: window.location.origin + page,
        page_title: document.title,
      });
    } else {
      window.gtag("event", event, params);
    }
  }
}

// ---- Named helpers (stable event names → map these to triggers in GTM) ----

export const trackPageView = (params: Record<string, unknown> = {}) =>
  track("page_view", params);

export const trackCtaClick = (location: string, params: Record<string, unknown> = {}) =>
  track("cta_click", { cta_location: location, ...params });

export const trackScrollDepth = (percent: number, page: string) =>
  track("scroll_depth", { scroll_percent: percent, page });

export const trackFormView = (formId: string, page: string) =>
  track("form_view", { form_id: formId, page });

export const trackFormStart = (formId: string, page: string) =>
  track("form_start", { form_id: formId, page });

// The conversion event. `params` should carry attribution + non-PII dimensions
// (form_id, page, project_type, lead_city, time_on_page_seconds, utm_*…).
export const trackGenerateLead = (params: Record<string, unknown> = {}) =>
  track("generate_lead", params);
