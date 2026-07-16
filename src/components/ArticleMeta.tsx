import { site } from "@/lib/site";

// Byline + formatted update date + derived reading-time, under an article title.
// Server component, pure CSS. YMYL-safe: surfaces only the real last_updated and a
// reading-time ESTIMATE (~200 wpm) — never a fabricated stat.
export function ArticleMeta({ date, minutes }: { date?: string; minutes?: number }) {
  let formatted: string | null = null;
  if (date) {
    const d = new Date(date);
    if (!Number.isNaN(d.getTime())) {
      formatted = new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "long", year: "numeric" }).format(d);
    }
  }
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
      <span className="font-semibold text-navy-700">{site.name}</span>
      {formatted && (
        <>
          <span aria-hidden className="text-gold">·</span>
          <span>עודכן {formatted}</span>
        </>
      )}
      {minutes ? (
        <>
          <span aria-hidden className="text-gold">·</span>
          <span>{minutes} דק׳ קריאה</span>
        </>
      ) : null}
    </div>
  );
}
