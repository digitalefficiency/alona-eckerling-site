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
export function track(event: string, params: Record<string, unknown> = {}): void {
  if (typeof window === "undefined") return;
  getDataLayer().push({ event, ...params });
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
