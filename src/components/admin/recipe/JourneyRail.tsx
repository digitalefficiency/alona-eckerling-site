"use client";
import { DUR, EASE, cssDur, cssEase } from "@/lib/motion-tokens";
import { T } from "@/lib/cms/desk-strings";
import { STATION_ORDER, type StationId } from "@/lib/cms/journey-status.mjs";

// The journey's progress rail: side list on desktop, sticky chip row on mobile.
// Pure props: state computation lives in journey-status.mjs, scrollspy in RecipeJourney.
export function JourneyRail({
  status,
  errors,
  active,
  onJump,
}: {
  status: Record<StationId, boolean>;
  errors: Set<StationId>;
  active: StationId;
  onJump: (id: StationId) => void;
}) {
  const micro = { transitionDuration: cssDur(DUR.micro), transitionTimingFunction: cssEase(EASE.micro) };
  const done = STATION_ORDER.filter((s) => status[s]).length;
  return (
    <nav aria-label={T("journey.progress", { done, total: STATION_ORDER.length })}>
      <p className="mb-3 hidden text-xs font-bold tracking-[.15em] text-gold-ink lg:block">
        {T("journey.progress", { done, total: STATION_ORDER.length })}
      </p>
      <ol className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-1.5 lg:overflow-visible lg:pb-0">
        {STATION_ORDER.map((id, i) => {
          const isErr = errors.has(id);
          const isDone = status[id];
          return (
            <li key={id} className="shrink-0">
              <button
                type="button"
                onClick={() => onJump(id)}
                aria-current={active === id ? "step" : undefined}
                className={`flex w-full items-center gap-2 rounded-[6px] px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
                  active === id ? "bg-ink text-bg" : "text-ink hover:bg-bg2"
                }`}
                style={micro}
              >
                <span
                  aria-hidden
                  className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-bold ${
                    isErr ? "bg-ink text-bg" : isDone ? "bg-gold-ink text-bg" : active === id ? "bg-bg text-ink" : "border border-line text-muted"
                  }`}
                >
                  {isErr ? "!" : isDone ? "✓" : i + 1}
                </span>
                {T(`journey.st.${id}`)}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
