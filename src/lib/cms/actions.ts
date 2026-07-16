"use server";
// ============================================================================
// actions.ts — every write the client can perform. Each action, in order:
//   1. requires a valid session (the allowlist is re-checked inside verify);
//   2. resolves the collection from collections.json (never trusts a raw id);
//   3. runs validateDoc — the SAME module the lint-content gate + the CI workflow
//      run, so the publish button and the rail can never disagree;
//   4. builds the repo path through safe-path.mjs (the traversal boundary);
//   5. commits atomically (post + images in one commit).
// Returns localized, field-anchored errors — never a raw exception string. Result
// messages render through T(brand.lang) (the desk-strings bridge), so this file
// carries NO Hebrew literal: even the git commit messages are neutralized to ascii,
// which is what lets the glyph-leak gate (lint-admin #9) need no per-line allowlist.
// ============================================================================
import { cookies } from "next/headers";
import { brand } from "@/brand.config";
import { cms, getCollection, type CollectionConfig } from "@/lib/cms/config";
import { renderMarkdown } from "@/lib/content";
import { readAdminDoc } from "@/lib/cms/read";
import { settingsSchema } from "@/lib/cms/settings-schema";
import { T } from "@/lib/cms/desk-strings";
import {
  parseSimpleFrontmatter,
  serializeFrontmatter,
  validateDoc,
  validateSettings,
  type ContentError,
} from "@/lib/cms/validate.mjs";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/cms/session";
import {
  MAX_IMAGE_BYTES,
  UnsafePathError,
  docPath,
  publicUrlFor,
  settingsPath,
  sniffImage,
  uploadPath,
} from "@/lib/cms/safe-path.mjs";
import {
  ConflictError,
  commitFiles,
  commitToNewBranchAndOpenPr,
  getCommitHistory,
  getFile,
  getFileAt,
  listDir,
  type Commit,
  type RepoFile,
} from "@/lib/cms/github";
import { checkRestore } from "@/lib/cms/restore-core.mjs";

// `kind` is what actually happened, and the UI must read it before it says anything.
// Without it a saved DRAFT is indistinguishable from a published post (both return a
// commit sha), and the desk would eventually announce "פורסם ✓ הפוסט חי באתר" over a
// draft that is deliberately excluded from the site — the exact class of lie this
// verification loop exists to prevent.
export type ActionKind = "publish" | "draft" | "delete" | "settings" | "media";

export type ActionResult =
  | { ok: true; kind: ActionKind; sha?: string; url?: string; prUrl?: string; message: string }
  | { ok: false; errors: ContentError[] };

// "general" (ascii) is the field sentinel for a non-field-anchored error; the admin
// components filter on it, so it must not be a Hebrew literal that leaks into the TSX.
const fail = (msg: string, field = "general", file = ""): ActionResult => ({ ok: false, errors: [{ file, field, msg }] });

async function requireSession(): Promise<string> {
  const jar = await cookies();
  const email = verifySessionToken(jar.get(SESSION_COOKIE)?.value);
  if (!email) throw new Error("unauthorized");
  return email;
}

function resolveCollection(id: unknown): CollectionConfig {
  const c = typeof id === "string" ? getCollection(id) : undefined;
  if (!c) throw new UnsafePathError("unknown collection");
  return c;
}

// Open an existing entry for editing. Reads repo HEAD (never the stale deployment
// filesystem) and returns the blob sha the editor must send back on save — the
// optimistic-concurrency handle that turns a concurrent edit into a clear message
// instead of a silent overwrite.
export async function fetchDoc(
  collectionId: string,
  file: string,
): Promise<{ ok: true; data: Record<string, unknown>; body: string; sha: string } | { ok: false }> {
  try {
    await requireSession();
    const c = resolveCollection(collectionId);
    if (!/^[a-z0-9][a-z0-9.-]{0,90}\.md$/.test(file)) return { ok: false };
    const doc = await readAdminDoc(c, file);
    return doc ? { ok: true, ...doc } : { ok: false };
  } catch {
    return { ok: false };
  }
}

// The editor's live preview renders through the SAME sanitizing markdown pipeline
// the published page uses (lib/content renderMarkdown) — so what the client sees
// is what ships, and a preview can never be more permissive than production.
export async function previewMarkdown(body: string): Promise<string> {
  await requireSession();
  return renderMarkdown(body.slice(0, 100_000));
}

export type DocInput = {
  collectionId: string;
  slug: string;
  locale?: string;
  frontmatter: Record<string, unknown>;
  body: string;
  draft: boolean;
  baseSha: string | null; // the blob sha the editor opened; null for a new file
};

