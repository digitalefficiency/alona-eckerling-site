// Accessible FAQ accordion built on native <details> — works without JS,
// keyboard-operable, content always in the DOM (crawlable). Server component.
export function FaqAccordion({ items }: { items: { q: string; a: string }[] }) {
  if (!items.length) return null;
  return (
    <div className="overflow-hidden rounded-[10px] border border-line bg-card">
      {items.map((f, i) => (
        <details key={i} className="group border-b border-line last:border-0">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 transition hover:bg-sand/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-inset [&::-webkit-details-marker]:hidden">
            <span className="font-serif text-lg font-bold text-navy">{f.q}</span>
            <span
              className="shrink-0 text-xl leading-none text-gold transition-transform duration-300 group-open:rotate-45"
              aria-hidden
            >
              +
            </span>
          </summary>
          <p className="px-6 pb-6 leading-relaxed text-muted">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
