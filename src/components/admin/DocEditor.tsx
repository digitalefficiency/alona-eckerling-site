"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import type { CollectionConfig, FieldSpec } from "@/lib/cms/config";
import { DUR, EASE, cssDur, cssEase } from "@/lib/motion-tokens";
import { deleteDoc, fetchDoc, previewMarkdown, saveDoc, setDocVisibility, type ActionResult } from "@/lib/cms/actions";
import {
  AUTOSAVE_DEBOUNCE_MS,
  autosaveKey,
  isDirty,
  parseSnapshot,
  serializeSnapshot,
  shouldOfferRestore,
  type Loaded,
} from "@/lib/cms/autosave.mjs";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { GalleryField } from "@/components/admin/GalleryField";
import { ChipSelect } from "@/components/admin/ChipSelect";
import { InlineImageInserter } from "@/components/admin/InlineImageInserter";
import { ConfirmDelete } from "@/components/admin/ConfirmDelete";
import { HistoryPanel } from "@/components/admin/HistoryPanel";
import { PublishBar } from "@/components/admin/PublishBar";
import { T } from "@/lib/cms/desk-strings";

type Values = Record<string, unknown>;

// A slug is the page's URL AND the repo path the publish action writes, so it is
// latin-only by design (see lib/cms/safe-path.mjs). The client never has to invent one:
// we prefill a dated slug and let them refine it.
const defaultSlug = () => `post-${new Date().toISOString().slice(0, 10)}`;

const micro = { transitionDuration: cssDur(DUR.micro), transitionTimingFunction: cssEase(EASE.micro) };
const inputClass =
  "mt-2 w-full rounded-[4px] border border-line bg-bg2 px-4 py-3 text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold";