function buildDoc(c: CollectionConfig, input: DocInput): { path: string; content: string; errors: ContentError[] } {
  const locale = c.i18n ? (input.locale ?? "he") : undefined;
  const path = docPath(c.id, input.slug, locale);
  const data: Record<string, unknown> = { ...input.frontmatter, slug: input.slug };
  if (input.draft) data.draft = true;
  else delete data.draft;
  const errors = validateDoc(c, data, input.body, path, { locale: brand.lang });
  return { path, content: serializeFrontmatter(data) + "\n" + input.body.trimEnd() + "\n", errors };
}

// Save = publish. There is no separate "save" state: a draft IS a published file
// carrying `draft: true`, invisible to the site (excluded from lists, params and
// sitemap) but committed, so nothing the client wrote can ever be lost in a tab.
export async function saveDoc(input: DocInput): Promise<ActionResult> {
  let email: string;
  try {
    email = await requireSession();
  } catch {
    return fail(T("action.sessionExpired"));
  }

  let built: ReturnType<typeof buildDoc>;
  let c: CollectionConfig;
  try {
    c = resolveCollection(input.collectionId);
    built = buildDoc(c, input);
  } catch (e) {
    if (e instanceof UnsafePathError) {
      return fail(T("action.badSlug"), "slug");
    }
    throw e;
  }
  if (built.errors.length) return { ok: false, errors: built.errors };

  const files: RepoFile[] = [{ path: built.path, content: built.content }];
  // Commit messages are ascii (repo-technical, not client UI) so the glyph gate stays clean.
  const verb = input.draft ? "draft" : "publish";
  const message = `cms: ${verb} · ${c.id}/${input.slug} (${email})`;

  try {
    if (cms.mode === "approval" && !input.draft) {
      const { prUrl } = await commitToNewBranchAndOpenPr({
        branchName: `cms/${c.id}-${input.slug}`,
        message,
        files,
        prTitle: `[CMS] ${String(input.frontmatter.title ?? input.slug)}`,
        prBody: T("action.prBody", { email }),
      });
      return { ok: true, kind: "publish", prUrl, message: T("action.pendingApprovalResult") };
    }
    const { sha, url } = await commitFiles({
      message,
      files,
      expect: { [built.path]: input.baseSha },
    });
    return {
      ok: true,
      kind: input.draft ? "draft" : "publish",
      sha,
      url,
      message: input.draft ? T("action.draftSaved") : T("action.published"),
    };
  } catch (e) {
    if (e instanceof ConflictError) {
      return fail(T("action.conflict"));
    }
    return fail(T("action.publishFailed"));
  }
}

// PERMANENT delete. `baseSha` is REQUIRED (not optional) — a compile-time
// concurrency guard: tsc forces every caller to pass the sha it opened, so a hard
// delete can never silently clobber a concurrent edit; a stale sha becomes a
// ConflictError. This is the "tier two" of the two-tier model — tier one (remove
// from site) is setDocVisibility(hidden:true), an ordinary reversible draft flip.
export async function deleteDoc(
  collectionId: string,
  slug: string,
  baseSha: string,
  locale?: string,
): Promise<ActionResult> {
  try {
    const email = await requireSession();
    const c = resolveCollection(collectionId);
    const path = docPath(c.id, slug, c.i18n ? (locale ?? "he") : undefined);
    const { sha } = await commitFiles({
      message: `cms: delete · ${c.id}/${slug} (${email})`,
      files: [],
      deletions: [path],
      expect: { [path]: baseSha },
    });
    return { ok: true, kind: "delete", sha, message: T("action.deleted") };
  } catch (e) {
    if (e instanceof ConflictError) return fail(T("action.conflict"));
    if (e instanceof UnsafePathError) return fail(T("action.badPath"));
    return fail(T("action.deleteFailed"));
  }
}

// The ONE going-live commit path. Any transition that makes content LIVE — a
// publish, an UNHIDE, a RESTORE-to-live — must route through here, so a YMYL
// (approval-mode) site opens a review PR for ALL of them, never just saveDoc. A
// direct commit (expect-guarded) is used in "direct" mode and for taking content
// DOWN (which never needs review). Returns kind:"publish" so PublishBar verifies
// liveness — a restore/unhide that silently skipped the poll would imply "live"
// without confirming it.
async function commitGoingLive(opts: {
  c: CollectionConfig;
  slug: string;
  path: string;
  content: string;
  expectSha: string | null;
  email: string;
  title: string;
}): Promise<ActionResult> {
  const { c, slug, path, content, expectSha, email, title } = opts;
  const message = `cms: publish · ${c.id}/${slug} (${email})`;
  if (cms.mode === "approval") {
    const { prUrl } = await commitToNewBranchAndOpenPr({
      branchName: `cms/${c.id}-${slug}`,
      message,
      files: [{ path, content }],
      prTitle: `[CMS] ${title}`,
      prBody: T("action.prBody", { email }),
    });
    return { ok: true, kind: "publish", prUrl, message: T("action.pendingApprovalResult") };
  }
  const { sha, url } = await commitFiles({ message, files: [{ path, content }], expect: { [path]: expectSha } });
  return { ok: true, kind: "publish", sha, url, message: T("action.published") };
}

