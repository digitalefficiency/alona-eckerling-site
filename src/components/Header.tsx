"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { site, nav, cta } from "@/lib/site";
import { BrandLogo } from "@/components/BrandLogo";
import { SocialGlyph } from "@/components/SocialLinks";

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
    let ticking = false;
    // The white (light-text) treatment requires an explicit [data-dark-hero]
    // marker on the page's opening dark hero — without one the header stays
    // solid, so a light page can never ship an invisible nav. The marker is a
    // per-page constant, so the lookup is hoisted OUT of the scroll handler
    // (it used to run a document-wide attribute-selector query every frame).
    const dh = document.querySelector("[data-dark-hero]");
    const read = () => {
      const y = window.scrollY;
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
      ticking = false;
    };
    // rAF guard — the read touches scrollHeight (a forced layout) and shares the
    // frame with SequenceFilm's per-frame style writes. One read per frame, max.
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(read);
    };
    read();
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

  // Current-page match: exact for "/", prefix for section routes (so a recipe
  // page still marks «מתכונים» as current).
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="fixed inset-x-0 top-0 z-[var(--z-header)]">
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
          // 3-column grid, not justify-between: the nav sits in the middle column
          // and the two 1fr rails are equal, so the links are centred against the
          // ISLAND rather than against whatever is left over after the logo. With
          // justify-between the nav drifted with every logo/CTA width change.
          className={`grid grid-cols-[1fr_auto_1fr] items-center gap-x-4 rounded-2xl px-4 transition-all duration-[var(--dur-micro)] md:px-5 ${
            condensed ? "py-2" : "py-2.5 md:py-3"
          } ${
            light
              ? "border border-white/15 bg-white/[0.04] backdrop-blur-[2px]"
              : "border border-line bg-card/85 shadow-[0_14px_44px_-22px_color-mix(in_srgb,var(--color-navy)_55%,transparent)] backdrop-blur-md"
          }`}
        >
          <Link href="/" className="flex flex-col items-end gap-1 justify-self-start leading-none">
            <BrandLogo dark={light} className={`w-auto transition-[height] duration-[var(--dur-micro)] ${condensed ? "h-7" : "h-8"}`} />
            <span
              className={`hidden text-[0.6rem] font-medium tracking-wide transition-colors sm:block ${
                light ? "text-on-navy-muted" : "text-navy-700/70"
              }`}
            >
              מאז {site.foundingYear}
            </span>
          </Link>

          {/* middle column — the nav itself, so it centres on the island */}
          <nav aria-label="ראשי" className="hidden items-center gap-x-4 text-[0.9rem] font-medium md:flex lg:gap-x-6 lg:text-[0.95rem]">
              {nav.map((n) => {
                const active = isActive(n.href);
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    aria-current={active ? "page" : undefined}
                    // Current location is marked with an underline as well as a
                    // colour shift — colour alone would fail WCAG 1.4.1.
                    className={`relative transition-colors ${
                      light ? "text-on-navy hover:text-gold-soft" : "text-navy-700 hover:text-gold-ink"
                    } ${active ? "font-semibold" : ""} ${
                      active
                        ? "after:absolute after:inset-x-0 after:-bottom-1.5 after:h-[2px] after:rounded-full after:bg-rose after:content-['']"
                        : ""
                    }`}
                  >
                    {n.label}
                  </Link>
                );
              })}
          </nav>

          {/* end column — socials, CTA, hamburger */}
          <div className="flex items-center gap-2 justify-self-end sm:gap-3 md:gap-4">
            {/* Icon-only, which the labelled-chip rule in SocialLinks deliberately
                avoids — the island has no room for a chip, so each link carries the
                same aria-label the chips do and the meaning lives there instead of
                in visible text. Hidden below sm so the phone island keeps logo +
                hamburger uncrowded; the drawer repeats them with full labels. */}
            {site.socials.map((s) => (
              <a
                key={s.network}
                href={s.url}
                target="_blank"
                rel="me noopener noreferrer"
                data-cta={`header-social-${s.network}`}
                aria-label={`${s.label} של ${site.name}, ${s.handle}, נפתח בלשונית חדשה`}
                className={`hidden h-9 w-9 place-items-center rounded-full transition-colors duration-[var(--dur-micro)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold sm:grid ${
                  light
                    ? "text-on-navy-muted hover:bg-white/10 hover:text-gold-soft"
                    : "text-navy-700/80 hover:bg-line/60 hover:text-gold-ink"
                }`}
              >
                <SocialGlyph network={s.network} className="h-[19px] w-[19px]" />
              </a>
            ))}

            <Link
              href={cta.primary.href}
              data-cta="header-consult"
              // The island CTA wears the house silhouette like every other primary
              // on the site — on a shorter cut, since a 10px chamfer on a ~40px-high
              // button eats a third of the edge.
              style={{ "--chamfer": "8px" } as React.CSSProperties}
              // md:inline-flex (not lg) — between 768px and 1023px the hamburger
              // is already hidden and the drawer CTA with it, so gating this at
              // lg left the whole tablet band with no primary action rendered
              // as a button.
              className={`btn-chamfer hidden rounded-[6px] px-5 py-2.5 text-sm font-bold md:inline-flex ${
                light
                  ? "bg-gold text-white hover:bg-gold-dark"
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
          // inert when closed — max-h-0 + opacity-0 hide the drawer VISUALLY but
          // leave its 6 links and CTA in the tab order and in the accessibility
          // tree, so a keyboard user fell into 7 invisible stops (and the
          // browser tried to scroll a zero-height box into view for each one),
          // directly contradicting aria-expanded={false} on the hamburger.
          // React 19 forwards `inert` natively; it removes both at once and the
          // max-height transition is unaffected.
          inert={!open}
          className={`mt-2 overflow-hidden rounded-2xl border border-line bg-card/98 backdrop-blur transition-[max-height,opacity] duration-[var(--dur-micro)] ease-[var(--ease-out)] md:hidden ${
            open ? "max-h-[80vh] opacity-100" : "max-h-0 border-transparent opacity-0"
          }`}
        >
          <div className="flex flex-col gap-1 p-4">
            {nav.map((n) => {
              const active = isActive(n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-[6px] px-3 py-3 text-lg font-medium transition hover:bg-sand hover:text-gold-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
                    active ? "bg-sand font-semibold text-gold-ink" : "text-navy-700"
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}
            <Link
              href={cta.primary.href}
              data-cta="header-consult-mobile"
              style={{ "--chamfer": "8px" } as React.CSSProperties}
              className="btn-chamfer mt-3 rounded-[6px] bg-navy px-5 py-3.5 text-center font-bold text-white hover:bg-navy-700"
            >
              {cta.primary.short}
            </Link>
            {/* the drawer has room for the labelled form, so the phone gets the
                readable version of what the island shows as glyphs */}
            <div className="mt-3 flex items-center gap-2 border-t border-line pt-3">
              {site.socials.map((s) => (
                <a
                  key={s.network}
                  href={s.url}
                  target="_blank"
                  rel="me noopener noreferrer"
                  data-cta={`drawer-social-${s.network}`}
                  aria-label={`${s.label} של ${site.name}, ${s.handle}, נפתח בלשונית חדשה`}
                  className="inline-flex items-center gap-2 rounded-full border border-line px-3.5 py-2 text-sm font-semibold text-navy-700 transition-colors duration-[var(--dur-micro)] hover:border-gold/60 hover:text-gold-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                >
                  <SocialGlyph network={s.network} className="h-[17px] w-[17px]" />
                  <span>{s.label}</span>
                </a>
              ))}
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}
