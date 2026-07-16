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
      className="fixed inset-x-0 bottom-0 z-[60] px-3 pb-3 sm:px-4 sm:pb-4"
    >
      <div className="mx-auto max-w-[var(--container-standard)] rounded-2xl border border-gold/30 bg-navy/95 p-5 text-right text-slate-200 shadow-[0_24px_70px_-30px_rgba(0,0,0,.8)] backdrop-blur-md sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-sm leading-relaxed">
            אנו משתמשים בעוגיות חיוניות לתפקוד האתר, ובעוגיות מדידה — בכפוף להסכמתכם — כדי לשפר את
            השירות. תוכלו לשנות את בחירתכם בכל עת.{" "}
            <Link href="/privacy" className="font-semibold text-gold-soft underline underline-offset-2 hover:text-gold">
              מדיניות הפרטיות
            </Link>
          </p>
          <div className="flex shrink-0 flex-wrap gap-3">
            <button
              type="button"
              onClick={() => choose("denied")}
              data-cta="cookie-deny"
              className="rounded-[4px] border border-white/30 px-5 py-2.5 text-sm font-bold text-white transition hover:border-gold hover:text-gold-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              עוגיות חיוניות בלבד
            </button>
            <button
              type="button"
              onClick={() => choose("granted")}
              data-cta="cookie-accept"
              className="rounded-[4px] bg-gold px-5 py-2.5 text-sm font-bold text-navy transition hover:bg-gold-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy"
            >
              אישור הכל
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
