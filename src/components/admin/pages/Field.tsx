"use client";
import { useId, useMemo } from "react";
import type { FieldSpec, TextField as TextSpec, MarkField as MarkSpec } from "@/lib/sections/schema";

// Field.tsx — one input, and the whole feel of the desk.
//
// THREE RULES, each of them a decision that could have gone the other way:
//
// 1. A LENGTH LIMIT IS A HINT, NOT A WALL. Typing past it is always allowed.
//    The counter turns amber and says what will happen ("בטלפון זה עלול לרדת
//    שורה"), and publishing shows it as a warning that can be dismissed. The
//    existing CMS never blocked mid-sentence either, and a field that rejects
//    keystrokes while someone is still thinking teaches them to fear the form.
//
// 2. A LOCKED FIELD IS SHOWN, NOT HIDDEN. Read-only, dimmed, with the reason
//    beside it. Hiding it makes the page look like it has fewer parts than it
//    does; showing it greyed says "this exists, it is deliberate, ask Rom".
//
// 3. NOTHING IS EXPLAINED TWICE. The label says what it is, the hint says the
//    one thing that is not obvious, and that is all. Help text people scroll
//    past is help text nobody reads.

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

const inputBase =
  "w-full rounded-[6px] border bg-bg px-3.5 py-2.5 text-[15px] text-ink outline-none transition " +
  "placeholder:text-muted/60 focus:border-gold focus:ring-2 focus:ring-gold/25";

function Counter({ value, max }: { value: string; max: number }) {
  const n = value.length;
  const over = n > max;
  const near = !over && n > max * 0.85;
  return (
    <span
      className={cx(
        "shrink-0 text-[11px] font-semibold tabular-nums",
        over ? "text-bad" : near ? "text-gold-ink" : "text-muted/70",
      )}
      // the count is decoration; the message below carries the meaning
      aria-hidden
    >
      {n}/{max}
    </span>
  );
}

function Wrap({
  spec,
  id,
  children,
  value,
  warning,
}: {
  spec: FieldSpec;
  id: string;
  children: React.ReactNode;
  value?: string;
  warning?: string;
}) {
  const max = "max" in spec ? spec.max : undefined;
  return (
    <div className="mb-5">
      <div className="mb-1.5 flex items-baseline gap-2">
        <label htmlFor={id} className="text-[13px] font-bold text-ink">
          {spec.label}
          {spec.required && (
            <span className="ms-1 text-gold-ink" aria-hidden>
              *
            </span>
          )}
        </label>
        {spec.locked && (
          <span className="rounded-full border border-line px-2 py-0.5 text-[10px] font-semibold text-muted">
            מנוהל על ידי רום
          </span>
        )}
        <span className="grow" />
        {max && value !== undefined && <Counter value={value} max={max} />}
      </div>
      {children}
      {spec.hint && !warning && <p className="mt-1.5 text-[12px] leading-relaxed text-muted">{spec.hint}</p>}
      {warning && (
        <p className="mt-1.5 text-[12px] font-semibold leading-relaxed text-gold-ink" role="status">
          {warning}
        </p>
      )}
    </div>
  );
}

/** The one message that turns a number into advice. */
function lengthWarning(spec: TextSpec, value: string): string | undefined {
  if (spec.maxPerLine) {
    const long = value.split("\n").findIndex((l) => l.length > spec.maxPerLine!);
    if (long >= 0) {
      return `שורה ${long + 1} ארוכה מ-${spec.maxPerLine} תווים. בעיצוב היא תישבר באמצע, ואפשר לשמור ככה.`;
    }
  }
  if (spec.lines) {
    const n = value.split("\n").length;
    if (n !== spec.lines) return `הכותרת הזו מעוצבת ל-${spec.lines} שורות, וכרגע יש ${n}.`;
  }
  if (spec.max && value.length > spec.max) {
    return `קצת ארוך. בטלפון זה עלול לרדת שורה, ואפשר לשמור ככה.`;
  }
  return undefined;
}

export function TextInput({
  spec,
  value,
  onChange,
}: {
  spec: TextSpec;
  value: string;
  onChange: (v: string) => void;
}) {
  const id = useId();
  const warning = lengthWarning(spec, value);
  const rows = spec.kind === "textarea" ? Math.max(3, Math.min(8, value.split("\n").length + 1)) : undefined;

  return (
    <Wrap spec={spec} id={id} value={value} warning={warning}>
      {spec.kind === "textarea" ? (
        <textarea
          id={id}
          rows={rows}
          value={value}
          readOnly={spec.locked}
          onChange={(e) => onChange(e.target.value)}
          className={cx(inputBase, "resize-y leading-relaxed", spec.locked && "cursor-not-allowed opacity-60", warning ? "border-gold" : "border-line")}
        />
      ) : (
        <input
          id={id}
          type="text"
          value={value}
          readOnly={spec.locked}
          onChange={(e) => onChange(e.target.value)}
          className={cx(inputBase, spec.locked && "cursor-not-allowed opacity-60", warning ? "border-gold" : "border-line")}
        />
      )}
    </Wrap>
  );
}

/**
 * The rose-underline field.
 *
 * It is NEVER a save blocker: SplitText already falls back to the plain line
 * when the accent is not found, so a mismatch costs an underline and not a
 * page. What it does instead is offer the sibling's own words as buttons —
 * picking the highlight should be one tap, not an exercise in retyping a
 * substring exactly.
 */
export function MarkInput({
  spec,
  value,
  sibling,
  onChange,
}: {
  spec: MarkSpec;
  value: string;
  sibling: string;
  onChange: (v: string) => void;
}) {
  const id = useId();
  const matches = value !== "" && sibling.split("\n").some((line) => line.includes(value));
  const words = useMemo(() => {
    // candidate phrases: every 1–3 word run from each line, deduped, short first
    const out = new Set<string>();
    for (const line of sibling.split("\n")) {
      const w = line.trim().split(/\s+/).filter(Boolean);
      for (let i = 0; i < w.length; i++) {
        for (let n = 1; n <= 3 && i + n <= w.length; n++) {
          const phrase = w.slice(i, i + n).join(" ").replace(/[.,;:!?]$/, "");
          if (phrase.length >= 2 && phrase.length <= (spec.max ?? 24)) out.add(phrase);
        }
      }
    }
    return [...out].slice(0, 18);
  }, [sibling, spec.max]);

  return (
    <Wrap
      spec={spec}
      id={id}
      value={value}
      warning={
        value && !matches
          ? `המילים «${value}» כבר לא מופיעות בטקסט, אז הקו הוורוד לא יופיע. אפשר לבחור מהמילים למטה, או להשאיר ככה — הטקסט ייראה תקין בלי הקו.`
          : undefined
      }
    >
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cx(inputBase, value && !matches ? "border-gold" : "border-line")}
      />
      {words.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {words.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => onChange(w)}
              className={cx(
                "rounded-full border px-2.5 py-1 text-[12px] transition",
                w === value ? "border-gold bg-gold-soft font-semibold text-ink" : "border-line text-muted hover:border-gold hover:text-ink",
              )}
            >
              {w}
            </button>
          ))}
        </div>
      )}
    </Wrap>
  );
}
