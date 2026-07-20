// ThreadRail — the ONE seam mechanism of the site (2026-07-20).
//
// The page used to carry seven different ways of handing one section to the
// next (ShapedSection arcs and curves, SectionSeam, MChapter, drawn stitches,
// gradient washes, hard cuts, overlaps) — which is why it read as a stack of
// separate pictures instead of one page. Now there is one: the rose thread
// that was born at the hero's CTA simply never stops. It runs the full height
// of the content in the reading-edge lane, and every section is something it
// passes through.
//
// Deliberately STATIC and server-rendered: a single path stretched to the real
// content height by preserveAspectRatio="none", with vector-effect keeping the
// stroke a true 2px at any scale. Nothing measures the page, nothing animates,
// so SSR, no-JS and reduced-motion are all identical to the live render — and
// it costs zero JS. What moves is only what sits ON the thread (knots), each
// arming through the existing reveal primitives.
//
// Visible on phones too: the previous thread was hidden below md, meaning the
// connection between sections disappeared exactly where most scrolling happens.

export function ThreadRail({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 100 1000"
      preserveAspectRatio="none"
      fill="none"
      // h-full is load-bearing: an absolutely positioned REPLACED element with
      // height:auto derives its height from the viewBox ratio and ignores
      // `bottom`, so inset-y-0 alone left the rail 255px tall on an 11800px page.
      // z-20 keeps it above the rooms' own backgrounds (which paint later in DOM
      // order) and below the header (z-50); it rides the gutter, never the text.
      // START side: in RTL that is the physical right, the reading edge — the same
      // corner the hero thread is born at, so the rail is literally its continuation.
      className={`pointer-events-none absolute inset-y-0 start-[var(--thread-lane)] z-20 h-full w-16 overflow-visible ${className}`}
    >
      {/* One hand-drawn descent. The wavelength is deliberately LONG — roughly a
          viewport per lean — so at any moment the reader sees a quiet line that
          is gently drifting, never a decorative squiggle. Stretched over ~12000px
          a short wavelength collapses into a straight ruled border, which is
          exactly what a thread must not look like. */}
      <path
        d="M62 0C62 48 20 78 28 128C36 178 74 206 66 258C58 310 18 336 26 388C34 440 72 470 64 522C56 574 16 600 24 652C32 704 70 734 62 786C54 838 18 866 26 918C32 958 44 978 48 1000"
        stroke="var(--color-rose)"
        strokeWidth="2"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

// The knots — the ◆ punctuation ON the thread, replacing MChapter/SectionSeam
// as the site's only chapter mark. They cannot live inside the rail's <svg>:
// preserveAspectRatio="none" stretches it ~12× vertically, so any shape drawn
// there would smear. Instead they are separate spans in the same lane, placed
// at the percentages where the path crosses the lane's middle — so each one
// lands ON the line at any page height.
const KNOTS = [23, 49, 75];

export function ThreadKnots() {
  return (
    <>
      {KNOTS.map((top) => (
        <span
          key={top}
          aria-hidden
          className="pointer-events-none absolute z-20 grid h-[15px] w-[15px] rotate-45 place-items-center border border-rose/80 bg-bg"
          style={{ top: `${top}%`, insetInlineStart: "calc(var(--thread-lane) + 25px)" }}
        />
      ))}
    </>
  );
}
