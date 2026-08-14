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
 * The public read. Hidden sections are stripped HERE as well as at publish
 * time — belt and braces, because the cost of the belt is one filter and the
 * cost of it being missing is unannounced copy on a live page.
 */
export async function getPublishedPage(slug: string): Promise<PageDocument | null> {
  let doc: PageDocument | null = null;

  if (supabaseConfigured) {
    const { data, error } = await publicClient()
      .from("pages")
      .select("slug,title,description,sections,baseline_order")
      .eq("slug", slug)
      .eq("status", "published")
      .is("deleted_at", null)
      .maybeSingle();
    if (!error && data) doc = toDoc(data as PageRow);
    // a miss OR an error falls through to the file: the page stays up
  }

  doc ??= await fromFile(slug);
  if (!doc) return null;
  return { ...doc, sections: doc.sections.filter((s) => s.visible !== false) };
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
 * The public read for a page whose composition NEEDS certain sections.
 *
 * The four core pages dereference their structural sections without null
 * checks — the composition is one piece, art-directed in code. That is fine
 * until the database document is OLDER than the code (a content round shipped
 * in code before its update-pages.sql was pasted): the DB row then lacks a
 * section the code requires, and prerender dies on a null — measured, the
 * 2026-08 round-2 build crashed exactly this way on about's `road`.
 *
 * So: if the published document is missing any required section, fall back to
 * the SHIPPED file document, which is always the same generation as the code.
 * The page renders the newest complete content and never crashes; the moment
 * the DB catches up, the fallback goes dormant.
 *
 * Known limit, deliberate for now: deliberately HIDING one of these
 * structural sections from the desk trips the same fallback and resurrects
 * the shipped copy. Per-band null-guards are the real answer; until then the
 * desk's hide-eye is for the optional bands, and a hidden structural band
 * shows shipped content rather than a crashed page.
 */
export async function getPublishedPageRequiring(
  slug: string,
  requiredIds: readonly string[],
): Promise<PageDocument | null> {
  const doc = await getPublishedPage(slug);
  const has = (d: PageDocument, id: string) => d.sections.some((s) => s.id === id);
  if (doc && requiredIds.every((id) => has(doc, id))) return doc;

  const shipped = await fromFile(slug);
  if (!shipped) return doc;
  return { ...shipped, sections: shipped.sections.filter((s) => s.visible !== false) };
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
