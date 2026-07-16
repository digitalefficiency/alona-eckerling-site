import crypto from "node:crypto";

// Server-side delivery for the lead pipe (/api/lead → the configured webhook,
// e.g. the CRM addon's lead-intake edge function). DORMANT substrate: signs
// `timestamp.body` with HMAC-SHA256 only when LEAD_WEBHOOK_SECRET is set —
// without the secret it behaves exactly like a plain fetch, so sites without
// the CRM addon are unchanged. Sends with a 5s timeout and one retry. Returns
// whether it landed — never throws, so callers can log their loud fallback and
// still answer 200.
export async function deliverSigned(hookUrl: string | undefined, payload: string): Promise<boolean> {
  if (!hookUrl) return false;

  const headers: Record<string, string> = { "content-type": "application/json" };
  const secret = process.env.LEAD_WEBHOOK_SECRET;
  if (secret) {
    const ts = Date.now().toString();
    const sig = crypto.createHmac("sha256", secret).update(`${ts}.${payload}`).digest("hex");
    headers["x-lead-timestamp"] = ts;
    headers["x-lead-signature"] = sig;
  }

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(hookUrl, {
        method: "POST",
        headers,
        body: payload,
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) return true;
    } catch {
      /* network error / timeout — retry once, then let the caller fall back */
    }
  }
  return false;
}
