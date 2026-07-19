"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { MStagger } from "@/components/motion/MStagger";

export type ProofRecipe = {
  slug: string;
  title: string;
  image: string;
  imageAlt: string;
  meta?: string;
  category?: string;
};

// Rom's call (2026-07-19): no "newest" highlight — three EQUAL tiles, and a
// fresh random trio on every visit. SSR ships the first three (stable HTML for
// SEO/no-JS and a hydration-exact first render); a mount effect redraws the
// trio from the full pool. The section sits several viewports below the fold,
// so the swap lands long before it is ever seen — no flicker, no CLS. The
// random pick lives in an effect (never in render) so server and client HTML
// always agree.
export function ProofRecipes({ pool }: { pool: ProofRecipe[] }) {
  const [cards, setCards] = useState(() => pool.slice(0, 3));

  useEffect(() => {
    if (pool.length <= 3) return;
    const rest = [...pool];
    const picks: ProofRecipe[] = [];
    while (picks.length < 3 && rest.length) {
      picks.push(rest.splice(Math.floor(Math.random() * rest.length), 1)[0]);
    }
    setCards(picks);
  }, [pool]);

  return (
    <MStagger className="mt-12 grid gap-6 md:grid-cols-3">
      {cards.map((e) => (
        <Link
          key={e.slug}
          href={`/recipes/${e.slug}`}
          data-cta={`proof-recipe-${e.slug}`}
          // House hover philosophy: NO lift — the photo already scales on
          // group-hover, so the card answers with a gold frame line instead.
          className="group block h-full overflow-hidden rounded-2xl border border-line bg-card transition-colors duration-[var(--dur-micro)] ease-[var(--ease-out)] hover:border-gold motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
        >
          <div className="relative aspect-[3/2] overflow-hidden rounded-t-2xl">
            <Image
              src={e.image}
              alt={e.imageAlt}
              fill
              sizes="(max-width: 768px) 100vw, 380px"
              className="object-cover transition duration-[calc(var(--dur-reveal)*0.7)] ease-[var(--ease-out)] group-hover:scale-[1.02] motion-reduce:transition-none"
            />
            {/* the ONE shared image grade (archive continuity) */}
            <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "var(--grade-tint)" }} />
            {/* material diet: §05 grain nearly gone (0.02) — the page is quieting */}
            <div aria-hidden className="grain-overlay" style={{ "--grain-opacity": "0.02" } as React.CSSProperties} />
            {e.category && (
              <span className="absolute top-3 start-3 rounded-full border border-line bg-bg/90 px-3 py-1 text-xs font-semibold text-gold-ink">
                {e.category}
              </span>
            )}
          </div>
          <div className="p-5">
            <h3 className="font-serif text-lg font-bold leading-snug text-navy transition-colors group-hover:text-gold-ink">
              {e.title}
            </h3>
            {e.meta && <p className="mt-1.5 text-[0.8rem] font-medium text-muted">{e.meta}</p>}
          </div>
        </Link>
      ))}
    </MStagger>
  );
}
