"use client";

import { useEffect, useState } from "react";
import type { Heading } from "@/lib/content";

// Sticky auto in-page Table of Contents for long guides/articles. Consumes the
// headings[] outline emitted by content.ts (which now injects #sec-N ids), and
// scroll-spies the active section via IntersectionObserver — NOT a scroll-owner
// (no scroll math), so it coexists with the header's progress bar. No-JS / SSR =
// a fully-working static anchor list with the first item active (deep-links work
// because the ids are in the server HTML). RTL-correct.
export function ServiceGuideTOC({
  headings,
  title = "בעמוד זה",
}: {
  headings: Heading[];
  title?: string;
}) {
  const [active, setActive] = useState(headings[0]?.id ?? "");

  useEffect(() => {
    const els = headings
      .map((h) => document.getElementById(h.id))
      .filter((el): el is HTMLElement => !!el);
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) setActive(vis[0].target.id);
      },
      { rootMargin: "-12% 0px -70% 0px", threshold: 0 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [headings]);

  if (!headings.length) return null;

  return (
    <nav aria-label="תוכן העמוד" className="text-sm">
      <p className="flex items-center gap-2 text-xs font-bold tracking-[.18em] text-gold-ink">
        <span className="text-[0.6rem] leading-none text-gold" aria-hidden>◆</span>
        {title}
      </p>
      <ul className="mt-4 space-y-0.5 border-e border-line pe-3">
        {headings.map((h) => {
          const on = active === h.id;
          return (
            <li key={h.id} className={h.depth === 3 ? "pe-3" : ""}>
              <a
                href={`#${h.id}`}
                className={`block border-e-2 py-1.5 pe-3 -me-[1px] leading-snug transition ${
                  on
                    ? "border-gold font-bold text-navy"
                    : "border-transparent text-muted hover:text-navy-700"
                }`}
              >
                {h.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
