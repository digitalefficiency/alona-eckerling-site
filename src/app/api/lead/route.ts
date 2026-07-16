import type { NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { deliverSigned } from "@/lib/webhook";

// Lead capture endpoint for the on-page forms (e.g. /services/urban-renewal).
//
// Validates server-side, enriches with request metadata, then forwards to the
// destination the client configures via env. Until a destination is wired
// ([לאימות] — office email / CRM / webhook), it logs server-side and still
// returns success so the UX works. NO destination is hard-coded.
//
// Env (all optional):
//   LEAD_WEBHOOK_URL     — POST the lead JSON here (Make/Zapier/CRM/Slack…)
//   LEAD_WEBHOOK_SECRET  — when set, the POST is HMAC-signed (timestamp.body,
//                          sha256) — the CRM addon's lead-intake requires it.
//
// PII is sent only in this POST body (never the URL, never the client dataLayer).

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

  // Forward to the configured destination, if any — HMAC-signed when the
  // shared secret is set (dormant otherwise; see lib/webhook.ts).
  const webhook = process.env.LEAD_WEBHOOK_URL;
  if (webhook) {
    const landed = await deliverSigned(webhook, JSON.stringify(lead));
    if (!landed) {
      // Don't lose the lead in logs if forwarding fails.
      console.error("[lead:fallback] webhook forward failed", id, JSON.stringify(lead));
    }
  } else {
    // [לאימות] No destination configured yet — log so nothing is lost.
    console.info("[lead] received (no LEAD_WEBHOOK_URL configured):", JSON.stringify(lead));
  }

  return Response.json({ ok: true, id });
}
