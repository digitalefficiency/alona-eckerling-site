"use client";
import { useEffect, useState } from "react";
import { DUR, EASE, cssDur, cssEase } from "@/lib/motion-tokens";
import { T } from "@/lib/cms/desk-strings";
import { listLeads, setLeadStatus, saveLeadNote, type Lead } from "@/lib/leads/actions";

// The inbox. Every card is one real person who asked to be called back, so the
// design optimizes for the two actions that actually answer her: call now
// (tel:/wa.me links, phone-first) and mark handled. Nothing here deletes —
// "handled" is a status, and the archive stays queryable forever.

const micro = { transitionDuration: cssDur(DUR.micro), transitionTimingFunction: cssEase(EASE.micro) };

const fmtDate = new Intl.DateTimeFormat("he-IL", { dateStyle: "short", timeStyle: "short" });

/** 05x-xxxxxxx → 9725xxxxxxx for wa.me; leaves anything unexpected alone. */
function waNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("0") ? `972${digits.slice(1)}` : digits;
}

export function LeadsTab() {
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    listLeads().then((r) => {
      if (!live) return;
      if (r.ok) setLeads(r.leads);
      else setError(r.error);
    });
    return () => {
      live = false;
    };
  }, []);

  async function toggle(lead: Lead) {
    const next = lead.status === "new" ? "handled" : "new";
    // optimistic — the revert on failure keeps the screen honest
    setLeads((p) =>
      p?.map((l) => (l.id === lead.id ? { ...l, status: next } : l)) ?? p,
    );
    const res = await setLeadStatus(lead.id, next);
    if (!res.ok) {
      setLeads((p) => p?.map((l) => (l.id === lead.id ? { ...l, status: lead.status } : l)) ?? p);
    }
  }

  if (error) return <p className="rounded-[6px] border border-line bg-bg2 p-5 text-muted">{error}</p>;
  if (!leads) return <p className="p-5 text-muted">{T("leads.loading")}</p>;
  if (!leads.length) return <p className="rounded-[6px] border border-line bg-bg2 p-5 text-muted">{T("leads.empty")}</p>;

  const fresh = leads.filter((l) => l.status === "new");
  const handled = leads.filter((l) => l.status !== "new");

  return (
    <div className="space-y-4">
      <p className="text-sm font-bold text-gold-ink">
        {fresh.length === 0 ? T("leads.allHandled") : fresh.length === 1 ? T("leads.oneNew") : T("leads.newCount", { n: fresh.length })}
      </p>
      <ul className="space-y-3">
        {[...fresh, ...handled].map((lead) => (
          <LeadCard key={lead.id} lead={lead} onToggle={() => toggle(lead)} />
        ))}
      </ul>
    </div>
  );
}

function LeadCard({ lead, onToggle }: { lead: Lead; onToggle: () => void }) {
  const [note, setNote] = useState(lead.notes ?? "");
  const [noteState, setNoteState] = useState<"idle" | "saving" | "saved">("idle");
  const isNew = lead.status === "new";

  async function persistNote() {
    setNoteState("saving");
    const res = await saveLeadNote(lead.id, note);
    setNoteState(res.ok ? "saved" : "idle");
  }

  return (
    <li
      className={`rounded-[8px] border p-5 transition-colors ${
        isNew ? "border-gold bg-card" : "border-line bg-bg2 opacity-80"
      }`}
      style={micro}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <span className="font-serif text-lg font-black text-ink">{lead.name}</span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                isNew ? "bg-gold/20 text-gold-ink" : "bg-line text-muted"
              }`}
            >
              {isNew ? T("leads.statusNew") : T("leads.statusHandled")}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted">
            {fmtDate.format(new Date(lead.created_at))}
            {lead.city ? ` · ${lead.city}` : ""}
            {lead.form_page ? ` · ${T("leads.source", { page: lead.form_page })}` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className={`shrink-0 rounded-[6px] px-4 py-2 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
            isNew ? "bg-ink text-bg hover:opacity-90" : "border border-line text-ink hover:border-gold"
          }`}
          style={micro}
        >
          {isNew ? T("leads.markHandled") : T("leads.markNew")}
        </button>
      </div>

      {lead.subject && <p className="mt-3 text-sm font-semibold text-ink">{lead.subject}</p>}
      {lead.message && <p className="mt-2 whitespace-pre-wrap leading-relaxed text-ink">{lead.message}</p>}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <a
          href={`https://wa.me/${waNumber(lead.phone)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-[6px] bg-gold-ink px-4 py-2 text-sm font-bold text-bg hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          {T("leads.whatsapp")}
        </a>
        <a
          href={`tel:${lead.phone}`}
          className="rounded-[6px] border border-line px-4 py-2 text-sm font-bold text-ink hover:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          {T("leads.call")} <span dir="ltr">{lead.phone}</span>
        </a>
        {lead.email && (
          <a
            href={`mailto:${lead.email}`}
            className="rounded-[6px] border border-line px-4 py-2 text-sm font-bold text-ink hover:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            {T("leads.email")} <span dir="ltr">{lead.email}</span>
          </a>
        )}
      </div>

      <details className="mt-4">
        <summary className="cursor-pointer text-sm font-semibold text-gold-ink underline-offset-4 hover:underline">
          {T("leads.noteLabel")}
        </summary>
        <div className="mt-2">
          <textarea
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              setNoteState("idle");
            }}
            rows={2}
            placeholder={T("leads.notePlaceholder")}
            className="w-full rounded-[4px] border border-line bg-card px-3 py-2 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          />
          <button
            type="button"
            onClick={persistNote}
            disabled={noteState === "saving"}
            className="mt-2 rounded-[6px] border border-line px-3 py-1.5 text-sm font-semibold text-ink hover:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-60"
          >
            {noteState === "saved" ? T("leads.noteSaved") : T("leads.noteSave")}
          </button>
        </div>
      </details>
    </li>
  );
}
