// safe-path.mjs — THE security boundary of the publish pipeline, as plain ESM so
// the regression harness runs the REAL code rather than a copy of it.
//
// A GitHub token with `contents:write` cannot be scoped to a subdirectory. So the
// only thing between a client-typed slug and an arbitrary repo write —
// `../../next.config.ts`, `../../.github/workflows/x.yml`, either of which executes
// on the next build — is this module. Treat everything here as security code.
import path from "node:path";
import { createHash } from "node:crypto";
import { SLUG_RE } from "./validate.mjs";

// Only these two trees may EVER be written by the CMS. Everything else — src/,
// scripts/, .github/, package.json, next.config.*, middleware.* — is code.
export const WRITABLE_PREFIXES = ["content/", "public/media/uploads/"];
export const MAX_IMAGE_BYTES = 300 * 1024;

const LOCALE_RE = /^[a-z]{2}$/;

export class UnsafePathError extends Error {}

// Normalize, then assert the result is unchanged, relative, and inside BOTH the
// intended prefix and the global allowlist. Defense in depth: a regex bug alone
// must not become an arbitrary write.
function assertInside(rel, prefix) {
  const normalized = path.posix.normalize(rel);
  if (normalized !== rel || normalized.startsWith("/") || normalized.startsWith("..")) {
    throw new UnsafePathError(`unsafe path: ${rel}`);
  }
  if (!normalized.startsWith(prefix)) throw new UnsafePathError(`path escapes ${prefix}: ${rel}`);
  if (!WRITABLE_PREFIXES.some((p) => normalized.startsWith(p))) {
    throw new UnsafePathError(`path is outside every writable prefix: ${rel}`);
  }
  return normalized;
}

export function assertSlug(slug) {
  if (typeof slug !== "string" || !SLUG_RE.test(slug)) throw new UnsafePathError(`illegal slug: ${slug}`);
  return slug;
}

// `collectionId` must already have been resolved against collections.json by the
// caller — this takes the resolved id, never a raw request field.
export function docPath(collectionId, slug, locale) {
  assertSlug(collectionId);
  assertSlug(slug);
  if (locale !== undefined && !LOCALE_RE.test(locale)) throw new UnsafePathError(`illegal locale: ${locale}`);
  const prefix = `content/${collectionId}/`;
  return assertInside(prefix + (locale ? `${slug}.${locale}.md` : `${slug}.md`), prefix);
}

export function settingsPath(name) {
  assertSlug(name);
  return assertInside(`content/settings/${name}.json`, "content/settings/");
}

const EXT_BY_MIME = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png" };

// Uploaded media is named by CONTENT HASH, never by the client's filename — which
// kills filename traversal, collisions, and the "innocent.jpg.svg" class of trick.
export function uploadPath(bytes, mime) {
  const ext = EXT_BY_MIME[mime];
  if (!ext) throw new UnsafePathError(`unsupported image type: ${mime}`);
  const hash = createHash("sha256").update(bytes).digest("hex").slice(0, 16);
  const prefix = "public/media/uploads/";
  return assertInside(`${prefix}${hash}.${ext}`, prefix);
}

export const publicUrlFor = (repoPath) => repoPath.replace(/^public/, "");

// Trust magic bytes, never the declared Content-Type. SVG is REJECTED outright:
// an SVG served from the site's own origin executes script in that origin,
// bypassing every markdown sanitizer the content pipeline applies.
export function sniffImage(b) {
  if (b.length > 12 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
      b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return "image/webp";
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
      b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a) return "image/png";
  return null;
}
