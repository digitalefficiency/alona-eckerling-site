// ============================================================================
// github.ts — the publish transport. The client's repo is the content database:
// the admin reads through the GitHub API (repo HEAD is the single source of
// truth — the running deployment's filesystem is stale the moment a publish
// lands) and writes ONE atomic commit per publish via the Git Data API
// (blobs → tree → commit → ref), so a post and its images can never half-ship.
//
// Auth: a FINE-GRAINED PAT, scoped to this one repo, `contents: write` only
// (env CMS_GH_TOKEN). Deliberately NOT a shared GitHub App private key: the env
// belongs to the client's own Vercel project, so a shared key would hand every
// client a master credential to every other client's repo. Blast radius here is
// the client's own repo, which they already own.
//
// Cost: the PAT expires yearly, and NOTHING automated warns about it today. The
// only mitigation is the calendar reminder in SETUP-OWNER.md §3. Do not write
// that the canary covers this until canary.mjs actually reads the
// `github-authentication-token-expiration` response header — it does not.
// ============================================================================
import { UnsafePathError } from "@/lib/cms/safe-path.mjs";
import { livenessVerdict, type LivenessReason } from "@/lib/cms/liveness.mjs";

const API = "https://api.github.com";

export type RepoFile = { path: string; content: string; encoding?: "utf-8" | "base64" };

export class GitHubError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
  }
}
// Someone else (the owner, another admin tab, a direct git push) moved the file
// since it was opened. Surfaced to the client in Hebrew — never a blind overwrite.
export class ConflictError extends Error {}

function config() {
  const token = process.env.CMS_GH_TOKEN;
  const repo = process.env.CMS_GH_REPO; // "owner/name"
  const branch = process.env.CMS_GH_BRANCH || "main";
  if (!token) throw new GitHubError("CMS_GH_TOKEN is not set — the admin cannot publish");
  if (!repo || !/^[\w.-]+\/[\w.-]+$/.test(repo)) throw new GitHubError("CMS_GH_REPO must be set as owner/name");
  return { token, repo, branch };
}

