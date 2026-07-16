// ============================================================================
// CMS CONFIG — the content-collections substrate (OPT-IN, config-driven).
// Mirrors the i18n pattern: `content/cms/collections.json` ships EMPTY, so the
// whole substrate (lib/collections, app/[collection] routes, lint-content) is
// dormant. Adding a collection activates loader + routes + sitemap + gate —
// no page rewrite, no new code. See references/cms.md for the activation recipe.
//
// The config is JSON (not TS) on purpose: it is read by Next (this import),
// by the zero-dep gate scripts/lint-content.mjs, and by the admin addon —
// one file, one source of truth, no drift.
// ============================================================================
import raw from "../../../content/cms/collections.json";

export type CmsFieldType = "text" | "textarea" | "date" | "list" | "image" | "boolean" | "gallery";

export type FieldSpec = {
  key: string; // frontmatter key
  type: CmsFieldType;
  label: string; // Hebrew label shown in the admin form
  required?: boolean;
  min?: number; // min length (text) / min items (list, gallery)
  max?: number; // max length (text) / max items (list, gallery)
  requiredAlt?: boolean; // image fields: alt text is mandatory
  // A "gallery" field stores TWO parallel string lists: <key> (the /media/ urls) and
  // <key>Alt (the descriptions), paired by index — the tags shape, so it round-trips
  // through gray-matter cleanly (see lib/cms/frontmatter-normalize.mjs). Alt is always
  // required per image; there is no requiredAlt toggle for a gallery.
};

export type CollectionConfig = {
  id: string; // URL segment + content/<id>/ directory — [a-z0-9-] only
  label: string; // plural Hebrew label ("בלוג", "מתכונים")
  labelSingular?: string; // ("פוסט", "מתכון")
  description?: string; // index-page lead paragraph
  i18n?: boolean; // true → entries are <slug>.<locale>.md pairs (one slug, N locales)
  fields: FieldSpec[];
  body?: { minWords?: number; maxWords?: number };
};

export type CmsConfig = {
  // "direct": the client publishes and it goes live. "approval": every publish
  // opens a PR and waits for the owner — the YMYL default (law/medical verticals).
  mode: "direct" | "approval";
  collections: CollectionConfig[];
};

export const cms = raw as unknown as CmsConfig;
export const collections: readonly CollectionConfig[] = cms.collections;
export const isCmsActive = collections.length > 0;

export function getCollection(id: string): CollectionConfig | undefined {
  return collections.find((c) => c.id === id);
}
