"use client";
import { useState } from "react";
import { DUR, EASE, cssDur, cssEase } from "@/lib/motion-tokens";
import { brand } from "@/brand.config";
import { T } from "@/lib/cms/desk-strings";
import { BrandLogo } from "@/components/BrandLogo";

// The whole login surface: type an email, get a link. No password to lose, no
// account to create. The response is identical for an unknown address (the server
// never reveals who is allowed), so the copy says "if the address is authorized".
export function LoginCard() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
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

        {sent ? (
          <p className="mt-5 leading-relaxed text-muted">
            {T("login.sent")}
          </p>
        ) : (
          <>
            <p className="mt-3 leading-relaxed text-muted">
              {T("login.prompt")}
            </p>
            <form onSubmit={submit} className="mt-7 text-start">
              <label htmlFor="cms-email" className="text-sm font-semibold text-ink">
                {T("login.emailLabel")}
              </label>
              <input
                id="cms-email"
                type="email"
                required
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-[4px] border border-line bg-bg2 px-4 py-3 text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
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
          </>
        )}
      </div>
    </main>
  );
}
