"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getAttributionSnapshot, getCampaignDimensions } from "@/lib/attribution";
import { getEngagement } from "@/lib/engagement";
import { trackFormView, trackFormStart, trackGenerateLead } from "@/lib/analytics";
import { contactForm } from "@/lib/site";

const FORM_ID = "contact";

// Subject options come from the per-site config (lib/site.ts → contactForm).
const SUBJECTS = contactForm.subjects;

type Status = "idle" | "submitting" | "success" | "error";

// The site's main contact form — captures the lead via /api/lead with full
// marketing attribution + engagement, and fires the same dataLayer funnel as
// the urban-renewal form. PII goes only in the POST body (never URL/dataLayer).
export function ContactLeadForm() {
  const ref = useRef<HTMLFormElement>(null);
  const started = useRef(false);
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");

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
    const time = String(fd.get("time") || "").trim();
    const engagement = getEngagement();
    const payload = {
      name: String(fd.get("name") || ""),
      phone: String(fd.get("phone") || ""),
      project_type: String(fd.get("subject") || ""),
      message: time ? `שעת חזרה מועדפת: ${time}` : "",
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
        if (data.errors) setErrors(data.errors);
        else setServerError("אירעה תקלה בשליחה. נסו שוב מאוחר יותר.");
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
      setServerError("אירעה תקלה בשליחה. נסו שוב מאוחר יותר.");
      setStatus("error");
    }
  }

  const fieldClass =
    "mt-1.5 w-full rounded-[4px] border border-line bg-bg2 px-3 py-2.5 outline-none transition focus:border-gold focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1";

  if (status === "success") {
    return (
      <div className="rounded-[10px] border border-line bg-card p-7 text-center" role="status">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-gold bg-gold-soft text-xl text-gold-ink" aria-hidden>✓</span>
        <p className="mt-4 font-serif text-xl font-bold text-navy">הפרטים התקבלו — תודה!</p>
        <p className="mt-2 text-sm leading-relaxed text-muted">נחזור אליכם בשעה שנוחה לכם.</p>
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
      <p className="font-serif text-xl font-bold text-navy">השאירו פרטים</p>
      <p className="mt-1 text-sm leading-relaxed text-muted">נחזור אליכם בשעה שנוחה לכם.</p>

      {/* honeypot */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>אל תמלאו שדה זה<input type="text" name="company" tabIndex={-1} autoComplete="off" /></label>
      </div>

      <label className="mt-5 block text-sm font-semibold text-navy-700">
        שם מלא *
        <input type="text" name="name" required autoComplete="name" aria-invalid={!!errors.name} className={fieldClass} />
      </label>
      {errors.name && <p className="mt-1 text-sm text-bad">{errors.name}</p>}

      <label className="mt-4 block text-sm font-semibold text-navy-700">
        טלפון *
        <input type="tel" name="phone" inputMode="tel" required autoComplete="tel" aria-invalid={!!errors.phone} dir="ltr" className={fieldClass} />
      </label>
      {errors.phone && <p className="mt-1 text-sm text-bad">{errors.phone}</p>}

      <label className="mt-4 block text-sm font-semibold text-navy-700">
        נושא הפנייה
        <select name="subject" className={fieldClass} defaultValue={SUBJECTS[0]}>
          {SUBJECTS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </label>

      <label className="mt-4 block text-sm font-semibold text-navy-700">
        שעת חזרה מועדפת
        <input type="text" name="time" placeholder="למשל: בבוקר / אחה״צ" className={fieldClass} />
      </label>

      <label className="mt-5 flex items-start gap-3 text-sm leading-relaxed text-muted">
        <input type="checkbox" name="consent" required aria-invalid={!!errors.consent} className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-gold-dark)]" />
        <span>
          אני מאשר/ת ש{contactForm.consentBrandName} ייצור עמי קשר בנוגע לפנייתי. הפרטים נשמרים לצורך מענה בלבד ולא
          יועברו לצד שלישי, בהתאם ל
          <Link href="/privacy" target="_blank" className="font-semibold text-gold-ink underline hover:text-gold-dark">
            מדיניות הפרטיות
          </Link>
          .
        </span>
      </label>
      {errors.consent && <p className="mt-1 text-sm text-bad">{errors.consent}</p>}

      {serverError && <p className="mt-4 rounded-[4px] bg-bad/10 px-3 py-2 text-sm text-bad" role="alert">{serverError}</p>}

      <button
        type="submit"
        data-cta="contact-form-submit"
        disabled={status === "submitting"}
        className="mt-6 w-full rounded-[4px] bg-navy px-7 py-3.5 font-bold text-white transition hover:bg-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 disabled:opacity-60"
      >
        {status === "submitting" ? "שולח…" : "שליחה"}
      </button>
    </form>
  );
}
