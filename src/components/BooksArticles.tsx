import Link from "next/link";
import { Section } from "@/components/layout/Section";
import { SectionHeading } from "@/components/SectionHeading";
import { Reveal } from "@/components/Reveal";
import { BookShelf } from "@/components/media/BookShelf";
import { books, articles } from "@/lib/library";

// "הספרייה המקצועית" — the firm's published authority, as an internal showcase.
// Each book opens its own /library/<slug> page; nothing leaves the site.
export function BooksArticles() {
  return (
    <Section tone="sand" seam>
      <Reveal>
        <SectionHeading
          eyebrow="מאגר הידע"
          title="הספרייה המקצועית"
          lead="שבעה ספרים מקצועיים ועשרות מאמרים, פסיקה והחלטות ערר — נכס ידע נדיר בנוף השמאות בישראל, שנכתב על‑ידי שלושת הדורות."
        />
      </Reveal>

      {/* Books — elevated cover cards → internal /library/<slug> */}
      <Reveal className="mt-12">
        <BookShelf items={books} />
      </Reveal>

      {/* Selected articles — proof of authority, routed to the internal knowledge base */}
      <Reveal className="mt-10">
        <div className="overflow-hidden rounded-[10px] border border-line bg-card">
          <div className="flex items-center gap-2.5 border-b border-line px-6 py-4">
            <span className="text-[0.6rem] leading-none text-gold-ink" aria-hidden>◆</span>
            <span className="text-xs font-bold tracking-[.18em] text-gold-ink">מאמרים נבחרים</span>
          </div>
          <ul className="divide-y divide-line">
            {articles.map((a) => (
              <li key={a.title} className="flex items-start justify-between gap-4 px-6 py-5">
                <div>
                  <h4 className="font-serif text-base font-bold leading-snug text-navy">{a.title}</h4>
                  <p className="mt-1 text-sm text-muted">{a.author} · {a.year}</p>
                </div>
                <span className="shrink-0 text-[0.6rem] leading-none text-gold-ink" aria-hidden>◆</span>
              </li>
            ))}
          </ul>
        </div>
      </Reveal>

      <Reveal className="mt-10 flex flex-wrap justify-center gap-3">
        <Link
          href="/library"
          data-cta="home-library"
          className="inline-block rounded-[4px] bg-navy px-7 py-3.5 font-bold text-white transition hover:bg-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
        >
          לספרייה המקצועית המלאה ›
        </Link>
        <Link
          href="/knowledge"
          data-cta="home-knowledge-base"
          className="inline-block rounded-[4px] border border-line px-7 py-3.5 font-bold text-navy transition hover:border-gold hover:text-gold-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          מאגר הידע ›
        </Link>
      </Reveal>
    </Section>
  );
}
