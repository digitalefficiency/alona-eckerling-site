import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { Marked } from "marked";
import { normalizeFrontmatter } from "@/lib/cms/frontmatter-normalize.mjs";

// התוכן חי בתוך האפליקציה: site/content. הענף הישן חיפש קודם תיקיית-אחות
// (‎../content‎, שריד ממבנה של פרויקט קודם) — היא לא קיימת כאן, ולכן היה קוד מת.
//
// חשוב מעבר לניקיון: ה-‎".."‎ יצא מחוץ לשורש הפרויקט, ולכן ה-file-tracer של
// Turbopack לא הצליח לתחום את קריאות הקבצים והזהיר «the whole project was
// traced unintentionally» (דרך feed.xml → collections → content), מה שגורר את
// כל הריפו לבאנדל של הפונקציות. נתיב סטטי מתחת ל-cwd פותר את שניהם.
const CONTENT_DIR = path.join(process.cwd(), "content");

// ── SAFE MARKDOWN RENDERING ──────────────────────────────────────────────────
// The rendered HTML lands in <Prose dangerouslySetInnerHTML> — so once markdown
// can be CLIENT-authored (the CMS substrate), raw HTML in a body is a stored-XSS
// vector. Defense at the sink, covering EVERY path a .md takes into the site:
//   • raw HTML tokens (block + inline) are ESCAPED to visible text, never emitted;
//   • link/image URLs must be same-site-relative, https/http, mailto or tel —
//     javascript:/data:/protocol-relative (//host) are dropped to plain text.
// lint-content also REJECTS raw HTML before publish (a Hebrew, fixable error);
// this renderer is the belt under that suspender.
const escapeHtml = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const SAFE_URL = /^(?:https?:|mailto:|tel:|\/(?!\/)|#)/i;

const safeMarked = new Marked({ gfm: true, breaks: false });
safeMarked.use({
  renderer: {
    html(token) {
      return escapeHtml(token.text ?? token.raw ?? "");
    },
    link(token) {
      const text = this.parser.parseInline(token.tokens);
      if (!SAFE_URL.test(token.href ?? "")) return text;
      const title = token.title ? ` title="${escapeHtml(token.title)}"` : "";
      return `<a href="${escapeHtml(token.href)}"${title}>${text}</a>`;
    },
    image(token) {
      const alt = escapeHtml(token.text ?? "");
      if (!SAFE_URL.test(token.href ?? "")) return alt;
      const title = token.title ? ` title="${escapeHtml(token.title)}"` : "";
      return `<img src="${escapeHtml(token.href)}" alt="${alt}"${title} loading="lazy" decoding="async">`;
    },
  },
});

// Markdown → sanitized HTML. THE single rendering entry point — loadDoc,
// lib/collections and the admin preview all route through here, so the XSS
// posture cannot drift between surfaces.
export function renderMarkdown(md: string): string {
  return safeMarked.parse(md, { async: false }) as string;
}

export type Frontmatter = {
  title?: string;
  h1?: string;
  meta_title?: string;
  meta_description?: string;
  intent_keywords?: string[];
  schema_type?: string | string[];
  internal_links?: string[];
  last_updated?: string;
  slug?: string;
  featured_image?: string; // e.g. "media/blog/foo.webp" — banner + card thumb
  featured_alt?: string;
};

export type Heading = { depth: 2 | 3; text: string; id: string };

export type Doc = {
  data: Frontmatter;
  html: string;
  headings: Heading[]; // H2/H3 outline (for a sticky TOC) — ids injected into html
  readingMinutes: number; // derived estimate (~200 wpm) — never a fabricated stat
  faq: { q: string; a: string }[];
};

// normalizeFrontmatter now lives in lib/cms/frontmatter-normalize.mjs — the SINGLE
// source of truth shared with the desk's writer, so gray-matter (which runs strictly
// on its output, below) and serializeFrontmatter can never disagree about a shape.
// The harness pins that agreement; see run-tests.mjs "cross-parser round-trip".

function parse(raw: string): { data: Frontmatter; content: string } {
  try {
    const { data, content } = matter(normalizeFrontmatter(raw));
    return { data: data as Frontmatter, content };
  } catch {
    // נפילה אחורה: אם בכל זאת לא נפרס — מתעלמים מ-frontmatter שבור.
    const { content } = matter(raw, { excerpt: false }) as unknown as {
      content: string;
    };
    return { data: {}, content: content ?? raw };
  }
}

function stripMd(s: string): string {
  return s
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/[*_`#>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// מחלץ Q&A מתוך סקשן "שאלות נפוצות" (## ...) עם שאלות ב-### — ל-FAQPage schema.
function extractFaq(md: string): { q: string; a: string }[] {
  const lines = md.split("\n");
  let inFaq = false;
  let cur: { q: string; a: string } | null = null;
  const out: { q: string; a: string }[] = [];
  const push = () => {
    if (cur && cur.q && cur.a.trim()) out.push({ q: cur.q, a: stripMd(cur.a) });
    cur = null;
  };
  for (const line of lines) {
    const h2 = /^##\s+(.*)/.exec(line);
    if (h2) {
      push();
      inFaq = /שאלות\s+נפוצות|שו"ת|FAQ/i.test(h2[1]);
      continue;
    }
    if (!inFaq) continue;
    const h3 = /^###\s+(.*)/.exec(line);
    if (h3) {
      push();
      cur = { q: stripMd(h3[1]), a: "" };
      continue;
    }
    if (cur && line.trim()) cur.a += line.trim() + " ";
  }
  push();
  return out;
}

// מסיר את סקשן "שאלות נפוצות" מהגוף — הוא מוצג כאקורדיון נפרד (FaqAccordion),
// ולא מוכפל בתוך ה-prose.
function stripFaqSection(md: string): string {
  const out: string[] = [];
  let skipping = false;
  for (const line of md.split("\n")) {
    const h2 = /^##\s+(.*)/.exec(line);
    if (h2) skipping = /שאלות\s+נפוצות|שו"ת|FAQ/i.test(h2[1]);
    if (!skipping) out.push(line);
  }
  return out.join("\n");
}

// ADDITIVE: inject sequential ids into rendered H2/H3 and return the outline.
// Only adds an `id` attribute (no structural change), so pages that don't consume
// the TOC render identically — they just gain anchor targets.
function injectHeadingIds(html: string): { html: string; headings: Heading[] } {
  const headings: Heading[] = [];
  let i = 0;
  const out = html.replace(/<(h2|h3)>([\s\S]*?)<\/\1>/g, (_m, tag: string, inner: string) => {
    i++;
    const id = `sec-${i}`;
    // strip tags, then DECODE entities marked emitted (e.g. ASCII " in רמ"י → &quot;);
    // &amp; must be decoded LAST so an authored &lt; isn't double-decoded.
    const text = inner
      .replace(/<[^>]+>/g, "")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, "&")
      .trim();
    headings.push({ depth: tag === "h3" ? 3 : 2, text, id });
    return `<${tag} id="${id}">${inner}</${tag}>`;
  });
  return { html: out, headings };
}

// Derived reading-time estimate (~200 wpm). YMYL-safe: an estimate, not a claim.
function readingTime(md: string): number {
  const words = md.replace(/[#>*_`[\]()-]/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

// Raw markdown STRING → fully-processed Doc (no fs). The pure pipeline —
// lib/collections feeds it files it discovered via cms/config; loadDoc below
// keeps the original path-based contract for legacy/seed content.
export function renderDoc(raw: string): Doc {
  const { data, content } = parse(raw);
  const body = content.replace(/^#\s+.+\n/m, ""); // H1 ראשון מוצג בנפרד
  const stripped = stripFaqSection(body);
  const { html, headings } = injectHeadingIds(renderMarkdown(stripped));
  return { data, html, headings, readingMinutes: readingTime(stripped), faq: extractFaq(content) };
}

export function loadDoc(relPath: string): Doc {
  return renderDoc(fs.readFileSync(path.join(CONTENT_DIR, relPath), "utf8"));
}

// Frontmatter-tolerant parse, exported for lib/collections (listing needs data
// + body without paying for a full HTML render per entry).
export function parseFrontmatter(raw: string): { data: Frontmatter; content: string } {
  return parse(raw);
}

export { readingTime };

export function slugFromFile(filename: string): string {
  return filename.replace(/^\d+-/, "").replace(/\.md$/, "");
}

// Featured image for a blog post. NEUTRAL TEMPLATE: the frontmatter `featured_image`
// (a composed /media/generated/ or /media/client/ asset) is the source of truth —
// there is no built-in demo fallback, so a fresh scaffold references zero prior-client
// media. Per-slug overrides can be composed into BLOG_IMG per client; it ships empty.
// blogImage returns "" when a post carries no image — callers must guard the render.
const BLOG_IMG: Record<string, string> = {};
export function blogImage(slug: string, data?: Frontmatter): string {
  const fi = data?.featured_image;
  if (fi) return fi.startsWith("/") ? fi : `/${fi}`;
  return BLOG_IMG[slug] ?? "";
}

export type BlogListItem = { slug: string; file: string; data: Frontmatter; readingMinutes: number };

export function listBlog(): BlogListItem[] {
  const dir = path.join(CONTENT_DIR, "blog-seed");
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .map((f) => {
      const { data, content } = parse(fs.readFileSync(path.join(dir, f), "utf8"));
      return { slug: slugFromFile(f), file: f, data, readingMinutes: readingTime(content) };
    });
}
