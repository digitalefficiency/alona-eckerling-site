"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getAttributionSnapshot, getCampaignDimensions } from "@/lib/attribution";
import { getEngagement } from "@/lib/engagement";
import { trackFormView, trackFormStart, trackGenerateLead } from "@/lib/analytics";
import { Reveal } from "@/components/Reveal";

const FORM_ID = "contact";

// ============================================================================
// ContactQuietForm — the contact page's bespoke friction-floor form (plan
// section 36). Page-local by necessity: the COPY.md block dictates its own
// field set (שם · טלפון/וואטסאפ · הודעה לא-חובה · אימייל מכווץ · הסכמת-ערוץ),
// a WhatsApp direct row (never a printed phone number), a subordinate
// newsletter magnet with its OWN separate opt-in, and a thank-you state that
// RESTORES THE PROMISE — none of which the generic ContactLeadForm renders.
//
// ZERO copy ships in this component: every visible string arrives as a prop
// from the page's COPY constants. Plumbing is byte-compatible with
// ContactLeadForm: /api/lead POST, honeypot, attribution + engagement,
// dataLayer funnel; PII only in the POST body. Validation strings mirror the
// /api/lead route's own server strings (system plumbing, not page copy).
// Motion: the thank-you swap rides <Reveal> (tokens-only, one-shot); under
// reduced-motion / a11y-stop-motion it is an instant static swap.
// ============================================================================

export type ContactQuietFormCopy = {
  nameLabel: string;
  phoneLabel: string;
  messageLabel: string;
  emailLabel: string;
  consentLabel: string;
  submitLabel: string;
  submittingLabel: string;
  whatsappLabel: string;
  whatsappHref: string;
  magnetLabel: string;
  thanks: { start: string; linkLabel: string; linkHref: string; end: string };
};

type Status = "idle" | "submitting" | "success" | "error";

