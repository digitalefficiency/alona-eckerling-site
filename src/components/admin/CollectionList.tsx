"use client";
import type { CollectionConfig } from "@/lib/cms/config";
import type { AdminDoc } from "@/lib/cms/read";
import { DUR, EASE, cssDur, cssEase } from "@/lib/motion-tokens";
import { T } from "@/lib/cms/desk-strings";
import { brand } from "@/brand.config";

// The library view: everything the client has written, drafts included (a draft is
// committed but invisible to the site, so nothing is ever lost in a closed tab).
export function CollectionList({
  collection,
  docs,
  onNew,
  onEdit,
}: {
  collection: CollectionConfig;
  docs: AdminDoc[];
  onNew: () => void;
  onEdit: (file: string) => void;
}) {
  const singular = collection.labelSingular ?? collection.label;
  const micro = { transitionDuration: cssDur(DUR.micro), transitionTimingFunction: cssEase(EASE.micro) };

  return (
    <section>
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="font-serif text-3xl font-black text-ink">{collection.label}</h1>
        <button
          onClick={onNew}
          className="ms-auto rounded-[4px] bg-ink px-6 py-3 font-bold text-bg transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          style={micro}
        >
          {T("list.newItem", { singular })}
        </button>
      </div>

      {docs.length === 0 ? (
        <p className="mt-10 rounded-[10px] border border-line bg-card p-10 text-center leading-relaxed text-muted">
          {T("list.emptyLine1")}
          <br />
          {T("list.emptyLine2", { singular })}
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-line overflow-hidden rounded-[10px] border border-line bg-card">
          {docs.map((d) => (
            <li key={d.file}>
              <button
                onClick={() => onEdit(d.file)}
                className="flex w-full items-center gap-4 px-6 py-5 text-start transition-colors hover:bg-sand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                style={micro}
              >
                <span className="flex-1">
                  <span className="block font-serif text-lg font-bold text-ink">{d.title}</span>
                  <span className="mt-1 block text-sm text-muted">
                    {d.date}
                    {d.locale ? ` · ${d.locale}` : ""}
                  </span>
                </span>
                {d.draft && (
                  <span className="rounded-full bg-sand px-3 py-1 text-xs font-bold text-gold-ink">{T("list.draftBadge")}</span>
                )}
                {/* drill-in affordance points toward the inline-end: ‹ in RTL, › in LTR */}
                <span aria-hidden className="text-gold-ink">{brand.direction === "rtl" ? "‹" : "›"}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
