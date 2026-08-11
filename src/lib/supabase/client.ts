import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// supabase/client.ts — the three ways this app reaches the database, and only
// three.
//
// PUBLIC READS use the anon key with NO session. That is not a shortcut, it is
// the security model: a visitor's page render must be able to see exactly what
// RLS lets `anon` see and nothing more, so if a draft ever became visible on a
// public page it would mean the policy is wrong, not that the render forgot to
// filter. The anon key is public by design — it ships in every browser bundle.
//
// DESK WRITES ride the desk's own Supabase Auth session (deskClient below).
// The desk's door is the cms_session cookie — checked by every server action —
// and behind that door the action signs in as ONE dedicated auth user whose
// app_metadata carries the role RLS checks. This is what makes a desk save an
// `authenticated` write instead of an anon write that RLS rightly refuses.
// When per-editor Supabase Auth arrives, her own session replaces this one and
// deskClient retires; the RLS surface does not change.
//
// EDITOR-SESSION reads/writes (userClient) carry the browser's Supabase
// cookies for the day real per-user auth exists. There is no fourth mode: the
// service-role key is never imported here, never read from the environment at
// runtime, and exists only in local migration scripts. A key that is not in
// the process cannot be leaked by it.
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

const DESK_EMAIL = process.env.SUPABASE_DESK_EMAIL ?? "";
const DESK_PASSWORD = process.env.SUPABASE_DESK_PASSWORD ?? "";

/** True once the desk's auth user is wired. Until then DB writes fail honestly. */
export const deskConfigured = supabaseConfigured && Boolean(DESK_EMAIL && DESK_PASSWORD);

let desk: { client: SupabaseClient; expiresAt: number } | null = null;

/**
 * The desk's database identity: one auth user, signed in with credentials
 * from the environment, cached for the token's lifetime and re-signed-in a
 * minute before expiry. Null when unconfigured or when sign-in fails — the
 * caller turns that into an honest Hebrew error, never into an anon write.
 *
 * Single-flight is not needed: worst case two parallel saves sign in twice
 * and the second cache write wins, which costs one extra auth round trip.
 */
export async function deskClient(): Promise<SupabaseClient | null> {
  if (!deskConfigured) return null;
  const now = Math.floor(Date.now() / 1000);
  if (desk && desk.expiresAt - now > 60) return desk.client;

  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data, error } = await client.auth.signInWithPassword({
    email: DESK_EMAIL,
    password: DESK_PASSWORD,
  });
  if (error || !data.session) {
    desk = null;
    return null;
  }
  desk = { client, expiresAt: data.session.expires_at ?? now + 3000 };
  return client;
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
