import { ClipReveal } from "@/components/motion/ClipReveal";

type Item = { src: string; alt: string; caption?: string };

// Responsive image grid; each tile uncovers with the signature clip-wipe (its
// own observer) and gently zooms on hover. Server component.
export function Gallery({
  items,
  cols = 3,
  ratio = "card",
}: {
  items: Item[];
  cols?: 2 | 3;
  /** "portrait" is for phone-shot sets (the recipe archive): a 9:16 photo cropped
   *  into the 4/3 card loses most of the plate, 3/4 keeps the dish whole. */
  ratio?: "card" | "wide" | "portrait";
}) {
  const ar =
    ratio === "wide"
      ? "var(--aspect-wide)"
      : ratio === "portrait"
        ? "var(--aspect-portrait)"
        : "var(--aspect-card)";
  return (
    <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${cols === 3 ? "lg:grid-cols-3" : ""}`}>
      {items.map((it, i) => (
        <figure key={i} className="group">
          <div
            className="relative overflow-hidden rounded-[10px] border border-line"
            style={{ aspectRatio: ar }}
          >
            <ClipReveal
              src={it.src}
              alt={it.alt}
              sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 380px"
              imgClassName="transition duration-[var(--dur-ui)] group-hover:scale-105"
            />
          </div>
          {it.caption && (
            <figcaption className="mt-2 text-sm text-muted">{it.caption}</figcaption>
          )}
        </figure>
      ))}
    </div>
  );
}
