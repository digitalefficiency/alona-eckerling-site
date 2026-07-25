"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getConsent, setConsent, onOpenCookiePrefs } from "@/lib/consent";

// Opt-in cookie banner. Shows on the first visit (no decision yet) and whenever the
// footer / privacy "ניהול הגדרות עוגיות" control re-opens it. Until the visitor
// accepts, no non-essential storage or analytics runs (see MarketingBootstrap).
// RTL, keyboard-accessible, no pre-selected non-essential option (תיקון 13).
export function CookieConsent() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!getConsent()) setOpen(true); // first visit — awaiting a choice
    return onOpenCookiePrefs(() => setOpen(true)); // manual re-open
  }, []);

  if (!open) return null;

  const choose = (v: "granted" | "denied") => {
    setConsent(v);
    setOpen(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="הסכמה לעוגיות"
      // Clears the bottom chrome instead of stacking on it: below md the
      // StickyContactBar owns the bottom --chrome-bottom of the viewport and the
      // accessibility button sits just above that. Anchoring to bottom-0 buried
      // both on every first visit — the WhatsApp + «בואי נדבר» row (the client's
      // primary referral channel) and the control a low-vision visitor needs in
      // order to read this very banner.
      // pointer-events-none on the WRAPPER, auto on the card. The wrapper is a
      // transparent full-width box that still reaches bottom-0; without this it
      // stays a hit-target over the mobile conversion bar, so clearing the bar
      // visually was not enough — every tap on «וואטסאפ» / «בואי נדבר» was still
      // swallowed by invisible padding. Verified with elementFromPoint.
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[var(--z-consent)] px-3 pb-[calc(var(--chrome-bottom)+0.75rem)] sm:px-4 md:pb-4"
    >
      <div className="pointer-events-auto mx-auto max-w-[var(--container-standard)] rounded-2xl border border-gold-soft/30 bg-navy/95 p-5 text-right text-on-navy shadow-(--elevation-3) backdrop-blur-md sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-sm leading-relaxed">
            אנו משתמשים בעוגיות חיוניות לתפקוד האתר, ובעוגיות מדידה — בכפוף להסכמתכם — כדי לשפר את
            השירות. תוכלו לשנות את בחירתכם בכל עת.{" "}
            <Link href="/privacy" className="font-semibold text-gold-soft underline underline-offset-2 hover:text-white">
              מדיניות הפרטיות
            </Link>
          </p>
          <div className="flex shrink-0 flex-wrap gap-3">
            <button
              type="button"
              onClick={() => choose("denied")}
              data-cta="cookie-deny"
              className="rounded-[4px] border border-white/30 px-5 py-2.5 text-sm font-bold text-white transition hover:border-gold-soft hover:text-gold-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-soft"
            >
              עוגיות חיוניות בלבד
            </button>
            <button
              type="button"
              onClick={() => choose("granted")}
              data-cta="cookie-accept"
              className="rounded-[4px] bg-gold px-5 py-2.5 text-sm font-bold text-white transition hover:bg-gold-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy"
            >
              אישור הכל
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
