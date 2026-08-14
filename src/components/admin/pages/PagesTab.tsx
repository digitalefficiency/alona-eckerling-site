"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PageDocument } from "@/lib/sections/schema";
import { savePage, loadPage } from "@/lib/sections/actions";
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

export function PagesTab({
  pages,
  initialDoc,
  initialRev,
}: {
  pages: PageSummary[];
  initialDoc: PageDocument | null;
  initialRev: string | null;
}) {
  const [slug, setSlug] = useState<string>(pages[0]?.slug ?? "");
  const [doc, setDoc] = useState<PageDocument | null>(initialDoc);
  // the draft revision this screen's document is based on; publish sends it
  // back so a stale tab conflicts instead of silently reverting newer work
  const [rev, setRev] = useState<string | null>(initialRev);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewOpened, setPreviewOpened] = useState(false);
  const iframe = useRef<HTMLIFrameElement>(null);

  const [loading, setLoading] = useState(false);
  const route = pages.find((p) => p.slug === slug)?.route ?? "/";
  const { rescue, dismiss, clear } = useDraftRescue(slug, doc, dirty, rev);

  // Switching pages fetches that page's document. Only the first one is sent
  // with the initial render, so the desk paints without waiting on five files.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    let live = true;
    setLoading(true);
    setStatus(null);
    loadPage(slug).then((next) => {
      if (!live) return;
      setDoc(next?.doc ?? null);
      setRev(next?.rev ?? null);
      setDirty(false);
      setLoading(false);
    });
    return () => {
      live = false;
    };
  }, [slug]);

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
    const res = await savePage(slug, doc, rev);
    setSaving(false);
    if (res.ok) {
      setRev(res.rev);
      setDirty(false);
      clear();
      setStatus({ kind: "ok", text: "השינוי באוויר" });
      if (iframe.current) iframe.current.src = `${route}?preview=${Date.now()}`;
    } else {
      setStatus({ kind: "err", text: res.error });
    }
  }



  return (
    <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-6">
      {/* On a phone the page list is a sideways chip strip, not a stack — the
          old stack pushed the actual sections four screens down. */}
      <aside className="min-w-0">
        <p className="mb-2 text-[11px] font-bold tracking-eyebrow text-muted">עמודי האתר</p>
        <ul className="scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:mx-0 lg:block lg:space-y-1 lg:overflow-visible lg:px-0 lg:pb-0">
          {pages.map((p) => (
            <li key={p.slug} className="shrink-0 lg:shrink">
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
                <span className="block whitespace-nowrap text-[13.5px] font-bold text-ink lg:whitespace-normal">
                  {p.title}
                </span>
                {/* bdi keeps the Latin route from scrambling the Hebrew tail */}
                <span className="block whitespace-nowrap text-[11.5px] text-muted lg:whitespace-normal">
                  <bdi dir="ltr">{p.route}</bdi> · {p.sections} סקשנים
                </span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <div className="min-w-0">
        {loading && <p className="text-[13.5px] text-muted">טוענת את העמוד…</p>}
        {!loading && !doc && (
          <p className="rounded-[8px] border border-line bg-card p-6 text-[13.5px] text-muted">
            לא הצלחתי לטעון את העמוד. כדאי לרענן את הדף.
          </p>
        )}
        {doc && rescue && !dirty && (
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
                  // publish against the revision the rescue was typed on, not
                  // the one just loaded — restoring must not bypass the
                  // stale-payload guard. Entries without a rev conflict too,
                  // which is the safe direction.
                  setRev(rescue.rev ?? null);
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

        {/* The publish bar RIDES ALONG (sticky under the shell header): a long
            section form used to strand her a full page-scroll away from the
            publish button, and the "did I save?" anxiety is exactly what this
            desk exists to remove. The bar also carries the dirty state, so the
            answer is always one glance up. */}
        <div className="sticky top-[54px] z-30 mb-4 flex flex-wrap items-center gap-2.5 rounded-[10px] border border-line bg-card/95 px-3 py-2.5 shadow-sm backdrop-blur sm:top-[60px] sm:gap-3 sm:px-4">
          <button
            type="button"
            onClick={publish}
            disabled={!dirty || saving || !doc}
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

          {dirty && !saving && !status && (
            <span className="text-[12.5px] font-semibold text-gold-ink">יש שינויים שעוד לא באוויר</span>
          )}

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

        {doc && <PageView doc={doc} onChange={change} onOpenPreview={openPreview} previewOpened={previewOpened} />}
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