// Tier-one delete + its inverse: hide (draft:true) removes a post from the site
// reversibly; unhide (draft:false) puts it back. Taking DOWN is a direct commit;
// putting UP is a going-live transition (PR in approval mode). Reads the current
// bytes so the flip preserves everything else verbatim.
export async function setDocVisibility(
  collectionId: string,
  slug: string,
  hidden: boolean,
  baseSha: string | null,
  locale?: string,
): Promise<ActionResult> {
  try {
    const email = await requireSession();
    const c = resolveCollection(collectionId);
    const loc = c.i18n ? (locale ?? "he") : undefined;
    const path = docPath(c.id, slug, loc);
    const cur = await getFile(path);
    if (!cur) return fail(T("action.deleteFailed"));
    const { data, body } = parseSimpleFrontmatter(cur.text);
    if (hidden) data.draft = true;
    else delete data.draft;
    const content = serializeFrontmatter(data) + "\n" + String(body).trimEnd() + "\n";
    const expectSha = baseSha ?? cur.sha;
    if (hidden) {
      const { sha } = await commitFiles({
        message: `cms: hide · ${c.id}/${slug} (${email})`,
        files: [{ path, content }],
        expect: { [path]: expectSha },
      });
      return { ok: true, kind: "draft", sha, message: T("action.hidden") };
    }
    return await commitGoingLive({ c, slug, path, content, expectSha, email, title: String(data.title ?? slug) });
  } catch (e) {
    if (e instanceof ConflictError) return fail(T("action.conflict"));
    if (e instanceof UnsafePathError) return fail(T("action.badPath"));
    return fail(T("action.deleteFailed"));
  }
}

// The version list for a doc (newest first) — draws with zero blob reads. `file` is
// the on-disk filename (from the admin list), so a DELETED post's history still
// resolves (the commits endpoint accepts a path absent at HEAD).
export async function fetchHistory(collectionId: string, file: string): Promise<Commit[]> {
  try {
    await requireSession();
    const c = resolveCollection(collectionId);
    if (!/^[a-z0-9][a-z0-9.-]{0,90}\.md$/.test(file)) return [];
    return await getCommitHistory(`content/${c.id}/${file}`);
  } catch {
    return [];
  }
}

// The bytes of one historical version — loaded lazily, only when the client opens
// "view this version". Returns the raw text so the editor can preview it.
export async function fetchVersion(collectionId: string, file: string, sha: string): Promise<{ ok: true; text: string } | { ok: false }> {
  try {
    await requireSession();
    const c = resolveCollection(collectionId);
    if (!/^[a-z0-9][a-z0-9.-]{0,90}\.md$/.test(file) || !/^[0-9a-f]{7,40}$/i.test(sha)) return { ok: false };
    const f = await getFileAt(`content/${c.id}/${file}`, sha);
    return f ? { ok: true, text: f.text } : { ok: false };
  } catch {
    return { ok: false };
  }
}

// Restore a historical version. Forward-only and byte-lossless: read the bytes at
// `sha`, RE-VALIDATE them against today's rules (checkRestore — an old version that
// violates a since-added rule, or carries a frontmatter line gray-matter would
// swallow to {}, is BLOCKED, never shipped to a page that renders titleless), then
// commit the VERBATIM bytes on top of the FRESH HEAD (a plain append-only commit,
// never a force-push). Going live routes through commitGoingLive → PR in approval
// mode, returns kind:"publish" so liveness is verified.
export async function restoreVersion(
  collectionId: string,
  file: string,
  sha: string,
  headSha: string | null,
): Promise<ActionResult> {
  try {
    const email = await requireSession();
    const c = resolveCollection(collectionId);
    if (!/^[a-z0-9][a-z0-9.-]{0,90}\.md$/.test(file) || !/^[0-9a-f]{7,40}$/i.test(sha)) return fail(T("action.badPath"));
    const old = await getFileAt(`content/${c.id}/${file}`, sha);
    if (!old) return fail(T("action.restoreFailed"));

    const gate = checkRestore(old.text, c, { locale: brand.lang, file });
    if (!gate.ok) return { ok: false, errors: gate.errors };

    const path = `content/${c.id}/${file}`;
    const { data } = parseSimpleFrontmatter(old.text);
    // If the restored version is itself a draft, it does NOT go live — a direct
    // hide-style commit; otherwise it is a going-live transition.
    if (data.draft === true) {
      const { sha: newSha } = await commitFiles({
        message: `cms: restore(draft) · ${c.id}/${file} (${email})`,
        files: [{ path, content: old.text }],
        expect: { [path]: headSha },
      });
      return { ok: true, kind: "draft", sha: newSha, message: T("action.restoredDraft") };
    }
    return await commitGoingLive({
      c,
      slug: String(data.slug ?? file.replace(/\.(\w{2}\.)?md$/, "")),
      path,
      content: old.text,
      expectSha: headSha,
      email,
      title: String(data.title ?? file),
    });
  } catch (e) {
    if (e instanceof ConflictError) return fail(T("action.conflict"));
    if (e instanceof UnsafePathError) return fail(T("action.badPath"));
    return fail(T("action.restoreFailed"));
  }
}

