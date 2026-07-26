import type { Metadata } from "next";
import { cookies } from "next/headers";
import { collections } from "@/lib/cms/config";
import { settingsSchema } from "@/lib/cms/settings-schema";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/cms/session";
import { listAdminDocs } from "@/lib/cms/read";
import { AdminShell } from "@/components/admin/AdminShell";
import { loadPage } from "@/lib/sections/actions";
import type { PageSummary } from "@/components/admin/pages/PagesTab";
import { LoginCard } from "@/components/admin/LoginCard";
import { T } from "@/lib/cms/desk-strings";

// ============================================================================
// /admin — the client's content desk. ONE catch-all page (its internal views are
// client state, not routes), so there is exactly one noindex declaration and
// nothing to keep in sync with lint-seo / the sitemap.
// The session is checked on the SERVER: an unauthenticated visitor is served the
// login card and never the shell — no content, no collection names, no data.
// ============================================================================

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: T("admin.deskTitle"),
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const jar = await cookies();
  const email = verifySessionToken(jar.get(SESSION_COOKIE)?.value);

  if (!email) return <LoginCard />;

  // Read through the repo (HEAD is the source of truth — the running deployment's
  // filesystem is one build behind every publish).
  const docs = await Promise.all(collections.map((c) => listAdminDocs(c)));

  // The page documents the desk can edit. One is loaded up front — the rest
  // load when she picks them, so the first paint is not waiting on five files.
  const pageDoc = await loadPage("");
  const pages: PageSummary[] = pageDoc
    ? [{ slug: "", title: "דף הבית", route: "/", sections: pageDoc.sections.length }]
    : [];

  return (
    <AdminShell
      email={email}
      collections={[...collections]}
      docs={docs}
      settings={settingsSchema}
      pages={pages}
      pageDoc={pageDoc}
    />
  );
}
