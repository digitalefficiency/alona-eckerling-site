// ============================================================================
// autosave.mjs — the local safety net under the editor, as a pure module so the
// regression harness runs the real rule.
//
// Why it exists: the desk's own words are "nothing you wrote is ever lost." That
// was FALSE until this shipped. Everything the client typed lived in React state
// until they pressed publish, and the most ordinary thing a person does — write a
// long post on a phone, background the tab to fetch a photo, come back — is
// exactly when iOS evicts the tab and the post is gone. A draft only becomes a
// committed file when it is saved; before that, the browser is the only store.
//
// The rules, all here so they can be tested without a DOM:
//   • an entry is worth restoring only if it actually differs from what the
//     server loaded — otherwise we would nag the client on every open;
//   • an entry expires, because a two-month-old ghost draft offered against a
//     since-edited post is worse than no draft at all;
//   • a malformed or foreign-shaped entry is discarded silently, never thrown;
//   • the key is namespaced per collection AND per file, so two tabs editing two
//     posts cannot overwrite each other.
// ============================================================================

export const AUTOSAVE_TTL_MS = 14 * 24 * 60 * 60 * 1000;
export const AUTOSAVE_DEBOUNCE_MS = 600;

/** @param {string} collectionId @param {string|undefined} file */
export function autosaveKey(collectionId, file) {
  return `cms-draft:${collectionId}:${file ?? "new"}`;
}

/**
 * @typedef {{ values: Record<string, unknown>, body: string, slug: string, locale: string, savedAt: number }} Snapshot
 */

/** @param {Omit<Snapshot,"savedAt">} snap @param {number} now */
export function serializeSnapshot(snap, now) {
  return JSON.stringify({ ...snap, savedAt: now });
}

/** Parse + expire + shape-check. Returns null for anything we should not trust. */
export function parseSnapshot(raw, now) {
  if (typeof raw !== "string" || !raw) return null;
  let s;
  try {
    s = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!s || typeof s !== "object" || Array.isArray(s)) return null;
  if (typeof s.body !== "string" || typeof s.slug !== "string") return null;
  if (typeof s.savedAt !== "number" || !Number.isFinite(s.savedAt)) return null;
  if (now - s.savedAt > AUTOSAVE_TTL_MS) return null;
  if (s.values && (typeof s.values !== "object" || Array.isArray(s.values))) return null;
  return {
    values: s.values ?? {},
    body: s.body,
    slug: s.slug,
    locale: typeof s.locale === "string" ? s.locale : "he",
    savedAt: s.savedAt,
  };
}

const sameFields = (a, b) => {
  const ka = Object.keys(a ?? {});
  const kb = Object.keys(b ?? {});
  if (ka.length !== kb.length) return false;
  return ka.every((k) => JSON.stringify(a[k]) === JSON.stringify(b[k]));
};

// Offer a restore ONLY when the cached draft says something the loaded document
// does not. An identical snapshot means the client saved and came back; nagging
// them then teaches them to dismiss the banner, which is how a real recovery
// prompt gets clicked away one day.
export function shouldOfferRestore(snapshot, loaded) {
  if (!snapshot) return false;
  if (!loaded) return Boolean(snapshot.body.trim()) || Object.keys(snapshot.values).length > 0;
  if (snapshot.body.trim() !== (loaded.body ?? "").trim()) return true;
  if (snapshot.slug !== loaded.slug) return true;
  if ((snapshot.locale ?? "he") !== (loaded.locale ?? "he")) return true;
  return !sameFields(snapshot.values, loaded.values);
}

// "Is there unsaved work?" — drives the beforeunload guard on desktop. A brand-new
// empty editor is not dirty; an untouched loaded document is not dirty either.
export function isDirty(current, loaded) {
  if (!loaded) return Boolean(current.body.trim()) || Object.keys(current.values ?? {}).length > 0;
  return shouldOfferRestore({ ...current, savedAt: 0 }, loaded);
}
