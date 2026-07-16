// read.ts — the admin's READ path. Deliberately not lib/collections.ts (which
// reads the local filesystem at build time): after a publish, the deployment that
// serves /admin is still one build behind, so listing from disk would show the
// client a stale library and hand the editor a stale blob sha. The repo HEAD, via
// the GitHub API, is the single source of truth. Drafts ARE listed here (they are
// invisible only to the public site).
//
// Without a token (i.e. `next dev` on the owner's machine) it falls back to the
// working tree, so the desk is inspectable locally. That path returns no blob sha,
// so a save from it is treated as a new file — which is exactly right offline.
import fs from "node:fs";
import path from "node:path";
import { parseSimpleFrontmatter } from "@/lib/cms/validate.mjs";
import type { CollectionConfig } from "@/lib/cms/config";
import { getFile, isConfigured, listDir } from "@/lib/cms/github";

export type AdminDoc = {
  slug: string;
  locale?: string;
  file: string;
  title: string;
  date: string;
  draft: boolean;
  sha: string;
};

export type AdminCollection = { id: string; docs: AdminDoc[]; error?: string };

function toDoc(c: CollectionConfig, name: string, text: string, sha: string): AdminDoc | null {
  let base = name.replace(/\.md$/, "");
  let locale: string | undefined;
  if (c.i18n) {
    const m = /^(.+)\.([a-z]{2})$/.exec(base);
    if (!m) return null;
    base = m[1];
    locale = m[2];
  }
  const { data } = parseSimpleFrontmatter(text);
  return {
    slug: String(data.slug ?? base),
    locale,
    file: name,
    title: String(data.title ?? base),
    date: String(data.date ?? ""),
    draft: data.draft === true,
    sha,
  };
}

const localDir = (c: CollectionConfig) => path.join(process.cwd(), "content", c.id);

export async function listAdminDocs(c: CollectionConfig): Promise<AdminCollection> {
  if (!isConfigured()) {
    const dir = localDir(c);
    if (!fs.existsSync(dir)) return { id: c.id, docs: [], error: "unconfigured" };
    const docs = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".md"))
      .map((f) => toDoc(c, f, fs.readFileSync(path.join(dir, f), "utf8"), ""))
      .filter((d): d is AdminDoc => d !== null)
      .sort((a, b) => (a.date < b.date ? 1 : -1));
    return { id: c.id, docs, error: "unconfigured" };
  }
  try {
    const entries = await listDir(`content/${c.id}`);
    const docs: AdminDoc[] = [];
    for (const e of entries) {
      if (!e.name.endsWith(".md")) continue;
      const file = await getFile(`content/${c.id}/${e.name}`);
      const doc = toDoc(c, e.name, file?.text ?? "", e.sha);
      if (doc) docs.push(doc);
    }
    docs.sort((a, b) => (a.date < b.date ? 1 : -1));
    return { id: c.id, docs };
  } catch {
    return { id: c.id, docs: [], error: "unreachable" };
  }
}

export async function readAdminDoc(c: CollectionConfig, file: string) {
  if (!isConfigured()) {
    const p = path.join(localDir(c), file);
    if (!fs.existsSync(p)) return null;
    const { data, body } = parseSimpleFrontmatter(fs.readFileSync(p, "utf8"));
    return { data, body, sha: "" };
  }
  const f = await getFile(`content/${c.id}/${file}`);
  if (!f) return null;
  const { data, body } = parseSimpleFrontmatter(f.text);
  return { data, body, sha: f.sha };
}
