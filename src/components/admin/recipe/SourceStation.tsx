"use client";
import { useState } from "react";
import { parsePaste, type PasteResult } from "@/lib/cms/recipe-paste.mjs";
import { T } from "@/lib/cms/desk-strings";

// Station 0 — only for a NEW recipe: paste-the-whole-thing (heuristics sort it
// into the stations, summary shows what was recognized) or start from scratch.
export function SourceStation({ onApply, onScratch }: { onApply: (r: PasteResult) => void; onScratch: () => void }) {
  const [mode, setMode] = useState<"choice" | "paste">("choice");
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<PasteResult | null>(null);

  if (mode === "choice") {
    return (
      <section className="rounded-[10px] border border-line bg-card p-6 md:p-8">
        <h2 className="font-serif text-xl font-black text-ink">{T("journey.source.title")}</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <SourceCard title={T("journey.source.pasteCard")} hint={T("journey.source.pasteHint")} onClick={() => setMode("paste")} />
          <SourceCard title={T("journey.source.scratchCard")} hint={T("journey.source.scratchHint")} onClick={onScratch} />
        </div>
      </section>
    );
  }

  const summary = parsed
    ? [
        parsed.summary.hasTitle && T("journey.sum.title"),
        parsed.summary.hasIntro && T("journey.sum.intro"),
        parsed.summary.ingredients > 0 && T("journey.sum.ingredients", { n: parsed.summary.ingredients }),
        parsed.summary.steps > 0 && T("journey.sum.steps", { n: parsed.summary.steps }),
        parsed.summary.hasTip && T("journey.sum.tip"),
      ].filter(Boolean)
    : [];

  return (
    <section className="rounded-[10px] border border-line bg-card p-6 md:p-8">
      <h2 className="font-serif text-xl font-black text-ink">{T("journey.source.pasteCard")}</h2>
      <label className="mt-4 block">
        <span className="text-sm font-semibold text-ink">{T("journey.source.pasteLabel")}</span>
        <textarea
          value={text}
          onChange={(e) => { setText(e.target.value); setParsed(null); }}
          rows={12}
          className="mt-2 w-full rounded-[4px] border border-line bg-bg2 px-4 py-3 leading-loose text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        />
      </label>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {!parsed ? (
          <button
            type="button"
            disabled={!text.trim()}
            onClick={() => setParsed(parsePaste(text))}
            className="rounded-[4px] bg-ink px-6 py-3 font-bold text-bg transition-colors hover:opacity-90 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            {T("journey.source.parse")}
          </button>
        ) : (
          <>
            <p className="w-full text-sm font-semibold text-ink" role="status">
              {summary.length ? T("journey.source.parsed", { found: summary.join(" · ") }) : T("journey.sum.nothing")}
            </p>
            <button type="button" onClick={() => onApply(parsed)} className="rounded-[4px] bg-ink px-6 py-3 font-bold text-bg transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold">
              {T("journey.source.apply")}
            </button>
          </>
        )}
        <button type="button" onClick={() => { setMode("choice"); setParsed(null); }} className="text-sm font-semibold text-gold-ink hover:underline">
          {T("journey.source.back")}
        </button>
      </div>
    </section>
  );
}

function SourceCard({ title, hint, onClick }: { title: string; hint: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-[10px] border border-line bg-bg2 p-6 text-start transition-colors hover:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
    >
      <span className="block font-serif text-lg font-bold text-ink">{title}</span>
      <span className="mt-1 block text-sm leading-relaxed text-muted">{hint}</span>
    </button>
  );
}
