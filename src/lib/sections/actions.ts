"use server";
import { writeFile, readFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/cms/session";
import { getSectionType } from "./registry";
import type { PageDocument } from "./schema";
import { deskClient, publicClient, supabaseConfigured } from "@/lib/supabase/client";

// sections/actions.ts — the write path for page content.
//
// It writes to Supabase when the project is configured, and to
// content/pages/<slug>.json when it is not. The authorisation, the validation
// and the revalidation are identical either way — only the last step differs.
//
// THE WRITE NEVER FALLS BACK. Reads do, because a brochure page should not go
// dark over a connection hiccup. A write must not: a save that quietly lands in
// a file while the editor believes it reached the database is worse than a save
// that fails, because she walks away thinking the site changed.
//
// THREE THINGS EVERY WRITE DOES, in this order, because the order is the
// safety:
//   1. authorise — the session is checked HERE, not in the component. A server
//      action is a public endpoint; a client that never renders the button can
//      still call it.
//   2. validate against the registry — a payload key the registry does not
//      declare is dropped rather than stored. Otherwise the first typo in a
//      fetch becomes a permanent field nobody can see or remove.
//   3. revalidate the routes the change actually touches.

const PAGES_DIR = path.join(process.cwd(), "content", "pages");
const fileFor = (slug: string) => path.join(PAGES_DIR, `${slug === "" ? "home" : slug}.json`);
const routeFor = (slug: string) => (slug === "" ? "/" : `/${slug}`);

export type SaveResult = { ok: true; savedAt: string } | { ok: false; error: string };

async function requireSession(): Promise<string | null> {
  const jar = await cookies();
  return verifySessionToken(jar.get(SESSION_COOKIE)?.value);
}

/**
 * Keep only what the registry declares, and only the shapes it declares.
 * Unknown keys are dropped silently — they cannot have come from the desk, and
 * storing them would mean the document grows fields no form can ever edit.
 */
function sanitise(doc: PageDocument): PageDocument | { registryGap: string } {
  const gaps: string[] = [];
  const sections = doc.sections.map((s) => {
      const type = getSectionType(s.type);
      if (!type) return s; // a section we do not model yet passes through untouched
      const allowed = new Set(type.fields.map((f) => f.key));
      // A payload key the registry does not declare is NOT junk to strip — the
      // desk cannot produce one, so it can only mean the registry entry is
      // incomplete. Dropping it silently is how a publish deleted the stakes
      // section's two comparison columns. Refuse instead, naming the keys.
      for (const k of Object.keys(s.payload)) {
        if (!allowed.has(k)) gaps.push(`${s.type}.${k}`);
      }
      const payload: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(s.payload)) if (allowed.has(k)) payload[k] = v;
      // a locked field can never be written from the desk, whatever arrives
      for (const f of type.fields) {
        if (f.locked) {
          const original = (s.payload as Record<string, unknown>)[f.key];
          if (original !== undefined) payload[f.key] = original;
        }
      }
      return { ...s, payload, visible: s.visible !== false };
  });
  if (gaps.length) return { registryGap: gaps.join(", ") };
  return { ...doc, sections };
}

// WHICH BACKEND IS THE LIVE SOURCE for a page? Not "is Supabase configured" —
// the read path serves the pages TABLE only when the row exists, and the file
// otherwise. Desk reads and desk writes must both land wherever public reads
// actually come from: loading the file while visitors read the table means the
// desk edits YESTERDAY'S text and every save silently reverts what the last
// session changed — split-brain, the exact bug class the write-never-falls-back
// rule exists for.
//
// In DB mode the desk's working document is the DRAFTS row (full document,
// hidden sections included — drafts have no anon policy at all) and the pages
// row carries only the visible projection, which is the same split
// publish_entity enforces. Without the drafts row, hiding a section and saving
// would DELETE its content from the only place it existed.
type Backend =
  | { mode: "db"; id: string; current: PageDocument }
  | { mode: "file"; current: PageDocument }
  | { mode: "missing" };

async function resolveBackend(slug: string): Promise<Backend> {
  if (supabaseConfigured) {
    // existence probe via the anon client on purpose: it can only see
    // published rows, and a page is only "live in the DB" once it is one
    const { data: row } = await publicClient()
      .from("pages")
      .select("id,slug,title,description,sections,baseline_order")
      .eq("slug", slug)
      .maybeSingle();
    if (row) {
      const sb = await deskClient();
      if (sb) {
        const { data: draft } = await sb
          .from("drafts")
          .select("payload")
          .eq("entity_type", "page")
          .eq("entity_id", row.id)
          .maybeSingle();
        if (draft?.payload) {
          return { mode: "db", id: row.id, current: draft.payload as PageDocument };
        }
      }
      // no draft yet (or desk user not wired): the published row is the truth
      return {
        mode: "db",
        id: row.id,
        current: {
          slug: row.slug,
          title: row.title,
          description: row.description ?? undefined,
          sections: row.sections ?? [],
          baseline_order: row.baseline_order ?? [],
        },
      };
    }
  }
  try {
    const current = JSON.parse(await readFile(fileFor(slug), "utf8")) as PageDocument;
    return { mode: "file", current };
  } catch {
    return { mode: "missing" };
  }
}

