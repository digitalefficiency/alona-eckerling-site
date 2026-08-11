#!/usr/bin/env node
// verify-db.mjs — the RLS verification suite, run against the REAL project
// through PostgREST with the anon key only. This is the attacker's-eye view:
// everything here is what anyone on the internet can do with the key that
// ships in the page source.
//
//   node scripts/verify-db.mjs
//
// Exit 0 = every check passed. Exit 1 = at least one failed, with details.
// Reads NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY from
// .env.local (same parser discipline as the app: no $-expansion surprises —
// values are taken verbatim from the line).

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const env = Object.fromEntries(
  readFileSync(resolve(root, ".env.local"), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);

const URL_ = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!URL_ || !KEY) {
  console.error("missing NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY in .env.local");
  process.exit(1);
}

const results = [];
function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "  ✓" : "  ✗"} ${name}${detail ? ` — ${detail}` : ""}`);
}

async function rest(path, init = {}) {
  const res = await fetch(`${URL_}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, ...(init.headers ?? {}) },
  });
  let body = null;
  try { body = await res.json(); } catch { /* empty bodies are fine */ }
  return { status: res.status, body };
}

// ── 1. the public read surface ──────────────────────────────────────────────
{
  const { status, body } = await rest("pages?select=slug,sections&order=slug");
  const slugs = Array.isArray(body) ? body.map((r) => r.slug).sort() : [];
  record("anon reads 5 published pages", status === 200 && slugs.length === 5, `got ${status}, ${slugs.length} rows [${slugs.join(", ")}]`);

  // The invariant behind the whole drafts/published table split: no section
  // that the editor hid may appear in what the world can fetch.
  const hidden = (Array.isArray(body) ? body : []).flatMap((r) =>
    (r.sections ?? []).filter((s) => s && s.visible === false).map((s) => `${r.slug}:${s.id}`),
  );
  record("no hidden (visible:false) section in the public documents", hidden.length === 0, hidden.join(", ") || "clean");
}
{
  const { status, body } = await rest("recipes?select=slug&limit=100");
  const n = Array.isArray(body) ? body.length : 0;
  record("anon reads 34 published recipes", status === 200 && n === 34, `got ${status}, ${n} rows`);
}

// ── 2. the walls ────────────────────────────────────────────────────────────
// Each of these tables holds drafts, history, personal data or routing.
// Depending on grants the refusal appears as 401/403/42501 OR as an empty
// 200 [] (RLS with no anon policy). BOTH are sealed; rows leaking is the bug.
for (const t of ["drafts", "revisions", "leads", "redirects", "media_assets", "media_refs"]) {
  const { status, body } = await rest(`${t}?select=*&limit=1`);
  const rows = Array.isArray(body) ? body.length : 0;
  const sealed = status !== 200 || rows === 0;
  record(`anon cannot read ${t}`, sealed, `status ${status}, ${rows} rows`);
}
{
  // Column-level: the consent trail is a third party's personal data. A plain
  // 200 with the column present is the failure B10 was about.
  const { status } = await rest("testimonials?select=consent_by&limit=1");
  record("anon cannot select testimonials.consent_by (column revoke)", status !== 200, `status ${status}`);
}

// ── 3. the write surface ────────────────────────────────────────────────────
{
  const { status, body } = await rest("pages?slug=eq.home", {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify({ status: "draft" }),
  });
  // Sealed looks like either an outright 4xx (no UPDATE grant) or 200 with an
  // EMPTY array (RLS let the statement run and matched zero rows). A returned
  // row is the breach — it means the row was actually unpublished.
  const touched = Array.isArray(body) ? body.length : 0;
  record("anon cannot UPDATE pages", status >= 400 || touched === 0, `status ${status}, ${touched} rows affected`);
  const after = await rest("pages?slug=eq.home&select=slug&limit=1");
  record("home is still published after the attack", Array.isArray(after.body) && after.body.length === 1, `status ${after.status}`);
}
{
  const { status } = await rest("rpc/publish_entity", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ p_type: "page", p_id: "home", p_expected_rev: 1 }),
  });
  record("anon cannot call publish_entity", status >= 400, `status ${status}`);
}

// ── 4. the functions exist for those who may call them ─────────────────────
{
  const { status, body } = await rest("rpc/save_draft", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  // As anon this must FAIL — but with a permission/argument error, not
  // PGRST202 (function missing). PGRST202 means the apply never happened.
  const exists = !(body && body.code === "PGRST202");
  record("save_draft exists (apply landed)", exists, `status ${status}${body?.code ? `, ${body.code}` : ""}`);
}

const failed = results.filter((r) => !r.ok);
console.log(failed.length === 0 ? "\nכל הבדיקות עברו — המסד סגור כמו שצריך." : `\n${failed.length} בדיקות נכשלו.`);
process.exit(failed.length === 0 ? 0 : 1);
