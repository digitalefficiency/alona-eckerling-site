"use client";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { CollectionConfig } from "@/lib/cms/config";
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
import { emptyRecipeBody, parseRecipeBody, serializeRecipeBody, type RecipeBodyModel } from "@/lib/cms/recipe-body.mjs";
import { stationStatus, missingStations, STATION_ORDER, type StationId, type JourneyInput } from "@/lib/cms/journey-status.mjs";
import { suggestSlug } from "@/lib/cms/transliterate.mjs";
import { ConfirmDelete } from "@/components/admin/ConfirmDelete";
import { HistoryPanel } from "@/components/admin/HistoryPanel";
import { PublishBar } from "@/components/admin/PublishBar";
import { JourneyRail } from "@/components/admin/recipe/JourneyRail";
import { SeoCard } from "@/components/admin/recipe/SeoCard";
import {
  Station,
  DishStation,
  StoryStation,
  IngredientsStation,
  StepsStation,
  ImageExtrasStation,
  CatalogStation,
} from "@/components/admin/recipe/stations";
import { T } from "@/lib/cms/desk-strings";

type Values = Record<string, unknown>;

const LOCALE = "he";
const micro = { transitionDuration: cssDur(DUR.micro), transitionTimingFunction: cssEase(EASE.micro) };

// A server error's `field` maps to the station that owns it, so the rail can
// paint an "!" on exactly the station that needs attention.
const FIELD_STATION: Record<string, StationId> = {
  title: "dish", prepTime: "dish", servings: "dish",
  body: "story",
  image: "image", imageAlt: "image",
  category: "catalog", tags: "catalog", date: "catalog",
  description: "publish", slug: "publish",
};

