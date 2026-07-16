"use client";
import { useEffect, useRef } from "react";
import { DUR, EASE, cssDur, cssEase } from "@/lib/motion-tokens";
import { T } from "@/lib/cms/desk-strings";

// The two-tier delete surface, as a real modal — never window.confirm, which is
// unstyleable and reads to a non-technical person as a browser ERROR. It offers the
// REVERSIBLE choice first (remove from site = draft:true, restorable any time) and
// the IRREVERSIBLE one second, visually subordinate, so the safe action is the easy
// one. A normal-flow overlay so it contributes layout height; Escape + backdrop close.
export function ConfirmDelete({
  label,
  onHide,
  onDeleteForever,
  onCancel,
}: {
  label: string;
  onHide: () => void;
  onDeleteForever: () => void;
  onCancel: () => void;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const micro = { transitionDuration: cssDur(DUR.micro), transitionTimingFunction: cssEase(EASE.micro) };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    document.addEventListener("keydown", onKey);
    panel.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={onCancel} role="presentation">
      <div
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={T("delete.title")}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[460px] rounded-[12px] border border-line bg-card p-6 focus-visible:outline-none"
      >
        <h2 className="font-serif text-xl font-black text-ink">{T("delete.title")}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">{T("delete.body", { label })}</p>

        <button
          type="button"
          onClick={onHide}
          className="mt-5 w-full rounded-[4px] bg-ink px-5 py-3 font-bold text-bg transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          style={micro}
        >
          {T("delete.hide")}
        </button>
        <p className="mt-2 text-xs leading-relaxed text-muted">{T("delete.hideHint")}</p>

        <div className="mt-5 border-t border-line pt-4">
          <button
            type="button"
            onClick={onDeleteForever}
            className="text-sm font-semibold text-muted underline-offset-4 hover:text-ink hover:underline"
            style={micro}
          >
            {T("delete.forever")}
          </button>
          <span className="mx-2 text-muted">·</span>
          <button type="button" onClick={onCancel} className="text-sm font-semibold text-gold-ink hover:underline" style={micro}>
            {T("delete.cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}
