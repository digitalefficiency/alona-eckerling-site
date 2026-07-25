import { ClipReveal } from "@/components/motion/ClipReveal";

// Team photo treatment. YMYL: STATIC photo only — ClipReveal wipes the frame on
// reveal, it never warps/animates facial geometry. No synthetic faces (a member
// without a photo uses <Monogram/> instead). avatar = 1/1, portrait = 3/4.
export function Portrait({
  src,
  alt,
  variant = "avatar",
  className = "",
  sizes = "(max-width:768px) 100vw, 420px",
}: {
  src: string;
  alt: string;
  variant?: "avatar" | "portrait";
  className?: string;
  sizes?: string;
}) {
  const ar = variant === "portrait" ? "var(--aspect-portrait)" : "var(--aspect-avatar)";
  return (
    <div
      className={`relative overflow-hidden rounded-[10px] border border-line ${className}`}
      style={{ aspectRatio: ar }}
    >
      <ClipReveal src={src} alt={alt} sizes={sizes} />
      <span className="tick tick-1" aria-hidden />
      <span className="tick tick-2" aria-hidden />
      <span className="tick tick-3" aria-hidden />
      <span className="tick tick-4" aria-hidden />
    </div>
  );
}

// Typographic stand-in for a member with no photograph — NEVER a
// synthetic face. A serif monogram on a navy field with the house corner ticks.
export function Monogram({
  initial,
  variant = "avatar",
  className = "",
}: {
  initial: string;
  variant?: "avatar" | "portrait";
  className?: string;
}) {
  const ar = variant === "portrait" ? "var(--aspect-portrait)" : "var(--aspect-avatar)";
  return (
    <div
      className={`relative grid place-items-center overflow-hidden rounded-[10px] border border-line bg-navy ${className}`}
      style={{ aspectRatio: ar }}
    >
      {/* A 7%-opacity blueprint texture used to sit here, carried over from the
          source design system. /media/texture/ was never provisioned for this
          site, so it 404'd on every render of /team/alona while showing nothing
          — a failed request for zero pixels. Removed rather than provisioned:
          the monogram reads as intended on the flat navy field, and the palette
          here is the client's own, not the one that texture was cut for. */}
      <span className="relative font-serif font-black text-gold-soft" style={{ fontSize: "clamp(3rem, 9vw, 6rem)" }}>
        {initial}
      </span>
      <span className="tick tick-1" aria-hidden />
      <span className="tick tick-2" aria-hidden />
      <span className="tick tick-3" aria-hidden />
      <span className="tick tick-4" aria-hidden />
    </div>
  );
}
