"use client";
import { useState } from "react";
import { DUR, EASE, cssDur, cssEase } from "@/lib/motion-tokens";
import { brand } from "@/brand.config";
import { T } from "@/lib/cms/desk-strings";
import { BrandLogo } from "@/components/BrandLogo";

// The whole login surface, with two doors and one line of honesty each.
//
// PASSWORD IS THE FIRST DOOR (Rom's call): it depends on nothing but this
// server, so a mail-provider outage or an expired API key cannot lock the
// editor out. The magic link stays as the second door for the day the password
// is forgotten.
//
// Every failure is the SAME generic message. A form that says "wrong password"
// has already confirmed the email exists, and this desk never confirms who is
// allowed — the same rule the magic-link route has always held.
export function LoginCard() {
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitMagic(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await fetch("/api/cms/auth/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).catch(() => {});
    setBusy(false);
    setSent(true);
  }

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/cms/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        // the session cookie is set; the server component decides what to show
        window.location.reload();
        return;
      }
      setError(T(res.status === 429 ? "login.tooMany" : "login.badCredentials"));
    } catch {
      setError(T("login.badCredentials"));
    }
    setBusy(false);
  }

  const inputClass =
    "mt-2 w-full rounded-[4px] border border-line bg-bg2 px-4 py-3 text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold";

  return (
    <main className="grid min-h-screen place-items-center bg-sand px-6" dir={brand.direction}>
      <div
        className="w-full max-w-[420px] rounded-[10px] border border-line bg-card p-10 text-center"
        style={{ transition: `opacity ${cssDur(DUR.reveal)} ${cssEase(EASE.out)}` }}
      >
        <div className="flex justify-center">
          <BrandLogo className="h-9 w-auto" />
        </div>
        <h1 className="mt-4 font-serif text-2xl font-black text-ink">{T("admin.deskTitle")}</h1>

        {mode === "password" ? (
          <>
            <p className="mt-3 leading-relaxed text-muted">{T("login.passwordPrompt")}</p>
            <form onSubmit={submitPassword} className="mt-7 text-start">
              <label htmlFor="cms-email" className="text-sm font-semibold text-ink">
                {T("login.emailLabel")}
              </label>
              <input
                id="cms-email"
                type="email"
                autoComplete="username"
                required
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
              <label htmlFor="cms-password" className="mt-4 block text-sm font-semibold text-ink">
                {T("login.passwordLabel")}
              </label>
              <input
                id="cms-password"
                type="password"
                autoComplete="current-password"
                required
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
              {error && (
                <p role="alert" className="mt-3 text-sm font-semibold text-bad">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={busy}
                className="mt-5 w-full rounded-[4px] bg-ink px-6 py-3.5 font-bold text-bg transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-60"
                style={{ transitionDuration: cssDur(DUR.micro), transitionTimingFunction: cssEase(EASE.micro) }}
              >
                {busy ? T("login.checking") : T("login.enter")}
              </button>
            </form>
            <button
              type="button"
              onClick={() => {
                setMode("magic");
                setError(null);
              }}
              className="mt-5 text-sm font-semibold text-gold-ink underline-offset-4 hover:underline"
            >
              {T("login.magicInstead")}
            </button>
          </>
        ) : sent ? (
          <p className="mt-5 leading-relaxed text-muted">{T("login.sent")}</p>
        ) : (
          <>
            <p className="mt-3 leading-relaxed text-muted">{T("login.prompt")}</p>
            <form onSubmit={submitMagic} className="mt-7 text-start">
              <label htmlFor="cms-email-magic" className="text-sm font-semibold text-ink">
                {T("login.emailLabel")}
              </label>
              <input
                id="cms-email-magic"
                type="email"
                required
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
              <button
                type="submit"
                disabled={busy}
                className="mt-5 w-full rounded-[4px] bg-ink px-6 py-3.5 font-bold text-bg transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-60"
                style={{ transitionDuration: cssDur(DUR.micro), transitionTimingFunction: cssEase(EASE.micro) }}
              >
                {busy ? T("login.sending") : T("login.submit")}
              </button>
            </form>
            <button
              type="button"
              onClick={() => setMode("password")}
              className="mt-5 text-sm font-semibold text-gold-ink underline-offset-4 hover:underline"
            >
              {T("login.passwordInstead")}
            </button>
          </>
        )}
      </div>
    </main>
  );
}