export function RecipeJourney({ collection, file, onDone }: { collection: CollectionConfig; file?: string; onDone: () => void }) {
  const [values, setValues] = useState<Values>(file ? {} : { date: new Date().toISOString().slice(0, 10) });
  const [model, setModel] = useState<RecipeBodyModel>(emptyRecipeBody());
  const [slug, setSlug] = useState("");
  const [baseSha, setBaseSha] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(file));
  const [result, setResult] = useState<ActionResult | null>(null);
  const [preview, setPreview] = useState("");
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [active, setActive] = useState<StationId>(STATION_ORDER[0]);

  // The document as the server handed it to us, in CANONICAL body form so a
  // cosmetic markdown difference (bullet glyph, numbering) never reads as an edit.
  const loadedRef = useRef<Loaded | null>(null);
  const [rescue, setRescue] = useState<ReturnType<typeof parseSnapshot>>(null);
  const key = autosaveKey(collection.id, file);

  const body = useMemo(() => serializeRecipeBody(model), [model]);

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
        const canonicalBody = serializeRecipeBody(parseRecipeBody(r.body.trim()));
        const loaded: Loaded = {
          values: rest,
          body: canonicalBody,
          slug: String(s ?? file.replace(/\.(\w{2}\.)?md$/, "")),
          locale: LOCALE,
        };
        loadedRef.current = loaded;
        setValues(loaded.values);
        setModel(parseRecipeBody(r.body.trim()));
        setSlug(loaded.slug);
        // "" = read from the local working tree (no GitHub token, i.e. `next dev`).
        // Send null so the save is treated as a create rather than a stale-sha conflict.
        setBaseSha(r.sha || null);
        if (shouldOfferRestore(cached, loaded)) setRescue(cached);
      }
      setLoading(false);
    });
  }, [collection.id, file, key]);

  // Autosave mirror: every edit reaches localStorage within ~600ms, so a crashed
  // tab or a mis-clicked back button never destroys unsaved work.
  useEffect(() => {
    if (loading || typeof window === "undefined") return;
    const t = setTimeout(() => {
      if (isDirty({ values, body, slug, locale: LOCALE }, loadedRef.current)) {
        localStorage.setItem(key, serializeSnapshot({ values, body, slug, locale: LOCALE }, Date.now()));
      } else {
        localStorage.removeItem(key);
      }
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [values, body, slug, loading, key]);

  // Desktop courtesy: warn on close/refresh with unsaved work.
  useEffect(() => {
    const guard = (e: BeforeUnloadEvent) => {
      if (isDirty({ values, body, slug, locale: LOCALE }, loadedRef.current)) e.preventDefault();
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [values, body, slug]);

  // Preview renders through the published site's own sanitizer — one renderer,
  // so a preview can never show what production would strip.
  useEffect(() => {
    const t = setTimeout(() => {
      if (body.trim()) previewMarkdown(body).then(setPreview).catch(() => setPreview(""));
    }, 400);
    return () => clearTimeout(t);
  }, [body]);

  // Scrollspy: the active station is the last one whose top crossed the header line.
  useEffect(() => {
    if (typeof window === "undefined") return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        let next: StationId = STATION_ORDER[0];
        for (const id of STATION_ORDER) {
          const el = document.getElementById(`station-${id}`);
          if (el && el.getBoundingClientRect().top <= 140) next = id;
        }
        setActive(next);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => { window.removeEventListener("scroll", onScroll); if (raf) cancelAnimationFrame(raf); };
  }, [loading]);

  const set = (k: string, v: unknown) => setValues((p) => ({ ...p, [k]: v }));
  const errorFor = (field: string) =>
    result && !result.ok ? result.errors.find((e) => e.field === field)?.msg : undefined;

  const slugPlaceholder = suggestSlug(String(values.title ?? ""));
  const effectiveSlug = slug.trim() || slugPlaceholder || `recipe-${String(values.date ?? "")}`;

  const input: JourneyInput = {
    title: String(values.title ?? ""),
    prepTime: String(values.prepTime ?? ""),
    intro: model.intro,
    ingredients: model.ingredients,
    steps: model.steps,
    image: String(values.image ?? ""),
    imageAlt: String(values.imageAlt ?? ""),
    category: String(values.category ?? ""),
    tags: Array.isArray(values.tags) ? (values.tags as string[]) : [],
    date: String(values.date ?? ""),
    description: String(values.description ?? ""),
    slug: slug.trim() || slugPlaceholder,
    isNew: !file,
  };
  const status = stationStatus(input);
  const missing = missingStations(input);
  const errors = new Set(
    (result && !result.ok ? result.errors : [])
      .map((e) => FIELD_STATION[e.field])
      .filter(Boolean) as StationId[],
  );

  function submit(draft: boolean) {
    setResult(null);
    startTransition(async () => {
      const r = await saveDoc({
        collectionId: collection.id,
        slug: effectiveSlug,
        locale: collection.i18n ? LOCALE : undefined,
        frontmatter: values,
        body,
        draft,
        baseSha,
      });
      setResult(r);
      if (r.ok) {
        loadedRef.current = { values, body, slug, locale: LOCALE };
        localStorage.removeItem(key);
        setRescue(null);
      }
    });
  }

  function restore() {
    if (!rescue) return;
    setValues(rescue.values);
    setModel(parseRecipeBody(rescue.body));
    setSlug(rescue.slug);
    setRescue(null);
  }

  function discardRescue() {
    localStorage.removeItem(key);
    setRescue(null);
  }

  // Two-tier delete, both routed through ConfirmDelete (never window.confirm).
  function hideFromSite() {
    setConfirmOpen(false);
    startTransition(async () => {
      const r = await setDocVisibility(collection.id, slug, true, baseSha, collection.i18n ? LOCALE : undefined);
      setResult(r);
      if (r.ok) setTimeout(onDone, 1200);
    });
  }
  function deleteForever() {
    setConfirmOpen(false);
    if (!file || baseSha === null) return;
    startTransition(async () => {
      const r = await deleteDoc(collection.id, slug, baseSha, collection.i18n ? LOCALE : undefined);
      setResult(r);
      if (r.ok) setTimeout(onDone, 1200);
    });
  }

  const onJump = (id: StationId) =>
    document.getElementById(`station-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });

  const onInsertExtra = (markdown: string) => {
    setModel((m) => ({ ...m, extra: m.extra ? `${m.extra}\n\n${markdown}` : markdown }));
    setAdvancedOpen(true);
  };

  if (loading) return <p className="py-20 text-center text-muted">{T("common.loading")}</p>;

  const generalErrors = result && !result.ok ? result.errors.filter((e) => e.field === "general") : [];
  const metaLine = [values.category, values.prepTime, values.servings]
    .map((x) => String(x ?? "").trim())
    .filter(Boolean)
    .join(" · ");

  const stationContent = (id: StationId) => {
    switch (id) {
      case "dish":
        return (
          <DishStation
            collection={collection}
            title={String(values.title ?? "")}
            prepTime={String(values.prepTime ?? "")}
            servings={String(values.servings ?? "")}
            onSet={set}
            errorFor={errorFor}
          />
        );
      case "story":
        return (
          <StoryStation
            intro={model.intro}
            onChange={(v) => setModel((m) => ({ ...m, intro: v }))}
            error={errorFor("body")}
          />
        );
      case "ingredients":
        return (
          <IngredientsStation
            items={model.ingredients}
            onChange={(items) => setModel((m) => ({ ...m, ingredients: items }))}
          />
        );
      case "steps":
        return (
          <StepsStation
            items={model.steps}
            onChange={(items) => setModel((m) => ({ ...m, steps: items }))}
          />
        );
      case "image":
        return (
          <ImageExtrasStation
            collection={collection}
            image={String(values.image ?? "")}
            imageAlt={String(values.imageAlt ?? "")}
            tip={model.tip}
            extra={model.extra}
            advancedOpen={advancedOpen}
            onImage={(url, alt) => { set("image", url); set("imageAlt", alt); }}
            onTip={(v) => setModel((m) => ({ ...m, tip: v }))}
            onExtra={(v) => setModel((m) => ({ ...m, extra: v }))}
            onToggleAdvanced={() => setAdvancedOpen((o) => !o)}
            onInsertExtra={onInsertExtra}
            errorFor={errorFor}
          />
        );
      case "catalog":
        return (
          <CatalogStation
            collection={collection}
            category={String(values.category ?? "")}
            tags={Array.isArray(values.tags) ? (values.tags as string[]) : []}
            date={String(values.date ?? "")}
            onSet={set}
            errorFor={errorFor}
          />
        );
      case "publish":
        return (
          <div className="space-y-6">
            <SeoCard
              title={String(values.title ?? "")}
              description={String(values.description ?? "")}
              slug={slug}
              isNew={!file}
              slugPlaceholder={slugPlaceholder}
              onDescription={(v) => set("description", v)}
              onSlug={(v) => setSlug(v)}
              errorFor={errorFor}
            />

            {preview && (
              <div>
                <span className="text-xs font-bold tracking-[.2em] text-gold-ink">{T("journey.preview.title")}</span>
                <div className="prose-rtl mt-3 rounded-[10px] border border-line bg-card p-6">
                  <h2 className="font-serif text-2xl font-black text-ink">{String(values.title ?? "…")}</h2>
                  {metaLine && <p className="mt-1 text-sm text-muted">{metaLine}</p>}
                  <div className="mt-4" dangerouslySetInnerHTML={{ __html: preview }} />
                </div>
              </div>
            )}

            {missing.length > 0 && (
              <div className="rounded-[10px] border border-line bg-bg2 p-5">
                <p className="text-sm font-semibold text-ink">{T("journey.missing.title")}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {missing.map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => onJump(id)}
                      className="rounded-full border border-line px-4 py-1.5 text-sm font-semibold text-ink transition-colors hover:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                      style={micro}
                    >
                      {T(`journey.st.${id}`)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <PublishBar
              pending={pending}
              result={result}
              onDraft={() => submit(true)}
              onPublish={() => submit(false)}
            />

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
          </div>
        );
    }
  };

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

      <div className="mt-8 lg:grid lg:grid-cols-[220px_1fr] lg:gap-10">
        <aside className="sticky top-0 z-10 -mx-6 bg-sand/95 px-6 py-2 backdrop-blur lg:static lg:m-0 lg:self-start lg:bg-transparent lg:p-0 lg:top-24 lg:sticky">
          <JourneyRail status={status} errors={errors} active={active} onJump={onJump} />
        </aside>

        <div className="mt-6 space-y-6 lg:mt-0">
          {STATION_ORDER.map((id, i) => (
            <Station key={id} id={id} index={i + 1} done={status[id]}>
              {stationContent(id)}
            </Station>
          ))}
        </div>
      </div>
    </section>
  );
}
