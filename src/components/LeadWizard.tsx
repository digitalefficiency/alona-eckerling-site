"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { getAttributionSnapshot, getCampaignDimensions } from "@/lib/attribution";
import { getEngagement } from "@/lib/engagement";
import { track, trackFormView, trackFormStart, trackGenerateLead } from "@/lib/analytics";
import { motionAllowed } from "@/lib/motion";
import { contactForm } from "@/lib/site";

// LeadWizard — the niche qualifier quiz that EARNS a multi-step lead ask.
// One question per view (progress dots, back), then the ≤5-field lead close
// (name/phone/consent → /api/lead with ContactLeadForm's exact plumbing:
// honeypot, attribution+engagement, PII only in the POST body). The steps are
// justified by a promised artifact (design-field-notes.md #6) — pass `results`
// so the close opens with the matched deliverable (dev-warns when ≥3 steps
// promise nothing). Funnel: form_view → form_start → lead_tool_step per answer
// (option VALUES are non-PII slugs) → generate_lead with every answer as a
// tool_<stepId> dimension. SSR/no-JS renders the FULL first question — nothing
// hidden; step swaps animate via motion tokens only, and only when
// motionAllowed(). ZERO vertical copy lives here — questions/options/results
// arrive as props (recipes: component-catalog.md → "Lead tools").

const FORM_ID = "lead-wizard";
const useIso = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export type LeadWizardStep = {
  id: string; // stable slug → the tool_<id> dataLayer dimension
  question: string;
  options: { label: string; value: string }[]; // value = non-PII slug
};
export type LeadWizardResult = {
  match: Record<string, string>; // stepId → option value; first FULL match wins
  headline: string; // the named deliverable that justifies the steps
  body: string;
};

type Status = "idle" | "submitting" | "success" | "error";

