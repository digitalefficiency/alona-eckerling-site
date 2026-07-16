"use client";

import { openCookiePrefs } from "@/lib/consent";

// Re-opens the cookie-consent banner so a visitor can change their choice at any
// time (linked from the footer + the privacy policy). RTL-safe inline control.
export function CookiePrefsButton({ className = "" }: { className?: string }) {
  return (
    <button type="button" onClick={openCookiePrefs} className={className} data-cta="open-cookie-prefs">
      ניהול הגדרות עוגיות
    </button>
  );
}
