import type { NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { deliverSigned } from "@/lib/webhook";

// Lead capture endpoint for the on-page forms (ContactLeadForm, ContactQuietForm).
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
  //
  // TRUTHFULNESS RULE: the success screen promises «אני חוזרת אלייך אישית, עד 4
  // ימי עסקים». We may only show it when the lead actually reached somewhere it
  // can be read. So the two branches answer DIFFERENTLY:
  //   • webhook configured + delivery failed → 502. deliverSigned has already
  //     retried twice with a 5s timeout, so this is a real dead end: the form
  //     must show its error path (which offers WhatsApp) rather than a promise
  //     nobody will keep.
  //   • no webhook configured → still 200. This is the documented pre-launch
  //     posture (MARKETING.md §5); failing here would break every submission on
  //     the staging site today. The launch checklist is what closes it.
  const webhook = process.env.LEAD_WEBHOOK_URL;
  if (webhook) {
    const landed = await deliverSigned(webhook, JSON.stringify(lead));
    if (!landed) {
      // Keep the payload in the log so the lead is recoverable by hand, then
      // tell the client the truth.
      console.error("[lead:fallback] webhook forward failed", id, JSON.stringify(lead));
      return Response.json({ ok: false, error: "delivery_failed" }, { status: 502 });
    }
  } else {
    // [לאימות] No destination configured yet — log so nothing is lost.
    console.info("[lead] received (no LEAD_WEBHOOK_URL configured):", JSON.stringify(lead));
  }

  return Response.json({ ok: true, id });
}
