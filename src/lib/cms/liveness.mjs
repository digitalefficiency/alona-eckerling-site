// ============================================================================
// liveness.mjs — "is my publish actually on the live site?", as a pure decision,
// so the regression harness exercises the REAL rule rather than a copy of it.
//
// The mechanism (verified against Vercel's docs, not folklore):
//   • Every deployment is immutable and carries its own VERCEL_GIT_COMMIT_SHA,
//     readable AT RUNTIME. The production domain is an alias — a pointer.
//   • While the build runs the alias still targets the OLD deployment, so the
//     status endpoint reports the OLD sha. That is the "not live yet" signal,
//     not a failure: the running function never has to learn about the build.
//   • On success Vercel re-points the alias; the next poll hits the NEW
//     deployment and reads the new sha.
//   • The poll is a raw client-component fetch, which Vercel's Skew Protection
//     does not pin to the originating deployment, so it always resolves to
//     whatever the alias currently targets.
//
// Two rules exist because "serving sha === my sha" is too strict and too loose:
//   TOO STRICT — someone else's commit (the owner, a second tab, a retainer
//     cycle) can land between the publish and the build. The deployment that
//     goes live then carries THEIR sha while containing OUR post. Exact-match
//     would sit in "building" forever and end in a support call. So a commit
//     that is an ANCESTOR of the serving commit counts as live.
//   TOO LOOSE — an absent VERCEL_GIT_COMMIT_SHA must never be read as "live".
//     Off-Vercel it means local dev (fine). ON Vercel it means the project
//     disabled system env vars, and answering "live" there is a lie told to a
//     client whose post is not up. Unknown is never success.
// ============================================================================

/** @typedef {"local"|"exact"|"contained"|"building"|"no-vercel-metadata"|"bad-sha"} LivenessReason */

const SHA_RE = /^[0-9a-f]{7,40}$/;

/**
 * @param {{ onVercel: boolean, servingSha: string|undefined, commitSha: string|undefined,
 *           containment?: "contained"|"not-contained"|"unknown" }} input
 * @returns {{ live: boolean, reason: LivenessReason }}
 */
export function livenessVerdict({ onVercel, servingSha, commitSha, containment = "unknown" }) {
  const ours = String(commitSha ?? "").toLowerCase();
  const serving = String(servingSha ?? "").toLowerCase();

  // Not on Vercel at all → `next dev` on the owner's machine. Nothing to verify.
  if (!onVercel) return { live: true, reason: "local" };

  if (!SHA_RE.test(ours)) return { live: false, reason: "bad-sha" };

  // On Vercel with no commit metadata: the project turned off "expose System
  // Environment Variables". We cannot verify, so we must not claim.
  if (!serving) return { live: false, reason: "no-vercel-metadata" };

  if (serving === ours) return { live: true, reason: "exact" };
  if (containment === "contained") return { live: true, reason: "contained" };

  // "not-contained" (an older deployment is still serving) and "unknown" (the
  // ancestry probe failed) both mean: keep waiting. Never guess upward.
  return { live: false, reason: "building" };
}
