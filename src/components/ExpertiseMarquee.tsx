// Continuous RTL credentials ticker (pure CSS — no JS, crash-proof). Pauses on
// hover/focus. Only honest, verifiable credentials (YMYL). The visual track is
// aria-hidden; a single sr-only list carries the facts for screen readers.
const ITEMS = [
  "מאז 1987",
  "רישיון מ‑1992 · #307",
  "שמאי מכריע מטעם משרד המשפטים",
  "מינויים כמומחים מטעם בתי משפט",
  "דוקטור למקרקעין",
  "8 ספרים מקצועיים",
];

export function ExpertiseMarquee() {
  const loop = [...ITEMS, ...ITEMS];
  return (
    <section className="overflow-hidden border-y border-line bg-sand">
      <div className="marquee-mask relative py-4">
        <div className="marquee-track" aria-hidden>
          {loop.map((t, i) => (
            <span key={i} className="flex items-center whitespace-nowrap text-sm font-semibold text-navy-700">
              <span className="px-7">{t}</span>
              <span className="text-[0.55rem] leading-none text-gold-ink" aria-hidden>◆</span>
            </span>
          ))}
        </div>
      </div>
      <ul className="sr-only">
        {ITEMS.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </section>
  );
}
