"use server";
import { writeFile, readFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/cms/session";
import { getSectionType } from "./registry";
import type { PageDocument } from "./schema";
import { userClient, supabaseConfigured } from "@/lib/supabase/client";

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

export async function savePage(slug: string, doc: PageDocument): Promise<SaveResult> {
  const email = await requireSession();
  if (!email) return { ok: false, error: "לא מחוברת. יש להיכנס מחדש." };

  if (doc.slug !== slug) return { ok: false, error: "אי-התאמה בכתובת העמוד." };

  try {
    // read-modify-write against what is on disk, so a stale tab cannot silently
    // drop a section that was added since it loaded
    const current = JSON.parse(await readFile(fileFor(slug), "utf8")) as PageDocument;
    const known = new Set(doc.sections.map((s) => s.id));
    const dropped = current.sections.filter((s) => !known.has(s.id));
    if (dropped.length) {
      return {
        ok: false,
        error: `העמוד השתנה מאז שנפתח (${dropped.length} סקשנים חסרים). כדאי לרענן ולנסות שוב.`,
      };
    }
  } catch {
    return { ok: false, error: "לא הצלחתי לקרוא את העמוד. כדאי לרענן." };
  }

  const cleanOrGap = sanitise(doc);
  if ("registryGap" in cleanOrGap) {
    return {
      ok: false,
      error: `באג ברישום הסקשנים (${cleanOrGap.registryGap}) — השמירה נעצרה כדי לא לאבד תוכן. פנו לרום.`,
    };
  }
  const clean = cleanOrGap;

  // WHICH BACKEND IS THE LIVE SOURCE for this page? Not "is Supabase
  // configured" — the read path serves the pages TABLE only when the row
  // exists, and the file otherwise. A save must land wherever reads actually
  // come from: writing the file while visitors read the table would be edits
  // into a void, and writing the table while visitors read the file would be
  // the same lie in the other direction.
  let dbIsLive = false;
  if (supabaseConfigured) {
    const sb = await userClient();
    const { data: existing } = await sb.from("pages").select("slug").eq("slug", slug).maybeSingle();
    dbIsLive = Boolean(existing);
  }

  if (dbIsLive) {
    const sb = await userClient();
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
      .eq("slug", slug)
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

/** The desk reads through this so it never touches the filesystem itself. */
export async function loadPage(slug: string): Promise<PageDocument | null> {
  if (!(await requireSession())) return null;
  try {
    return JSON.parse(await readFile(fileFor(slug), "utf8")) as PageDocument;
  } catch {
    return null;
  }
}

/**
 * Every page the desk can list. A page appears here as soon as its document
 * exists, whether or not every one of its sections has a registry entry yet —
 * PageView renders an un-modelled section as a card that says so, which is a
 * truthful "not yet" rather than a page that pretends to have fewer parts.
 */
export async function listPages(): Promise<{ slug: string; title: string; route: string; sections: number }[]> {
  if (!(await requireSession())) return [];
  const known = [
    { slug: "", title: "דף הבית", route: "/" },
    { slug: "about", title: "עליי", route: "/about" },
    { slug: "coaching", title: "איך עובדים איתי", route: "/coaching" },
    { slug: "contact", title: "צור קשר", route: "/contact" },
    { slug: "testimonials", title: "המלצות", route: "/testimonials" },
  ];
  const out = [];
  for (const p of known) {
    try {
      const doc = JSON.parse(await readFile(fileFor(p.slug), "utf8")) as PageDocument;
      out.push({ ...p, sections: doc.sections.length });
    } catch {
      // no document yet — the page is still rendered from code
    }
  }
  return out;
}
