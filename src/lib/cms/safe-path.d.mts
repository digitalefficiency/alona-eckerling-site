// Type surface of safe-path.mjs (the publish-path boundary).
export declare const WRITABLE_PREFIXES: string[];
export declare const MAX_IMAGE_BYTES: number;

export declare class UnsafePathError extends Error {}

export declare function assertSlug(slug: string): string;
export declare function docPath(collectionId: string, slug: string, locale?: string): string;
export declare function settingsPath(name: string): string;
export declare function uploadPath(bytes: Uint8Array, mime: string): string;
export declare function publicUrlFor(repoPath: string): string;
export declare function sniffImage(bytes: Uint8Array): "image/webp" | "image/jpeg" | "image/png" | null;
