"use client";
import { useEffect, useState, useTransition } from "react";
import { DUR, EASE, cssDur, cssEase } from "@/lib/motion-tokens";
import { T } from "@/lib/cms/desk-strings";
import { fetchHistory, fetchVersion, restoreVersion, type ActionResult } from "@/lib/cms/actions";

type Commit = { sha: string; message: string; author: string; date: string };

// The versions of one entry, from git. Draws from the message+author+date the
// history call returns inline (zero blob reads); a version's text loads lazily only
// when the client opens "view". Restore is forward-only: it re-validates the old
// bytes and commits them on top of HEAD (see restoreVersion / restore-core). The
// label is deliberately "changes to the live site" — approval-mode pending PRs and
// pre-rename history are not claimed, so the log never oversells what git knows.
export function HistoryPanel({
  collectionId,
  file,
  headSha,
  onRestored,
}: {
  collectionId: string;
  file: string;
  headSha: string | null;
  onRestored: (r: ActionResult) => void;
}) {
  const [commits, setCommits] = useState<Commit[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [preview, setPreview] = useState("");
  const [pending, startTransition] = useTransition();
  const micro = { transitionDuration: cssDur(DUR.micro), transitionTimingFunction: cssEase(EASE.micro) };

  useEffect(() => {
    fetchHistory(collectionId, file).then(setCommits);
  }, [collectionId, file]);

  function view(sha: string) {
    if (open === sha) { setOpen(null); return; }
    setOpen(sha);
    setPreview("");
    fetchVersion(collectionId, file, sha).then((r) => setPreview(r.ok ? r.text : ""));
  }

  function restore(sha: string) {
    startTransition(async () => {
      const r = await restoreVersion(collectionId, file, sha, headSha);
      onRestored(r);
    });
  }

  const fmt = (iso: string) => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? iso : new Intl.DateTimeFormat(T("common.intlLocale"), { dateStyle: "medium", timeStyle: "short" }).format(d);
  };

  return (
    <section className="mt-8 rounded-[10px] border border-line bg-card p-5">
      <h2 className="text-xs font-bold tracking-[.2em] text-gold-ink">{T("history.title")}</h2>
      <p className="mt-1 text-xs leading-relaxed text-muted">{T("history.scopeNote")}</p>

      {commits === null ? (
        <p className="py-8 text-center text-muted">{T("common.loading")}</p>
      ) : commits.length === 0 ? (
        <p className="py-8 text-center text-muted">{T("history.empty")}</p>
      ) : (
        <ul className="mt-4 divide-y divide-line">
          {commits.map((c, i) => (
            <li key={c.sha} className="py-3">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-muted">{fmt(c.date)}</span>
                {i === 0 && <span className="rounded-full bg-bg2 px-2 py-0.5 text-xs font-bold text-gold-ink">{T("history.current")}</span>}
                <button type="button" onClick={() => view(c.sha)} className="ms-auto font-semibold text-gold-ink hover:underline" style={micro}>
                  {open === c.sha ? T("history.hideView") : T("history.view")}
                </button>
                {i !== 0 && (
                  <button type="button" onClick={() => restore(c.sha)} disabled={pending} className="font-semibold text-ink hover:underline disabled:opacity-50" style={micro}>
                    {T("history.restore")}
                  </button>
                )}
              </div>
              {open === c.sha && (
                <pre className="mt-2 max-h-64 overflow-auto rounded-[4px] border border-line bg-bg2 p-3 text-xs leading-relaxed text-ink" dir="ltr">
                  {preview || T("common.loading")}
                </pre>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
