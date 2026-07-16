// Type surface of autosave.mjs (the editor's local safety net).
export type Snapshot = {
  values: Record<string, unknown>;
  body: string;
  slug: string;
  locale: string;
  savedAt: number;
};

export type Loaded = {
  values: Record<string, unknown>;
  body: string;
  slug: string;
  locale: string;
};

export declare const AUTOSAVE_TTL_MS: number;
export declare const AUTOSAVE_DEBOUNCE_MS: number;

export declare function autosaveKey(collectionId: string, file: string | undefined): string;
export declare function serializeSnapshot(snap: Omit<Snapshot, "savedAt">, now: number): string;
export declare function parseSnapshot(raw: string | null, now: number): Snapshot | null;
export declare function shouldOfferRestore(snapshot: Snapshot | null, loaded: Loaded | null): boolean;
export declare function isDirty(current: Omit<Snapshot, "savedAt">, loaded: Loaded | null): boolean;
