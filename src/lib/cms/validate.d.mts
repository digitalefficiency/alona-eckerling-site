// Type surface of validate.mjs for the TS side (admin server actions).
import type { CollectionConfig, FieldSpec } from "./config";

// ADDITIVE i18n shape (Phase 2): { file, field, msg } is preserved so every .msg
// reader keeps working; code?/params? are optional metadata that carry the strings-
// table key + interpolation values.
export type ContentError = {
  file: string;
  field: string;
  msg: string;
  code?: string;
  params?: Record<string, unknown>;
};

export type FrontmatterProblem = { code: string; params?: Record<string, unknown> };

export type ValidateOpts = { locale?: string };

export declare const SLUG_RE: RegExp;
export declare const COLLECTION_ID_RE: RegExp;

export declare function wordCount(s: string): number;

export declare function parseSimpleFrontmatter(raw: string): {
  data: Record<string, unknown>;
  body: string;
  problems: FrontmatterProblem[];
};

export declare function serializeFrontmatter(data: Record<string, unknown>): string;

export declare function validateFields(
  fields: readonly FieldSpec[],
  data: Record<string, unknown>,
  file: string,
  errors: ContentError[],
  locale?: string,
): void;

export declare function validateDoc(
  collection: Pick<CollectionConfig, "fields" | "body"> & Partial<CollectionConfig>,
  data: Record<string, unknown>,
  body: string,
  file?: string,
  opts?: ValidateOpts,
): ContentError[];

export declare function validateSettings(
  schema: Record<string, { label?: string; array?: boolean; fields?: FieldSpec[] }>,
  name: string,
  json: unknown,
  file?: string,
  locale?: string,
): ContentError[];

export declare function validateTree(root: string, opts?: ValidateOpts): {
  dormant: boolean;
  files: number;
  errors: ContentError[];
};
