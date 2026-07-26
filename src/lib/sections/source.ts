// sections/source.ts — where a page's section document is read from.
//
// TODAY it is a JSON file in content/pages/. ON MONDAY it is the `pages` table
// in Supabase. The point of this module is that NOTHING ELSE has to know: the
// document shape here is byte-for-byte the shape of a `pages.sections` value,
// so the swap is a change of one function body, not a rewrite of the pages.
//
// Two entry points, deliberately separate, mirroring what the published/draft
// split will need:
//
//   getPublishedPage()  cached, what visitors get
//   getDraftPage()      uncached, what /preview renders
//
// They are separated NOW rather than later because `force-dynamic` does not
// bypass a cache wrapper — a preview built on the cached reader would quietly
// show stale content while claiming to be live, which is the one thing a
// preview must never do.

import { readFile } from "node:fs/promises";
import path from "node:path";
import type { PageDocument, SectionInstance } from "./schema";

const PAGES_DIR = path.join(process.cwd(), "content", "pages");

/** '' is the home page; anything else is its slug. */
const fileFor = (slug: string) => path.join(PAGES_DIR, `${slug === "" ? "home" : slug}.json`);

async function read(slug: string): Promise<PageDocument | null> {
  try {
    return JSON.parse(await readFile(fileFor(slug), "utf8")) as PageDocument;
  } catch {
    return null;
  }
}

/**
 * The public read. Hidden sections are stripped HERE as well as at publish
 * time — belt and braces, because the cost of the belt is one filter and the
 * cost of it being missing is unannounced copy on a live page.
 */
export async function getPublishedPage(slug: string): Promise<PageDocument | null> {
  const doc = await read(slug);
  if (!doc) return null;
  return { ...doc, sections: doc.sections.filter((s) => s.visible !== false) };
}

/** The preview read: everything, including what is hidden. */
export async function getDraftPage(slug: string): Promise<PageDocument | null> {
  return read(slug);
}

/**
 * One section by id, typed by the caller.
 *
 * Returns the payload only. A page component asks for what it renders and gets
 * a plain object — it never learns whether that came from a file, a table or a
 * cache, which is the whole reason the swap on Monday is safe.
 */
export function sectionPayload<T>(doc: PageDocument | null, id: string): T | null {
  const found = doc?.sections.find((s) => s.id === id);
  return found ? (found.payload as T) : null;
}

export type { PageDocument, SectionInstance };
