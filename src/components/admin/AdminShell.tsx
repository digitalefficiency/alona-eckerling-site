"use client";
import { useState } from "react";
import type { CollectionConfig } from "@/lib/cms/config";
import type { AdminCollection } from "@/lib/cms/read";
import { DUR, EASE, cssDur, cssEase } from "@/lib/motion-tokens";
import { brand } from "@/brand.config";
import { T } from "@/lib/cms/desk-strings";
import type { SettingsGroup } from "@/lib/cms/settings-schema";
import { BrandLogo } from "@/components/BrandLogo";
import { CollectionList } from "@/components/admin/CollectionList";
import { DocEditor } from "@/components/admin/DocEditor";
import { SettingsForm } from "@/components/admin/SettingsForm";

// The desk. Views are client state, not routes — one page, one noindex, no router
// surface to keep in sync with lint-seo/sitemap.
type View =
  | { kind: "list"; collectionId: string }
  | { kind: "edit"; collectionId: string; file?: string }
  | { kind: "settings"; group: string };

export function AdminShell({
  email,
  collections,
  docs,
  settings,
}: {
  email: string;
  collections: CollectionConfig[];
  docs: AdminCollection[];
  settings: Record<string, SettingsGroup>;
}) {
  const settingsKeys = Object.keys(settings);
  const [view, setView] = useState<View>(
    collections[0]
      ? { kind: "list", collectionId: collections[0].id }
      : { kind: "settings", group: settingsKeys[0] ?? "" },
  );
  const activeCollectionId = view.kind === "settings" ? "" : view.collectionId;
  const current = collections.find((c) => c.id === activeCollectionId);
  const bucket = docs.find((d) => d.id === activeCollectionId);

  if (!collections.length && !settingsKeys.length) {
    return (
      <main dir={brand.direction} className="mx-auto max-w-[900px] px-6 py-20 text-center">
        <h1 className="font-serif text-2xl font-black text-ink">{T("admin.noCollectionsTitle")}</h1>
        <p className="mt-3 text-muted">{T("admin.noCollectionsBody")}</p>
      </main>
    );
  }

  return (
    <div dir={brand.direction} className="min-h-screen bg-sand">
      <header className="border-b border-line bg-card">
        <div className="mx-auto flex max-w-[1100px] flex-wrap items-center gap-4 px-6 py-5">
          <div className="flex items-center gap-2.5">
            <BrandLogo className="h-7 w-auto" />
            <span className="text-xs font-bold tracking-[.2em] text-gold-ink">{T("admin.deskTitle")}</span>
          </div>
          <nav className="flex flex-wrap gap-2">
            {collections.map((c) => (
              <Tab
                key={c.id}
                active={view.kind === "list" && c.id === view.collectionId}
                onClick={() => setView({ kind: "list", collectionId: c.id })}
              >
                {c.label}
              </Tab>
            ))}
            {settingsKeys.map((k) => (
              <Tab
                key={k}
                active={view.kind === "settings" && view.group === k}
                onClick={() => setView({ kind: "settings", group: k })}
              >
                {settings[k].label}
              </Tab>
            ))}
          </nav>
          <div className="ms-auto flex items-center gap-3 text-sm text-muted">
            <span dir="ltr">{email}</span>
            <form method="POST" action="/api/cms/auth/logout">
              <button type="submit" className="font-semibold text-gold-ink underline-offset-4 hover:underline">
                {T("admin.logout")}
              </button>
            </form>
          </div>
        </div>
      </header>

      <main
        className="mx-auto max-w-[1100px] px-6 py-10"
        style={{ animation: `none`, transition: `opacity ${cssDur(DUR.reveal)} ${cssEase(EASE.out)}` }}
      >
        {bucket?.error === "unconfigured" && (
          <p className="mb-6 rounded-[4px] border border-line bg-bg2 p-4 text-sm text-muted">
            {T("admin.unconfigured")}
          </p>
        )}
        {view.kind === "settings" && settings[view.group] ? (
          <SettingsForm name={view.group} group={settings[view.group]} />
        ) : view.kind === "list" && current ? (
          <CollectionList
            collection={current}
            docs={bucket?.docs ?? []}
            onNew={() => setView({ kind: "edit", collectionId: current.id })}
            onEdit={(file) => setView({ kind: "edit", collectionId: current.id, file })}
          />
        ) : view.kind === "edit" && current ? (
          <DocEditor
            collection={current}
            file={view.file}
            onDone={() => setView({ kind: "list", collectionId: current.id })}
          />
        ) : null}
      </main>
    </div>
  );
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-[4px] px-4 py-2 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
        active ? "bg-ink text-bg" : "border border-line text-ink hover:border-gold"
      }`}
      style={{ transitionDuration: cssDur(DUR.micro), transitionTimingFunction: cssEase(EASE.micro) }}
    >
      {children}
    </button>
  );
}
