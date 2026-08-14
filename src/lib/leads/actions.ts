"use server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/cms/session";
import { deskClient } from "@/lib/supabase/client";

// leads/actions.ts — the desk's window into the inbox.
//
// Reads ride the desk's Supabase identity, so RLS's leads_staff_read is the
// real gate; the cms_session check on top keeps these server actions from
// being a public endpoint. Nothing here can DELETE — that privilege is revoked
// from every client role by design, and "handled" is a status, not a removal.

export type Lead = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  city: string | null;
  subject: string | null;
  message: string | null;
  form_page: string | null;
  created_at: string;
  status: "new" | "handled";
  handled_at: string | null;
  notes: string | null;
};

export type LeadsResult = { ok: true; leads: Lead[] } | { ok: false; error: string };

async function requireSession(): Promise<string | null> {
  const jar = await cookies();
  return verifySessionToken(jar.get(SESSION_COOKIE)?.value);
}

export async function listLeads(): Promise<LeadsResult> {
  if (!(await requireSession())) return { ok: false, error: "לא מחוברת. יש להיכנס מחדש." };
  const sb = await deskClient();
  if (!sb) return { ok: false, error: "חיבור המסד של המערכת לא זמין כרגע. נסו שוב עוד רגע." };

  const { data, error } = await sb
    .from("leads")
    .select("id,name,phone,email,city,subject,message,form_page,created_at,status,handled_at,notes")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) return { ok: false, error: "לא הצלחתי לקרוא את הפניות. נסו לרענן." };
  return { ok: true, leads: (data ?? []) as Lead[] };
}

export async function setLeadStatus(id: string, status: "new" | "handled"): Promise<{ ok: boolean }> {
  if (!(await requireSession())) return { ok: false };
  const sb = await deskClient();
  if (!sb) return { ok: false };

  // .select() so an RLS-refused update reads as failure, not silent success —
  // same returning-rows discipline as savePage.
  const { data, error } = await sb
    .from("leads")
    .update({ status, handled_at: status === "handled" ? new Date().toISOString() : null })
    .eq("id", id)
    .select("id");
  return { ok: !error && Boolean(data?.length) };
}

export async function saveLeadNote(id: string, notes: string): Promise<{ ok: boolean }> {
  if (!(await requireSession())) return { ok: false };
  const sb = await deskClient();
  if (!sb) return { ok: false };

  const { data, error } = await sb
    .from("leads")
    .update({ notes: notes.trim() || null })
    .eq("id", id)
    .select("id");
  return { ok: !error && Boolean(data?.length) };
}
