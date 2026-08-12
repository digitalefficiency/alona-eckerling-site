// BrandLockup — Alona's two-line wordmark, drawn rather than photographed.
//
// The client supplied the logo as a raster (green text over a WHITE plate, wide
// margins, one flat colour). Three things made that file unusable as-is on this
// site, and all three disappear when the lockup is drawn instead:
//   1. the header slot is 28-32px tall, and a two-line raster at that height
//      renders each line at ~10px — legible only as a smudge;
//   2. the plate is opaque white, so it would have shown as a white rectangle
//      over every sand and cream band on the site;
//   3. the navy footer and CTA bands knock a light logo out with
//      brightness(0) invert(1), which flattens the green AND erases the avocado.
// Vector text scales cleanly, carries no background, and can recolour per
// surface while the avocado keeps its own palette.
//
// Why SVG and not an HTML block: the call sites size the mark with `h-8 w-auto`,
// exactly as they sized the <img>. A viewBox honours that contract; a text block
// would need its own font-size plumbing at every call site.
//
// textLength + lengthAdjust pin each line to a known width, so the lockup can
// never overflow its own viewBox if the webfont is swapped, fails to load, or
// falls back mid-render. The geometry is fixed; only the glyphs vary.

// TWO variants, because one lockup cannot serve both slots. The full mark is
// 33 characters across two lines; in the header's 32px slot that puts line one
// at roughly 10px, which is a smudge, not a wordmark. So the header gets a
// compact mark (name + avocado) and the footer — where there is real room —
// carries the full lockup. This is the ordinary primary/compact pairing every
// logo system ends up with, not a workaround.
const FULL = { w: 560, h: 132 };
const COMPACT = { w: 300, h: 64 };

export function BrandLockup({
  className = "",
  title,
  variant = "full",
}: {
  className?: string;
  /** accessible name — the caller owns it, so the mark carries no copy of its own */
  title: string;
  variant?: "full" | "compact";
}) {
  const box = variant === "compact" ? COMPACT : FULL;

  if (variant === "compact") {
    return (
      <svg
        viewBox={`0 0 ${box.w} ${box.h}`}
        className={className}
        role="img"
        aria-label={title}
        style={{ fontFamily: "var(--font-serif)" }}
      >
        <text
          x={172}
          y={45}
          textAnchor="middle"
          textLength={232}
          lengthAdjust="spacingAndGlyphs"
          fontSize={42}
          fontWeight={800}
          fill="currentColor"
        >
          אלונה אקרלינג
        </text>
        <Avocado x={30} y={31} r={20} />
      </svg>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${box.w} ${box.h}`}
      className={className}
      role="img"
      aria-label={title}
      // the glyphs inherit the page's serif; only the avocado carries fixed colour
      style={{ fontFamily: "var(--font-serif)" }}
    >
      <text
        x={box.w / 2}
        y={52}
        textAnchor="middle"
        textLength={520}
        lengthAdjust="spacingAndGlyphs"
        fontSize={40}
        fontWeight={800}
        fill="currentColor"
      >
        אלונה אקרלינג, R.D דיאטנית קלינית
      </text>
      <text
        x={box.w / 2 + 30}
        y={110}
        textAnchor="middle"
        textLength={380}
        lengthAdjust="spacingAndGlyphs"
        fontSize={36}
        fontWeight={800}
        fill="currentColor"
      >
        תזונה בגישה שפויה
      </text>
      <Avocado x={66} y={98} r={27} />
    </svg>
  );
}

// The half-avocado closes the wordmark at its READING end, which in RTL is the
// inline-start (left) edge — the same place it sits in the supplied artwork.
// Drawn, never the 🥑 emoji: an emoji glyph renders as whatever font the
// viewer's OS ships, so the mark would change shape per device — and it would
// vanish entirely anywhere the emoji font is missing. It also keeps its own
// colours on navy, where a knocked-out raster would have gone flat white.
function Avocado({ x, y, r }: { x: number; y: number; r: number }) {
  // An EGG silhouette, not an ellipse: narrow at the crown, full at the base.
  // A symmetrical ellipse reads as a target at logo scale — the taper is the
  // whole difference between "avocado" and "circle with a dot".
  const body = (k: number) => {
    const w = r * 0.86 * k;
    const h = r * k;
    return [
      `M 0,${-h}`,
      `C ${w * 0.62},${-h} ${w},${-h * 0.34} ${w},${h * 0.24}`,
      `C ${w},${h * 0.73} ${w * 0.55},${h} 0,${h}`,
      `C ${-w * 0.55},${h} ${-w},${h * 0.73} ${-w},${h * 0.24}`,
      `C ${-w},${-h * 0.34} ${-w * 0.62},${-h} 0,${-h}`,
      "Z",
    ].join(" ");
  };
  return (
    <g transform={`translate(${x}, ${y})`}>
      <path d={body(1)} fill="#6F9E4A" />
      <path d={body(0.72)} fill="#F2F1C8" />
      <circle cx="0" cy={r * 0.12} r={r * 0.3} fill="#8A5A2B" />
    </g>
  );
}