export function DocEditor({
  collection,
  file,
  onDone,
}: {
  collection: CollectionConfig;
  file?: string;
  onDone: () => void;
}) {
  const [values, setValues] = useState<Values>({});
  const [body, setBody] = useState("");
  const [slug, setSlug] = useState(defaultSlug());
  const [locale, setLocale] = useState("he");
  const [baseSha, setBaseSha] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(file));
  const [result, setResult] = useState<ActionResult | null>(null);
  const [preview, setPreview] = useState("");
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  // Splice inline markdown at the caret (replacing any selection), on its own lines
  // so an image never lands mid-sentence. Falls back to appending if the textarea
  // ref is not mounted. Keeps the caret after the inserted text.
  function insertInBody(markdown: string) {
    const ta = bodyRef.current;
    setBody((prev) => {
      const start = ta ? ta.selectionStart : prev.length;
      const end = ta ? ta.selectionEnd : prev.length;
      const before = prev.slice(0, start).replace(/\s*$/, "");
      const after = prev.slice(end).replace(/^\s*/, "");
      const next = `${before}${before ? "\n\n" : ""}${markdown}${after ? "\n\n" : ""}${after}`;
      if (ta) {
        const caret = (before ? before.length + 2 : 0) + markdown.length;
        requestAnimationFrame(() => { ta.focus(); ta.setSelectionRange(caret, caret); });
      }
      return next;
    });
  }

  // The document as the server handed it to us. Everything "unsaved" is measured
  // against this, never against an empty editor.
  const loadedRef = useRef<Loaded | null>(null);
  const [rescue, setRescue] = useState<ReturnType<typeof parseSnapshot>>(null);
  const key = autosaveKey(collection.id, file);

  useEffect(() => {
    const cached = typeof window === "undefined" ? null : parseSnapshot(localStorage.getItem(key), Date.now());

    if (!file) {
      loadedRef.current = null;
      if (shouldOfferRestore(cached, null)) setRescue(cached);
      return;
    }
    fetchDoc(collection.id, file).then((r) => {
      if (r.ok) {
        const { draft: _draft, slug: s, ...rest } = r.data as Values & { slug?: string };
        const m = /\.([a-z]{2})\.md$/.exec(file);
        const loaded: Loaded = {
          values: rest,
          body: r.body.trim(),
          slug: String(s ?? file.replace(/\.(\w{2}\.)?md$/, "")),
          locale: m ? m[1] : "he",
        };
        loadedRef.current = loaded;
        setValues(loaded.values);
        setBody(loaded.body);
        setSlug(loaded.slug);
        setLocale(loaded.locale);
        // "" = read from the local working tree (no GitHub token, i.e. `next dev`).
        // Send null, so the save is treated as a create rather than a stale-sha conflict.
        setBaseSha(r.sha || null);
        if (shouldOfferRestore(cached, loaded)) setRescue(cached);
      }
      setLoading(false);
    });
  }, [collection.id, file, key]);

  // The safety net. Everything typed is mirrored to this browser within ~600ms,
  // so a phone that evicts the tab, a crashed browser, or a mis-clicked back
  // button cannot destroy an unsaved post. Cleared the moment a save succeeds.
  useEffect(() => {
    if (loading || typeof window === "undefined") return;
    const t = setTimeout(() => {
      if (isDirty({ values, body, slug, locale }, loadedRef.current)) {
        localStorage.setItem(key, serializeSnapshot({ values, body, slug, locale }, Date.now()));
      } else {
        localStorage.removeItem(key);
      }
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [values, body, slug, locale, loading, key]);

  // Desktop only: a close/refresh with unsaved work asks first. Mobile browsers
  // ignore this, which is exactly why the localStorage mirror above is the real
  // protection and this is only a courtesy.
  useEffect(() => {
    const guard = (e: BeforeUnloadEvent) => {
      if (isDirty({ values, body, slug, locale }, loadedRef.current)) e.preventDefault();
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [values, body, slug, locale]);

  // Preview renders on the server through the published site's own sanitizer —
  // one renderer, so a preview can never show what production would strip.
  useEffect(() => {
    const t = setTimeout(() => {
      if (body.trim()) previewMarkdown(body).then(setPreview).catch(() => setPreview(""));
    }, 400);
    return () => clearTimeout(t);
  }, [body]);

  const set = (k: string, v: unknown) => setValues((p) => ({ ...p, [k]: v }));
  const errorFor = (field: string) =>
    result && !result.ok ? result.errors.find((e) => e.field === field)?.msg : undefined;

  function submit(draft: boolean) {
    setResult(null);
    startTransition(async () => {
      const r = await saveDoc({
        collectionId: collection.id,
        slug: slug.trim(),
        locale: collection.i18n ? locale : undefined,
        frontmatter: values,
        body,
        draft,
        baseSha,
      });
      setResult(r);
      // The work is now a committed file in the client's repo. The browser copy
      // has done its job; keeping it would resurrect a stale ghost on the next open.
      if (r.ok) {
        // Adopt the file's NEW blob sha so a second in-place save this session doesn't
        // re-send the sha we opened with and trip a false conflict. docSha is the blob
        // sha (r.sha is the COMMIT sha, for the liveness poll); it's absent in approval
        // mode, which opens a PR instead of committing — baseSha then stays as opened.
        if (r.docSha) setBaseSha(r.docSha);
        loadedRef.current = { values, body, slug, locale };
        localStorage.removeItem(key);
        setRescue(null);
      }
    });
  }

  function restore() {
    if (!rescue) return;
    setValues(rescue.values);
    setBody(rescue.body);
    setSlug(rescue.slug);
    setLocale(rescue.locale);
    setRescue(null);
  }

  function discardRescue() {
    localStorage.removeItem(key);
    setRescue(null);
  }

  // Two-tier delete, both routed through the ConfirmDelete modal (never window.confirm).
  // "Remove from site" is the reversible default (draft:true). "Delete permanently"
  // passes the blob sha the editor opened, so a concurrent edit becomes a conflict,
  // never a silent clobber (deleteDoc's sha is a tsc-required param).
  function hideFromSite() {
    setConfirmOpen(false);
    startTransition(async () => {
      const r = await setDocVisibility(collection.id, slug, true, baseSha, collection.i18n ? locale : undefined);
      setResult(r);
      if (r.ok) setTimeout(onDone, 1200);
    });
  }
  function deleteForever() {
    setConfirmOpen(false);
    if (!file || baseSha === null) return;
    startTransition(async () => {
      const r = await deleteDoc(collection.id, slug, baseSha, collection.i18n ? locale : undefined);
      setResult(r);
      if (r.ok) setTimeout(onDone, 1200);
    });
  }

  if (loading) return <p className="py-20 text-center text-muted">{T("common.loading")}</p>;

  const generalErrors = result && !result.ok ? result.errors.filter((e) => e.field === "general") : [];

  return (
    <section style={{ transition: `opacity ${cssDur(DUR.reveal)} ${cssEase(EASE.out)}` }}>
      <div className="flex flex-wrap items-center gap-4">
        <button onClick={onDone} className="text-sm font-semibold text-gold-ink hover:underline" style={micro}>
          {T("editor.backTo", { label: collection.label })}
        </button>
        {file && (
          <button onClick={() => setConfirmOpen(true)} className="ms-auto text-sm font-semibold text-muted hover:text-ink" style={micro}>
            {T("editor.delete")}
          </button>
        )}
      </div>

      {confirmOpen && (
        <ConfirmDelete
          label={String(values.title ?? slug)}
          onHide={hideFromSite}
          onDeleteForever={deleteForever}
          onCancel={() => setConfirmOpen(false)}
        />
      )}

      <h1 className="mt-4 font-serif text-3xl font-black text-ink">
        {file ? T("editor.editVerb") : T("editor.createVerb")} {collection.labelSingular ?? collection.label}
      </h1>

      {rescue && (
        <div
          role="status"
          className="mt-6 rounded-[10px] border border-line bg-card p-5"
          style={{ transition: `border-color ${cssDur(DUR.micro)} ${cssEase(EASE.micro)}` }}
        >
          <p className="font-semibold text-ink">{T("editor.rescueTitle")}</p>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            {T("editor.rescueBody", {
              when: new Intl.DateTimeFormat(T("common.intlLocale"), { dateStyle: "short", timeStyle: "short" }).format(rescue.savedAt),
            })}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={restore}
              className="rounded-[4px] bg-ink px-5 py-2.5 text-sm font-bold text-bg transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              style={micro}
            >
              {T("editor.rescueRestore")}
            </button>
            <button
              type="button"
              onClick={discardRescue}
              className="rounded-[4px] border border-line px-5 py-2.5 text-sm font-bold text-ink transition-colors hover:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              style={micro}
            >
              {T("editor.rescueDiscard")}
            </button>
          </div>
        </div>
      )}

      {generalErrors.map((e, i) => (
        <p key={i} className="mt-6 rounded-[4px] border border-line bg-bg2 p-4 font-semibold text-ink">
          {e.msg}
        </p>
      ))}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <label className="block">
            <span className="text-sm font-semibold text-ink">{T("editor.bodyLabel")}</span>
            <span className="mt-1 block text-xs text-muted">
              {T("editor.bodyHint")}
            </span>
            <textarea
              ref={bodyRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={22}
              className={`${inputClass} leading-loose`}
            />
          </label>
          <InlineImageInserter onInsert={insertInBody} />
          {errorFor("body") && <p className="mt-2 text-sm font-semibold text-ink">{errorFor("body")}</p>}

          {preview && (
            <div className="mt-8">
              <span className="text-xs font-bold tracking-eyebrow text-gold-ink">{T("editor.preview")}</span>
              <div
                className="prose-rtl mt-3 rounded-[10px] border border-line bg-card p-6"
                dangerouslySetInnerHTML={{ __html: preview }}
              />
            </div>
          )}
        </div>

        <aside className="space-y-5">
          {collection.fields.map((f) => (
            <Field key={f.key} spec={f} value={values[f.key]} onChange={set} error={errorFor(f.key)} altError={errorFor(`${f.key}Alt`)} altValue={values[`${f.key}Alt`]} />
          ))}

          <label className="block">
            <span className="text-sm font-semibold text-ink">{T("editor.slugLabel")}</span>
            <span className="mt-1 block text-xs text-muted">{T("editor.slugHint")}</span>
            <input dir="ltr" value={slug} onChange={(e) => setSlug(e.target.value)} className={inputClass} />
            {errorFor("slug") && <p className="mt-2 text-sm font-semibold text-ink">{errorFor("slug")}</p>}
          </label>

          {collection.i18n && (
            <label className="block">
              <span className="text-sm font-semibold text-ink">{T("editor.localeLabel")}</span>
              <select value={locale} onChange={(e) => setLocale(e.target.value)} className={inputClass}>
                <option value="he">{T("editor.localeHe")}</option>
                <option value="en">{T("editor.localeEn")}</option>
              </select>
            </label>
          )}

          <PublishBar
            pending={pending}
            result={result}
            onDraft={() => submit(true)}
            onPublish={() => submit(false)}
          />
        </aside>
      </div>

      {file && (
        <HistoryPanel
          collectionId={collection.id}
          file={file}
          headSha={baseSha}
          onRestored={(r) => {
            setResult(r);
            if (r.ok) setTimeout(onDone, 1400);
          }}
        />
      )}
    </section>
  );
}

function Field({
  spec,
  value,
  altValue,
  onChange,
  error,
  altError,
}: {
  spec: FieldSpec;
  value: unknown;
  altValue: unknown;
  onChange: (k: string, v: unknown) => void;
  error?: string;
  altError?: string;
}) {
  const err = (m?: string) => m && <p className="mt-2 text-sm font-semibold text-ink">{m}</p>;

  if (spec.type === "image") {
    return (
      <div>
        <span className="text-sm font-semibold text-ink">{spec.label}</span>
        <MediaPicker
          url={typeof value === "string" ? value : ""}
          alt={typeof altValue === "string" ? altValue : ""}
          onChange={(url, alt) => {
            onChange(spec.key, url);
            onChange(`${spec.key}Alt`, alt);
          }}
        />
        {err(error)}
        {err(altError)}
      </div>
    );
  }

  if (spec.type === "gallery") {
    return (
      <div>
        <GalleryField
          label={spec.label}
          urls={Array.isArray(value) ? (value as string[]) : []}
          alts={Array.isArray(altValue) ? (altValue as string[]) : []}
          onChange={(urls, alts) => {
            onChange(spec.key, urls);
            onChange(`${spec.key}Alt`, alts);
          }}
        />
        {err(error)}
        {err(altError)}
      </div>
    );
  }

  if (spec.options?.length) {
    const list = Array.isArray(value) ? (value as string[]) : typeof value === "string" && value ? [value] : [];
    return (
      <ChipSelect
        label={spec.label}
        options={spec.options}
        value={list}
        single={spec.type !== "list"}
        max={spec.type === "list" ? spec.max : undefined}
        allowCustom
        onChange={(next) => onChange(spec.key, spec.type === "list" ? next : (next[0] ?? ""))}
        error={error}
      />
    );
  }

  if (spec.type === "list") {
    const items = Array.isArray(value) ? (value as string[]) : [];
    return (
      <label className="block">
        <span className="text-sm font-semibold text-ink">{spec.label}</span>
        <span className="mt-1 block text-xs text-muted">{T("editor.listHint")}</span>
        <textarea
          rows={4}
          value={items.join("\n")}
          onChange={(e) => onChange(spec.key, e.target.value.split("\n").map((s) => s.trim()).filter(Boolean))}
          className={inputClass}
        />
        {err(error)}
      </label>
    );
  }

  const type = spec.type === "date" ? "date" : "text";
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink">
        {spec.label}
        {spec.required && <span className="text-gold-ink"> *</span>}
      </span>
      {spec.type === "textarea" ? (
        <textarea rows={3} value={String(value ?? "")} onChange={(e) => onChange(spec.key, e.target.value)} className={inputClass} />
      ) : (
        <input type={type} value={String(value ?? "")} onChange={(e) => onChange(spec.key, e.target.value)} className={inputClass} />
      )}
      {err(error)}
    </label>
  );
}
