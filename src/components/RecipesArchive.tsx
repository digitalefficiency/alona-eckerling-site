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
//
// A big slot is a slot for a PHOTO: only entries that actually carry an image can
// be enlarged, so an imageless recipe-card can never be blown up into a big empty
// pastel tower. The sort is untouched — `featureIndex` is simply the first entry
// in the existing order that has a photo (‑1 when the filter holds none, in which
// case the mosaic opens flat rather than featuring an empty card).
function spanFor(i: number, featureIndex: number, hasImage: boolean): string {
  if (!hasImage) return "";
  // the 2×2 feature exists only where the mosaic has columns (sm+): in the
  // one-column phone grid a doubled-height first card reads as a glitch, not
  // a feature, and pushes recipe #2 under the fold.
  if (i === featureIndex) return "sm:col-span-2 sm:row-span-2";
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
      className={`chip-skew inline-flex min-h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[6px] px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 md:min-h-0 md:py-1.5 ${
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
      className={`chip-skew inline-flex min-h-10 shrink-0 items-center whitespace-nowrap rounded-[6px] border px-3.5 py-2 text-[0.85rem] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1 md:min-h-0 md:py-1 ${
        active
          ? "border-gold bg-gold-soft/70 text-gold-ink"
          : "border-line bg-transparent text-muted hover:border-gold/60 hover:text-navy"
      }`}
    >
      {/* the quiet twin of CategoryChip: same skewed spice-jar silhouette, line
          border + transparent fill. Wrapped so .chip-skew's counter-skew applies. */}
      <span>{children}</span>
    </button>
  );
}

// The magazine-gallery tile (client's call): the dish photo FILLS the whole card
// and the title rides ON it, over a bottom scrim graded into the photo. This is the
// one place the site lets type sit on imagery — the recipe photos ARE the content,
// so an edge-to-edge cover reads editorial, not template. Category chip on the top
// corner; hover pushes the photo in behind the fixed title.
function ImageTile({ t, feature }: { t: RecipeTile; feature: boolean }) {
  const meta = tileMeta(t);
  return (
    <Link
      href={`/recipes/${t.slug}`}
      data-cta={`recipes-card-${t.slug}`}
      className="group relative flex h-full flex-col justify-end overflow-hidden rounded-2xl border border-line transition-colors duration-[var(--dur-micro)] ease-[var(--ease-out)] hover:border-gold/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
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
        className="object-cover transition duration-[calc(var(--dur-reveal)*0.7)] ease-[var(--ease-out)] group-hover:scale-[1.04]"
      />
      {/* the ONE shared image grade: brand tint + the shared grain token */}
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "var(--grade-tint)" }} />
      <div aria-hidden className="grain-overlay" />
      {/* legibility scrim, graded UP from the navy foot so the title reads over any dish */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-navy/85 via-navy/35 to-transparent"
      />
      {t.category && (
        <span className="absolute top-3 start-3 rounded-[4px] border border-white/25 bg-navy/40 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
          {t.category}
        </span>
      )}
      {/* the title rides ON the photo (client-requested magazine cover) */}
      <div className={`relative ${feature ? "p-6" : "p-5"}`}>
        <h3
          className={`font-serif font-bold leading-snug text-white [text-shadow:0_1px_10px_color-mix(in_srgb,var(--color-navy)_45%,transparent)] ${
            feature ? "text-2xl md:text-3xl" : "text-lg"
          }`}
        >
          {t.title}
        </h3>
        {meta && (
          <p className={`mt-1.5 font-medium text-white/85 ${feature ? "text-sm" : "text-[0.8rem]"}`}>{meta}</p>
        )}
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
      className={`group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-line p-5 transition-colors duration-[var(--dur-micro)] ease-[var(--ease-out)] hover:border-gold/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 ${
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
          <span className="inline-flex items-center gap-1.5 rounded-[4px] bg-bg/85 px-3 py-1 text-xs font-bold text-gold-ink">
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

  // the mosaic's 2×2 opener: the first entry IN THE EXISTING ORDER that carries a
  // photo (‑1 → this filter holds no photos at all, so nothing is featured).
  const featureIndex = useMemo(() => filtered.findIndex((e) => !!e.image), [filtered]);

  const listKey = `${category ?? "*"}|${tags.join("|")}`;

  // Entrance state machine (house Reveal mechanism): "rest" = final visible
  // (SSR / no-JS / reduced-motion). Motion allowed → arm hidden pre-paint,
  // then reveal: the FIRST view rides a one-shot IntersectionObserver (the
  // scroll-in entrance), while a filter SWAP re-enters on a short scheduling
  // timeout — the user just clicked a chip, so the grid is on screen; a
  // timeout (unlike rAF / a fresh IO) also survives throttled tabs, so the
  // grid can never be left stuck hidden.
  const gridRef = useRef<HTMLUListElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<"rest" | "armed" | "in">("rest");
  const prevKey = useRef<string | null>(null);
  const didUrlRestore = useRef(false);
  // distinguishes a chip-tap re-entry from the first scroll-in: a filter is a
  // utility, so a swap gets a quick near-simultaneous fade (--dur-micro, no
  // stagger theatre); the full staggered entrance stays for the first view.
  const isSwapRef = useRef(false);
  useIso(() => {
    // once, pre-paint: restore filters reflected in the URL. Back from a
    // recipe remounts this client component, so state alone forgets every
    // filter — the URL (?cat=…&tags=…) is the memory, and it makes a filtered
    // view shareable. Values are validated against the real CMS-derived sets.
    if (!didUrlRestore.current) {
      didUrlRestore.current = true;
      const params = new URLSearchParams(window.location.search);
      const cat = params.get("cat");
      const tagParam = params.get("tags");
      const nextCat = cat && categories.includes(cat) ? cat : null;
      const nextTags = tagParam ? tagParam.split(",").filter((t) => dietTags.includes(t)) : [];
      if (nextCat !== null || nextTags.length > 0) {
        setCategory(nextCat);
        setTags(nextTags);
        return; // re-runs synchronously with the restored key; arms then
      }
    }
    const isSwap = prevKey.current !== null && prevKey.current !== listKey;
    prevKey.current = listKey;
    isSwapRef.current = isSwap;
    // swap scroll-clamp: tapping a small category deep inside the (very tall)
    // one-column mobile grid collapses the page height by thousands of px and
    // the browser dumps the user at the footer. Pre-paint, pull the viewport
    // back so the sticky bar + the first result row stay on screen. Anchored
    // on the wrapper (not the ul — the empty state has no ul) and runs even
    // under reduced motion: this is correctness, not animation.
    if (isSwap && wrapRef.current) {
      // = the sticky bar's top-20 / md:top-24 offsets
      const stickyOffset = window.matchMedia("(min-width: 768px)").matches ? 96 : 80;
      const wrapTop = wrapRef.current.getBoundingClientRect().top + window.scrollY;
      if (window.scrollY > wrapTop - stickyOffset) {
        window.scrollTo({ top: Math.max(wrapTop - stickyOffset, 0), behavior: "auto" });
      }
    }
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
      // one painted frame of the armed state, then the quick re-entry
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

  // single write-path for every chip: set state, then REFLECT to the URL —
  // history.replaceState (not router.replace) keeps this SSG-safe with no
  // Suspense boundary, adds no history entries and never touches scroll.
  const applyFilters = (nextCategory: string | null, nextTags: string[]) => {
    setCategory(nextCategory);
    setTags(nextTags);
    const params = new URLSearchParams(window.location.search);
    if (nextCategory) params.set("cat", nextCategory);
    else params.delete("cat");
    if (nextTags.length > 0) params.set("tags", nextTags.join(","));
    else params.delete("tags");
    const qs = params.toString();
    window.history.replaceState(window.history.state, "", qs ? `?${qs}` : window.location.pathname);
  };

  const toggleTag = (t: string) =>
    applyFilters(category, tags.includes(t) ? tags.filter((x) => x !== t) : [...tags, t]);

  return (
    <div ref={wrapRef}>
      <h2 className="sr-only">{labels.list}</h2>

      {/* sticky sage filter bar. Phones get ONE scrollable line per chip row
          (the wrapped bar ate half an iPhone screen); sm+ wraps as before.
          The -m/p pairs give the clipped focus ring breathing room inside the
          scroll containers without shifting layout. */}
      <div className="sticky top-20 z-30 md:top-24">
        <div className="rounded-2xl border border-line bg-bg/90 px-4 py-3 shadow-[var(--elevation-1)] backdrop-blur-md">
          <div
            role="group"
            aria-label={labels.categoryGroup}
            className="-mx-1 -my-1 flex flex-nowrap items-center gap-2.5 overflow-x-auto px-1 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:overflow-x-visible"
          >
            <CategoryChip active={category === null} onClick={() => applyFilters(null, tags)}>
              {labels.all}
            </CategoryChip>
            {categories.map((c) => (
              <CategoryChip key={c} active={category === c} onClick={() => applyFilters(category === c ? null : c, tags)}>
                {c}
              </CategoryChip>
            ))}
            {/* the honest-count chip rides the bar only where there is room —
                on phones it moves to the static line above the grid */}
            <span className="ms-auto hidden shrink-0 rounded-[4px] bg-gold-soft px-3.5 py-1.5 text-[0.8rem] font-bold text-gold-ink md:inline-flex">
              {labels.countChip}
            </span>
          </div>
          <div
            role="group"
            aria-label={labels.tagGroup}
            className="-mx-1 -mb-1 mt-2.5 flex flex-nowrap items-center gap-2.5 overflow-x-auto border-t border-line2 px-1 pb-1 pt-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:overflow-x-visible"
          >
            {dietTags.map((t) => (
              <TagChip key={t} active={tags.includes(t)} onClick={() => toggleTag(t)}>
                {t}
              </TagChip>
            ))}
          </div>
        </div>
      </div>

      {/* the honest count line, phones/tablets — same pasted COPY string the
          md+ bar chip shows */}
      <p className="mt-6 text-[0.85rem] font-bold text-gold-ink md:hidden">{labels.countChip}</p>

      <p aria-live="polite" className="sr-only">
        {filtered.length} · {labels.list}
      </p>

      {filtered.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-line bg-sand px-6 py-16 text-center">
          <p className="mx-auto max-w-[40ch] font-serif text-xl font-bold leading-relaxed text-navy">{labels.empty}</p>
          {/* one-tap way back — reuses the pasted «הכול» chip instead of
              sending her up to dismantle the bar selection chip by chip */}
          <div className="mt-6 flex justify-center">
            <CategoryChip active={false} onClick={() => applyFilters(null, [])}>
              {labels.all}
            </CategoryChip>
          </div>
        </div>
      ) : (
        <ul
          ref={gridRef}
          className="mt-8 grid grid-flow-dense grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-3 [grid-auto-rows:12rem] sm:[grid-auto-rows:13rem]"
        >
          {filtered.map((t, i) => (
            <li
              key={t.slug}
              style={
                phase === "in"
                  ? {
                      // swap = utility: near-simultaneous; first view keeps the stagger
                      // swap: no delay property at all (browser default = immediate)
                      transitionDelay: isSwapRef.current ? undefined : `calc(var(--dur-stagger) * ${Math.min(i, 8)})`,
                    }
                  : undefined
              }
              className={`${spanFor(i, featureIndex, !!t.image)} transition-all ease-[var(--ease-out)] ${
                isSwapRef.current ? "duration-[var(--dur-micro)]" : "duration-[calc(var(--dur-reveal)*0.7)]"
              } ${phase === "armed" ? "translate-y-3 opacity-0" : "translate-y-0 opacity-100"}`}
            >
              {t.image ? (
                <ImageTile t={t} feature={i === featureIndex} />
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
