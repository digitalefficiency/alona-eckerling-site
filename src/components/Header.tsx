"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { site, nav, cta } from "@/lib/site";
import { BrandLogo } from "@/components/BrandLogo";

// Floating "island" header: a rounded, detached bar that hovers over the page.
// DEFAULT is the solid glass island with navy text — always readable, on any hero.
// The transparent white-on-dark treatment is an explicit OPT-IN: a page marks its
// dark hero with [data-dark-hero], and only then (top of page, drawer closed) the
// island goes transparent. Inline nav on lg+, accessible hamburger drawer below lg.
export function Header() {
  const pathname = usePathname();
  const [solid, setSolid] = useState(true);
  const [condensed, setCondensed] = useState(false);
  const [open, setOpen] = useState(false);
  const barRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let solidNow = true;
    const onScroll = () => {
      const y = window.scrollY;
      // The white (light-text) treatment requires an explicit [data-dark-hero]
      // marker on the page's opening dark hero — without one the header stays
      // solid, so a light page can never ship an invisible nav.
      const dh = document.querySelector("[data-dark-hero]");
      const overDark = !!dh && dh.getBoundingClientRect().bottom > 90;
      // hysteresis so the transparent↔solid swap doesn't flicker at the boundary
      if (!solidNow && (y > 64 || !overDark)) {
        solidNow = true;
        setSolid(true);
      } else if (solidNow && y < 24 && overDark) {
        solidNow = false;
        setSolid(false);
      }
      setCondensed(y > 120);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, y / max) : 0;
      if (barRef.current) barRef.current.style.transform = `scaleX(${p})`;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Over an opted-in dark hero (top, not scrolled, drawer closed) → light treatment.
  const light = !solid && !open;

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      {/* reading-progress hairline at the very top edge (RTL: grows from the right) */}
      <span
        ref={barRef}
        aria-hidden
        className="absolute inset-x-0 top-0 h-[2px] origin-right bg-gold/80"
        style={{ transform: "scaleX(0)" }}
      />

      <div className="mx-auto max-w-[var(--container-wide)] px-3 pt-3 md:px-5 md:pt-4">
        {/* the floating island */}
        <div
          className={`flex items-center justify-between gap-x-6 rounded-2xl px-4 transition-all duration-300 md:px-5 ${
            condensed ? "py-2" : "py-2.5 md:py-3"
          } ${
            light
              ? "border border-white/15 bg-white/[0.04] backdrop-blur-[2px]"
              : "border border-line bg-card/85 shadow-[0_14px_44px_-22px_color-mix(in_srgb,var(--color-navy)_55%,transparent)] backdrop-blur-md"
          }`}
        >
          <Link href="/" className="flex flex-col items-end gap-1 leading-none">
            <BrandLogo dark={light} className={`w-auto transition-[height] duration-300 ${condensed ? "h-7" : "h-8"}`} />
            <span
              className={`hidden text-[0.6rem] font-medium tracking-wide transition-colors sm:block ${
                light ? "text-slate-300" : "text-navy-700/70"
              }`}
            >
              מאז {site.foundingYear}
            </span>
          </Link>

          <div className="flex items-center gap-5">
            <nav aria-label="ראשי" className="hidden items-center gap-x-4 text-[0.9rem] font-medium md:flex lg:gap-x-6 lg:text-[0.95rem]">
              {nav.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`transition-colors ${light ? "text-slate-100 hover:text-gold-soft" : "text-navy-700 hover:text-gold-ink"}`}
                >
                  {n.label}
                </Link>
              ))}
            </nav>

            <Link
              href={cta.primary.href}
              data-cta="header-consult"
              // The island CTA wears the house silhouette like every other primary
              // on the site — on a shorter cut, since a 10px chamfer on a ~40px-high
              // button eats a third of the edge.
              style={{ "--chamfer": "8px" } as React.CSSProperties}
              className={`btn-chamfer hidden rounded-[6px] px-5 py-2.5 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 lg:inline-flex ${
                light
                  ? "bg-gold text-white hover:bg-gold-dark focus-visible:ring-offset-transparent"
                  : "bg-navy text-white hover:bg-navy-700"
              }`}
            >
              {cta.primary.short}
            </Link>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "סגירת תפריט" : "פתיחת תפריט"}
              aria-expanded={open}
              aria-controls="mobile-nav"
              className={`grid h-10 w-10 place-items-center rounded-[6px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold md:hidden ${
                light ? "text-white hover:bg-white/10" : "text-navy-700 hover:bg-line/60"
              }`}
            >
              {open ? <X size={22} aria-hidden /> : <Menu size={22} aria-hidden />}
            </button>
          </div>
        </div>

        {/* mobile drawer — a solid rounded panel under the island */}
        <nav
          id="mobile-nav"
          aria-label="ראשי (מובייל)"
          className={`mt-2 overflow-hidden rounded-2xl border border-line bg-card/98 backdrop-blur transition-[max-height,opacity] duration-300 ease-[var(--ease-out)] md:hidden ${
            open ? "max-h-[80vh] opacity-100" : "max-h-0 border-transparent opacity-0"
          }`}
        >
          <div className="flex flex-col gap-1 p-4">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="rounded-[6px] px-3 py-3 text-lg font-medium text-navy-700 transition hover:bg-sand hover:text-gold-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                {n.label}
              </Link>
            ))}
            <Link
              href={cta.primary.href}
              data-cta="header-consult-mobile"
              style={{ "--chamfer": "8px" } as React.CSSProperties}
              className="btn-chamfer mt-3 rounded-[6px] bg-navy px-5 py-3.5 text-center font-bold text-white hover:bg-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
            >
              {cta.primary.short}
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
