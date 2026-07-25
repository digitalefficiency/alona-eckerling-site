import Image from "next/image";

// Recognition/membership logo row — curated and quiet. HARD RULE: renders at
// most 7 logos, monochrome (grayscale + dimmed). Premium-tier ban: "badge wall
// clutter (10+ logos); premium = max 5-7 curated, monochrome".
// Example: <CredentialStrip label="חברים ומוכרים על ידי"
//   items={[{ src: "/media/logos/bar-association.svg", alt: "לשכת עורכי הדין" }]} />
const MAX_LOGOS = 7;

export function CredentialStrip({
  items,
  label,
}: {
  items: { src: string; alt: string }[];
  label?: string;
}) {
  if (process.env.NODE_ENV !== "production" && items.length > MAX_LOGOS) {
    console.warn(`[CredentialStrip] ${items.length} logos passed — rendering only the first ${MAX_LOGOS}. Curate, don't clutter (premium-tier ban).`);
  }
  const shown = items.slice(0, MAX_LOGOS);
  if (!shown.length) return null;
  return (
    <div className="text-center">
      {label && (
        <div className="mb-7 flex items-center justify-center gap-2.5">
          <span className="text-[0.65rem] leading-none text-gold" aria-hidden>◆</span>
          <span className="text-xs font-bold tracking-eyebrow text-gold-ink">{label}</span>
        </div>
      )}
      <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
        {shown.map((logo) => (
          <li key={logo.src}>
            <Image
              src={logo.src}
              alt={logo.alt}
              width={140}
              height={56}
              className="h-9 w-auto object-contain opacity-60 grayscale transition hover:opacity-90 md:h-10"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
