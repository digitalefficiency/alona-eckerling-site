// Engagement tracking — how long a visitor spent and how far they scrolled.
//
// Feeds two needs:
//   1. Marketing dimensions on a submitted lead (time_on_page, scroll depth) —
//      "warm" leads that read the whole page convert differently than bouncers.
//   2. Site-wide scroll-depth milestone events (25/50/75/100%) → dataLayer.
//
// A module-level singleton so any component (e.g. the lead form) can read the
// current page's engagement without prop-drilling. SSR-safe.

import { trackScrollDepth } from "@/lib/analytics";

let inited = false;
let sessionStart = 0; // ms, first init this tab
let pageStart = 0; // ms, current page (reset on client navigation)
let activeMs = 0; // accumulated foreground time on current page
let lastActiveTick = 0;
let visible = true;
let maxScroll = 0; // 0..100
let currentPath = "";
const firedMilestones = new Set<number>();

const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

function flushActive(): void {
  if (visible) {
    activeMs += now() - lastActiveTick;
    lastActiveTick = now();
  }
}

function onScroll(): void {
  const doc = document.documentElement;
  const scrollable = doc.scrollHeight - window.innerHeight;
  // A page that fits the viewport carries no genuine scroll signal — don't
  // synthesize 25/50/75/100 milestones (would pollute the dataLayer and report
  // a 100% scroll on a lead from someone who never scrolled).
  if (scrollable <= 0) return;
  const pct = Math.max(0, Math.min(100, Math.round(((window.scrollY || doc.scrollTop) / scrollable) * 100)));
  if (pct > maxScroll) maxScroll = pct;
  for (const m of [25, 50, 75, 100]) {
    if (maxScroll >= m && !firedMilestones.has(m)) {
      firedMilestones.add(m);
      trackScrollDepth(m, currentPath);
    }
  }
}

function onVisibility(): void {
  if (document.visibilityState === "hidden") {
    flushActive();
    visible = false;
  } else {
    visible = true;
    lastActiveTick = now();
  }
}

// Call once (client) — typically from the site-wide MarketingBootstrap.
export function initEngagement(pathname: string): void {
  if (typeof window === "undefined" || inited) return;
  inited = true;
  sessionStart = now();
  lastActiveTick = now();
  currentPath = pathname;
  resetPage(pathname);
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  document.addEventListener("visibilitychange", onVisibility);
  onScroll();
}

// Reset per-page counters on client-side navigation.
export function resetPage(pathname: string): void {
  if (typeof window === "undefined") return;
  flushActive();
  currentPath = pathname;
  pageStart = now();
  activeMs = 0;
  lastActiveTick = now();
  maxScroll = 0;
  firedMilestones.clear();
}

export type Engagement = {
  time_on_page_seconds: number;
  active_seconds: number;
  session_duration_seconds: number;
  max_scroll_depth: number;
};

export function getEngagement(): Engagement {
  if (typeof window === "undefined") {
    return {
      time_on_page_seconds: 0,
      active_seconds: 0,
      session_duration_seconds: 0,
      max_scroll_depth: 0,
    };
  }
  flushActive();
  return {
    time_on_page_seconds: Math.round((now() - pageStart) / 1000),
    active_seconds: Math.round(activeMs / 1000),
    session_duration_seconds: Math.round((now() - sessionStart) / 1000),
    max_scroll_depth: maxScroll,
  };
}
