import Link from "next/link";
import { site } from "@/lib/site";
import { JsonLd } from "@/components/JsonLd";

type Crumb = { label: string; href: string };

export function Breadcrumbs({ items, tone = "light" }: { items: Crumb[]; tone?: "light" | "dark" }) {
  const trail = [{ label: "בית", href: "/" }, ...items];
  const dark = tone === "dark";
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      item: `${site.url}${c.href}`,
    })),
  };
  return (
    <nav aria-label="breadcrumb" className={`text-sm ${dark ? "text-white/70" : "text-muted"}`}>
      <JsonLd data={schema} />
      <ol className="flex flex-wrap items-center gap-2">
        {trail.map((c, i) => (
          <li key={`${c.href}-${i}`} className="flex items-center gap-2">
            {i < trail.length - 1 ? (
              <Link href={c.href} className={dark ? "hover:text-gold-soft" : "hover:text-navy-600"}>
                {c.label}
              </Link>
            ) : (
              <span className={dark ? "text-white" : "text-navy-700"}>{c.label}</span>
            )}
            {i < trail.length - 1 && <span aria-hidden>‹</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
