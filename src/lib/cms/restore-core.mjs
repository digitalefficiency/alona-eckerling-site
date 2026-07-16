// ============================================================================
// restore-core.mjs — the PURE decision at the heart of "restore this old version".
// Extracted so the zero-dep harness can PROVE the restore path validates, rather
// than merely that validateDoc exists somewhere near it. The network half (read the
// bytes at a sha, commit them) lives in actions.ts and is proven-live-not-pinned;
// this — parse, merge frontmatter problems, re-validate against TODAY's rules — is
// the part that must never be skipped, and the part a test can hold.
//
// THE DANGER THIS CLOSES: an old version can carry content that violates a rule the
// site added since, OR a frontmatter line gray-matter would silently swallow to {}.
// Restoring it verbatim would put a live page up with no title/date — a post that
// lies about being intact. So a restore is ALLOWED only if the historical bytes
// re-validate clean. Restore commits the VERBATIM bytes (no re-serialize), so the
// tiny-YAML round-trip is untouched; this only decides go / no-go.
import { parseSimpleFrontmatter, validateDoc } from "./validate.mjs";

// checkRestore(rawText, collection, opts) → { ok: true } | { ok: false, errors }.
// rawText = the file exactly as it was at the chosen commit.
export function checkRestore(rawText, collection, opts = {}) {
  const locale = opts.locale ?? "he";
  const { data, body, problems } = parseSimpleFrontmatter(String(rawText ?? ""));
  // Merge the parse problems the SAME way validateTree does, so a broken frontmatter
  // line (which gray-matter would swallow) is surfaced, not smuggled.
  const errors = validateDoc(collection, { ...data, __problems: problems }, body, opts.file ?? "", { locale });
  return errors.length ? { ok: false, errors } : { ok: true };
}
