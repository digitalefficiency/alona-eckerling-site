// Cookie / analytics consent. Israel's PPA guidance (2026) + GDPR require OPT-IN
// for non-essential storage and analytics — so nothing analytics-related (GTM,
// first-party attribution, engagement, page_view) runs until the visitor grants
// consent here. Essential, no-egress site function needs no consent.
//
// Stored in localStorage so the choice persists across sessions. SSR-safe.

const KEY = "bz_cookie_consent"; // "granted" | "denied"
const CHANGE_EVENT = "bz:consent-change";
const OPEN_EVENT = "bz:open-cookie-prefs";

export type ConsentValue = "granted" | "denied";

function read(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

// The recorded decision, or null if the visitor hasn't chosen yet.
export function getConsent(): ConsentValue | null {
  if (typeof window === "undefined") return null;
  const v = read();
  return v === "granted" || v === "denied" ? v : null;
}

export function hasAnalyticsConsent(): boolean {
  return getConsent() === "granted";
}

export function setConsent(v: ConsentValue): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, v);
  } catch {
    /* private mode / quota — best-effort */
  }
  window.dispatchEvent(new CustomEvent<ConsentValue>(CHANGE_EVENT, { detail: v }));
}

// Subscribe to consent changes; returns an unsubscribe fn.
export function onConsentChange(cb: (granted: boolean) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = (e: Event) => cb((e as CustomEvent<ConsentValue>).detail === "granted");
  window.addEventListener(CHANGE_EVENT, handler);
  return () => window.removeEventListener(CHANGE_EVENT, handler);
}

// Footer / privacy-page "ניהול עוגיות" re-opens the banner.
export function openCookiePrefs(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(OPEN_EVENT));
}
export function onOpenCookiePrefs(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(OPEN_EVENT, cb);
  return () => window.removeEventListener(OPEN_EVENT, cb);
}
