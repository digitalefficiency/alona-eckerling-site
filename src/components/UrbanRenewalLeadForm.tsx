"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { site } from "@/lib/site";
import { getAttributionSnapshot, getCampaignDimensions } from "@/lib/attribution";
import { getEngagement } from "@/lib/engagement";
import { trackFormView, trackFormStart, trackGenerateLead } from "@/lib/analytics";

const FORM_ID = "urban-renewal-lead";

const PROJECT_TYPES = [
  "תמ\"א 38 (חיזוק / הריסה ובנייה)",
  "פינוי-בינוי",
  "נציגות בית משותף",
  "עדיין לא בטוח/ה",
];

type Status = "idle" | "submitting" | "success" | "error";

export function UrbanRenewalLeadForm() {
  const sectionRef = useRef<HTMLElement>(null);
  const started = useRef(false);
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");

  // Fire form_view once when the form scrolls into view.
  useEffect(() => {
    const el = sectionRef.current;
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
      email: String(fd.get("email") || ""),
      city: String(fd.get("city") || ""),
      project_type: String(fd.get("project_type") || ""),
      message: String(fd.get("message") || ""),
      consent: fd.get("consent") === "on",
      company: String(fd.get("company") || ""), // honeypot
      form_id: FORM_ID,
      form_page: window.location.pathname,
      attribution: getAttributionSnapshot(),
      engagement,
    };

    // Client-side guard (server re-validates).
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
        else setServerError("אירעה תקלה בשליחה. נסו שוב או חייגו אלינו.");
        setStatus("error");
        return;
      }
      // Conversion event — non-PII dimensions only.
      trackGenerateLead({
        form_id: FORM_ID,
        page: window.location.pathname,
        project_type: payload.project_type,
        lead_city: payload.city,
        lead_id: data.id,
        time_on_page_seconds: engagement.time_on_page_seconds,
        max_scroll_depth: engagement.max_scroll_depth,
        ...getCampaignDimensions(),
      });
      setStatus("success");
    } catch {
      setServerError("אירעה תקלה בשליחה. נסו שוב או חייגו אלינו.");
      setStatus("error");
    }
  }

  const fieldClass =
    "mt-1.5 w-full rounded-[4px] border border-line bg-white px-4 py-3 text-navy outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/30";
  const labelClass = "block text-sm font-bold text-navy-700";
  const errClass = "mt-1 text-sm text-bad";

  return (
    <section ref={sectionRef} id="lead" className="relative overflow-hidden bg-navy text-white">
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.06]"
        style={{ backgroundImage: "url('/media/texture/blueprint.webp')", backgroundSize: "cover" }}
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: "radial-gradient(820px 360px at 80% -20%, rgba(200,164,92,.16), transparent 60%)" }}
      />
      <div className="relative mx-auto grid max-w-[var(--container-standard)] grid-cols-1 gap-12 px-4 py-16 sm:px-6 sm:py-20 md:py-24 lg:grid-cols-[1fr_1.05fr] lg:items-center">
        {/* Persuasion column */}
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-[0.7rem] leading-none text-gold" aria-hidden>◆</span>
            <span className="h-px w-12 bg-gold/40" aria-hidden />
            <span className="font-serif tracking-wide text-gold-soft" style={{ fontSize: "clamp(1.4rem,3vw,2rem)" }}>
              CHECK WHAT YOU DESERVE
            </span>
          </div>
          <h2 className="mt-5 font-serif text-3xl font-black leading-tight text-white md:text-[2.6rem]">
            לפני שאתם חותמים — בדקו שהתמורה הוגנת
          </h2>
          <p className="mt-5 max-w-[46ch] text-lg leading-relaxed text-slate-200">
            השאירו פרטים ושמאי מהמשרד יחזור אליכם לשיחת ייעוץ ראשונית — נבין את הפרויקט שלכם
            ונאמר לכם איפה אתם עומדים. ללא התחייבות.
          </p>
          <ul className="mt-7 space-y-3 text-slate-100">
            {[
              "ניתוח שווי הזכויות שאתם מוסרים מול התמורה המוצעת",
              "ליווי נציגויות ובעלי דירות — שלושה דורות של שמאות",
              "חוות דעת הקבילה גם כראיה בבית המשפט",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3">
                <span className="mt-1 font-mono text-gold" aria-hidden>▸</span>
                <span className="leading-snug">{t}</span>
              </li>
            ))}
          </ul>
          {site.phone && (
            <a
              href={`tel:${site.phone}`}
              data-cta="urban-renewal-phone"
              className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-gold-soft hover:underline"
            >
              או חייגו עכשיו: <span dir="ltr">{site.phone}</span>
            </a>
          )}
        </div>

        {/* Form column */}
        <div className="rounded-[12px] border border-white/10 bg-white p-6 text-navy shadow-[0_30px_90px_-40px_rgba(0,0,0,.7)] md:p-8">
          {status === "success" ? (
            <div className="py-8 text-center" role="status">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-gold bg-gold-soft text-2xl text-gold-ink" aria-hidden>✓</span>
              <h3 className="mt-5 font-serif text-2xl font-bold text-navy">הפרטים התקבלו — תודה!</h3>
              <p className="mt-3 leading-relaxed text-muted">
                שמאי מהמשרד יחזור אליכם בהקדם. בינתיים, אתם מוזמנים לעיין במדריכים המקצועיים שלנו.
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmit} onFocusCapture={onFirstInteract} noValidate aria-label="טופס יצירת קשר — התחדשות עירונית">
              <p className="font-serif text-xl font-bold text-navy">קבלו בדיקה ראשונית</p>
              <p className="mt-1 text-sm text-muted">מלאו את הפרטים — ללא התחייבות.</p>

              {/* honeypot (hidden from users + AT) */}
              <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden" >
                <label>אל תמלאו שדה זה
                  <input type="text" name="company" tabIndex={-1} autoComplete="off" />
                </label>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass} htmlFor="lf-name">שם מלא *</label>
                  <input id="lf-name" name="name" type="text" required autoComplete="name"
                    aria-invalid={!!errors.name} className={fieldClass} />
                  {errors.name && <p className={errClass}>{errors.name}</p>}
                </div>
                <div>
                  <label className={labelClass} htmlFor="lf-phone">טלפון *</label>
                  <input id="lf-phone" name="phone" type="tel" inputMode="tel" required autoComplete="tel"
                    aria-invalid={!!errors.phone} className={fieldClass} dir="ltr" />
                  {errors.phone && <p className={errClass}>{errors.phone}</p>}
                </div>
                <div>
                  <label className={labelClass} htmlFor="lf-email">אימייל</label>
                  <input id="lf-email" name="email" type="email" autoComplete="email" className={fieldClass} dir="ltr" />
                </div>
                <div>
                  <label className={labelClass} htmlFor="lf-city">עיר / כתובת הנכס</label>
                  <input id="lf-city" name="city" type="text" autoComplete="address-level2" className={fieldClass} />
                </div>
              </div>

              <div className="mt-4">
                <label className={labelClass} htmlFor="lf-type">סוג הפרויקט</label>
                <select id="lf-type" name="project_type" className={fieldClass} defaultValue="">
                  <option value="" disabled>בחרו…</option>
                  {PROJECT_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="mt-4">
                <label className={labelClass} htmlFor="lf-msg">פרטים נוספים (אופציונלי)</label>
                <textarea id="lf-msg" name="message" rows={3} className={fieldClass} />
              </div>

              <label className="mt-5 flex items-start gap-3 text-sm leading-relaxed text-muted">
                <input type="checkbox" name="consent" required aria-invalid={!!errors.consent}
                  className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-gold-dark)]" />
                <span>
                  אני מאשר/ת שמשרד ברזילי ייצור עמי קשר בנוגע לפנייתי. הפרטים נשמרים לצורך
                  מענה בלבד ולא יועברו לצד שלישי, בהתאם ל
                  <Link href="/privacy" target="_blank" className="font-semibold text-gold-ink underline hover:text-gold-dark">
                    מדיניות הפרטיות
                  </Link>
                  .
                </span>
              </label>
              {errors.consent && <p className={errClass}>{errors.consent}</p>}

              {serverError && <p className="mt-4 rounded-[4px] bg-bad/10 px-3 py-2 text-sm text-bad" role="alert">{serverError}</p>}

              <button
                type="submit"
                data-cta="urban-renewal-submit"
                disabled={status === "submitting"}
                className="mt-6 w-full rounded-[4px] bg-navy px-6 py-4 font-bold text-white transition hover:bg-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 disabled:opacity-60"
              >
                {status === "submitting" ? "שולח…" : "שליחה — לבדיקה ללא התחייבות"}
              </button>
              <p className="mt-3 text-center text-xs text-muted">
                המידע אינו מהווה ייעוץ שמאי או משפטי פרטני. כל פרויקט נבחן לגופו.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
