// Centered content container at one of three standard widths (the unified scale).
// Server component, zero JS. Replaces ad-hoc `mx-auto max-w-[...] px-6`.
const WIDTHS = {
  wide: "max-w-[var(--container-wide)]", // 1240 — sections, grids, heroes
  standard: "max-w-[var(--container-standard)]", // 1120 — bands, centered blocks
  prose: "max-w-[var(--container-prose)]", // 760 — long-form reading measure
} as const;

export function Container({
  width = "wide",
  className = "",
  children,
}: {
  width?: keyof typeof WIDTHS;
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={`mx-auto ${WIDTHS[width]} px-4 sm:px-6 ${className}`}>{children}</div>;
}
