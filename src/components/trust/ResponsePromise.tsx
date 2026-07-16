// Response-time commitment — a small, calm gold-◆ line stating when the office
// answers. Premium-tier rule: place adjacent to EVERY lead-capture form (and
// near phone/booking CTAs) — a stated response time is a conversion signal.
// Example: <ResponsePromise promise="אנחנו חוזרים תוך 4 שעות ביום עסקים"
//   sub="פנייה שמתקבלת אחרי 17:00 נענית למחרת בבוקר" tone="dark" />
export function ResponsePromise({
  promise,
  sub,
  tone = "light",
}: {
  promise: string;
  sub?: string;
  tone?: "light" | "dark"; // "dark" for navy bands (e.g. the home lead section)
}) {
  const dark = tone === "dark";
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-1 text-[0.65rem] leading-none text-gold" aria-hidden>◆</span>
      <div>
        <p className={`text-sm font-bold ${dark ? "text-white" : "text-navy"}`}>{promise}</p>
        {sub && (
          <p className={`mt-1 text-xs leading-relaxed ${dark ? "text-slate-300" : "text-muted"}`}>{sub}</p>
        )}
      </div>
    </div>
  );
}
