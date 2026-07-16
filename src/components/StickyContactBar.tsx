import Link from "next/link";
import { site, cta } from "@/lib/site";

// Mobile-only persistent conversion bar (premium-tier "Conversion" gate: sticky
// mobile call/book bar, booking ≤2 taps from any page). Fixed to the viewport
// bottom below md, ALWAYS present — no dismiss. Two actions from lib/site.ts:
// tel: call (NAP phone, gold) + the primary booking link (navy). When no phone
// is configured the booking action takes the full width; the bar never invents
// a number. Server component: zero JS, zero animation → reduced-motion-safe by
// construction. Safe-area padding for notched devices; a same-height spacer
// keeps the page end (footer) reachable above the fixed bar.
export function StickyContactBar({
  callLabel = "שיחה למשרד",
  bookLabel = cta.primary.short,
  bookHref = cta.primary.href,
}: {
  callLabel?: string;
  bookLabel?: string;
  bookHref?: string;
}) {
  const phone = site.phone;
  return (
    <>
      {/* spacer — same height as the bar (+ safe area) so nothing hides behind it */}
      <div aria-hidden className="h-[calc(3.5rem+env(safe-area-inset-bottom))] md:hidden" />
      <nav
        aria-label="יצירת קשר מהירה"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-gold/40 bg-navy pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <div className="flex items-stretch">
          {phone && (
            <a
              href={`tel:${phone}`}
              data-cta="sticky-bar-call"
              className="flex min-h-14 flex-1 items-center justify-center gap-2 bg-gold px-4 text-[0.95rem] font-bold text-navy transition-colors hover:bg-gold-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-inset"
            >
              <span aria-hidden className="text-[0.55rem] leading-none">◆</span>
              {callLabel}
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
