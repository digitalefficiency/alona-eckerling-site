import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/cms/session";
import { publishState } from "@/lib/cms/github";

// GET /api/cms/status?sha=<commit> — "is my publish live yet?"
//
// A publish commits to the repo; Vercel rebuilds (~2 min) and re-points the
// production alias at the new deployment. Each deployment bakes in its own
// VERCEL_GIT_COMMIT_SHA, so this endpoint reports whichever deployment is
// currently serving the domain — old sha while the build runs, new sha the
// moment it is promoted. That is why "פורסם ✓" means the post is genuinely on
// the live site, not merely that a commit landed.
//
// Session-gated: it spends the GitHub token (the ancestry probe) and reveals the
// serving commit id, neither of which belongs to an anonymous visitor.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const jar = await cookies();
  if (!verifySessionToken(jar.get(SESSION_COOKIE)?.value)) {
    return Response.json({ ok: false }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  const sha = new URL(request.url).searchParams.get("sha") ?? "";
  if (!/^[0-9a-f]{7,40}$/i.test(sha)) return Response.json({ ok: false }, { status: 400 });

  const { live, reason, serving } = await publishState(sha);
  return Response.json(
    { ok: true, live, reason, serving: serving.slice(0, 7) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
