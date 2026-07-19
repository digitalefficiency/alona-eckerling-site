import Link from "next/link";
import { site, cta } from "@/lib/site";

// Mobile-only persistent conversion bar (premium-tier "Conversion" gate: sticky
// mobile contact bar, booking ≤2 taps from any page). Fixed to the viewport
// bottom below md, ALWAYS present — no dismiss. Two actions from lib/site.ts:
// WhatsApp (the site's referral channel — sage, white text) + the primary booking
// link (navy). The booking default lands on the FORM anchor (#lead), not the bare
// page: on any page it's booking ≤2 taps straight to the fields, and on /contact
// itself it anchors DOWN to the card instead of self-linking back to the top of
// the page a visitor may be mid-form on. No tel: action — the phone number is
// deliberately unpublished (brief Q4); the bar never invents a number. When no
// WhatsApp is configured the booking action takes the full width. Server
// component: zero JS, zero animation → reduced-motion-safe by construction.
// Safe-area padding for notched devices; a same-height spacer keeps the page end
// (footer) reachable above the fixed bar.
export function StickyContactBar({
  whatsappLabel = "וואטסאפ",
  bookLabel = cta.primary.short,
  bookHref = `${cta.primary.href}#lead`,
}: {
  whatsappLabel?: string;
  bookLabel?: string;
  bookHref?: string;
}) {
  const whatsapp = site.whatsapp;
  return (
    <>
      {/* spacer — same height as the bar (+ safe area) so nothing hides behind it */}
      <div aria-hidden className="h-[calc(3.5rem+env(safe-area-inset-bottom))] md:hidden" />
      <nav
        aria-label="יצירת קשר מהירה"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-gold/40 bg-navy pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <div className="flex items-stretch">
          {whatsapp && (
            <a
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              data-cta="sticky-bar-whatsapp"
              className="flex min-h-14 flex-1 items-center justify-center gap-2 bg-gold px-4 text-[0.95rem] font-bold text-white transition-colors hover:bg-gold-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-inset"
            >
              <span aria-hidden className="text-[0.55rem] leading-none">◆</span>
              {whatsappLabel}
            </a>
          )}
          <Link
            href={bookHref}
            data-cta="sticky-bar-book"
            className="flex min-h-14 flex-1 items-center justify-center px-4 text-[0.95rem] font-bold text-white transition-colors hover:bg-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-inset"
          >
            {bookLabel}
          </Link>
        </div>
      </nav>
    </>
  );
}
