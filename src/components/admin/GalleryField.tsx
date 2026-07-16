"use client";
import { useRef } from "react";
import { DUR, EASE, cssDur, cssEase } from "@/lib/motion-tokens";
import { T } from "@/lib/cms/desk-strings";
import { useImageUpload } from "@/components/admin/useImageUpload";

// A gallery is TWO parallel string lists the caller owns: urls + alts, paired by
// index (the frontmatter shape from frontmatter-normalize.mjs). This component edits
// them as one visual list of {image, description} rows and hands both arrays back on
// every change, so the DocEditor stores `<key>` and `<key>Alt` in lockstep — exactly
// what validateDoc's gallery case checks (equal counts, every alt non-empty).
export function GalleryField({
  label,
  urls,
  alts,
  onChange,
}: {
  label: string;
  urls: string[];
  alts: string[];
  onChange: (urls: string[], alts: string[]) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const { upload, busy, error } = useImageUpload();
  const micro = { transitionDuration: cssDur(DUR.micro), transitionTimingFunction: cssEase(EASE.micro) };

  async function addFiles(files: FileList) {
    let nextUrls = [...urls];
    let nextAlts = [...alts];
    for (const file of Array.from(files)) {
      const r = await upload(file, "");
      if ("url" in r) {
        nextUrls = [...nextUrls, r.url];
        nextAlts = [...nextAlts, ""];
        onChange(nextUrls, nextAlts); // commit incrementally so a slow batch shows progress
      }
    }
  }

  const setAlt = (i: number, v: string) => onChange(urls, alts.map((a, idx) => (idx === i ? v : a)));
  const remove = (i: number) => onChange(urls.filter((_, idx) => idx !== i), alts.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= urls.length) return;
    const u = [...urls]; const a = [...alts];
    [u[i], u[j]] = [u[j], u[i]]; [a[i], a[j]] = [a[j], a[i]];
    onChange(u, a);
  };

  return (
    <div className="mt-2">
      <span className="text-sm font-semibold text-ink">{label}</span>
      <span className="mt-1 block text-xs text-muted">{T("gallery.hint")}</span>

      {urls.length > 0 && (
        <ul className="mt-3 space-y-3">
          {urls.map((url, i) => (
            <li key={url + i} className="flex gap-3 rounded-[10px] border border-line bg-card p-3">
              {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnail of an uploaded asset */}
              <img src={url} alt="" className="h-20 w-20 flex-none rounded-[4px] border border-line object-cover" />
              <div className="flex-1">
                <input
                  value={alts[i] ?? ""}
                  onChange={(e) => setAlt(i, e.target.value)}
                  placeholder={T("gallery.altPlaceholder")}
                  className="w-full rounded-[4px] border border-line bg-bg2 px-3 py-2 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                />
                <div className="mt-2 flex items-center gap-3 text-xs">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="font-semibold text-muted hover:text-ink disabled:opacity-40" style={micro}>
                    {T("gallery.moveUp")}
                  </button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === urls.length - 1} className="font-semibold text-muted hover:text-ink disabled:opacity-40" style={micro}>
                    {T("gallery.moveDown")}
                  </button>
                  <button type="button" onClick={() => remove(i)} className="ms-auto font-semibold text-muted hover:text-ink" style={micro}>
                    {T("gallery.remove")}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && addFiles(e.target.files)}
      />
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={busy}
        className="mt-3 w-full rounded-[4px] border border-line bg-bg2 px-4 py-3 text-sm font-bold text-ink transition-colors hover:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-60"
        style={micro}
      >
        {busy ? T("media.uploading") : T("gallery.add")}
      </button>
      {error && <p className="mt-2 text-sm font-semibold text-ink">{error}</p>}
    </div>
  );
}
