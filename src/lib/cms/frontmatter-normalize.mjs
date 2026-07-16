// ============================================================================
// frontmatter-normalize.mjs — the ONE frontmatter normalizer, shared by the two
// sides that must agree byte-for-byte:
//   • the SITE reader (lib/content.ts parse) runs gray-matter STRICTLY on this
//     function's output, so whatever bytes this emits are the bytes gray-matter sees;
//   • the harness pins the desk's WRITER (validate.mjs serializeFrontmatter) against
//     this, proving the desk and the live site never disagree about a frontmatter shape.
//
// It was extracted verbatim from content.ts so there is a SINGLE source of truth:
// auto-generated YAML can carry unquoted values with ":" or quotes that break the
// parser, so every scalar (and every "- item" list element) is wrapped in double
// quotes with escaping. Pure, zero-dep, so the zero-dep harness can import it.
//
// WHY THE GALLERY IS TWO PARALLEL STRING LISTS, NOT A LIST OF MAPS: the li-branch
// below runs quoteScalar on a "- url: \"/media/x\"" line — first char "u", not a
// quote — and wraps the WHOLE map line into one quoted scalar, so gray-matter reads
// the literal text and the "alt:" line orphans. A nested shape silently corrupts the
// published gallery. Two quoted-string lists (the exact `tags` shape) round-trip cleanly.

export function quoteScalar(v) {
  const s = String(v).trim();
  if (s === "") return '""';
  const first = s[0];
  if (first === '"' || first === "'" || first === "[" || first === "{") return s;
  return `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

export function normalizeFrontmatter(raw) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw);
  if (!m) return raw;
  const lines = m[1].split("\n").map((line) => {
    const li = /^(\s*)-\s+(.*)$/.exec(line);
    if (li) return `${li[1]}- ${quoteScalar(li[2])}`;
    const kv = /^(\s*)([^:\s][^:]*):\s*(.*)$/.exec(line);
    if (kv) return kv[3] === "" ? line : `${kv[1]}${kv[2]}: ${quoteScalar(kv[3])}`;
    return line;
  });
  return `---\n${lines.join("\n")}\n---\n${m[2]}`;
}
