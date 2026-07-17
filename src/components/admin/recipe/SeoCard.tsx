"use client";
import { T } from "@/lib/cms/desk-strings";
import { site } from "@/lib/site";
import { inputClass } from "@/components/admin/recipe/stations";

// The "business card on Google" editor: description with a live counter and a
// search-result mock, plus the slug (editable on NEW docs only: a published URL
// never changes from the desk).
export function SeoCard({
  title, description, slug, isNew, slugPlaceholder, onDescription, onSlug, errorFor,
}: {
  title: string; description: string; slug: string; isNew: boolean; slugPlaceholder: string;
  onDescription: (v: string) => void;
  onSlug: (v: string) => void;
  errorFor: (field: string) => string | undefined;
}) {
  const n = description.trim().length;
  const ok = n >= 70 && n <= 160;
  const shownSlug = slug || slugPlaceholder;
  return (
    <div className="space-y-5">
      <div className="rounded-[10px] border border-line bg-bg2 p-5" dir="auto">
        <p className="text-xs text-muted">{T("journey.seo.preview")}</p>
        <p className="mt-2 truncate text-sm text-muted" dir="ltr">
          {site.url.replace(/^https?:\/\//, "")} › recipes › {shownSlug || "…"}
        </p>
        <p className="truncate font-serif text-lg font-bold text-gold-ink">{title || "…"}</p>
        <p className="line-clamp-2 text-sm leading-relaxed text-ink">{description || "…"}</p>
      </div>
      <label className="block">
        <span className="text-sm font-semibold text-ink">{T("journey.seo.count", { n })}</span>
        <textarea
          value={description}
          onChange={(e) => onDescription(e.target.value)}
          rows={3}
          className={`${inputClass} ${ok ? "" : "border-gold"}`}
        />
        {errorFor("description") && <p className="mt-2 text-sm font-semibold text-ink">{errorFor("description")}</p>}
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-ink">{T("editor.slugLabel")}</span>
        <span className="mt-1 block text-xs text-muted">{isNew ? T("editor.slugHint") : T("journey.slug.locked")}</span>
        {isNew ? (
          <input dir="ltr" value={slug} placeholder={slugPlaceholder} onChange={(e) => onSlug(e.target.value)} className={inputClass} />
        ) : (
          <p dir="ltr" className="mt-2 rounded-[4px] border border-line bg-bg2 px-4 py-3 text-muted">{slug}</p>
        )}
        {errorFor("slug") && <p className="mt-2 text-sm font-semibold text-ink">{errorFor("slug")}</p>}
      </label>
    </div>
  );
}
