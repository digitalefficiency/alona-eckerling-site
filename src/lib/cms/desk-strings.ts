// desk-strings.ts — the typed bridge that binds the desk's UI language ONCE.
//
// The admin components write T("admin.deskTitle") instead of a raw literal; T
// resolves against brand.lang so the same component renders Hebrew on a he site
// and English on an en site. This is the ONLY place brand.lang is read for copy,
// so the language is a single knob, not a literal sprinkled across the TSX.
//
// Client-safe by construction: it imports only brand.config (pure) and strings.mjs
// (pure, zero node:*). The node-only client-language sniff lives in desk-locale.mjs
// and is NEVER imported from here, so this stays bundleable into a client component.
import { brand } from "@/brand.config";
import { t, type Params } from "@/lib/cms/strings.mjs";

export function T(key: string, params?: Params): string {
  return t(brand.lang, key, params);
}
