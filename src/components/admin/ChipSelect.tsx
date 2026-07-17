"use client";
import { useState } from "react";
import { DUR, EASE, cssDur, cssEase } from "@/lib/motion-tokens";
import { T } from "@/lib/cms/desk-strings";

// Chip picker for fields that carry an `options` list in collections.json.
// `value` is always string[] (single-choice fields pass 0-1 items); values not
// present in `options` (legacy docs) render as selected chips so nothing ever
// disappears from an existing document.
export function ChipSelect({
  label,
  hint,
  options,
  value,
  onChange,
  single = false,
  max,
  allowCustom = false,
  error,
}: {
  label: string;
  hint?: string;
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
  single?: boolean;
  max?: number;
  allowCustom?: boolean;
  error?: string;
}) {
  const [custom, setCustom] = useState("");
  const micro = { transitionDuration: cssDur(DUR.micro), transitionTimingFunction: cssEase(EASE.micro) };
  const all = [...options, ...value.filter((v) => !options.includes(v))];
  const atMax = !single && typeof max === "number" && value.length >= max;

  const toggle = (opt: string) => {
    if (single) return onChange(value[0] === opt ? [] : [opt]);
    if (value.includes(opt)) return onChange(value.filter((v) => v !== opt));
    if (atMax) return;
    onChange([...value, opt]);
  };

  const addCustom = () => {
    const v = custom.trim();
    if (!v || value.includes(v) || atMax) return;
    onChange(single ? [v] : [...value, v]);
    setCustom("");
  };

  return (
    <div>
      <span className="text-sm font-semibold text-ink">{label}</span>
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
      <div className="mt-2 flex flex-wrap gap-2">
        {all.map((opt) => {
          const active = value.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(opt)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
                active ? "bg-ink text-bg" : "border border-line text-ink hover:border-gold"
              } ${!active && atMax ? "opacity-40" : ""}`}
              style={micro}
            >
              {opt}
            </button>
          );
        })}
        {allowCustom && (
          <span className="flex items-center gap-1">
            <input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }}
              placeholder={T("chip.customPlaceholder")}
              className="w-32 rounded-full border border-line bg-bg2 px-3 py-1.5 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            />
            <button type="button" onClick={addCustom} className="text-sm font-semibold text-gold-ink hover:underline" style={micro}>
              {T("chip.add")}
            </button>
          </span>
        )}
      </div>
      {error && <p className="mt-2 text-sm font-semibold text-ink">{error}</p>}
    </div>
  );
}
