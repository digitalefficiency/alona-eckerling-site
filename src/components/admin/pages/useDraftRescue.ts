"use client";
import { useEffect, useRef, useState } from "react";
import type { PageDocument } from "@/lib/sections/schema";

// useDraftRescue — nothing typed is ever lost to a closed tab.
//
// This is NOT autosave-to-the-site. Publishing stays an explicit act, because
// an editor who cannot tell whether a change is live has no way to work
// carefully. What this does is keep a local copy of work in progress so a
// crash, a phone locking, or an accidental close costs nothing.
//
// The rescue is OFFERED, never applied. Silently restoring an old draft over
// what she is looking at is the same class of mistake as silently discarding
// it — either way the screen stops matching her memory. So it asks.

const KEY = (slug: string) => `alona.page-draft.${slug || "home"}`;
const DEBOUNCE_MS = 800;
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

// `rev` is the draft revision the work was typed on, so a restored rescue
// publishes against ITS base and not against whatever is current — an old
// rescue must conflict, never silently revert a newer publish. Optional
// because entries written before the field existed lack it.
type Saved = { at: number; doc: PageDocument; rev?: string | null };

export function useDraftRescue(slug: string, doc: PageDocument | null, dirty: boolean, rev: string | null) {
  const [rescue, setRescue] = useState<Saved | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // On mount: is there work from a previous visit that never got published?
  useEffect(() => {
    setRescue(null);
    try {
      const raw = window.localStorage.getItem(KEY(slug));
      if (!raw) return;
      const saved = JSON.parse(raw) as Saved;
      // anything older than a week is noise, not a rescue
      if (Date.now() - saved.at > MAX_AGE_MS) {
        window.localStorage.removeItem(KEY(slug));
        return;
      }
      setRescue(saved);
    } catch {
      // a corrupt entry is not worth a message; it is worth forgetting
      try {
        window.localStorage.removeItem(KEY(slug));
      } catch {}
    }
  }, [slug]);

  // While there are unpublished changes, keep the local copy current.
  useEffect(() => {
    if (!dirty || !doc) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      try {
        window.localStorage.setItem(KEY(slug), JSON.stringify({ at: Date.now(), doc, rev } satisfies Saved));
      } catch {
        // a full quota must never break typing
      }
    }, DEBOUNCE_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [slug, doc, dirty, rev]);

  const clear = () => {
    try {
      window.localStorage.removeItem(KEY(slug));
    } catch {}
    setRescue(null);
  };

  return { rescue, dismiss: () => setRescue(null), clear };
}
