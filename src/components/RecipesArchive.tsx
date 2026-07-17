"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { motionAllowed } from "@/lib/motion";

// ============================================================================
// RecipesArchive — the bespoke signature grid of the מתכונים page (plan section
// 24, archetype bento-grid). A client component fed REAL CMS entries from the
// server (listDocs("recipes")): sage category chips + diet-tag chips filter an
// editorial masonry/bento mosaic. Every visible label is either pasted COPY
// (passed via `labels`) or CMS data (categories, tags, titles) — nothing is
// authored here. Honest empty-filter state from COPY; no ratings, no counters,
// no invented metrics (YMYL: a recipe is food, not a treatment).
//
// Motion (plan layer 6, tokens only): SSR / no-JS / reduced-motion /
// a11y-stop-motion render the FINAL visible grid; motion allowed → tiles
// stagger up once on first view (--dur-stagger steps, --ease-out), and each
// filter swap re-enters with the same gentle fade (instant under reduced
// motion). Hover lift is micro and desktop-only by nature.
// ============================================================================

export type RecipeTile = {
  slug: string;
  title: string;
  image?: string;
  imageAlt?: string;
  category: string;
  tags: string[];
  prepTime?: string;
};

export type ArchiveLabels = {
  /** COPY: «הכול» — the default filter chip */
  all: string;
  /** COPY: the honest count chip («בערך 30 מתכונים · מתכון חדש כל שבוע») */
  countChip: string;
  /** COPY: the honest empty-filter state */
  empty: string;
  /** collection label from the CMS config («מתכונים») — sr-only h2 + live region */
  list: string;
  /** CMS field label for the category chip group (aria) */
  categoryGroup: string;
  /** CMS field label for the diet-tag chip group (aria) */
  tagGroup: string;
};

const useIso = typeof window !== "undefined" ? useLayoutEffect : useEffect;

// Menu order for the CMS `category` values — SORT ONLY. Chips render only the
// values that actually exist in the entries; unknown categories append last.
const CATEGORY_ORDER = ["בוקר", "צהריים", "ערב", "סלטים", "מרקים", "מאפים", "מתוקים", "חטיפים"];

// Bento spans — one 2×2 feature opens the mosaic, then a deterministic sprinkle
// of wide/tall tiles keeps the grid irregular-but-orderly (grid-flow-dense
// backfills the gaps). RTL-safe: the grid is symmetric, order flows from the
// inline start.
function spanFor(i: number): string {
  if (i === 0) return "row-span-2 sm:col-span-2";
  if (i % 9 === 4) return "lg:col-span-2";
  if (i % 7 === 3) return "lg:row-span-2";
  return "";
}

// One neutral meta line at most (COPY card rule) — prep time only when the CMS
// holds a real duration, then the first diet tag; category as last resort.
function tileMeta(t: RecipeTile): string | undefined {
  const parts: string[] = [];
  if (t.prepTime && /\d/.test(t.prepTime)) parts.push(t.prepTime);
  if (t.tags[0]) parts.push(t.tags[0]);
  if (parts.length === 0 && t.category) parts.push(t.category);
  return parts.length ? parts.slice(0, 2).join(" · ") : undefined;
}

function CategoryChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`chip-skew inline-flex items-center gap-1.5 rounded-[6px] px-4 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 ${
        active ? "bg-gold text-white" : "bg-gold-soft text-navy hover:bg-gold/20"
      }`}
    >
      {/* the section's single dusty-rose accent: the active-chip mark.
          children are wrapped in spans so .chip-skew's counter-skew applies. */}
      {active && <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-rose" />}
      <span>{children}</span>
    </button>
  );
}

function TagChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-[0.8rem] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1 ${
        active
          ? "border-gold bg-gold-soft/70 text-gold-ink"
          : "border-line bg-transparent text-muted hover:border-gold/60 hover:text-navy"
      }`}
    >
      {children}
    </button>
  );
}

function ImageTile({ t, feature }: { t: RecipeTile; feature: boolean }) {
  const meta = tileMeta(t);
  return (
    <Link
      href={`/recipes/${t.slug}`}
      data-cta={`recipes-card-${t.slug}`}
      className="group relative flex h-full flex-col justify-end overflow-hidden rounded-2xl border border-line bg-sand transition duration-[var(--dur-micro)] ease-[var(--ease-out)] hover:-translate-y-1 hover:shadow-[var(--elevation-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
    >
      <Image
        src={t.image as string}
        alt={t.imageAlt || t.title}
        fill
        sizes={
          feature
            ? "(max-width:640px) 100vw, (max-width:1024px) 100vw, 820px"
            : "(max-width:640px) 100vw, (max-width:1024px) 50vw, 410px"
        }
        className="object-cover transition duration-[calc(var(--dur-reveal)*0.7)] ease-[var(--ease-out)] group-hover:scale-[1.02]"
      />
      {/* the ONE shared image grade: brand tint + the shared grain token */}
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "var(--grade-tint)" }} />
      <div aria-hidden className="grain-overlay" />
      {/* bottom scrim keeps the title AA over any dish photo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-navy/80 via-navy/30 to-transparent"
      />
      <div className="relative p-5">
        <h3 className={`font-serif font-bold leading-snug text-white ${feature ? "text-2xl md:text-3xl" : "text-lg"}`}>
          {t.title}
        </h3>
        {meta && <p className="mt-1.5 text-[0.8rem] font-medium text-white/90">{meta}</p>}
      </div>
    </Link>
  );
}

// A real recipe whose photo has not been uploaded yet — an intentional
// "recipe-card" object (never a stock image, never a broken src): alternating
// warm washes keyed to the tile's mosaic position, a large faint serif ״ mark,
// and the category as a paper chip. Reads designed, not failed, until the
// client uploads her own dish photo through the CMS.
function TextTile({ t, tint }: { t: RecipeTile; tint: "sage" | "blush" }) {
  const meta = tileMeta(t);
  return (
    <Link
      href={`/recipes/${t.slug}`}
      data-cta={`recipes-card-${t.slug}`}
      className={`group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-line p-5 transition duration-[var(--dur-micro)] ease-[var(--ease-out)] hover:-translate-y-1 hover:border-gold/60 hover:shadow-[var(--elevation-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 ${
        tint === "sage" ? "bg-gold-soft/60" : "bg-blush/50"
      }`}
    >
      {/* the card's quiet mark — a large faint serif quote glyph */}
      <span
        aria-hidden
        className="pointer-events-none absolute -top-5 start-2 font-serif text-[6.5rem] font-black leading-none text-navy/10"
      >
        ״
      </span>
      <div className="relative">
        {t.category && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-bg/85 px-3 py-1 text-xs font-bold text-gold-ink">
            <span aria-hidden className="text-[0.55rem] leading-none text-gold">◆</span>
            {t.category}
          </span>
        )}
      </div>
      <div className="relative">
        <h3 className="font-serif text-lg font-bold leading-snug text-navy group-hover:text-gold-ink">{t.title}</h3>
        {meta && <p className="mt-1.5 text-[0.8rem] font-medium text-muted">{meta}</p>}
      </div>
    </Link>
  );
}

export function RecipesArchive({ entries, labels }: { entries: RecipeTile[]; labels: ArchiveLabels }) {
  const [category, setCategory] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);

  // Chip sets derive from the entries' REAL field values (never hardcoded).
  const categories = useMemo(() => {
    const seen: string[] = [];
    for (const e of entries) if (e.category && !seen.includes(e.category)) seen.push(e.category);
    return seen.sort((a, b) => {
      const ia = CATEGORY_ORDER.indexOf(a);
      const ib = CATEGORY_ORDER.indexOf(b);
      return (ia === -1 ? CATEGORY_ORDER.length : ia) - (ib === -1 ? CATEGORY_ORDER.length : ib);
    });
  }, [entries]);

  const dietTags = useMemo(() => {
    const freq = new Map<string, number>();
    for (const e of entries) for (const t of e.tags) freq.set(t, (freq.get(t) ?? 0) + 1);
    return [...freq.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t);
  }, [entries]);

  const filtered = useMemo(
    () => entries.filter((e) => (!category || e.category === category) && tags.every((t) => e.tags.includes(t))),
    [entries, category, tags],
  );

  const listKey = `${category ?? "*"}|${tags.join("|")}`;

  // Entrance state machine (house Reveal mechanism): "rest" = final visible
  // (SSR / no-JS / reduced-motion). Motion allowed → arm hidden pre-paint,
  // then reveal: the FIRST view rides a one-shot IntersectionObserver (the
  // scroll-in entrance), while a filter SWAP re-enters on a short scheduling
  // timeout — the user just clicked a chip, so the grid is on screen; a
  // timeout (unlike rAF / a fresh IO) also survives throttled tabs, so the
  // grid can never be left stuck hidden.
  const gridRef = useRef<HTMLUListElement>(null);
  const [phase, setPhase] = useState<"rest" | "armed" | "in">("rest");
  const prevKey = useRef<string | null>(null);
  useIso(() => {
    const isSwap = prevKey.current !== null && prevKey.current !== listKey;
    prevKey.current = listKey;
    if (!motionAllowed()) {
      setPhase("rest");
      return;
    }
    const el = gridRef.current;
    if (!el) {
      setPhase("rest"); // empty-filter view — nothing to animate
      return;
    }
    setPhase("armed");
    if (isSwap) {
      // one painted frame of the armed state, then the staggered re-entry
      const t = setTimeout(() => setPhase("in"), 50);
      return () => clearTimeout(t);
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setPhase("in");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [listKey]);

  const toggleTag = (t: string) =>
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  return (
    <div>
      <h2 className="sr-only">{labels.list}</h2>

      {/* sticky sage filter bar — the honest-count chip rides beside the chips */}
      <div className="sticky top-20 z-30 md:top-24">
        <div className="rounded-2xl border border-line bg-bg/90 px-4 py-3 shadow-[var(--elevation-1)] backdrop-blur-md">
          <div role="group" aria-label={labels.categoryGroup} className="flex flex-wrap items-center gap-2">
            <CategoryChip active={category === null} onClick={() => setCategory(null)}>
              {labels.all}
            </CategoryChip>
            {categories.map((c) => (
              <CategoryChip key={c} active={category === c} onClick={() => setCategory((p) => (p === c ? null : c))}>
                {c}
              </CategoryChip>
            ))}
            <span className="ms-auto rounded-full bg-gold-soft px-3.5 py-1.5 text-[0.8rem] font-bold text-gold-ink">
              {labels.countChip}
            </span>
          </div>
          <div
            role="group"
            aria-label={labels.tagGroup}
            className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-line2 pt-2.5"
          >
            {dietTags.map((t) => (
              <TagChip key={t} active={tags.includes(t)} onClick={() => toggleTag(t)}>
                {t}
              </TagChip>
            ))}
          </div>
        </div>
      </div>

      <p aria-live="polite" className="sr-only">
        {filtered.length} · {labels.list}
      </p>

      {filtered.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-line bg-sand px-6 py-16 text-center">
          <p className="mx-auto max-w-[40ch] font-serif text-xl font-bold leading-relaxed text-navy">{labels.empty}</p>
        </div>
      ) : (
        <ul
          ref={gridRef}
          className="mt-8 grid grid-flow-dense grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-3 [grid-auto-rows:13rem]"
        >
          {filtered.map((t, i) => (
            <li
              key={t.slug}
              style={phase === "in" ? { transitionDelay: `calc(var(--dur-stagger) * ${Math.min(i, 8)})` } : undefined}
              className={`${spanFor(i)} transition-all duration-[calc(var(--dur-reveal)*0.7)] ease-[var(--ease-out)] ${
                phase === "armed" ? "translate-y-3 opacity-0" : "translate-y-0 opacity-100"
              }`}
            >
              {t.image ? (
                <ImageTile t={t} feature={i === 0} />
              ) : (
                <TextTile t={t} tint={i % 2 === 0 ? "sage" : "blush"} />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
