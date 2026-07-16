"use client";
import { useRef, useState } from "react";
import { DUR, EASE, cssDur, cssEase } from "@/lib/motion-tokens";
import { T } from "@/lib/cms/desk-strings";
import { useImageUpload } from "@/components/admin/useImageUpload";
import { MediaLibrary } from "@/components/admin/MediaLibrary";

// The "add a picture inside the text" control. It resolves to a url (fresh upload OR
// a reused library image), then REQUIRES an alt before it will splice — because the
// validator refuses to publish a body ![](url) with no alt, and the desk must catch
// that here, in the client's language, not at publish time. onInsert receives the
// finished `![alt](url)` for the editor to splice at the caret.
export function InlineImageInserter({ onInsert }: { onInsert: (markdown: string) => void }) {
  const file = useRef<HTMLInputElement>(null);
  const { upload, busy, error } = useImageUpload();
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [alt, setAlt] = useState("");
  const [libraryOpen, setLibraryOpen] = useState(false);
  const micro = { transitionDuration: cssDur(DUR.micro), transitionTimingFunction: cssEase(EASE.micro) };

  async function pickFile(f: File) {
    const r = await upload(f, "");
    if ("url" in r) setPendingUrl(r.url);
  }

  function confirmInsert() {
    if (!pendingUrl || !alt.trim()) return;
    onInsert(`![${alt.trim()}](${pendingUrl})`);
    setPendingUrl(null);
    setAlt("");
  }

  return (
    <div className="mt-2">
      {!pendingUrl ? (
        <div className="flex flex-wrap gap-3">
          <input
            ref={file}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && pickFile(e.target.files[0])}
          />
          <button
            type="button"
            onClick={() => file.current?.click()}
            disabled={busy}
            className="rounded-[4px] border border-line bg-bg2 px-4 py-2 text-sm font-bold text-ink transition-colors hover:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-60"
            style={micro}
          >
            {busy ? T("media.uploading") : T("inline.addImage")}
          </button>
          <button
            type="button"
            onClick={() => setLibraryOpen(true)}
            className="rounded-[4px] border border-line bg-bg2 px-4 py-2 text-sm font-bold text-ink transition-colors hover:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            style={micro}
          >
            {T("inline.fromLibrary")}
          </button>
        </div>
      ) : (
        <div className="rounded-[10px] border border-line bg-card p-4">
          {/* eslint-disable-next-line @next/next/no-img-element -- admin preview of the chosen inline image */}
          <img src={pendingUrl} alt="" className="mb-3 max-h-40 rounded-[4px] border border-line" />
          <label className="block text-sm font-semibold text-ink">
            {T("inline.altLabel")}
            <input
              autoFocus
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), confirmInsert())}
              className="mt-2 w-full rounded-[4px] border border-line bg-bg2 px-3 py-2 text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            />
          </label>
          <div className="mt-3 flex gap-3">
            <button
              type="button"
              onClick={confirmInsert}
              disabled={!alt.trim()}
              className="rounded-[4px] bg-ink px-5 py-2 text-sm font-bold text-bg transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-40"
              style={micro}
            >
              {T("inline.insert")}
            </button>
            <button
              type="button"
              onClick={() => { setPendingUrl(null); setAlt(""); }}
              className="rounded-[4px] border border-line px-5 py-2 text-sm font-bold text-ink transition-colors hover:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              style={micro}
            >
              {T("inline.cancel")}
            </button>
          </div>
        </div>
      )}
      {error && <p className="mt-2 text-sm font-semibold text-ink">{error}</p>}
      {libraryOpen && (
        <MediaLibrary
          onClose={() => setLibraryOpen(false)}
          onPick={(url) => { setPendingUrl(url); setLibraryOpen(false); }}
        />
      )}
    </div>
  );
}
