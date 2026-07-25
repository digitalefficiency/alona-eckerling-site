"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getAttributionSnapshot, getCampaignDimensions } from "@/lib/attribution";
import { getEngagement } from "@/lib/engagement";
import { trackFormView, trackFormStart, trackGenerateLead } from "@/lib/analytics";
import { contactForm, responsePromise, site } from "@/lib/site";
import { focusFirstInvalid, focusStatusPanel } from "@/lib/form-focus";

const FORM_ID = "contact";

// Subject options come from the per-site config (lib/site.ts → contactForm).
const SUBJECTS = contactForm.subjects;

type Status = "idle" | "submitting" | "success" | "error";

// The site's main contact form — captures the lead via /api/lead with full
// marketing attribution + engagement, and fires the same dataLayer funnel as
// the urban-renewal form. PII goes only in the POST body (never URL/dataLayer).
export function ContactLeadForm() {
  const ref = useRef<HTMLFormElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");

  // The success panel REPLACES the form, so the focused submit button is
  // unmounted and focus would fall to <body>. Move it to the panel instead:
  // that both announces the outcome and keeps the reading position.
  useEffect(() => {
    if (status === "success") focusStatusPanel(successRef.current);
  }, [status]);

  // Focus the first invalid field AFTER React commits the error state.
  // It has to be an effect keyed on `errors`: focusFirstInvalid resolves its
  // target via `[aria-invalid="true"]`, and that attribute does not exist until
  // the setErrors re-render is committed. Calling it from the submit handler
  // (even inside requestAnimationFrame) races the commit and finds nothing —
  // verified in the browser: errors rendered, focus stayed on <body>.
  useEffect(() => {
    if (Object.keys(errors).length) focusFirstInvalid(ref.current);
  }, [errors]);

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
    const engagement = getEngagement();
    const payload = {
      name: String(fd.get("name") || ""),
      phone: String(fd.get("phone") || ""),
      project_type: String(fd.get("subject") || ""),
      message: String(fd.get("message") || "").trim(),
      consent: fd.get("consent") === "on",
      company: String(fd.get("company") || ""), // honeypot
      form_id: FORM_ID,
      form_page: window.location.pathname,
      attribution: getAttributionSnapshot(),
      engagement,
    };

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
        if (data.errors) {
          setErrors(data.errors);
        } else {
          setServerError("לא הצלחתי לקלוט את הפנייה כרגע.");
        }
        setStatus("error");
        return;
      }
      trackGenerateLead({
        form_id: FORM_ID,
        page: window.location.pathname,
        project_type: payload.project_type,
        lead_id: data.id,
        time_on_page_seconds: engagement.time_on_page_seconds,
        max_scroll_depth: engagement.max_scroll_depth,
        ...getCampaignDimensions(),
      });
      setStatus("success");
    } catch {
      setServerError("לא הצלחתי לקלוט את הפנייה כרגע.");
      setStatus("error");
    }
  }

  const fieldClass =
    "mt-1.5 w-full rounded-[4px] border border-line bg-bg2 px-3 py-2.5 outline-none transition focus:border-gold focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1";

  if (status === "success") {
    return (
      <div
        ref={successRef}
        tabIndex={-1}
        className="rounded-card border border-line bg-card p-7 text-center outline-none"
        role="status"
      >
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-gold bg-gold-soft text-xl text-gold-ink" aria-hidden>✓</span>
        <p className="mt-4 font-serif text-xl font-bold text-navy">הפרטים התקבלו, תודה!</p>
        <p className="mt-2 text-sm leading-relaxed text-muted">{responsePromise.promise}</p>
      </div>
    );
  }

  return (
    <form
      ref={ref}
      onSubmit={onSubmit}
      onFocusCapture={onFirstInteract}
      noValidate
      aria-label="טופס יצירת קשר"
      className="rounded-[10px] border border-line bg-card p-7 transition hover:border-gold/70"
    >
      <p className="font-serif text-xl font-bold text-navy">השאירי פרטים</p>
      <p className="mt-1 text-sm leading-relaxed text-muted">{responsePromise.promise}</p>

      {/* honeypot */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>אל תמלאו שדה זה<input type="text" name="company" tabIndex={-1} autoComplete="off" /></label>
      </div>

      <label className="mt-5 block text-sm font-semibold text-navy-700">
        שם מלא *
        <input
          type="text"
          name="name"
          required
          autoComplete="name"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "lead-name-err" : undefined}
          className={fieldClass}
        />
      </label>
      {errors.name && <p id="lead-name-err" role="alert" className="mt-1 text-sm text-bad">{errors.name}</p>}

      <label className="mt-4 block text-sm font-semibold text-navy-700">
        טלפון / וואטסאפ *
        <input
          type="tel"
          name="phone"
          inputMode="tel"
          required
          autoComplete="tel"
          aria-invalid={!!errors.phone}
          aria-describedby={errors.phone ? "lead-phone-err" : undefined}
          dir="ltr"
          className={fieldClass}
        />
      </label>
      {errors.phone && <p id="lead-phone-err" role="alert" className="mt-1 text-sm text-bad">{errors.phone}</p>}

      <label className="mt-4 block text-sm font-semibold text-navy-700">
        נושא הפנייה
        <select name="subject" className={fieldClass} defaultValue={SUBJECTS[0]}>
          {SUBJECTS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </label>

      {/* COPY §8/§16 — שדה חופשי «מה הכי מעסיק אותך עכשיו?» (אין שירות חזרה-בשעה; ההבטחה היחידה היא responsePromise) */}
      {/* a textarea, not an input: the ONE open question in the form should look
          like an invitation to write, not a one-line "keep it short" slot */}
      <label className="mt-4 block text-sm font-semibold text-navy-700">
        מה הכי מעסיק אותך עכשיו? (לא חובה)
        <textarea name="message" rows={3} className={fieldClass + " resize-none"} />
      </label>

      <label className="mt-5 flex items-start gap-3 text-sm leading-relaxed text-muted">
        <input
          type="checkbox"
          name="consent"
          required
          aria-invalid={!!errors.consent}
          aria-describedby={errors.consent ? "lead-consent-err" : undefined}
          className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-gold-dark)]"
        />
        {/* «ולא יועברו לצד שלישי» ירד: מדיניות הפרטיות §5 מונה חמישה מעבדים
            חיצוניים (אירוח, דיוור, מדידה), אז ההבטחה הקודמת סתרה את המסמך
            שהיא מקשרת אליו. הניסוח החדש נאמן לשניהם. */}
        <span>
          אני מאשרת ש{contactForm.consentBrandName} תיצור איתי קשר בנוגע לפנייתי. הפרטים נשמרים לצורך מענה בלבד,
          בהתאם ל
          <Link href="/privacy" target="_blank" className="font-semibold text-gold-ink underline hover:text-gold-dark">
            מדיניות הפרטיות
          </Link>
          .
        </span>
      </label>
      {errors.consent && <p id="lead-consent-err" role="alert" className="mt-1 text-sm text-bad">{errors.consent}</p>}

      {/* Server-error path always offers a way through. If the lead could not be
          delivered we must not leave her at a dead end with a promise we cannot
          keep — WhatsApp is the client's primary referral channel and reaches a
          real person. Rendered only when a number is configured. */}
      {serverError && (
        <div className="mt-4 rounded-[4px] bg-bad-soft px-3 py-2.5 text-sm text-bad" role="alert">
          <p>{serverError}</p>
          {site.whatsapp && (
            <p className="mt-1">
              אפשר לכתוב לי ישירות ב
              <a
                href={`https://wa.me/${site.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                data-cta="lead-error-whatsapp"
                className="font-bold underline underline-offset-2"
              >
                וואטסאפ
              </a>
              , ואחזור אלייך משם.
            </p>
          )}
        </div>
      )}

      {/* Same silhouette as every other primary CTA on the site (and as
          ContactQuietForm's submit): btn-chamfer rounded-[6px] bg-gold. The ring
          moves gold → navy because the button itself is now gold: a gold ring on a
          gold button is an invisible focus state. Navy reads against the white card
          the offset sits on. */}
      <button
        type="submit"
        data-cta="contact-form-submit"
        disabled={status === "submitting"}
        className="btn-chamfer mt-6 w-full rounded-[6px] bg-gold px-7 py-3.5 font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 disabled:opacity-60"
      >
        {status === "submitting" ? "שולחת…" : "שליחה"}
      </button>
    </form>
  );
}
