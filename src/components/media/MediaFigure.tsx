import { ClipReveal } from "@/components/motion/ClipReveal";

const AR: Record<string, string> = {
  hero: "var(--aspect-hero)",
  feature: "var(--aspect-feature)",
  card: "var(--aspect-card)",
  wide: "var(--aspect-wide)",
};

// A framed inline image with optional caption + credit, revealed with the
// signature clip-wipe. For JSX placement (server-rendered prose uses the
// .prose-rtl img/figure CSS instead).
export function MediaFigure({
  src,
  alt,
  caption,
  credit,
  ratio = "feature",
  sizes = "(max-width:768px) 100vw, 800px",
  className = "",
}: {
  src: string;
  alt: string;
  caption?: string;
  credit?: string;
  ratio?: keyof typeof AR;
  sizes?: string;
  className?: string;
}) {
  return (
    <figure className={`my-8 ${className}`}>
      <div
        className="relative overflow-hidden rounded-[10px] border border-line"
        style={{ aspectRatio: AR[ratio] }}
      >
        <ClipReveal src={src} alt={alt} sizes={sizes} />
      </div>
      {(caption || credit) && (
        <figcaption className="mt-3 flex items-center gap-2 text-sm text-muted">
          <span className="text-[0.55rem] leading-none text-gold-ink" aria-hidden>◆</span>
          {caption}
          {credit && <span className="text-muted/70">· {credit}</span>}
        </figcaption>
      )}
    </figure>
  );
}
