import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { ClipReveal } from "@/components/motion/ClipReveal";
import { blogImage, type BlogListItem } from "@/lib/content";

// Shared blog card grid (extracted from /knowledge so /blog and /knowledge share
// one component). Server component rendering the existing Reveal/ClipReveal cards,
// now with per-card reading-time meta + data-cta tags for marketing tracking.
// `base` points the cards at any collection route (CMS substrate) — "/blog" default.
export function BlogCardGrid({ posts, base = "/blog" }: { posts: BlogListItem[]; base?: string }) {
  const ctaPrefix = base.replace(/^\//, "").replace(/\//g, "-") || "blog";
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((p, i) => {
        const img = blogImage(p.slug, p.data);
        // Metronome = DUR.stagger (80ms), the declared voice. The `% 3` resets the
        // count per grid ROW on purpose — it is not drift. A flat `i * 80` would
        // make the 12th post on /blog wait ~1s after it enters view before it
        // appears, which reads as lag, not rhythm.
        return (
        <Reveal as="div" key={p.slug} delay={(i % 3) * 80}>
          {/* ONE hover gesture: the gold dock-line that grows under the card
              (.survey-card::after). The card does not also levitate. */}
          <Link
            href={`${base}/${p.slug}`}
            data-cta={`${ctaPrefix}-card-${p.slug}`}
            className="survey-card group flex h-full flex-col overflow-hidden rounded-[10px] border border-line bg-card transition-colors duration-[var(--dur-micro)] ease-[var(--ease-out)] hover:border-gold/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
          >
            {img && (
            <div className="relative overflow-hidden" style={{ aspectRatio: "var(--aspect-card)" }}>
              <ClipReveal
                src={img}
                alt={p.data.h1 ?? p.data.title ?? ""}
                sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 380px"
                imgClassName="transition duration-[var(--dur-ui)] group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy/45 to-transparent" />
            </div>
            )}
            <div className="flex flex-1 flex-col p-6">
              <h3 className="font-serif text-lg font-bold text-navy group-hover:text-gold-ink">
                {p.data.h1 ?? p.data.title}
              </h3>
              {p.data.meta_description && (
                <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">{p.data.meta_description}</p>
              )}
              <div className="mt-4 flex items-center gap-2 text-xs text-muted">
                {p.readingMinutes ? <span>{p.readingMinutes} דק׳ קריאה</span> : null}
                <span className="ms-auto text-sm font-semibold text-gold-ink">קריאה ›</span>
              </div>
            </div>
          </Link>
        </Reveal>
        );
      })}
    </div>
  );
}
