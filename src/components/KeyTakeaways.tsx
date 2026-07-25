// "מה חשוב לדעת" / TL;DR card — orients the reader before a long guide. Server
// component, pure CSS, reuses existing card/line/gold tokens. YMYL: scope-only
// bullets (no fabricated numbers/deadlines/outcomes — authored per slug).
export function KeyTakeaways({
  items,
  title = "מה חשוב לדעת",
}: {
  items: string[];
  title?: string;
}) {
  if (!items?.length) return null;
  return (
    <aside className="survey-card rounded-[10px] border border-line bg-card p-6 md:p-7">
      <div className="flex items-center gap-2.5">
        <span className="text-[0.7rem] leading-none text-gold" aria-hidden>◆</span>
        <span className="text-xs font-bold tracking-eyebrow text-gold-ink">{title}</span>
      </div>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {items.map((t, i) => (
          <li key={i} className="flex items-start gap-3">
            <span dir="ltr" className="mt-0.5 font-mono text-xs font-bold text-gold-ink">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="leading-relaxed text-ink">{t}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