// The browser re-encodes to webp/JPEG (≤1600px, EXIF stripped by the canvas
// round-trip). The SERVER is still the boundary: magic-bytes sniff (never the
// declared type), hard byte cap, SVG rejected, content-hash filename.
export async function uploadImage(base64: string, alt: string): Promise<ActionResult & { url?: string }> {
  try {
    const email = await requireSession();
    const bytes = Buffer.from(base64, "base64");
    if (bytes.byteLength > MAX_IMAGE_BYTES) {
      return fail(T("action.imageTooBig", { kb: Math.round(bytes.byteLength / 1024), max: MAX_IMAGE_BYTES / 1024 }), "image");
    }
    const mime = sniffImage(bytes);
    if (!mime) return fail(T("action.imageBadType"), "image");
    if (!alt.trim()) return fail(T("action.imageAltRequired"), "imageAlt");

    const path = uploadPath(bytes, mime);
    const existing = await getFile(path);
    if (!existing) {
      await commitFiles({
        message: `cms: image · ${path.split("/").pop()} (${email})`,
        files: [{ path, content: bytes.toString("base64"), encoding: "base64" }],
      });
    }
    return { ok: true, kind: "media", url: publicUrlFor(path), message: T("action.imageUploaded") };
  } catch (e) {
    if (e instanceof UnsafePathError) return fail(T("action.imageBadTypeShort"), "image");
    return fail(T("action.uploadFailed"));
  }
}

// The media library: every image the client has already uploaded, newest-ish first,
// so they can REUSE one instead of re-uploading. Read-only — there is deliberately NO
// delete here: with no cross-file reference count, removing an image a live gallery or
// inline body still embeds would silently 404 that page, the exact lie the system
// forbids. Append-only uploads are also what keeps revision-restore lossless (Phase 4).
export async function listUploads(): Promise<{ url: string }[]> {
  try {
    await requireSession();
    const files = await listDir("public/media/uploads");
    return files
      .filter((f) => /\.(webp|jpe?g|png)$/i.test(f.name))
      .map((f) => ({ url: publicUrlFor(`public/media/uploads/${f.name}`) }))
      .reverse();
  } catch {
    return [];
  }
}

// Current value of a settings group + its blob sha (the concurrency handle).
export async function fetchSettings(
  name: string,
): Promise<{ ok: true; json: unknown; sha: string | null } | { ok: false }> {
  try {
    await requireSession();
    if (!Object.prototype.hasOwnProperty.call(settingsSchema, name)) return { ok: false };
    const path = settingsPath(name);
    const f = await getFile(path).catch(() => null);
    if (f) return { ok: true, json: JSON.parse(f.text), sha: f.sha };
    // No token (local `next dev`) or the file does not exist yet → start from the empty shape.
    return { ok: true, json: settingsSchema[name].array ? [] : {}, sha: null };
  } catch {
    return { ok: false };
  }
}

// Business info / testimonials. The schema is loaded on the SERVER from
// content/cms/settings.schema.json — never accepted from the caller, or a client
// could hand in a permissive schema and validate its way past every rule.
export async function saveSettings(name: string, json: unknown, baseSha: string | null): Promise<ActionResult> {
  try {
    const email = await requireSession();
    if (!Object.prototype.hasOwnProperty.call(settingsSchema, name)) return fail(T("action.badSettingsName"));
    const path = settingsPath(name);
    const errors = validateSettings(settingsSchema, name, json, path, brand.lang);
    if (errors.length) return { ok: false, errors };
    const { sha } = await commitFiles({
      message: `cms: update ${name} (${email})`,
      files: [{ path, content: JSON.stringify(json, null, 2) + "\n" }],
      expect: { [path]: baseSha },
    });
    return { ok: true, kind: "settings", sha, message: T("action.settingsSaved") };
  } catch (e) {
    if (e instanceof ConflictError) return fail(T("action.settingsConflict"));
    if (e instanceof UnsafePathError) return fail(T("action.badSettingsName"));
    return fail(T("action.settingsSaveFailed"));
  }
}
