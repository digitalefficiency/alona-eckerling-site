// Type surface of strings.mjs for the TS side (the desk-strings bridge, the admin
// components via T(), the auth routes via t(), and validate.mjs via formatError).
// Follows the validate.d.mts sidecar precedent.

export type Params = Record<string, unknown>;
export type StringValue = string | ((p: Params) => string);
export type ErrorBuilder = (p: Params) => string;

export type CodedError = { code?: string; params?: Params; msg?: string };

export declare const STRINGS: Record<string, Record<string, StringValue>>;
export declare const ERRORS: Record<string, Record<string, ErrorBuilder>>;
export declare const SUPPORTED_LOCALES: string[];

export declare function t(locale: string, key: string, params?: Params): string;
export declare function formatError(err: CodedError, locale: string): string;
export declare function formatErrors(errs: CodedError[], locale: string): string[];