export function LeadWizard({
  title,
  steps,
  results,
  ctaLabel,
  tone = "light", // "dark" lifts the card off navy bands
}: {
  title: string;
  steps: LeadWizardStep[];
  results?: LeadWizardResult[];
  ctaLabel: string;
  tone?: "light" | "dark";
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const questionRef = useRef<HTMLParagraphElement>(null);
  const started = useRef(false);
  const mounted = useRef(false);
  const [view, setView] = useState(0); // 0..steps.length-1 = questions; steps.length = lead close
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [swap, setSwap] = useState(false); // armed-hidden step entrance — post-interaction only
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");

  if (process.env.NODE_ENV !== "production" && steps.length >= 3 && !results?.length) {
    console.warn(`[LeadWizard] "${title}" asks ≥3 qualifying steps without \`results\` — a multi-step ask must promise a named deliverable (design-field-notes.md #6 / premium-tier conversion rubric).`);
  }

  useEffect(() => { // form_view once, when the wizard scrolls into view
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { trackFormView(FORM_ID, window.location.pathname); io.disconnect(); }
    }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useIso(() => { // step-swap entrance — never on first paint (SSR = the final design)
    if (!mounted.current) { mounted.current = true; return; }
    questionRef.current?.focus({ preventScroll: true });
    if (!motionAllowed()) return;
    setSwap(true); // arm hidden pre-paint, release after one painted frame
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => { raf2 = requestAnimationFrame(() => setSwap(false)); });
    return () => { cancelAnimationFrame(raf1); cancelAnimationFrame(raf2); setSwap(false); };
  }, [view]);

  const pick = (step: LeadWizardStep, index: number, value: string) => {
    if (!started.current) { started.current = true; trackFormStart(FORM_ID, window.location.pathname); }
    setAnswers((a) => ({ ...a, [step.id]: value }));
    track("lead_tool_step", { form_id: FORM_ID, page: window.location.pathname, step_id: step.id, step_index: index, value });
    setView(index + 1);
  };

  const matched = results?.find((r) => Object.entries(r.match).every(([k, v]) => answers[k] === v));

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "submitting") return;
    setErrors({}); setServerError("");
    const fd = new FormData(e.currentTarget);
    const engagement = getEngagement();
    const labelOf = (s: LeadWizardStep) => s.options.find((o) => o.value === answers[s.id])?.label ?? "";
    const payload = {
      name: String(fd.get("name") || ""),
      phone: String(fd.get("phone") || ""),
      project_type: matched?.headline || labelOf(steps[0]),
      message: steps.map((s) => `${s.question} — ${labelOf(s)}`).join("\n"),
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
    if (Object.keys(next).length) { setErrors(next); return; }
    setStatus("submitting");
    try {
      const res = await fetch("/api/lead", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        if (data.errors) setErrors(data.errors); else setServerError("אירעה תקלה בשליחה. נסו שוב מאוחר יותר.");
        setStatus("error"); return;
      }
      trackGenerateLead({
        form_id: FORM_ID,
        page: window.location.pathname,
        lead_id: data.id,
        ...Object.fromEntries(steps.map((s) => [`tool_${s.id}`, answers[s.id] ?? ""])), // answers = non-PII slugs
        ...(matched ? { tool_result: matched.headline } : {}),
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

  if (!steps.length) return null;
  const total = steps.length + 1;
  const step = view < steps.length ? steps[view] : null;
  const fieldClass = "mt-1.5 w-full rounded-[4px] border border-line bg-bg2 px-3 py-2.5 outline-none transition focus:border-gold focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1";
  const swapClass = `transition-all duration-[var(--dur-micro)] ease-[var(--ease-micro)] ${swap ? "translate-y-2 opacity-0" : "translate-y-0 opacity-100"}`;

  if (status === "success") return (
    <div className="rounded-[10px] border border-line bg-card p-7 text-center" role="status">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-gold bg-gold-soft text-xl text-gold-ink" aria-hidden>✓</span>
      <p className="mt-4 font-serif text-xl font-bold text-navy">הפרטים התקבלו — תודה!</p>
      {matched && <p className="mt-2 text-sm leading-relaxed text-muted">{matched.headline}</p>}
    </div>
  );

  return (
    <div ref={rootRef} className={`relative rounded-[10px] border bg-card p-6 sm:p-7 ${tone === "dark" ? "border-white/10 shadow-[var(--elevation-1)]" : "border-line"}`}>
      <div className="flex items-center justify-between gap-4">
        <p className="font-serif text-xl font-bold text-navy">{title}</p>
        <div className="flex shrink-0 items-center gap-1.5" aria-hidden>
          {Array.from({ length: total }, (_, i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all duration-[var(--dur-micro)] ease-[var(--ease-micro)] ${i === view ? "w-5 bg-gold" : i < view ? "w-1.5 bg-navy" : "w-1.5 bg-line"}`} />
          ))}
        </div>
      </div>
      <p className="sr-only" aria-live="polite">שלב {view + 1} מתוך {total}</p>

      {step ? (
        <div key={step.id} className={`mt-5 ${swapClass}`} role="group" aria-labelledby={`lw-q-${step.id}`}>
          <p id={`lw-q-${step.id}`} ref={questionRef} tabIndex={-1} className="font-semibold leading-snug text-navy-700 outline-none">{step.question}</p>
          <div className="mt-3 grid gap-2.5">
            {step.options.map((o) => {
              const selected = answers[step.id] === o.value;
              return (
                <button key={o.value} type="button" data-cta="lead-wizard-option" aria-pressed={selected}
                  onClick={() => pick(step, view, o.value)}
                  className={`flex items-center justify-between gap-3 rounded-[4px] border px-4 py-3 text-start transition hover:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1 ${selected ? "border-gold bg-gold-soft/40 text-navy" : "border-line bg-bg2 text-navy-700"}`}>
                  <span className="text-sm font-semibold leading-snug">{o.label}</span>
                  <span className={`text-[0.6rem] leading-none text-gold ${selected ? "" : "opacity-0"}`} aria-hidden>◆</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate aria-label={title} className={`mt-5 ${swapClass}`}>
          {matched && (
            <div className="rounded-[4px] border border-gold/50 bg-gold-soft/40 p-4">
              <p className="flex items-start gap-2 font-serif font-bold leading-snug text-navy">
                <span className="mt-1.5 text-[0.6rem] leading-none text-gold" aria-hidden>◆</span>{matched.headline}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{matched.body}</p>
            </div>
          )}
          {/* honeypot */}
          <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
            <label>אל תמלאו שדה זה<input type="text" name="company" tabIndex={-1} autoComplete="off" /></label>
          </div>
          <label className="mt-4 block text-sm font-semibold text-navy-700">שם מלא *
            <input type="text" name="name" required autoComplete="name" aria-invalid={!!errors.name} className={fieldClass} />
          </label>
          {errors.name && <p className="mt-1 text-sm text-bad">{errors.name}</p>}
          <label className="mt-4 block text-sm font-semibold text-navy-700">טלפון *
            <input type="tel" name="phone" inputMode="tel" required autoComplete="tel" aria-invalid={!!errors.phone} dir="ltr" className={fieldClass} />
          </label>
          {errors.phone && <p className="mt-1 text-sm text-bad">{errors.phone}</p>}
          <label className="mt-5 flex items-start gap-3 text-sm leading-relaxed text-muted">
            <input type="checkbox" name="consent" required aria-invalid={!!errors.consent} className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-gold-dark)]" />
            <span>
              אני מאשר/ת ש{contactForm.consentBrandName} ייצור עמי קשר בנוגע לפנייתי. הפרטים נשמרים לצורך מענה בלבד ולא יועברו לצד שלישי, בהתאם ל
              <Link href="/privacy" target="_blank" className="font-semibold text-gold-ink underline hover:text-gold-dark">מדיניות הפרטיות</Link>.
            </span>
          </label>
          {errors.consent && <p className="mt-1 text-sm text-bad">{errors.consent}</p>}
          {serverError && <p className="mt-4 rounded-[4px] bg-bad/10 px-3 py-2 text-sm text-bad" role="alert">{serverError}</p>}
          <button type="submit" data-cta="lead-wizard-submit" disabled={status === "submitting"}
            className="mt-5 w-full rounded-[4px] bg-navy px-7 py-3.5 font-bold text-white transition hover:bg-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 disabled:opacity-60">
            {status === "submitting" ? "שולח…" : ctaLabel}
          </button>
        </form>
      )}

      {view > 0 && (
        <button type="button" data-cta="lead-wizard-back" onClick={() => setView((v) => v - 1)}
          className="mt-4 rounded-[4px] text-sm font-semibold text-muted transition hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold">
          חזרה לשאלה הקודמת
        </button>
      )}
    </div>
  );
}
