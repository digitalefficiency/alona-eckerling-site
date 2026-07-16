// Type surface of session-core.mjs (the CMS auth tokens).
export declare const SESSION_COOKIE: string;
export declare const NONCE_COOKIE: string;
export declare const MAGIC_TTL_MS: number;
export declare const SESSION_TTL_MS: number;

export declare function allowedEmails(env?: NodeJS.ProcessEnv): string[];
export declare function isAllowed(email: string, env?: NodeJS.ProcessEnv): boolean;
export declare function newNonce(): string;
export declare function createMagicToken(email: string, nonce: string, env?: NodeJS.ProcessEnv): string;
export declare function verifyMagicToken(
  token: string,
  cookieNonce: string | undefined,
  env?: NodeJS.ProcessEnv,
): string | null;
export declare function createSessionToken(email: string, env?: NodeJS.ProcessEnv): string;
export declare function verifySessionToken(token: string | undefined, env?: NodeJS.ProcessEnv): string | null;
export declare function safeNext(next: string | null | undefined): string;
