// sections/source.ts — where a page's section document is read from.
//
// TWO BACKENDS, ONE SHAPE. When NEXT_PUBLIC_SUPABASE_URL and the anon key are
// present the documents come from the `pages` table; until then they come from
// content/pages/*.json. The JSON files have the exact shape of a `pages.sections`
// value, so this is a change of source and not of meaning, and NOTHING else in
// the app knows which one answered.
//
// The fallback is not a development convenience — it is what keeps the site up
// if the database is unreachable. A brochure page that has not changed in a
// month should not go dark because a connection pooler hiccupped, so a failed
// query falls back to the file rather than throwing. The one thing that must
// NOT fall back is a write: a save that silently lands in a file while the
// editor believes it reached the database is worse than a save that fails.
//
// Two entry points, deliberately separate:
//   getPublishedPage()  cached, what visitors get, anon key, no session
//   getDraftPage()      uncached, what /preview renders, editor's session
//
// They are separate because `force-dynamic` does NOT bypass a cache wrapper. A
// preview built on the cached reader would quietly show stale content while
// claiming to be live, which is the one thing a preview must never do.

import { readFile } from "node:fs/promises";
import path from "node:path";
import type { PageDocument, SectionInstance } from "./schema";
import { publicClient, deskClient, supabaseConfigured } from "@/lib/supabase/client";

const PAGES_DIR = path.join(process.cwd(), "content", "pages");

/** '' is the home page; anything else is its slug. */
const fileFor = (slug: string) => path.join(PAGES_DIR, `${slug === "" ? "home" : slug}.json`);

async function fromFile(slug: string): Promise<PageDocument | null> {
  try {
    return JSON.parse(await readFile(fileFor(slug), "utf8")) as PageDocument;
  } catch {
    return null;
  }
}

type PageRow = {
  slug: string;
  title: string;
  description: string | null;
  sections: SectionInstance[];
  baseline_order: { id: string; type: string }[];
};

const toDoc = (r: PageRow): PageDocument => ({
  slug: r.slug,
  title: r.title,
  description: r.description ?? undefined,
  sections: r.sections ?? [],
  baseline_order: r.baseline_order ?? [],
});

/**
 * The raw published document, hidden entries still in place. Publish writes a
 * hidden section as a STUB (id + type, empty payload) precisely so this layer
 * can tell "deliberately hidden" from "document older than the code" — the
 * content itself never reaches the public row either way.
 */
async function rawPublishedPage(slug: string): Promise<PageDocument | null> {
  if (supabaseConfigured) {
    const { data, error } = await publicClient()
      .from("pages")
      .select("slug,title,description,sections,baseline_order")
      .eq("slug", slug)
      .eq("status", "published")
      .is("deleted_at", null)
      .maybeSingle();
    if (!error && data) return toDoc(data as PageRow);
    // a miss OR an error falls through to the file: the page stays up
  }
  return fromFile(slug);
}

const dropHidden = (doc: PageDocument): PageDocument => ({
  ...doc,
  sections: doc.sections.filter((s) => s.visible !== false),
});

/**
 * The public read. Hidden sections are stripped HERE as well as at publish
 * time — belt and braces, because the cost of the belt is one filter and the
 * cost of it being missing is unannounced copy on a live page.
 */
export async function getPublishedPage(slug: string): Promise<PageDocument | null> {
  const doc = await rawPublishedPage(slug);
  return doc ? dropHidden(doc) : null;
}

/**
 * The preview read: everything, including what is hidden. It reads what the
 * DESK would read — the drafts row first (the full working document), then the
 * published row, then the file. An earlier version read the pages table with
 * the browser's (empty) Supabase session, which meant role anon: the preview
 * silently rendered the PUBLISHED row while claiming to show the draft, and a
 * hidden section could never appear in it. The route this feeds is already
 * behind the cms_session check.
 */
export async function getDraftPage(slug: string): Promise<PageDocument | null> {
  if (supabaseConfigured) {
    const { data: row } = await publicClient()
      .from("pages")
      .select("id,slug,title,description,sections,baseline_order")
      .eq("slug", slug)
      .maybeSingle();
    if (row) {
      const sb = await deskClient();
      if (sb) {
        const { data: draft } = await sb
          .from("drafts")
          .select("payload")
          .eq("entity_type", "page")
          .eq("entity_id", row.id)
          .maybeSingle();
        if (draft?.payload) return draft.payload as PageDocument;
      }
      return toDoc(row as PageRow);
    }
  }
  return fromFile(slug);
}

/**
 * The public read for a page whose composition is art-directed around known
 * sections. Two different absences, two different answers:
 *
 *   - An id MISSING from the raw document means the document is OLDER than
 *     the code (a content round shipped in code before its update-pages.sql
 *     was pasted) — fall back to the SHIPPED file document, which is always
 *     the same generation as the code. Measured: the 2026-08 round-2 build
 *     crashed prerendering /about on a missing `road` before this existed.
 *
 *   - An id present as a hidden STUB means the editor hid it on purpose —
 *     honor it: the band is dropped and the page renders without it. (The
 *     first version of this fallback could not tell the two apart and
 *     resurrected the shipped copy over a deliberate hide.)
 *
 * Pages guard each band on its payload being present, so a dropped section
 * skips its band instead of crashing.
 */
export async function getPublishedPageRequiring(
  slug: string,
  knownIds: readonly string[],
): Promise<PageDocument | null> {
  const raw = await rawPublishedPage(slug);
  const has = (d: PageDocument, id: string) => d.sections.some((s) => s.id === id);
  if (raw && knownIds.every((id) => has(raw, id))) return dropHidden(raw);

  const shipped = await fromFile(slug);
  if (!shipped) return raw ? dropHidden(raw) : null;
  return dropHidden(shipped);
}

/**
 * One section by id, typed by the caller.
 *
 * Returns the payload only. A page component asks for what it renders and gets
 * a plain object — it never learns whether that came from a file, a table or a
 * cache, which is the whole reason swapping the backend is safe.
 */
export function sectionPayload<T>(doc: PageDocument | null, id: string): T | null {
  const found = doc?.sections.find((s) => s.id === id);
  return found ? (found.payload as T) : null;
}

export type { PageDocument, SectionInstance };