export async function savePage(slug: string, doc: PageDocument): Promise<SaveResult> {
  const email = await requireSession();
  if (!email) return { ok: false, error: "לא מחוברת. יש להיכנס מחדש." };

  if (doc.slug !== slug) return { ok: false, error: "אי-התאמה בכתובת העמוד." };

  const backend = await resolveBackend(slug);
  if (backend.mode === "missing") {
    return { ok: false, error: "לא הצלחתי לקרוא את העמוד. כדאי לרענן." };
  }

  // read-modify-write against the live source, so a stale tab cannot silently
  // drop a section that was added since it loaded
  {
    const known = new Set(doc.sections.map((s) => s.id));
    const dropped = backend.current.sections.filter((s) => !known.has(s.id));
    if (dropped.length) {
      return {
        ok: false,
        error: `העמוד השתנה מאז שנפתח (${dropped.length} סקשנים חסרים). כדאי לרענן ולנסות שוב.`,
      };
    }
  }

  const cleanOrGap = sanitise(doc);
  if ("registryGap" in cleanOrGap) {
    return {
      ok: false,
      error: `באג ברישום הסקשנים (${cleanOrGap.registryGap}) — השמירה נעצרה כדי לא לאבד תוכן. פנו לרום.`,
    };
  }
  const clean = cleanOrGap;

  if (backend.mode === "db") {
    const sb = await deskClient();
    if (!sb) {
      return {
        ok: false,
        error:
          "השמירה נדחתה: משתמש המסד של המערכת עוד לא הוגדר. התוכן שלך עדיין כאן במסך — פנו לרום.",
      };
    }

    // the FULL document (hidden sections included) lives in drafts, which has
    // no anon policy at all; only then does the visible projection go public
    const { error: draftErr } = await sb.from("drafts").upsert(
      { entity_type: "page", entity_id: backend.id, payload: clean, updated_at: new Date().toISOString() },
      { onConflict: "entity_type,entity_id" },
    );
    if (draftErr) {
      return { ok: false, error: "השמירה נדחתה. התוכן שלך עדיין כאן במסך — פנו לרום." };
    }

    // .select() makes the update RETURN the rows it touched. This is the whole
    // check: an RLS-refused update answers with ZERO rows and NO error, so
    // "no error" proves nothing and "the row exists" (a read-back) proves even
    // less — the row existing is exactly what a refused update leaves behind.
    // Only "the update returned the row" means the write landed.
    const { data: updated, error } = await sb
      .from("pages")
      .update({
        title: clean.title,
        description: clean.description ?? null,
        // only what is visible crosses into the published row — the same rule
        // publish_entity enforces, applied here too so the two cannot disagree
        sections: clean.sections.filter((x) => x.visible !== false),
        status: "published",
      })
      .eq("id", backend.id)
      .select("slug");

    if (error) {
      return { ok: false, error: "השמירה נדחתה. ייתכן שאין הרשאה לערוך את העמוד הזה." };
    }
    if (!updated || updated.length === 0) {
      return {
        ok: false,
        error: "השמירה נדחתה: אין לחשבון הזה הרשאת כתיבה במסד. התוכן שלך עדיין כאן במסך.",
      };
    }
  } else {
    try {
      await mkdir(PAGES_DIR, { recursive: true });
      await writeFile(fileFor(slug), JSON.stringify(clean, null, 2) + "\n", "utf8");
    } catch {
      return { ok: false, error: "השמירה נכשלה. התוכן שלך עדיין כאן במסך." };
    }
  }

  revalidatePath(routeFor(slug));
  return { ok: true, savedAt: new Date().toISOString() };
}

/** The desk reads through this so it never touches the backend itself. */
export async function loadPage(slug: string): Promise<PageDocument | null> {
  if (!(await requireSession())) return null;
  const backend = await resolveBackend(slug);
  return backend.mode === "missing" ? null : backend.current;
}

/**
 * Every page the desk can list. A page appears here as soon as its document
 * exists, whether or not every one of its sections has a registry entry yet —
 * PageView renders an un-modelled section as a card that says so, which is a
 * truthful "not yet" rather than a page that pretends to have fewer parts.
 */
export async function listPages(): Promise<{ slug: string; title: string; route: string; sections: number }[]> {
  if (!(await requireSession())) return [];
  // /testimonials retired 2026-07-30 → /articles (a content collection, edited
  // like recipes, not a section page) — so four section pages remain.
  const known = [
    { slug: "", title: "דף הבית", route: "/" },
    { slug: "about", title: "עליי", route: "/about" },
    { slug: "coaching", title: "איך עובדים איתי", route: "/coaching" },
    { slug: "contact", title: "צור קשר", route: "/contact" },
  ];
  const out = [];
  for (const p of known) {
    const backend = await resolveBackend(p.slug);
    if (backend.mode !== "missing") {
      out.push({ ...p, sections: backend.current.sections.length });
    }
    // missing: no document yet — the page is still rendered from code
  }
  return out;
}
