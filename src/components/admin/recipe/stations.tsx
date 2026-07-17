"use client";
import { T } from "@/lib/cms/desk-strings";
import type { CollectionConfig } from "@/lib/cms/config";
import { type StationId } from "@/lib/cms/journey-status.mjs";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { InlineImageInserter } from "@/components/admin/InlineImageInserter";
import { ChipSelect } from "@/components/admin/ChipSelect";
import { LineListEditor } from "@/components/admin/recipe/LineListEditor";

// The journey's presentational stations. Every station is a dumb slice over the
// journey's state: RecipeJourney owns values/model and passes narrow setters.
// Labels come from collections.json fields (single source of truth for copy).

export const inputClass =
  "mt-2 w-full rounded-[4px] border border-line bg-bg2 px-4 py-3 text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold";

export function Station({
  id,
  index,
  done,
  children,
}: {
  id: StationId;
  index: number;
  done: boolean;
  children: React.ReactNode;
}) {
  return (
    <section id={`station-${id}`} className="scroll-mt-28 rounded-[10px] border border-line bg-card p-6 md:p-8">
      <header className="mb-5 flex items-center gap-3">
        <span
          aria-hidden
          className={`grid h-8 w-8 place-items-center rounded-full text-sm font-black ${done ? "bg-gold-ink text-bg" : "border border-line text-muted"}`}
        >
          {done ? "✓" : String(index).padStart(2, "0")}
        </span>
        <h2 className="font-serif text-xl font-black text-ink">{T(`journey.st.${id}`)}</h2>
      </header>
      {children}
    </section>
  );
}

const fieldLabel = (c: CollectionConfig, key: string) => c.fields.find((f) => f.key === key)?.label ?? key;

export function DishStation({
  collection, title, prepTime, servings, onSet, errorFor,
}: {
  collection: CollectionConfig;
  title: string; prepTime: string; servings: string;
  onSet: (key: string, v: string) => void;
  errorFor: (field: string) => string | undefined;
}) {
  const err = (f: string) => errorFor(f) && <p className="mt-2 text-sm font-semibold text-ink">{errorFor(f)}</p>;
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <label className="block md:col-span-2">
        <span className="text-sm font-semibold text-ink">{fieldLabel(collection, "title")} <span className="text-gold-ink">*</span></span>
        <input value={title} onChange={(e) => onSet("title", e.target.value)} className={inputClass} />
        {err("title")}
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-ink">{fieldLabel(collection, "prepTime")} <span className="text-gold-ink">*</span></span>
        <input value={prepTime} onChange={(e) => onSet("prepTime", e.target.value)} className={inputClass} />
        {err("prepTime")}
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-ink">{fieldLabel(collection, "servings")}</span>
        <input value={servings} onChange={(e) => onSet("servings", e.target.value)} className={inputClass} />
        {err("servings")}
      </label>
    </div>
  );
}

export function StoryStation({
  intro, onChange, error,
}: { intro: string; onChange: (v: string) => void; error?: string }) {
  return (
    <label className="block">
      <span className="block text-xs text-muted">{T("journey.story.hint")}</span>
      <textarea value={intro} onChange={(e) => onChange(e.target.value)} rows={5} className={`${inputClass} leading-loose`} />
      {error && <p className="mt-2 text-sm font-semibold text-ink">{error}</p>}
    </label>
  );
}

export function IngredientsStation({
  items, onChange,
}: { items: string[]; onChange: (items: string[]) => void }) {
  return (
    <LineListEditor
      label=""
      hint={T("journey.ing.hint")}
      items={items}
      onChange={onChange}
      addLabel={T("journey.ing.add")}
      placeholder={T("journey.ing.placeholder")}
    />
  );
}

export function StepsStation({
  items, onChange,
}: { items: string[]; onChange: (items: string[]) => void }) {
  return (
    <LineListEditor
      label=""
      hint={T("journey.steps.hint")}
      items={items}
      onChange={onChange}
      numbered
      addLabel={T("journey.steps.add")}
      placeholder={T("journey.steps.placeholder")}
    />
  );
}

export function ImageExtrasStation({
  collection, image, imageAlt, tip, extra, advancedOpen, onImage, onTip, onExtra, onToggleAdvanced, onInsertExtra, errorFor,
}: {
  collection: CollectionConfig;
  image: string; imageAlt: string; tip: string; extra: string; advancedOpen: boolean;
  onImage: (url: string, alt: string) => void;
  onTip: (v: string) => void;
  onExtra: (v: string) => void;
  onToggleAdvanced: () => void;
  onInsertExtra: (markdown: string) => void;
  errorFor: (field: string) => string | undefined;
}) {
  const err = (f: string) => errorFor(f) && <p className="mt-2 text-sm font-semibold text-ink">{errorFor(f)}</p>;
  return (
    <div className="space-y-6">
      <div>
        <span className="text-sm font-semibold text-ink">{fieldLabel(collection, "image")} <span className="text-gold-ink">*</span></span>
        <MediaPicker url={image} alt={imageAlt} onChange={onImage} />
        {err("image")}
        {err("imageAlt")}
      </div>
      <label className="block">
        <span className="text-sm font-semibold text-ink">{T("journey.tip.label")}</span>
        <textarea value={tip} onChange={(e) => onTip(e.target.value)} rows={2} className={inputClass} />
      </label>
      <div>
        <button type="button" onClick={onToggleAdvanced} className="text-sm font-semibold text-gold-ink hover:underline">
          {advancedOpen ? "▾" : "▸"} {T("journey.advanced.toggle")}
        </button>
        {advancedOpen && (
          <div className="mt-3">
            <span className="block text-xs text-muted">{T("journey.advanced.hint")}</span>
            <textarea value={extra} onChange={(e) => onExtra(e.target.value)} rows={6} dir="auto" className={`${inputClass} leading-loose`} />
            <InlineImageInserter onInsert={onInsertExtra} />
          </div>
        )}
      </div>
    </div>
  );
}

export function CatalogStation({
  collection, category, tags, date, onSet, errorFor,
}: {
  collection: CollectionConfig;
  category: string; tags: string[]; date: string;
  onSet: (key: string, v: unknown) => void;
  errorFor: (field: string) => string | undefined;
}) {
  const catField = collection.fields.find((f) => f.key === "category");
  const tagField = collection.fields.find((f) => f.key === "tags");
  const err = (f: string) => errorFor(f) && <p className="mt-2 text-sm font-semibold text-ink">{errorFor(f)}</p>;
  return (
    <div className="space-y-6">
      <div>
        <ChipSelect
          label={catField?.label ?? "קטגוריה"}
          options={catField?.options ?? []}
          value={category ? [category] : []}
          single
          allowCustom
          onChange={(next) => onSet("category", next[0] ?? "")}
          error={errorFor("category")}
        />
      </div>
      <div>
        <ChipSelect
          label={tagField?.label ?? "תגיות"}
          options={tagField?.options ?? []}
          value={tags}
          max={tagField?.max}
          allowCustom
          onChange={(next) => onSet("tags", next)}
          error={errorFor("tags")}
        />
      </div>
      <label className="block max-w-60">
        <span className="text-sm font-semibold text-ink">{fieldLabel(collection, "date")} <span className="text-gold-ink">*</span></span>
        <input type="date" value={date} onChange={(e) => onSet("date", e.target.value)} className={inputClass} />
        {err("date")}
      </label>
    </div>
  );
}
