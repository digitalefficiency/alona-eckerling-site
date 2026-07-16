// Result-as-story card — the narrative is the point: situation → what was done
// → outcome, closed by a REQUIRED disclaimer rendered small and muted.
// Premium-tier ban: "raw dollar results with no story and no disclaimer" —
// this component won't let you ship that (dev-warns on an empty disclaimer).
// Example: <ResultCard matterType="היטל השבחה" title="ערר על שומה בפרויקט מגורים"
//   story="הלקוח קיבל שומה..." outcome="הפחתה משמעותית בהיטל"
//   disclaimer="התוצאה תלויה בנסיבות המקרה ואינה מבטיחה תוצאה דומה." />
export function ResultCard({
  title,
  story,
  outcome,
  matterType,
  disclaimer,
}: {
  title: string;
  story: string; // required — the narrative, never just a number
  outcome: string;
  matterType?: string;
  disclaimer: string; // required — always rendered; never omit
}) {
  if (process.env.NODE_ENV !== "production" && !disclaimer.trim()) {
    console.warn(`[ResultCard] "${title}" has an empty disclaimer — every result must carry one (premium-tier ban on raw results).`);
  }
  return (
    <article className="flex h-full flex-col rounded-[10px] border border-line bg-card p-6 md:p-7">
      {matterType && (
        <div className="mb-3 flex items-center gap-2.5">
          <span className="text-[0.65rem] leading-none text-gold" aria-hidden>◆</span>
          <span className="text-xs font-bold tracking-[.18em] text-gold-ink">{matterType}</span>
        </div>
      )}
      <h3 className="font-serif text-xl font-black leading-snug text-navy">{title}</h3>
      <p className="mt-3 grow text-sm leading-relaxed text-muted">{story}</p>
      <p className="mt-5 border-t border-line pt-4 font-serif text-lg font-bold text-navy">{outcome}</p>
      <p className="mt-3 text-xs leading-relaxed text-muted/80">{disclaimer}</p>
    </article>
  );
}
