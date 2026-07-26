"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PageDocument } from "@/lib/sections/schema";
import { savePage } from "@/lib/sections/actions";
import { PageView } from "./PageView";
import { useDraftRescue } from "./useDraftRescue";

// PagesTab.tsx — the עמודים tab: pick a page, edit it, publish it.
//
// WHAT THIS SCREEN PROMISES AND KEEPS:
//   · nothing is lost. Edits live in component state and are written on publish;
//     leaving with unsaved work asks first.
//   · publishing says what happened, not that it was attempted. The action
//     revalidates the real route before it returns, so "השינוי באוויר" is a
//     statement about the site and not about the request.
//   · the preview is the live route in an iframe. Not an approximation of it —
//     an approximation is a second thing to keep in sync, and the day it drifts
//     is the day she stops trusting both.

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

export type PageSummary = { slug: string; title: string; route: string; sections: number };

export function PagesTab({ pages, initialDoc }: { pages: PageSummary[]; initialDoc: PageDocument | null }) {
  const [slug, setSlug] = useState<string>(pages[0]?.slug ?? "");
  const [doc, setDoc] = useState<PageDocument | null>(initialDoc);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewOpened, setPreviewOpened] = useState(false);
  const iframe = useRef<HTMLIFrameElement>(null);

  const route = pages.find((p) => p.slug === slug)?.route ?? "/";
  const { rescue, dismiss, clear } = useDraftRescue(slug, doc, dirty);

  // Leaving with unsaved work should cost a keystroke, not a paragraph.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const change = useCallback((next: PageDocument) => {
    setDoc(next);
    setDirty(true);
    setStatus(null);
  }, []);

  const openPreview = useCallback(() => {
    setPreviewOpen(true);
    setPreviewOpened(true);
    // reload so the iframe shows the last published state rather than a cached one
    if (iframe.current) iframe.current.src = `${route}?preview=${Date.now()}`;
  }, [route]);

  async function publish() {
    if (!doc) return;
    setSaving(true);
    setStatus(null);
    const res = await savePage(slug, doc);
    setSaving(false);
    if (res.ok) {
      setDirty(false);
      clear();
      setStatus({ kind: "ok", text: "השינוי באוויר" });
      if (iframe.current) iframe.current.src = `${route}?preview=${Date.now()}`;
    } else {
      setStatus({ kind: "err", text: res.error });
    }
  }

  if (!doc) {
    return (
      <p className="rounded-[8px] border border-line bg-card p-6 text-[13.5px] text-muted">
        לא הצלחתי לטעון את העמוד. כדאי לרענן את הדף.
      </p>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside>
        <p className="mb-2 text-[11px] font-bold tracking-eyebrow text-muted">עמודי האתר</p>
        <ul className="space-y-1">
          {pages.map((p) => (
            <li key={p.slug}>
              <button
                type="button"
                onClick={() => setSlug(p.slug)}
                disabled={p.slug !== slug && dirty}
                title={p.slug !== slug && dirty ? "יש שינויים שלא פורסמו בעמוד הנוכחי" : undefined}
                className={cx(
                  "w-full rounded-[6px] border px-3 py-2.5 text-start transition disabled:cursor-not-allowed disabled:opacity-40",
                  p.slug === slug ? "border-gold bg-gold-soft/40" : "border-line bg-card hover:border-gold",
                )}
              >
                <span className="block text-[13.5px] font-bold text-ink">{p.title}</span>
                <span className="block text-[11.5px] text-muted">
                  {p.route} · {p.sections} סקשנים
                </span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <div className="min-w-0">
        {rescue && !dirty && (
          <div className="mb-4 rounded-[8px] border border-gold bg-gold-soft/40 p-4">
            <p className="text-[13.5px] font-bold text-ink">יש כאן עבודה שלא פורסמה</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink/80">
              בפעם הקודמת ערכת את העמוד הזה ולא פרסמת. שמרתי עותק במחשב שלך.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setDoc(rescue.doc);
                  setDirty(true);
                  dismiss();
                }}
                className="rounded-[5px] bg-gold-ink px-3.5 py-1.5 text-[12.5px] font-bold text-bg"
              >
                לשחזר את העבודה
              </button>
              <button
                type="button"
                onClick={clear}
                className="rounded-[5px] border border-line bg-card px-3.5 py-1.5 text-[12.5px] font-semibold text-muted"
              >
                למחוק ולהתחיל מהמפורסם
              </button>
            </div>
          </div>
        )}

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={publish}
            disabled={!dirty || saving}
            className={cx(
              "rounded-[6px] px-5 py-2.5 text-[13.5px] font-bold transition",
              dirty && !saving ? "bg-gold-ink text-bg hover:opacity-90" : "cursor-not-allowed bg-line text-muted",
            )}
          >
            {saving ? "מפרסמת…" : dirty ? "פרסום" : "אין שינויים לפרסם"}
          </button>

          <button
            type="button"
            onClick={openPreview}
            className="rounded-[6px] border border-line px-4 py-2.5 text-[13.5px] font-semibold text-ink transition hover:border-gold"
          >
            תצוגה מקדימה
          </button>

          {status && (
            <span
              role="status"
              className={cx(
                "text-[13px] font-semibold",
                status.kind === "ok" ? "text-good" : "text-bad",
              )}
            >
              {status.kind === "ok" ? "✓ " : ""}
              {status.text}
              {status.kind === "ok" && (
                <a href={route} target="_blank" rel="noreferrer" className="ms-2 underline decoration-rose">
                  לצפייה בעמוד
                </a>
              )}
            </span>
          )}
        </div>

        <PageView doc={doc} onChange={change} onOpenPreview={openPreview} previewOpened={previewOpened} />
      </div>

      {previewOpen && (
        <div className="fixed inset-0 z-50 flex bg-ink/40" onClick={() => setPreviewOpen(false)}>
          <div
            className="ms-auto flex h-full w-full max-w-[520px] flex-col bg-card shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-line px-4 py-3">
              <span className="text-[13px] font-bold text-ink">תצוגה מקדימה</span>
              <span className="text-[12px] text-muted">{route}</span>
              {dirty && (
                <span className="rounded-full bg-gold-soft px-2 py-0.5 text-[11px] font-semibold text-ink">
                  מציג את מה שפורסם, לא את השינויים שלך
                </span>
              )}
              <span className="grow" />
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="rounded-[5px] border border-line px-3 py-1 text-[12px] text-muted hover:border-gold hover:text-ink"
              >
                סגירה
              </button>
            </div>
            <iframe ref={iframe} src={route} title="תצוגה מקדימה" className="h-full w-full grow border-0" />
          </div>
        </div>
      )}
    </div>
  );
}
