import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// supabase/client.ts — the two ways this app reaches the database, and only two.
//
// PUBLIC READS use the anon key with NO session. That is not a shortcut, it is
// the security model: a visitor's page render must be able to see exactly what
// RLS lets `anon` see and nothing more, so if a draft ever became visible on a
// public page it would mean the policy is wrong, not that the render forgot to
// filter. The anon key is public by design — it ships in every browser bundle.
//
// EDITOR WRITES ride the signed-in user's session, so RLS evaluates
// `is_cms_user()` against a real JWT. There is no third mode: the service-role
// key is never imported here, never read from the environment at runtime, and
// exists only in local migration scripts. A key that is not in the process
// cannot be leaked by it.
//
// `server-only` is load-bearing. If any of this were pulled into a client
// component the cookie handling would silently change meaning.

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** True once the project is wired. Until then the app falls back to files. */
export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

/**
 * The visitor's view. No cookies are read or written: this client must never
 * pick up an editor's session by accident, because then a public page would
 * render with staff privileges and nobody would notice until it leaked.
 */
export function publicClient() {
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: { getAll: () => [], setAll: () => {} },
  });
}

/**
 * The editor's view, carrying her session so RLS sees her role.
 *
 * setAll is wrapped: refreshing a token during a render throws in Next, and
 * that throw would surface to the editor as a failed save rather than as the
 * token refresh it actually is.
 */
export async function userClient() {
  const jar = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) jar.set(name, value, options);
        } catch {
          // called from a Server Component render — the middleware refresh owns it
        }
      },
    },
  });
}
