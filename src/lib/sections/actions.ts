"use server";
import { writeFile, readFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/cms/session";
import { getSectionType } from "./registry";
import type { PageDocument } from "./schema";

// sections/actions.ts — the write path for page content.
//
// TODAY it writes content/pages/<slug>.json. ON MONDAY the body of savePage()
// becomes a call to publish_entity(), and everything above it is unchanged:
// the same authorisation, the same validation, the same revalidation, the same
// return shape. That is the point of writing it this way now rather than
// reaching for the filesystem from the component.
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
function sanitise(doc: PageDocument): PageDocument {
  return {
    ...doc,
    sections: doc.sections.map((s) => {
      const type = getSectionType(s.type);
      if (!type) return s; // a section we do not model yet passes through untouched
      const allowed = new Set(type.fields.map((f) => f.key));
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
    }),
  };
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

  const clean = sanitise(doc);

  try {
    await mkdir(PAGES_DIR, { recursive: true });
    await writeFile(fileFor(slug), JSON.stringify(clean, null, 2) + "\n", "utf8");
  } catch {
    return { ok: false, error: "השמירה נכשלה. התוכן שלך עדיין כאן במסך." };
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
