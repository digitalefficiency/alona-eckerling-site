// Typographic recognition badges — award/membership NAMES as quiet text chips
// (no logo images, no color noise). Premium-tier: max 7 curated recognitions
// (bans the 10+ badge wall); use CredentialStrip when real logo artwork exists.
// Example: <RecognitionBadges badges={["חבר לשכת שמאי המקרקעין", "בורר מוסמך"]} />
const MAX_BADGES = 7;

export function RecognitionBadges({ badges }: { badges: string[] }) {
  if (process.env.NODE_ENV !== "production" && badges.length > MAX_BADGES) {
    console.warn(`[RecognitionBadges] ${badges.length} badges passed — rendering only the first ${MAX_BADGES} (premium-tier curation rule).`);
  }
  const shown = badges.slice(0, MAX_BADGES);
  if (!shown.length) return null;
  return (
    <ul className="flex flex-wrap gap-2.5">
      {shown.map((b) => (
        <li
          key={b}
          className="rounded-[4px] border border-line bg-card px-3.5 py-1.5 text-xs font-semibold tracking-wide text-navy-700"
        >
          {b}
        </li>
      ))}
    </ul>
  );
}
