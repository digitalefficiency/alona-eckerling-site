"use client";
import { useState } from "react";
import type { RepeaterField, FieldSpec, TextField as TextSpec } from "@/lib/sections/schema";
import { TextInput } from "./Field";

// Repeater.tsx — a list she can reorder, add to and remove from.
//
// COLLAPSED BY DEFAULT, and that is the whole design. The coaching FAQ has
// eleven items; open, that is a form nobody can scroll. Each row shows its own
// first line, so the list reads like the page reads, and only the row being
// worked on is expanded.
//
// Removal always asks. Not because a list item is precious, but because the
// undo for "I meant to click the arrow" is retyping a paragraph from memory.

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

const iconBtn =
  "grid h-7 w-7 shrink-0 place-items-center rounded-[5px] border border-line text-muted transition " +
  "hover:border-gold hover:text-ink disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-line disabled:hover:text-muted";

type Item = Record<string, unknown> | string;

/** The line shown on a collapsed row: the first text-ish value it carries. */
function summary(item: Item, fields: FieldSpec[]): string {
  if (typeof item === "string") return item;
  for (const f of fields) {
    const v = item[f.key];
    if (typeof v === "string" && v.trim()) return v;
  }
  return "";
}

export function Repeater({
  spec,
  value,
  onChange,
}: {
  spec: RepeaterField;
  value: Item[];
  onChange: (v: Item[]) => void;
}) {
  const [open, setOpen] = useState<number | null>(value.length === 1 ? 0 : null);
  const [confirming, setConfirming] = useState<number | null>(null);

  // A repeater whose only field is text stores plain strings, not {key: value}
  // wrappers — the payload should read like the content, not like the form.
  const scalar = spec.fields.length === 1 && (spec.fields[0].kind === "text" || spec.fields[0].kind === "textarea");

  const move = (i: number, d: -1 | 1) => {
    const next = [...value];
    const j = i + d;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
    setOpen(open === i ? j : open === j ? i : open);
  };

  const add = () => {
    const blank: Item = scalar ? "" : Object.fromEntries(spec.fields.map((f) => [f.key, ""]));
    onChange([...value, blank]);
    setOpen(value.length);
  };

  const atMin = spec.min !== undefined && value.length <= spec.min;
  const atMax = spec.max !== undefined && value.length >= spec.max;

  return (
    <div className="mb-6">
      <div className="mb-2 flex items-baseline gap-2">
        <span className="text-[13px] font-bold text-ink">
          {spec.label}
          {spec.required && <span className="ms-1 text-gold-ink" aria-hidden>*</span>}
        </span>
        <span className="text-[11px] text-muted/70">{value.length}</span>
        {spec.max !== undefined && <span className="text-[11px] text-muted/70">מתוך {spec.max}</span>}
      </div>
      {spec.hint && <p className="mb-2 text-[12px] leading-relaxed text-muted">{spec.hint}</p>}

      <ul className="space-y-2">
        {value.map((item, i) => {
          const isOpen = open === i;
          return (
            <li key={i} className="rounded-[8px] border border-line bg-bg">
              <div className="flex items-center gap-2 px-2.5 py-2">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex min-w-0 grow items-center gap-2 text-start"
                  aria-expanded={isOpen}
                >
                  <span aria-hidden className="text-[10px] text-muted">{isOpen ? "▾" : "▸"}</span>
                  <span className="truncate text-[13px] text-ink">
                    {summary(item, spec.fields) || <span className="text-muted/60">{spec.itemLabel} ריק</span>}
                  </span>
                </button>
                <button type="button" className={iconBtn} onClick={() => move(i, -1)} disabled={i === 0} aria-label="להעביר למעלה">↑</button>
                <button type="button" className={iconBtn} onClick={() => move(i, 1)} disabled={i === value.length - 1} aria-label="להעביר למטה">↓</button>
                <button
                  type="button"
                  className={cx(iconBtn, "hover:border-bad hover:text-bad")}
                  onClick={() => setConfirming(i)}
                  disabled={atMin}
                  aria-label="למחוק"
                  title={atMin ? `צריך לפחות ${spec.min}` : undefined}
                >
                  ×
                </button>
              </div>

              {confirming === i && (
                <div className="border-t border-line bg-sand px-3.5 py-2.5">
                  <p className="text-[12px] text-ink">למחוק את {spec.itemLabel} הזה?</p>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onChange(value.filter((_, j) => j !== i));
                        setConfirming(null);
                        setOpen(null);
                      }}
                      className="rounded-[5px] bg-bad px-3 py-1 text-[12px] font-bold text-white"
                    >
                      כן, למחוק
                    </button>
                    <button type="button" onClick={() => setConfirming(null)} className="rounded-[5px] border border-line px-3 py-1 text-[12px] text-muted">
                      ביטול
                    </button>
                  </div>
                </div>
              )}

              {isOpen && (
                <div className="border-t border-line px-3.5 pt-4">
                  {scalar ? (
                    <TextInput
                      spec={{ ...(spec.fields[0] as TextSpec), label: spec.itemLabel }}
                      value={String(item)}
                      onChange={(v) => onChange(value.map((x, j) => (j === i ? v : x)))}
                    />
                  ) : (
                    spec.fields.map((f) =>
                      f.kind === "text" || f.kind === "textarea" ? (
                        <TextInput
                          key={f.key}
                          spec={f}
                          value={String((item as Record<string, unknown>)[f.key] ?? "")}
                          onChange={(v) =>
                            onChange(value.map((x, j) => (j === i ? { ...(x as object), [f.key]: v } : x)))
                          }
                        />
                      ) : null,
                    )
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {!atMax && (
        <button
          type="button"
          onClick={add}
          className="mt-2 rounded-[6px] border border-dashed border-line px-3 py-2 text-[13px] font-semibold text-muted transition hover:border-gold hover:text-ink"
        >
          + {spec.itemLabel} חדש
        </button>
      )}
    </div>
  );
}
