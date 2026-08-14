import { statSync } from "node:fs";
import path from "node:path";
import { site } from "@/lib/site";
import { listDocs } from "@/lib/collections";

// RSS 2.0 feed of the recipe archive — a weekly-updated food feed is a standard
// lever for Google Discover / aggregator pickup (research: Discover is a primary
// channel for Hebrew food content). Derived from the same collection data as
// sitemap.ts; one <item> per published recipe, newest first. Referenced from the
// layout <head> via <link rel="alternate" type="application/rss+xml">.

export const dynamic = "force-static";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// RSS 2.0 requires type AND length on <enclosure>. type follows the extension
// (the archive mixes .jpg with .webp); length is the byte size of the file under
// public/, and 0 when the file cannot be read — the spec's value for "unknown".
const ENCLOSURE_MIME: Record<string, string> = {
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};
const enclosureFor = (base: string, img: string) => {
  const type = ENCLOSURE_MIME[path.extname(img).toLowerCase()] ?? "image/jpeg";
  let length = 0;
  try {
    length = statSync(path.join(process.cwd(), "public", img.replace(/^\//, ""))).size;
  } catch {}
  return `\n      <enclosure url="${esc(base + img)}" type="${type}" length="${length}" />`;
};

export function GET() {
  const base = site.url;
  const recipes = listDocs("recipes");
  const buildDate = new Date().toUTCString();

  const items = recipes
    .map((e) => {
      const link = `${base}/recipes/${e.slug}`;
      const pub = /^\d{4}-\d{2}-\d{2}/.test(e.date) ? new Date(e.date).toUTCString() : buildDate;
      const img = e.image ? enclosureFor(base, e.image) : "";
      return `    <item>
      <title>${esc(e.title)}</title>
      <link>${esc(link)}</link>
      <guid isPermaLink="true">${esc(link)}</guid>
      <pubDate>${pub}</pubDate>
      <description>${esc(e.description || e.title)}</description>${img}
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${esc(site.name)} — מתכונים</title>
    <link>${esc(base)}/recipes</link>
    <description>${esc(site.description)}</description>
    <language>he</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