async function gh<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { token } = config();
  const res = await fetch(`${API}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new GitHubError(`GitHub ${init.method ?? "GET"} ${path} → ${res.status} ${body.slice(0, 200)}`, res.status);
  }
  return (await res.json()) as T;
}

export const isConfigured = () => Boolean(process.env.CMS_GH_TOKEN && process.env.CMS_GH_REPO);

// ── reads ────────────────────────────────────────────────────────────────────
export type FetchedFile = { path: string; text: string; sha: string };

// getFileAt(path, ref) — the contents at any ref. GitHub's ?ref accepts a branch,
// tag OR commit sha on the same endpoint, so reading a HISTORICAL version is the
// identical call with the sha threaded in. getFile is the default-branch case.
export async function getFileAt(path: string, ref: string): Promise<FetchedFile | null> {
  const { repo } = config();
  try {
    const r = await gh<{ content: string; sha: string; encoding: string }>(
      `/repos/${repo}/contents/${encodeURI(path)}?ref=${encodeURIComponent(ref)}`,
    );
    return { path, text: Buffer.from(r.content, "base64").toString("utf8"), sha: r.sha };
  } catch (e) {
    if (e instanceof GitHubError && e.status === 404) return null;
    throw e;
  }
}

export async function getFile(path: string): Promise<FetchedFile | null> {
  return getFileAt(path, config().branch);
}

export type Commit = { sha: string; message: string; author: string; date: string };

// getCommitHistory(path, n) — the versions of one file, newest first. message +
// author + date are INLINE in the commits response, so the list draws with ZERO blob
// reads; a version's bytes load lazily via getFileAt only when the client views it.
// Caps at n (no auto-pagination). Works for a DELETED path too — the commits endpoint
// still returns the history of a path that no longer exists at HEAD.
export async function getCommitHistory(path: string, n = 20): Promise<Commit[]> {
  const { repo, branch } = config();
  try {
    const r = await gh<Array<{ sha: string; commit: { message: string; author: { name: string; date: string } } }>>(
      `/repos/${repo}/commits?path=${encodeURIComponent(path)}&sha=${encodeURIComponent(branch)}&per_page=${Math.max(1, Math.min(100, n))}`,
    );
    return Array.isArray(r)
      ? r.map((c) => ({ sha: c.sha, message: c.commit.message, author: c.commit.author?.name ?? "", date: c.commit.author?.date ?? "" }))
      : [];
  } catch (e) {
    if (e instanceof GitHubError && e.status === 404) return [];
    throw e;
  }
}

export async function listDir(path: string): Promise<{ name: string; sha: string }[]> {
  const { repo, branch } = config();
  try {
    const r = await gh<{ name: string; sha: string; type: string }[]>(
      `/repos/${repo}/contents/${encodeURI(path)}?ref=${encodeURIComponent(branch)}`,
    );
    return Array.isArray(r) ? r.filter((e) => e.type === "file").map(({ name, sha }) => ({ name, sha })) : [];
  } catch (e) {
    if (e instanceof GitHubError && e.status === 404) return [];
    throw e;
  }
}

// ── the atomic write ─────────────────────────────────────────────────────────
// `expect` is optimistic concurrency: { path → sha | null }. A mismatch means the
// file moved under us → ConflictError, never a silent clobber. Because every commit
// is built on the CURRENT HEAD tree, unrelated files are always preserved.
export async function commitFiles(opts: {
  message: string;
  files: RepoFile[];
  deletions?: string[];
  expect?: Record<string, string | null>;
  branch?: string; // approval mode targets a side branch
}): Promise<{ sha: string; url: string }> {
  const { repo, branch: defaultBranch } = config();
  const branch = opts.branch ?? defaultBranch;

  for (const f of opts.files) {
    if (f.path.startsWith("/") || f.path.includes("..")) throw new UnsafePathError(`refusing to commit ${f.path}`);
  }

  if (opts.expect) {
    for (const [p, expected] of Object.entries(opts.expect)) {
      const current = await getFile(p);
      const currentSha = current?.sha ?? null;
      if (currentSha !== expected) throw new ConflictError(p);
    }
  }

  const ref = await gh<{ object: { sha: string } }>(`/repos/${repo}/git/ref/heads/${encodeURIComponent(branch)}`);
  const headSha = ref.object.sha;
  const headCommit = await gh<{ tree: { sha: string } }>(`/repos/${repo}/git/commits/${headSha}`);

  const tree: Record<string, unknown>[] = [];
  for (const f of opts.files) {
    const blob = await gh<{ sha: string }>(`/repos/${repo}/git/blobs`, {
      method: "POST",
      body: JSON.stringify({ content: f.content, encoding: f.encoding ?? "utf-8" }),
    });
    tree.push({ path: f.path, mode: "100644", type: "blob", sha: blob.sha });
  }
  for (const p of opts.deletions ?? []) tree.push({ path: p, mode: "100644", type: "blob", sha: null });

  const newTree = await gh<{ sha: string }>(`/repos/${repo}/git/trees`, {
    method: "POST",
    body: JSON.stringify({ base_tree: headCommit.tree.sha, tree }),
  });
  const commit = await gh<{ sha: string; html_url: string }>(`/repos/${repo}/git/commits`, {
    method: "POST",
    body: JSON.stringify({ message: opts.message, tree: newTree.sha, parents: [headSha] }),
  });
  await gh(`/repos/${repo}/git/refs/heads/${encodeURIComponent(branch)}`, {
    method: "PATCH",
    body: JSON.stringify({ sha: commit.sha, force: false }),
  });
  return { sha: commit.sha, url: commit.html_url };
}

// ── approval mode (YMYL verticals): publish opens a PR instead of going live ──
export async function commitToNewBranchAndOpenPr(opts: {
  branchName: string;
  message: string;
  files: RepoFile[];
  prTitle: string;
  prBody: string;
}): Promise<{ prUrl: string }> {
  const { repo, branch: base } = config();
  const ref = await gh<{ object: { sha: string } }>(`/repos/${repo}/git/ref/heads/${encodeURIComponent(base)}`);
  await gh(`/repos/${repo}/git/refs`, {
    method: "POST",
    body: JSON.stringify({ ref: `refs/heads/${opts.branchName}`, sha: ref.object.sha }),
  }).catch((e) => {
    if (!(e instanceof GitHubError && e.status === 422)) throw e; // 422 = branch exists → reuse it
  });
  await commitFiles({ message: opts.message, files: opts.files, branch: opts.branchName });
  const pr = await gh<{ html_url: string }>(`/repos/${repo}/pulls`, {
    method: "POST",
    body: JSON.stringify({ title: opts.prTitle, body: opts.prBody, head: opts.branchName, base }),
  });
  return { prUrl: pr.html_url };
}

// Is `base` already part of `head`'s history? This answers the question exact-sha
// matching gets wrong: another commit (the owner, a second tab, a retainer cycle)
// can land between the client's publish and the build, so the deployment that goes
// live carries a DIFFERENT sha while containing the client's post. GitHub's compare
// reports "identical" or "ahead" in exactly that case. Returns null when the answer
// cannot be obtained — never a guess, because a guess upward is a lie.
export async function commitContains(base: string, head: string): Promise<boolean | null> {
  if (!isConfigured()) return null;
  const { repo } = config();
  try {
    const r = await gh<{ status: string }>(`/repos/${repo}/compare/${base}...${head}`);
    return r.status === "identical" || r.status === "ahead";
  } catch {
    return null;
  }
}

// After a publish the running deployment still serves the OLD build until Vercel
// finishes rebuilding and re-points the production alias. Each deployment bakes in
// its own VERCEL_GIT_COMMIT_SHA (readable at runtime), so the admin polls the SITE
// and asks: is the deployment answering me one whose history contains my commit?
// The decision rule is pure and lives in lib/cms/liveness.mjs (harness-pinned).
export async function publishState(
  commitSha: string,
): Promise<{ live: boolean; reason: LivenessReason; serving: string }> {
  const onVercel = process.env.VERCEL === "1";
  const serving = (process.env.VERCEL_GIT_COMMIT_SHA ?? "").toLowerCase();
  const ours = commitSha.toLowerCase();

  // Only pay for the ancestry probe once an exact match has already failed.
  const contained = onVercel && serving && serving !== ours ? await commitContains(ours, serving) : null;
  const containment = contained === null ? "unknown" : contained ? "contained" : "not-contained";

  return { ...livenessVerdict({ onVercel, servingSha: serving, commitSha: ours, containment }), serving };
}
