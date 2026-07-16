"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { DUR, EASE, cssDur, cssEase } from "@/lib/motion-tokens";
import type { ActionResult } from "@/lib/cms/actions";
import { T } from "@/lib/cms/desk-strings";

// Publishing writes a commit; Vercel then rebuilds and re-points the production
// alias. Until that happens the post is NOT on the site — so we poll
// /api/cms/status with the commit sha instead of declaring victory on the commit.
//
// THE RULE THIS COMPONENT EXISTS TO KEEP: never tell the client something is live
// unless the site says it is. Which means:
//   • only a real PUBLISH gets the liveness poll. A draft is committed but hidden
//     by design, so it has no "went live" state to verify and must never be
//     announced as one. A delete redirects back to the list before any verdict.
//   • when the site cannot answer (a project with system env vars disabled), we
//     say we cannot verify — we do not round up to "published".
//   • a timeout means SLOW, not failed. Vercel keeps the old build serving, so
//     nothing is broken; the copy says so and offers another look instead of
//     sending the client to support.
const POLL_MS = 6000;
// A cold build of this template (three.js + motion) can run well past the usual
// ~2 minutes. 5 minutes was tight enough to cry wolf on a successful publish.
const GIVE_UP_MS = 10 * 60 * 1000;

type Status = { live?: boolean; reason?: string };

export function PublishBar({
  pending,
  result,
  onDraft,
  onPublish,
}: {
  pending: boolean;
  result: ActionResult | null;
  onDraft: () => void;
  onPublish: () => void;
}) {
  // A draft/delete/settings result carries a sha too — but only a publish has a
  // public consequence worth verifying. This single guard is what keeps a saved
  // draft from eventually announcing itself as live on the site.
  const sha = result?.ok && result.kind === "publish" ? result.sha : undefined;

  const [live, setLive] = useState(false);
  const [reason, setReason] = useState<string | undefined>();
  const [timedOut, setTimedOut] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const cancelled = useRef(false);
  const micro = { transitionDuration: cssDur(DUR.micro), transitionTimingFunction: cssEase(EASE.micro) };

  useEffect(() => {
    if (!sha) return;
    cancelled.current = false;
    setLive(false);
    setTimedOut(false);
    setReason(undefined);

    const started = Date.now();
    let timer: ReturnType<typeof setTimeout>;

    // setTimeout-reschedule, not setInterval: a slow poll can never overlap the
    // next one, and nothing writes state after unmount.
    const tick = async () => {
      if (cancelled.current) return;
      if (Date.now() - started > GIVE_UP_MS) {
        setTimedOut(true);
        return;
      }
      try {
        const r = await fetch(`/api/cms/status?sha=${sha}`, { cache: "no-store" });
        const j = (await r.json()) as Status;
        if (cancelled.current) return;
        if (j.reason) setReason(j.reason);
        if (j.live) {
          setLive(true);
          return;
        }
      } catch {
        /* transient network blip — keep waiting until GIVE_UP_MS */
      }
      if (!cancelled.current) timer = setTimeout(tick, POLL_MS);
    };
    timer = setTimeout(tick, POLL_MS);

    return () => {
      cancelled.current = true;
      clearTimeout(timer);
    };
  }, [sha, attempt]);

  const checkAgain = useCallback(() => setAttempt((a) => a + 1), []);
  const fieldErrors = result && !result.ok ? result.errors.filter((e) => e.field !== "general") : [];

  return (
    <div
      className="rounded-[10px] border border-line bg-card p-5"
      style={{ transition: `border-color ${cssDur(DUR.micro)} ${cssEase(EASE.micro)}` }}
    >
      <button
        type="button"
        onClick={onPublish}
        disabled={pending}
        className="w-full rounded-[4px] bg-ink px-6 py-3.5 font-bold text-bg transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-60"
        style={micro}
      >
        {pending ? T("common.saving") : T("publish.publish")}
      </button>
      <button
        type="button"
        onClick={onDraft}
        disabled={pending}
        className="mt-3 w-full rounded-[4px] border border-line px-6 py-3 text-sm font-bold text-ink transition-colors hover:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-60"
        style={micro}
      >
        {T("publish.saveDraft")}
      </button>

      {result?.ok && (
        <div className="mt-4 text-sm leading-relaxed text-muted">
          <p>{statusLine(result, { live, reason, timedOut })}</p>
          {sha && !live && timedOut && (
            <button
              type="button"
              onClick={checkAgain}
              className="mt-3 font-semibold text-gold-ink underline-offset-4 hover:underline"
              style={micro}
            >
              {T("publish.checkAgain")}
            </button>
          )}
        </div>
      )}

      {fieldErrors.length > 0 && (
        <div className="mt-4 border-t border-line pt-4">
          <p className="text-sm font-bold text-ink">{T("publish.fixBeforePublish")}</p>
          <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-muted">
            {fieldErrors.map((e, i) => (
              <li key={i}>• {e.msg}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function statusLine(
  result: Extract<ActionResult, { ok: true }>,
  poll: { live: boolean; reason?: string; timedOut: boolean },
): string {
  if (result.prUrl) return T("publish.pendingApproval");
  if (result.kind !== "publish") return result.message;

  if (poll.live) {
    // "local" means `next dev` on the owner's machine: the site was never built,
    // so say what actually happened rather than borrowing the production wording.
    return poll.reason === "local" ? T("publish.savedLocal") : T("publish.liveConfirmed");
  }
  if (poll.reason === "no-vercel-metadata") {
    return T("publish.savedNoVerify");
  }
  if (poll.timedOut) {
    return T("publish.building");
  }
  return result.message;
}
