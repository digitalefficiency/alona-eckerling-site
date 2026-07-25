// First-party marketing attribution — captures where a visitor came from so a
// submitted lead can be tied to a paid campaign (Google Ads / Meta / etc.).
//
// Stores BOTH first-touch (the campaign that originally acquired the visitor)
// and last-touch (the campaign of the current visit) in localStorage, plus a
// session id + visit count. No cookies, no third parties, no PII — only the
// click/campaign params already present in the URL. SSR-safe.

import { hasAnalyticsConsent } from "@/lib/consent";

const STORE_FIRST = "bz_attr_first";
const STORE_LAST = "bz_attr_last";
const STORE_FIRST_SEEN = "bz_first_seen";
const STORE_VISITS = "bz_visits";
const SESSION_ID = "bz_session_id";
const SESSION_STARTED = "bz_session_started";
const SESSION_LANDING = "bz_session_landing";

// Paid click identifiers worth capturing for ad-platform conversion matching.
const CLICK_IDS = [
  "gclid", // Google Ads
  "gbraid", // Google Ads (iOS, app→web)
  "wbraid", // Google Ads (iOS, web→app)
  "gclsrc",
  "fbclid", // Meta
  "msclkid", // Microsoft Ads
  "ttclid", // TikTok
  "li_fat_id", // LinkedIn
] as const;

const UTM = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "utm_id",
] as const;

export type Touch = {
  ts: string;
  page: string;
  referrer: string;
} & Partial<Record<(typeof UTM)[number] | (typeof CLICK_IDS)[number], string>>;

export type AttributionSnapshot = Record<string, string | number>;

function safeGet(store: Storage, key: string): string | null {
  try {
    return store.getItem(key);
  } catch {
    return null;
  }
}
function safeSet(store: Storage, key: string, val: string): void {
  try {
    store.setItem(key, val);
  } catch {
    /* private mode / quota — attribution is best-effort */
  }
}

function uid(): string {
  return (
    Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6)
  );
}

// Build a "touch" from the current URL. Only includes keys actually present.
function readTouch(): Touch {
  const params = new URLSearchParams(window.location.search);
  const touch: Touch = {
    ts: new Date().toISOString(),
    page: window.location.pathname,
    referrer: document.referrer || "",
  };
  for (const k of [...UTM, ...CLICK_IDS]) {
    const v = params.get(k);
    if (v) (touch as Record<string, string>)[k] = v.slice(0, 256);
  }
  // Heuristic source/medium when no UTM but there's an external referrer.
  if (!touch.utm_source && touch.referrer) {
    try {
      const refHost = new URL(touch.referrer).hostname;
      if (refHost && !refHost.includes(window.location.hostname)) {
        touch.utm_source = refHost;
        touch.utm_medium = touch.gclid || touch.gbraid || touch.wbraid ? "cpc" : "referral";
      }
    } catch {
      /* malformed referrer */
    }
  } else if (!touch.utm_source && !touch.referrer) {
    touch.utm_source = "direct";
    touch.utm_medium = "none";
  }
  return touch;
}

// Call once per page load (client). Idempotent per session for first-touch.
export function captureAttribution(): void {
  if (typeof window === "undefined") return;
  const ls = window.localStorage;
  const ss = window.sessionStorage;
  const touch = readTouch();
  const serialized = JSON.stringify(touch);

  // First touch — written once, ever.
  if (!safeGet(ls, STORE_FIRST)) safeSet(ls, STORE_FIRST, serialized);
  if (!safeGet(ls, STORE_FIRST_SEEN)) safeSet(ls, STORE_FIRST_SEEN, touch.ts);

  // Last touch — only overwrite when this visit carries a REAL campaign signal
  // in the URL, so an organic/referral/direct revisit (whose source/medium we
  // synthesize heuristically) doesn't wipe the acquiring paid campaign.
  const rawParams = new URLSearchParams(window.location.search);
  const hasSignal = [...UTM, ...CLICK_IDS].some((k) => rawParams.get(k));
  if (hasSignal || !safeGet(ls, STORE_LAST)) safeSet(ls, STORE_LAST, serialized);

  // Session bootstrap.
  if (!safeGet(ss, SESSION_ID)) {
    safeSet(ss, SESSION_ID, uid());
    safeSet(ss, SESSION_STARTED, touch.ts);
    safeSet(ss, SESSION_LANDING, touch.page);
    const visits = Number(safeGet(ls, STORE_VISITS) || "0") + 1;
    safeSet(ls, STORE_VISITS, String(visits));
  }
}

function flatten(prefix: string, touch: Touch | null, out: AttributionSnapshot): void {
  if (!touch) return;
  for (const [k, v] of Object.entries(touch)) {
    if (v) out[`${prefix}${k}`] = String(v);
  }
}

// Flat snapshot for embedding in a lead payload (hidden fields / POST body).
export function getAttributionSnapshot(): AttributionSnapshot {
  if (typeof window === "undefined") return {};
  const ls = window.localStorage;
  const ss = window.sessionStorage;
  const out: AttributionSnapshot = {};

  const parse = (raw: string | null): Touch | null => {
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Touch;
    } catch {
      return null;
    }
  };

  flatten("first_", parse(safeGet(ls, STORE_FIRST)), out);
  flatten("last_", parse(safeGet(ls, STORE_LAST)), out);

  out.session_id = safeGet(ss, SESSION_ID) || "";
  out.session_started = safeGet(ss, SESSION_STARTED) || "";
  out.landing_page = safeGet(ss, SESSION_LANDING) || "";
  out.first_seen = safeGet(ls, STORE_FIRST_SEEN) || "";
  out.visit_count = Number(safeGet(ls, STORE_VISITS) || "1");
  // DEVICE / BROWSER FIELDS — consent-gated.
  //
  // The campaign stores above are already protected: they live in localStorage,
  // which is only written after consent is granted. These five are read LIVE
  // from the browser on every call, so they bypassed the gate entirely and rode
  // along with every lead regardless of the visitor's cookie choice — while the
  // consent sentence beside the submit button promises the details are kept
  // «לצורך מענה בלבד». Collecting a device fingerprint after she declined is
  // exactly what that sentence rules out.
  // Name and phone are unaffected: she typed those deliberately, and they are
  // the payload the form exists to deliver.
  if (hasAnalyticsConsent()) {
    out.referrer = document.referrer || "";
    out.user_agent = navigator.userAgent.slice(0, 256);
    out.language = navigator.language || "";
    out.screen = `${window.screen?.width || 0}x${window.screen?.height || 0}`;
    out.viewport = `${window.innerWidth}x${window.innerHeight}`;
  }

  return out;
}

// Just the campaign dimensions (no PII) — safe to push into the dataLayer with
// a conversion event so GTM can attribute it.
export function getCampaignDimensions(): AttributionSnapshot {
  const snap = getAttributionSnapshot();
  // Keep ALL paid click ids (Meta/Microsoft/TikTok/LinkedIn + Google incl. iOS
  // gbraid/wbraid) and UTMs — derived from the source arrays so it can't drift.
  // Excludes PII/device fields (user_agent, language, screen, viewport, referrer).
  const keep = (k: string) =>
    CLICK_IDS.some((c) => k === `first_${c}` || k === `last_${c}`) ||
    UTM.some((u) => k === `first_${u}` || k === `last_${u}`) ||
    k === "session_id" ||
    k === "visit_count" ||
    k === "landing_page";
  const out: AttributionSnapshot = {};
  for (const [k, v] of Object.entries(snap)) if (keep(k)) out[k] = v;
  return out;
}
