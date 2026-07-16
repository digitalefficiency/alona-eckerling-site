"use client";
import { useEffect, useRef, useState } from "react";
import { DUR, EASE, cssDur, cssEase } from "@/lib/motion-tokens";
import { T } from "@/lib/cms/desk-strings";
import { listUploads } from "@/lib/cms/actions";

// Browse-and-reuse: a modal grid of images the client already uploaded, so placing
// one again is a click, not a re-upload. Read-only (no delete — see listUploads).
// A normal-flow overlay (not position:fixed) so it contributes layout height; focus
// is trapped to the panel and Escape closes, matching the desk's accessibility bar.
export function MediaLibrary({ onPick, onClose }: { onPick: (url: string) => void; onClose: () => void }) {
  const [items, setItems] = useState<{ url: string }[] | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  const micro = { transitionDuration: cssDur(DUR.micro), transitionTimingFunction: cssEase(EASE.micro) };

  useEffect(() => {
    listUploads().then(setItems);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    panel.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={T("library.title")}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[80vh] w-full max-w-[720px] overflow-auto rounded-[12px] border border-line bg-card p-6 focus-visible:outline-none"
      >
        <div className="flex items-center">
          <h2 className="font-serif text-xl font-black text-ink">{T("library.title")}</h2>
          <button type="button" onClick={onClose} className="ms-auto text-sm font-semibold text-muted hover:text-ink" style={micro}>
            {T("library.close")}
          </button>
        </div>

        {items === null ? (
          <p className="py-16 text-center text-muted">{T("common.loading")}</p>
        ) : items.length === 0 ? (
          <p className="py-16 text-center leading-relaxed text-muted">{T("library.empty")}</p>
        ) : (
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {items.map((it) => (
              <li key={it.url}>
                <button
                  type="button"
                  onClick={() => onPick(it.url)}
                  className="block w-full overflow-hidden rounded-[8px] border border-line transition hover:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                  style={{ aspectRatio: "1 / 1", ...micro }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnail */}
                  <img src={it.url} alt="" className="h-full w-full object-cover" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
