import type { NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { deliverSigned } from "@/lib/webhook";
import { publicClient, supabaseConfigured } from "@/lib/supabase/client";

// Lead capture endpoint for the on-page forms (ContactLeadForm, ContactQuietForm).
//
// Validates server-side, enriches with request metadata, then persists to two
// independent destinations:
//   • the leads table — anon is the DESIGNED writer here: 0002_rls column-grants
//     INSERT on exactly the lead fields and RLS enforces consent=true. Active
//     whenever Supabase is configured; needs no env beyond the anon key.
//   • LEAD_WEBHOOK_URL — optional forward (Make/Zapier/CRM/Slack…), HMAC-signed
//     (timestamp.body, sha256) when LEAD_WEBHOOK_SECRET is set — the CRM
//     addon's lead-intake requires it.
// 200 only when at least one destination actually has the lead.
//
// PII is sent only in the DB row / POST body (never the URL, never the client
// dataLayer).

export const dynamic = "force-dynamic";

type LeadBody = {
  name?: string;
  phone?: string;
  email?: string;
  city?: string;
  project_type?: string;
  message?: string;
  consent?: boolean;
  form_id?: string;
  form_page?: string;
  company?: string; // honeypot — must stay empty
  attribution?: Record<string, unknown>;
  engagement?: Record<string, unknown>;
};

const isPhone = (s: string) => /[0-9]/.test(s) && s.replace(/\D/g, "").length >= 7;

function uid(): string {
  return (
    "lead_" +
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 8)
  );
}

export async function POST(request: NextRequest) {
  let body: LeadBody;
  try {
    body = (await request.json()) as LeadBody;
  } catch {
    return Response.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  // Honeypot — silently accept bots without forwarding.
  if (body.company && body.company.trim() !== "") {
    return Response.json({ ok: true, id: uid() });
  }

  const name = (body.name || "").trim();
  const phone = (body.phone || "").trim();
  const errors: Record<string, string> = {};
  if (name.length < 2) errors.name = "נא להזין שם מלא";
  if (!isPhone(phone)) errors.phone = "נא להזין מספר טלפון תקין";
  if (!body.consent) errors.consent = "נדרשת הסכמה ליצירת קשר";
  if (Object.keys(errors).length) {
    return Response.json({ ok: false, errors }, { status: 422 });
  }

  const id = uid();
  const lead = {
    id,
    // Stable idempotency key: CRM destinations dedupe retries on this uuid.
    submission_id: randomUUID(),
    received_at: new Date().toISOString(),
    name,
    phone,
    email: (body.email || "").trim(),
    city: (body.city || "").trim(),
    project_type: (body.project_type || "").trim(),
    message: (body.message || "").trim(),
    consent: body.consent === true,
    form_id: body.form_id || "",
    form_page: body.form_page || "",
    attribution: body.attribution || {},
    engagement: body.engagement || {},
    meta: {
      ip:
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip") ||
        "",
      user_agent: request.headers.get("user-agent") || "",
      country: request.headers.get("x-vercel-ip-country") || "",
    },
  };

  // TRUTHFULNESS RULE: the success screen promises «אני חוזרת אלייך אישית, עד 4
  // ימי עסקים». We may only show it when the lead actually reached somewhere it
  // can be read. Two destinations, each attempted when configured; 200 iff at
  // least one landed. Both missed → 502, so the form shows its error path
  // (which offers WhatsApp) rather than a promise nobody will keep.
  let dbLanded = false;
  if (supabaseConfigured) {
    // Row shape is bound by two constraints:
    //   • the column list must match the anon INSERT grant in 0002_rls exactly
    //     — any extra column is a 42501 on the whole insert;
    //   • values must satisfy the 0001 CHECKs, which the form does not surface:
    //     empty optionals become null (the email regex CHECK rejects ""), and
    //     lengths are capped at the CHECK limits so an over-long field costs
    //     its tail, not the lead. The webhook payload stays uncapped.
    // No .select(): anon has no SELECT policy, so return=minimal is what keeps
    // a committed row from reading as a failure (0002 caller contract).
    const opt = (s: string, max: number) => (s ? s.slice(0, max) : null);
    const { error } = await publicClient().from("leads").insert({
      submission_id: lead.submission_id,
      name: lead.name.slice(0, 120),
      phone: lead.phone.slice(0, 30),
      email: /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(lead.email) ? lead.email : null,
      city: opt(lead.city, 80),
      subject: opt(lead.project_type, 120), // DB column is `subject`
      message: opt(lead.message, 4000),
      consent: lead.consent,
      form_id: opt(lead.form_id, 60),
      form_page: opt(lead.form_page, 200),
      attribution: lead.attribution,
    });
    if (!error || error.code === "23505") {
      // 23505 = submission_id unique violation: a retry replay — the row is
      // already there, which is exactly what "landed" means.
      dbLanded = true;
    } else {
      // code + message only: Postgres puts the failing row (PII) in error.details.
      console.error("[lead:db] insert failed", id, error.code, error.message);
    }
  }

  // Webhook forward — HMAC-signed when the shared secret is set (dormant
  // otherwise; see lib/webhook.ts). deliverSigned has already retried twice
  // with a 5s timeout, so a false here is a real dead end for this destination.
  const webhook = process.env.LEAD_WEBHOOK_URL;
  let webhookLanded = false;
  if (webhook) {
    webhookLanded = await deliverSigned(webhook, JSON.stringify(lead));
    if (!webhookLanded && dbLanded) {
      // The lead is safe in the DB; surface the CRM gap without re-logging PII.
      console.error("[lead:webhook] forward failed (lead persisted to DB)", id);
    }
  }

  if (!dbLanded && !webhookLanded) {
    // Keep the payload in the log so the lead is recoverable by hand, then
    // tell the client the truth: no destination has this lead.
    console.error("[lead:fallback] no destination landed", id, JSON.stringify(lead));
    return Response.json({ ok: false, error: "delivery_failed" }, { status: 502 });
  }

  return Response.json({ ok: true, id });
}
