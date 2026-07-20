// SeamShape — the ONE section-transition shape (2026-07-20, Rom's call).
//
// Rom asked for a shaped hand-off between rooms, not the flat colour dissolve
// the page had. So the bottom edge of each photo room is a single soft curve
// where the next room's ground rises into the photo above, and the direction
// alternates (crest / trough) between consecutive seams so the scroll never
// feels mechanical. One boundary — before the navy lead form — takes the
// half-circle "arch" accent (his pick), filled navy so the night rises in.
//
// It is an absolutely-positioned SVG pinned to the room's bottom, so the shape
// rises into the room's OWN photo layer and never covers text. Zero JS, no
// animation → SSR / no-JS / reduced-motion are identical to the live render.
// preserveAspectRatio="none" stretches one path to any width. Pair it with the
// media's edge fade (.room-edges-*) so the colour softens too, not just the line.

type SeamVariant = "curve-up" | "curve-down" | "arch";

const PATHS: Record<SeamVariant, string> = {
  // the lower room's ground crests up into the photo above — a single gentle hill
  "curve-up": "M0,80 L0,50 C400,18 800,18 1200,50 L1200,80 Z",
  // the mirror trough, so consecutive seams breathe in opposite directions
  "curve-down": "M0,80 L0,22 C400,54 800,54 1200,22 L1200,80 Z",
  // the accent: one clean half-circle the ground rises through (before the form)
  arch: "M0,80 L0,58 L444,58 C444,8 560,4 600,4 C640,4 756,8 756,58 L1200,58 L1200,80 Z",
};

export function SeamShape({
  variant = "curve-up",
  fill = "var(--color-bg)",
  className = "",
  height = 72,
}: {
  variant?: SeamVariant;
  /** the colour that rises — the ground of the room BELOW this seam */
  fill?: string;
  className?: string;
  /** rendered band height in px; the viewBox is fixed so the curve scales */
  height?: number;
}) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-x-0 bottom-0 z-10 w-full ${className}`}
      style={{ height }}
    >
      <svg
        viewBox="0 0 1200 80"
        preserveAspectRatio="none"
        fill="none"
        className="block h-full w-full"
      >
        <path d={PATHS[variant]} fill={fill} />
      </svg>
    </div>
  );
}
