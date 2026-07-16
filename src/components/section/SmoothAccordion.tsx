// SmoothAccordion — a FAQ built on NATIVE <details> (works with no JS, fully crawlable — preserves the SEO of
// FaqAccordion), progressively enhanced: when motion is allowed the open panel eases in (globals.css .smooth-acc).
// House rule #1: the native accordion IS the floor — reduced-motion / a11y / no-JS just toggle instantly. Server
// component. RTL/LTR via logical properties. The ◆ + gold marker follow the reading end.
export function SmoothAccordion({
  items,
  className = "",
  name,
}: {
  items: { q: string; a: React.ReactNode }[];
  className?: string;
  name?: string; // shared name → single-open (native exclusive accordion)
}) {
  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {items.map((it, i) => (
        <details key={i} name={name} className="smooth-acc rounded-[10px] border border-line bg-card">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-serif text-lg font-bold text-navy">
            <span>{it.q}</span>
            <span className="acc-mark text-gold" aria-hidden>◆</span>
          </summary>
          <div className="acc-inner px-5 pb-5 text-sm leading-relaxed text-muted">{it.a}</div>
        </details>
      ))}
    </div>
  );
}
