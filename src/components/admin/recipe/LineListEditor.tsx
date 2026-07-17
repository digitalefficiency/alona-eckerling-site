"use client";
import { useRef } from "react";
import { DUR, EASE, cssDur, cssEase } from "@/lib/motion-tokens";
import { splitPastedLines } from "@/lib/cms/recipe-paste.mjs";

// One row per ingredient/step. Paste a whole block into any row and it splits
// into rows (splitPastedLines strips bullets/numbering); Enter inserts a row
// below; Backspace on an empty row removes it; ▲▼ reorder (buttons, not drag:
// keyboard-accessible and phone-friendly).
export function LineListEditor({
  label,
  hint,
  items,
  onChange,
  numbered = false,
  addLabel,
  placeholder,
  error,
}: {
  label: string;
  hint?: string;
  items: string[];
  onChange: (items: string[]) => void;
  numbered?: boolean;
  addLabel: string;
  placeholder?: string;
  error?: string;
}) {
  const micro = { transitionDuration: cssDur(DUR.micro), transitionTimingFunction: cssEase(EASE.micro) };
  const rowRefs = useRef<(HTMLInputElement | null)[]>([]);
  const rows = items.length ? items : [""];

  const set = (i: number, v: string) => onChange(rows.map((r, j) => (j === i ? v : r)));
  const insertAfter = (i: number) => {
    onChange([...rows.slice(0, i + 1), "", ...rows.slice(i + 1)]);
    requestAnimationFrame(() => rowRefs.current[i + 1]?.focus());
  };
  const remove = (i: number) => {
    const next = rows.filter((_, j) => j !== i);
    onChange(next.length ? next : [""]);
    requestAnimationFrame(() => rowRefs.current[Math.max(0, i - 1)]?.focus());
  };
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= rows.length) return;
    const next = [...rows];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const pasteAt = (i: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text");
    if (!text.includes("\n")) return; // single-line paste: default behavior
    e.preventDefault();
    const parts = splitPastedLines(text);
    if (!parts.length) return;
    const next = [...rows];
    if (!next[i].trim()) next.splice(i, 1, ...parts);
    else next.splice(i + 1, 0, ...parts);
    onChange(next);
  };

  return (
    <div>
      <span className="text-sm font-semibold text-ink">{label}</span>
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
      <ol className="mt-2 space-y-2">
        {rows.map((row, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="w-6 shrink-0 text-center text-sm font-bold text-gold-ink" aria-hidden>
              {numbered ? i + 1 : "·"}
            </span>
            <input
              ref={(el) => { rowRefs.current[i] = el; }}
              value={row}
              placeholder={placeholder}
              onChange={(e) => set(i, e.target.value)}
              onPaste={(e) => pasteAt(i, e)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); insertAfter(i); }
                if (e.key === "Backspace" && !row && rows.length > 1) { e.preventDefault(); remove(i); }
              }}
              className="w-full rounded-[4px] border border-line bg-bg2 px-4 py-2.5 text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            />
            <span className="flex shrink-0 gap-1">
              <RowBtn onClick={() => move(i, -1)} label="▲" disabled={i === 0} micro={micro} />
              <RowBtn onClick={() => move(i, 1)} label="▼" disabled={i === rows.length - 1} micro={micro} />
              <RowBtn onClick={() => remove(i)} label="✕" disabled={rows.length === 1 && !row} micro={micro} />
            </span>
          </li>
        ))}
      </ol>
      <button
        type="button"
        onClick={() => { onChange([...rows, ""]); requestAnimationFrame(() => rowRefs.current[rows.length]?.focus()); }}
        className="mt-3 text-sm font-semibold text-gold-ink hover:underline"
        style={micro}
      >
        + {addLabel}
      </button>
      {error && <p className="mt-2 text-sm font-semibold text-ink">{error}</p>}
    </div>
  );
}

function RowBtn({ onClick, label, disabled, micro }: { onClick: () => void; label: string; disabled?: boolean; micro: React.CSSProperties }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="rounded-[4px] border border-line px-2 py-1.5 text-xs text-ink transition-colors hover:border-gold disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
      style={micro}
    >
      {label}
    </button>
  );
}
