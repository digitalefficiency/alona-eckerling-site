// Type surface of restore-core.mjs — the pure "may this old version be restored?" gate.
import type { CollectionConfig } from "./config";
import type { ContentError } from "./validate";

export declare function checkRestore(
  rawText: string,
  collection: Pick<CollectionConfig, "fields" | "body"> & Partial<CollectionConfig>,
  opts?: { locale?: string; file?: string },
): { ok: true } | { ok: false; errors: ContentError[] };
