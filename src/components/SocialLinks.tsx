import { site, type SocialProfile } from "@/lib/site";

// SocialLinks — the visible half of lib/site.ts `socials` (schema-presets owns
// the other half, `sameAs`). One record feeds both, so a profile can never be
// on screen but missing from the markup, or the reverse.
//
// Labelled chips, not bare icons: a naked glyph row is both an accessibility
// failure (nothing to announce but a guess at the brand) and a conversion
// failure (nobody clicks a symbol without knowing where it goes). The label
// carries the meaning; the glyph only speeds up recognition.

// Both glyphs are authored here rather than imported: the installed lucide-react
// exports neither Instagram nor TikTok (brand marks were dropped from the set),
// and hand-drawing the pair in ONE geometry (24×24, fill none, currentColor,
// stroke-width 2, round caps) is what makes the row read as a single icon family
// instead of two logos borrowed from different places.
function Glyph({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable="false"
      className={className}
    >
      {children}
    </svg>
  );
}

const GLYPH: Record<SocialProfile["network"], (p: { className?: string }) => React.ReactElement> = {
  // rounded body · lens · the corner dot drawn as a zero-length round-capped
  // line, so it inherits the same stroke weight as everything else
  instagram: ({ className }) => (
    <Glyph className={className}>
      <rect x="2" y="2" width="20" height="20" rx="5.5" />
      <circle cx="12" cy="12" r="4" />
      <path d="M17.5 6.5h.01" />
    </Glyph>
  ),
  // the note: a hook circle, the stem rising from its exact right edge
  // (x = cx + r = 13), and the shoulder curving off the top
  tiktok: ({ className }) => (
    <Glyph className={className}>
      <circle cx="8.5" cy="16" r="4.5" />
      <path d="M13 16V3" />
      <path d="M13 3c.5 2.8 2.7 5 5.5 5.3" />
    </Glyph>
  ),
};

// Exported so the Header can wear the SAME two glyphs. The header needs an
// icon-only affordance (there is no room for a labelled chip in the island), and
// re-drawing the marks there would fork the geometry the moment either is tuned.
// The a11y half of the "labelled chips, not bare icons" rule above still holds
// wherever this is used: an icon-only link MUST carry its own aria-label.
export function SocialGlyph({
  network,
  className,
}: {
  network: SocialProfile["network"];
  className?: string;
}) {
  return GLYPH[network]({ className });
}

const TONE = {
  light: "border-line bg-bg text-navy hover:border-gold/60 hover:text-gold-ink",
  dark: "border-white/15 bg-white/5 text-on-navy-muted hover:border-gold-soft/50 hover:text-gold-soft",
} as const;

export function SocialLinks({
  profiles = site.socials,
  tone = "light",
  showHandle = false,
  label,
  className = "",
}: {
  profiles?: readonly SocialProfile[];
  tone?: "light" | "dark";
  /** show the @handle beside the label — worth it where the row has room */
  showHandle?: boolean;
  /** optional heading above the row */
  label?: string;
  className?: string;
}) {
  // honest-empty: no profiles, no row, no empty heading left behind
  if (!profiles.length) return null;

  return (
    <div className={className}>
      {label && (
        <p className={`mb-3 text-sm font-bold ${tone === "dark" ? "text-white" : "text-navy"}`}>
          {label}
        </p>
      )}
      <ul className="flex flex-wrap items-center gap-2.5">
        {profiles.map((p) => (
          <li key={p.network}>
            <a
              href={p.url}
              target="_blank"
              // rel="me" states "this profile is the same entity as this site",
              // the human-readable twin of the sameAs we emit in JSON-LD
              rel="me noopener noreferrer"
              data-cta={`social-${p.network}`}
              aria-label={`${p.label} של ${site.name}, ${p.handle}, נפתח בלשונית חדשה`}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors duration-[var(--dur-micro)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${TONE[tone]}`}
            >
              {GLYPH[p.network]({ className: "h-[18px] w-[18px]" })}
              <span>{p.label}</span>
              {showHandle && (
                <span dir="ltr" className="font-normal opacity-70">
                  {p.handle}
                </span>
              )}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