export function ContactQuietForm({ copy }: { copy: ContactQuietFormCopy }) {
  const ref = useRef<HTMLFormElement>(null);
  const started = useRef(false);
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [emailOpen, setEmailOpen] = useState(false);
  const [newsletter, setNewsletter] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          trackFormView(FORM_ID, window.location.pathname);
          io.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const onFirstInteract = () => {
    if (started.current) return;
    started.current = true;
    trackFormStart(FORM_ID, window.location.pathname);
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "submitting") return;
    setErrors({});
    setServerError("");

    const fd = new FormData(e.currentTarget);
    const message = String(fd.get("message") || "").trim();
    const engagement = getEngagement();
    // The newsletter opt-in rides the same lead to the CRM desk (Smoove is not
    // wired yet — the office adds her to the list by hand). CRM-side note only,
    // never rendered on-page.
    const messageParts = [
      message,
      newsletter ? "ביקשה להצטרף לרשימה השפויה (דיוור בהסכמה נפרדת)" : "",
    ].filter(Boolean);
    const payload = {
      name: String(fd.get("name") || ""),
      phone: String(fd.get("phone") || ""),
      email: String(fd.get("email") || "").trim(),
      message: messageParts.join("\n"),
      consent: fd.get("consent") === "on",
      company: String(fd.get("company") || ""), // honeypot
      form_id: FORM_ID,
      form_page: window.location.pathname,
      attribution: getAttributionSnapshot(),
      engagement,
    };

    // Client-side pre-validation — the exact strings /api/lead returns on 422.
    const next: Record<string, string> = {};
    if (payload.name.trim().length < 2) next.name = "נא להזין שם מלא";
    if (payload.phone.replace(/\D/g, "").length < 7) next.phone = "נא להזין מספר טלפון תקין";
    if (!payload.consent) next.consent = "נדרשת הסכמה ליצירת קשר";
    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }

    setStatus("submitting");
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        if (data.errors) setErrors(data.errors);
        else setServerError("אירעה תקלה בשליחה. נסו שוב מאוחר יותר.");
        setStatus("error");
        return;
      }
      trackGenerateLead({
        form_id: FORM_ID,
        page: window.location.pathname,
        lead_id: data.id,
        newsletter_opt_in: newsletter, // non-PII boolean dimension
        time_on_page_seconds: engagement.time_on_page_seconds,
        max_scroll_depth: engagement.max_scroll_depth,
        ...getCampaignDimensions(),
      });
      setStatus("success");
    } catch {
      setServerError("אירעה תקלה בשליחה. נסו שוב מאוחר יותר.");
      setStatus("error");
    }
  }

  const fieldClass =
    "mt-1.5 w-full rounded-[8px] border border-line bg-card px-3.5 py-2.5 text-ink outline-none transition focus:border-gold focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1";

  // ── Thank-you: the promise restored (COPY מסך-תודה). Reveal = soft one-shot
  //    settle on the motion tokens; reduced-motion renders it instantly static.
  if (status === "success") {
    return (
      <Reveal>
        <div className="rounded-[16px] bg-gold-soft/45 px-6 py-10 text-center sm:px-10" role="status">
          {/* לוואי עלה-וי רך, sage/rose, SSR-drawn — קבלה שקטה, לא קונפטי */}
          <svg viewBox="0 0 48 48" aria-hidden className="mx-auto h-14 w-14">
            <circle cx="24" cy="24" r="22" className="fill-gold-soft" />
            <path
              d="M15 24.5 21.5 31 33 18"
              className="stroke-gold"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M34 11.5c-3.6.4-5.6 2.3-6 5.7 3.5-.3 5.5-2.2 6-5.7Z"
              className="fill-rose"
              opacity=".85"
            />
          </svg>
          <p className="mx-auto mt-6 max-w-[46ch] text-lg leading-[1.8] text-navy">
            {copy.thanks.start}
            <Link
              href={copy.thanks.linkHref}
              className="font-semibold text-gold-ink underline decoration-rose decoration-2 underline-offset-4 transition hover:text-gold-dark"
            >
              {copy.thanks.linkLabel}
            </Link>
            {copy.thanks.end}
          </p>
        </div>
      </Reveal>
    );
  }

  return (
    <form ref={ref} onSubmit={onSubmit} onFocusCapture={onFirstInteract} noValidate>
      {/* honeypot */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          אל תמלאו שדה זה
          <input type="text" name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <label className="block text-sm font-semibold text-navy-700">
        {copy.nameLabel}
        <input
          type="text"
          name="name"
          required
          autoComplete="name"
          aria-invalid={!!errors.name}
          className={fieldClass}
        />
      </label>
      {errors.name && <p className="mt-1 text-sm text-bad">{errors.name}</p>}

      <label className="mt-4 block text-sm font-semibold text-navy-700">
        {copy.phoneLabel}
        <input
          type="tel"
          name="phone"
          inputMode="tel"
          required
          autoComplete="tel"
          aria-invalid={!!errors.phone}
          dir="ltr"
          className={fieldClass}
        />
      </label>
      {errors.phone && <p className="mt-1 text-sm text-bad">{errors.phone}</p>}

      <label className="mt-4 block text-sm font-semibold text-navy-700">
        {copy.messageLabel}
        <textarea name="message" rows={3} className={`${fieldClass} resize-y`} />
      </label>

      {/* אימייל — שדה מכווץ (COPY: «אימייל» (מכווץ)); נפתח בלחיצה או עם הצטרפות לרשימה */}
      {emailOpen || newsletter ? (
        <label className="mt-4 block text-sm font-semibold text-navy-700">
          {copy.emailLabel}
          <input type="email" name="email" autoComplete="email" dir="ltr" className={fieldClass} />
        </label>
      ) : (
        <button
          type="button"
          onClick={() => setEmailOpen(true)}
          aria-expanded={false}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-gold-ink underline decoration-gold/40 underline-offset-4 transition hover:text-gold-dark"
        >
          <span aria-hidden>+</span>
          {copy.emailLabel}
        </button>
      )}

      <label className="mt-6 flex items-start gap-3 text-sm leading-relaxed text-muted">
        <input
          type="checkbox"
          name="consent"
          required
          aria-invalid={!!errors.consent}
          className="mt-0.5 h-5 w-5 shrink-0 rounded-[4px] accent-[var(--color-gold-dark)]"
        />
        <span>{copy.consentLabel}</span>
      </label>
      {errors.consent && <p className="mt-1 text-sm text-bad">{errors.consent}</p>}

      {serverError && (
        <p className="mt-4 rounded-[8px] bg-bad/10 px-3 py-2 text-sm text-bad" role="alert">
          {serverError}
        </p>
      )}

      <button
        type="submit"
        data-cta="contact-form-submit"
        disabled={status === "submitting"}
        className="mt-7 w-full rounded-full bg-gold px-8 py-4 text-[1.02rem] font-bold text-white transition hover:bg-gold-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 disabled:opacity-60"
      >
        {status === "submitting" ? copy.submittingLabel : copy.submitLabel}
      </button>

      {/* ערוץ ישיר — וואטסאפ בלבד; מספר הטלפון האישי לעולם לא מודפס (Q4) */}
      <a
        href={copy.whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        data-cta="contact-whatsapp"
        className="mt-4 flex w-full items-center justify-center gap-2.5 rounded-full border border-navy/20 px-6 py-3.5 font-bold text-navy-700 transition hover:border-gold hover:text-gold-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
      >
        <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5 shrink-0">
          <path
            d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.7-1.2A9 9 0 1 0 12 3Z"
            fill="none"
            className="stroke-gold"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path
            d="M8.8 8.6c.5-.5 1-.4 1.3 0l.9 1.3c.2.3.1.7-.1 1l-.5.6c.4 1 1.3 1.9 2.3 2.4l.6-.6c.3-.3.7-.3 1-.1l1.3.8c.4.3.5.9.1 1.3l-.6.6c-.4.4-1 .6-1.6.4-2.4-.7-4.4-2.6-5.1-5-.2-.6 0-1.2.4-1.7Z"
            className="fill-gold"
          />
        </svg>
        {copy.whatsappLabel}
      </a>

      {/* המגנט הרך — חלון קטן ופתוח לצד הדלת המוארת: הסכמת-ניוזלטר נפרדת שרוכבת
          על אותה שליחה (Smoove טרם חובר; הצטרפות דרך שולחן הלידים) */}
      <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-[16px] bg-blush p-5 transition hover:opacity-95">
        <input
          type="checkbox"
          name="newsletter"
          checked={newsletter}
          onChange={(e) => setNewsletter(e.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 rounded-[4px] accent-[var(--color-gold-dark)]"
        />
        <span className="text-[0.95rem] font-medium leading-relaxed text-navy">
          <span className="text-[0.6rem] leading-none text-rose-ink" aria-hidden>
            ◆{" "}
          </span>
          {copy.magnetLabel}
        </span>
      </label>
    </form>
  );
}
