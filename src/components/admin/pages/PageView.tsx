"use client";
import { useState } from "react";
import type { PageDocument, SectionInstance } from "@/lib/sections/schema";
import { getSectionType } from "@/lib/sections/registry";
import { SectionForm } from "./SectionForm";

// PageView.tsx — the page as a stack of cards she can recognise at a glance.
//
// A CARD SHOWS THE SECTION'S OWN WORDS, not its type name. "פתיח — חדר הבוקר"
// tells her nothing on its own; «את כבר יודעת מה לאכול» tells her exactly which
// part of the page she is about to open. The type name is the small print.
//
// ON REORDERING, THE HONEST VERSION: the composition of this page alternates
// seams and tones, and four sections carry a background made for that spot and
// no other. Moving one CAN produce a boundary the designer never drew. Rom's
// call was full freedom with the truth told plainly, so:
//   · the first drag shows the warning once, and never again
//   · publishing a reorder requires opening the preview first
//   · "החזרת הסדר המקורי" restores the launch order and touches no copy
// The alternative — greying out the arrows — would have been a quieter lie.

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

const iconBtn =
  "grid h-8 w-8 shrink-0 place-items-center rounded-[6px] border border-line text-muted transition " +
  "hover:border-gold hover:text-ink disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:border-line disabled:hover:text-muted";

/** The line that identifies a section to a human: its own biggest words. */
function headline(s: SectionInstance): string {
  const p = s.payload as Record<string, unknown>;
  for (const k of ["title", "staticHeading", "lines", "kicker", "band", "quote"]) {
    const v = p[k];
    if (typeof v === "string" && v.trim()) return v.split("\n")[0];
  }
  return "";
}

export function PageView({
  doc,
  onChange,
  onOpenPreview,
  previewOpened,
}: {
  doc: PageDocument;
  onChange: (next: PageDocument) => void;
  onOpenPreview: () => void;
  previewOpened: boolean;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [warned, setWarned] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  const orderChanged =
    doc.sections.map((s) => s.id).join(",") !== doc.baseline_order.map((b) => b.id).join(",");

  const move = (i: number, d: -1 | 1) => {
    if (!warned) {
      setShowWarning(true);
      setWarned(true);
    }
    const next = [...doc.sections];
    const j = i + d;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange({ ...doc, sections: next });
  };

  const setVisible = (id: string, visible: boolean) =>
    onChange({ ...doc, sections: doc.sections.map((s) => (s.id === id ? { ...s, visible } : s)) });

  const restoreOrder = () => {
    const byId = new Map(doc.sections.map((s) => [s.id, s]));
    const restored = doc.baseline_order.map((b) => byId.get(b.id)).filter(Boolean) as SectionInstance[];
    const extra = doc.sections.filter((s) => !doc.baseline_order.some((b) => b.id === s.id));
    onChange({ ...doc, sections: [...restored, ...extra] });
  };

  return (
    <div>
      {showWarning && (
        <div className="mb-5 rounded-[8px] border border-gold bg-gold-soft/40 p-4">
          <p className="text-[13.5px] font-bold text-ink">שינית את סדר הסקשנים</p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-ink/80">
            העמוד בנוי כרצף: המעברים בין הסקשנים והרקעים שלהם עוצבו למקום שבו הם יושבים. סידור מחדש יכול
            ליצור מעבר שנראה שבור. תמיד אפשר לפתוח תצוגה מקדימה לפני פרסום, ותמיד אפשר לחזור לסדר המקורי.
          </p>
          <button
            type="button"
            onClick={() => setShowWarning(false)}
            className="mt-3 rounded-[5px] border border-line bg-card px-3 py-1.5 text-[12px] font-semibold text-ink"
          >
            הבנתי, אל תציגו לי שוב
          </button>
        </div>
      )}

      {orderChanged && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-[8px] border border-line bg-card px-4 py-3">
          <span className="text-[13px] text-ink">הסדר שונה מהמקור.</span>
          {!previewOpened && (
            <span className="text-[12.5px] font-semibold text-gold-ink">
              כדאי לפתוח תצוגה מקדימה לפני פרסום.
            </span>
          )}
          <span className="grow" />
          <button
            type="button"
            onClick={onOpenPreview}
            className="rounded-[5px] border border-line px-3 py-1.5 text-[12.5px] font-semibold text-ink transition hover:border-gold"
          >
            תצוגה מקדימה
          </button>
          <button
            type="button"
            onClick={restoreOrder}
            className="rounded-[5px] border border-line px-3 py-1.5 text-[12.5px] font-semibold text-muted transition hover:border-gold hover:text-ink"
          >
            החזרת הסדר המקורי
          </button>
        </div>
      )}

      <ul className="space-y-2.5">
        {doc.sections.map((s, i) => {
          const type = getSectionType(s.type);
          const isOpen = openId === s.id;
          const hidden = s.visible === false;
          return (
            <li
              key={s.id}
              className={cx(
                "rounded-[10px] border bg-card transition",
                isOpen ? "border-gold" : "border-line",
                hidden && "opacity-55",
              )}
            >
              <div className="flex items-center gap-3 p-3.5">
                <span
                  aria-hidden
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line text-[12px] font-black text-muted"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>

                <button
                  type="button"
                  onClick={() => setOpenId(isOpen ? null : s.id)}
                  className="flex min-w-0 grow flex-col items-start text-start"
                  aria-expanded={isOpen}
                >
                  <span className="truncate text-[14.5px] font-bold text-ink">
                    {headline(s) || type?.label || s.type}
                  </span>
                  <span className="mt-0.5 truncate text-[12px] text-muted">
                    {type?.label ?? s.type}
                    {hidden && " · מוסתר מהאתר"}
                  </span>
                </button>

                <button
                  type="button"
                  className={iconBtn}
                  onClick={() => setVisible(s.id, hidden)}
                  aria-label={hidden ? "להציג באתר" : "להסתיר מהאתר"}
                  title={hidden ? "להציג באתר" : "להסתיר מהאתר"}
                >
                  {hidden ? "◌" : "●"}
                </button>
                <button
                  type="button"
                  className={iconBtn}
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  aria-label="להעביר למעלה"
                >
                  ↑
                </button>
                <button
                  type="button"
                  className={iconBtn}
                  onClick={() => move(i, 1)}
                  disabled={i === doc.sections.length - 1}
                  aria-label="להעביר למטה"
                >
                  ↓
                </button>
              </div>

              {isOpen && type && (
                <div className="border-t border-line p-5 md:p-6">
                  {type.purpose && <p className="mb-5 text-[13px] leading-relaxed text-muted">{type.purpose}</p>}
                  <SectionForm
                    type={type}
                    payload={s.payload}
                    onChange={(payload) =>
                      onChange({
                        ...doc,
                        sections: doc.sections.map((x) => (x.id === s.id ? { ...x, payload } : x)),
                      })
                    }
                  />
                </div>
              )}

              {isOpen && !type && (
                <div className="border-t border-line p-5 text-[13px] text-muted">
                  הסקשן הזה עדיין לא נפתח לעריכה. הוא מוצג כאן כדי שתדעי שהוא קיים בעמוד.
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
