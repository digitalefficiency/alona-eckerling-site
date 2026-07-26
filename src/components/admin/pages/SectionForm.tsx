"use client";
import { useMemo } from "react";
import type { SectionType, FieldSpec } from "@/lib/sections/schema";
import { TextInput, MarkInput } from "./Field";
import { Repeater } from "./Repeater";

// SectionForm.tsx — every field of one section, generated from the registry.
//
// A GENERATED FORM IS ONLY AS KIND AS ITS ORDER. Rendering fields in whatever
// order the object happened to list them produces a wall. So the form groups
// them the way the section reads on the page — the headline area first, then
// the body, then the buttons, then what is locked — and a mark field always
// appears directly under the text it marks, because it is meaningless anywhere
// else.
//
// The locked fields sit at the bottom under their own quiet heading. They are
// not hidden: a page part that vanishes from the form reads as a bug, and the
// honest message is "this exists, it is deliberate, it is not yours to change".

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

type Payload = Record<string, unknown>;

/** Fields in reading order, with each mark tucked under the field it marks. */
function ordered(fields: FieldSpec[]): FieldSpec[] {
  const marks = new Map<string, FieldSpec[]>();
  for (const f of fields) {
    if (f.kind === "mark") {
      const list = marks.get(f.of) ?? [];
      list.push(f);
      marks.set(f.of, list);
    }
  }
  const out: FieldSpec[] = [];
  for (const f of fields) {
    if (f.kind === "mark") continue;
    out.push(f);
    for (const m of marks.get(f.key) ?? []) out.push(m);
  }
  return out;
}

export function SectionForm({
  type,
  payload,
  onChange,
}: {
  type: SectionType;
  payload: Payload;
  onChange: (next: Payload) => void;
}) {
  const fields = useMemo(() => ordered(type.fields), [type.fields]);
  const editable = fields.filter((f) => !f.locked);
  const locked = fields.filter((f) => f.locked);

  const set = (key: string, v: unknown) => onChange({ ...payload, [key]: v });

  const render = (f: FieldSpec) => {
    switch (f.kind) {
      case "text":
      case "textarea":
        return <TextInput key={f.key} spec={f} value={String(payload[f.key] ?? "")} onChange={(v) => set(f.key, v)} />;
      case "mark":
        return (
          <MarkInput
            key={f.key}
            spec={f}
            value={String(payload[f.key] ?? "")}
            sibling={String(payload[f.of] ?? "")}
            onChange={(v) => set(f.key, v)}
          />
        );
      case "repeater":
        return (
          <Repeater
            key={f.key}
            spec={f}
            value={Array.isArray(payload[f.key]) ? (payload[f.key] as never[]) : []}
            onChange={(v) => set(f.key, v)}
          />
        );
      case "image":
      case "video":
        return (
          <div key={f.key} className="mb-5">
            <span className="mb-1.5 block text-[13px] font-bold text-ink">{f.label}</span>
            <div className="flex items-center gap-3 rounded-[6px] border border-line bg-bg px-3.5 py-2.5">
              <span className="truncate text-[13px] text-muted">{String(payload[f.key] ?? "—")}</span>
            </div>
            {f.hint && <p className="mt-1.5 text-[12px] leading-relaxed text-muted">{f.hint}</p>}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      {editable.map(render)}

      {locked.length > 0 && (
        <details className="mt-8 rounded-[8px] border border-line bg-sand/60">
          <summary className="cursor-pointer px-4 py-3 text-[13px] font-bold text-muted">
            נכסי עיצוב של הסקשן ({locked.length}) — מנוהלים על ידי רום
          </summary>
          <div className={cx("border-t border-line px-4 pt-4")}>
            <p className="mb-4 text-[12px] leading-relaxed text-muted">
              אלה הצילומים והקבצים שנוצרו במיוחד לסקשן הזה. הם מוצגים כאן כדי שתדעי מה יש בעמוד, והחלפה שלהם
              נעשית דרך רום כי היא משפיעה על הרצף הוויזואלי של כל העמוד.
            </p>
            {locked.map(render)}
          </div>
        </details>
      )}
    </div>
  );
}
