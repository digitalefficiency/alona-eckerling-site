"use client";
import { useEffect, useState, useTransition } from "react";
import type { FieldSpec } from "@/lib/cms/config";
import type { SettingsGroup } from "@/lib/cms/settings-schema";
import { DUR, EASE, cssDur, cssEase } from "@/lib/motion-tokens";
import { fetchSettings, saveSettings, type ActionResult } from "@/lib/cms/actions";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { T } from "@/lib/cms/desk-strings";

// One component for BOTH shapes the settings schema allows:
//   object group (business info) → a single form
//   array group  (testimonials)  → a repeatable list of the same form
// The schema is the contract; the admin never hardcodes a field name, and the
// exact same schema drives lint-content — so a field the client can edit is
// precisely a field the gate validates.
type Item = Record<string, unknown>;

const micro = { transitionDuration: cssDur(DUR.micro), transitionTimingFunction: cssEase(EASE.micro) };
const inputClass =
  "mt-2 w-full rounded-[4px] border border-line bg-bg2 px-4 py-3 text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold";

export function SettingsForm({ name, group }: { name: string; group: SettingsGroup }) {
  const [items, setItems] = useState<Item[]>([]);
  const [sha, setSha] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    fetchSettings(name).then((r) => {
      if (r.ok) {
        setItems(group.array ? ((r.json as Item[]) ?? []) : [((r.json as Item) ?? {})]);
        setSha(r.sha);
      }
      setLoading(false);
    });
  }, [name, group.array]);

  const set = (i: number, key: string, v: unknown) =>
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, [key]: v } : it)));

  function save() {
    setResult(null);
    startTransition(async () => {
      const payload = group.array ? items : (items[0] ?? {});
      setResult(await saveSettings(name, payload, sha));
    });
  }

  if (loading) return <p className="py-20 text-center text-muted">{T("common.loading")}</p>;

  const errors = result && !result.ok ? result.errors : [];
  const errFor = (i: number, key: string) =>
    errors.find((e) => e.field === key && (!group.array || e.file.endsWith(`#${i + 1}`)))?.msg;

  return (
    <section style={{ transition: `opacity ${cssDur(DUR.reveal)} ${cssEase(EASE.out)}` }}>
      <h1 className="font-serif text-3xl font-black text-ink">{group.label}</h1>

      <div className="mt-8 space-y-6">
        {items.map((item, i) => (
          <div key={i} className="rounded-[10px] border border-line bg-card p-6">
            {group.array && (
              <div className="mb-4 flex items-center">
                <span className="text-xs font-bold tracking-eyebrow text-gold-ink">
                  {group.itemLabel ?? T("settings.itemFallback")} {i + 1}
                </span>
                <button
                  onClick={() => setItems((p) => p.filter((_, idx) => idx !== i))}
                  className="ms-auto text-sm font-semibold text-muted hover:text-ink"
                  style={micro}
                >
                  {T("settings.remove")}
                </button>
              </div>
            )}
            <div className="grid gap-5 sm:grid-cols-2">
              {group.fields.map((f) => (
                <SettingField
                  key={f.key}
                  spec={f}
                  value={item[f.key]}
                  // an image field is really TWO keys — `<key>` and `<key>Alt` —
                  // exactly as validateFields reads them, so the alt a client
                  // types is the alt the gate checks
                  altValue={item[`${f.key}Alt`]}
                  onChange={(v) => set(i, f.key, v)}
                  onAltChange={(v) => set(i, `${f.key}Alt`, v)}
                  error={errFor(i, f.key)}
                  altError={errFor(i, `${f.key}Alt`)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {group.array && (
        <button
          onClick={() => setItems((p) => [...p, {}])}
          className="mt-5 rounded-[4px] border border-line bg-bg2 px-5 py-2.5 text-sm font-bold text-ink transition-colors hover:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          style={micro}
        >
          {T("settings.add", { item: group.itemLabel ?? T("settings.itemFallback") })}
        </button>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-5">
        <button
          onClick={save}
          disabled={pending}
          className="rounded-[4px] bg-ink px-7 py-3.5 font-bold text-bg transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-60"
          style={micro}
        >
          {pending ? T("common.saving") : T("common.save")}
        </button>
        {result?.ok && <p className="text-sm text-muted">{result.message}</p>}
      </div>

      {errors.length > 0 && (
        <div className="mt-6 rounded-[10px] border border-line bg-card p-5">
          <p className="text-sm font-bold text-ink">{T("settings.fixBeforeSave")}</p>
          <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-muted">
            {errors.map((e, i) => (
              <li key={i}>• {e.msg}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function SettingField({
  spec,
  value,
  altValue,
  onChange,
  onAltChange,
  error,
  altError,
}: {
  spec: FieldSpec;
  value: unknown;
  altValue?: unknown;
  onChange: (v: unknown) => void;
  onAltChange?: (v: unknown) => void;
  error?: string;
  altError?: string;
}) {
  // An image field is NOT a <label>-wrapped input — MediaPicker owns its own
  // file input and buttons, and nesting those under one label breaks the click
  // target. So it returns early with its own container.
  //
  // validateSettings already routed `image` through validateFields (the /media/
  // prefix rule AND requiredAlt), which meant the gate had been enforcing a
  // field the form could not actually render: a client editing a settings group
  // with a photo in it saw a bare text box asking for a path. This closes that
  // gap and is the reason a CMS-editable, image-bearing settings group is now
  // possible at all.
  if (spec.type === "image") {
    return (
      <div className="sm:col-span-2">
        <span className="text-sm font-semibold text-ink">
          {spec.label}
          {spec.required && <span className="text-gold-ink"> *</span>}
        </span>
        <MediaPicker
          url={typeof value === "string" ? value : ""}
          alt={typeof altValue === "string" ? altValue : ""}
          onChange={(url, alt) => {
            onChange(url);
            onAltChange?.(alt);
          }}
        />
        {error && <p className="mt-2 text-sm font-semibold text-ink">{error}</p>}
        {altError && <p className="mt-2 text-sm font-semibold text-ink">{altError}</p>}
      </div>
    );
  }

  const isList = spec.type === "list";
  return (
    <label className={`block ${spec.type === "textarea" || isList ? "sm:col-span-2" : ""}`}>
      <span className="text-sm font-semibold text-ink">
        {spec.label}
        {spec.required && <span className="text-gold-ink"> *</span>}
      </span>
      {isList ? (
        <textarea
          rows={3}
          value={Array.isArray(value) ? (value as string[]).join("\n") : ""}
          onChange={(e) => onChange(e.target.value.split("\n").map((s) => s.trim()).filter(Boolean))}
          className={inputClass}
        />
      ) : spec.type === "textarea" ? (
        <textarea rows={3} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} className={inputClass} />
      ) : (
        <input
          type={spec.type === "date" ? "date" : "text"}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
      )}
      {error && <p className="mt-2 text-sm font-semibold text-ink">{error}</p>}
    </label>
  );
}
