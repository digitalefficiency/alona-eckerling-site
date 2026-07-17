import Link from "next/link";
import Image from "next/image";
import type { Book } from "@/lib/library";
import { Reveal } from "@/components/Reveal";

// Elevated "bookshelf": refined cover cards (Higgsfield art that fills the frame +
// a deep bottom scrim + a thin gold inset frame + title overlay) opening the
// INTERNAL /library/<slug> page. Centered flex-wrap so an incomplete last row sits
// in the middle rather than orphaned to one side.
export function BookShelf({ items }: { items: Book[] }) {
  return (
    <div className="flex flex-wrap justify-center gap-5 md:gap-6">
      {items.map((b, i) => (
        <Reveal key={b.slug} delay={(i % 4) * 80} className="w-[clamp(150px,44vw,244px)]">
          <Link
            href={`/library/${b.slug}`}
            data-cta={`book-${b.slug}`}
            aria-label={`${b.title} — ${b.author}`}
            // ONE hover gesture, and it belongs to the child: the "לעמוד הספר ›" row
            // that opens at the foot of the cover. The card itself only warms its
            // gold (color state, token-timed) — it no longer levitates-and-swells,
            // which was the same wallpaper lift every other card was doing.
            className="group relative block aspect-[3/4] overflow-hidden rounded-[12px] border border-line bg-navy shadow-[0_18px_40px_-26px_rgba(10,30,63,.7)] transition-colors duration-[var(--dur-micro)] ease-[var(--ease-out)] hover:border-gold/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
          >
            {/* cover art — fills the whole frame */}
            <Image
              src={b.image}
              alt=""
              aria-hidden
              fill
              sizes="(max-width:640px) 44vw, 244px"
              className="object-cover object-center transition-transform duration-[800ms] group-hover:scale-[1.06]"
            />
            {/* deep, consistent bottom scrim so every cover reads the same regardless of art */}
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-navy via-navy/65 to-navy/5" />
            <div aria-hidden className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-navy/40 to-transparent" />
            {/* thin gold inset frame */}
            <span aria-hidden className="pointer-events-none absolute inset-2.5 rounded-[8px] border border-gold/25 transition-colors duration-[var(--dur-micro)] ease-[var(--ease-out)] group-hover:border-gold/55" />

            <div className="absolute inset-x-0 bottom-0 p-4 text-right">
              <span className="text-[0.6rem] leading-none text-gold" aria-hidden>◆</span>
              <h3 className="mt-2 font-serif text-[0.98rem] font-bold leading-snug text-gold-soft transition-colors duration-[var(--dur-micro)] ease-[var(--ease-out)] group-hover:text-white">
                {b.title}
              </h3>
              <p className="mt-1.5 text-xs text-slate-300">{b.author}</p>
              {b.meta && <p className="mt-0.5 text-[11px] text-gold-soft/70">{b.meta}</p>}
              <span className="mt-2.5 inline-flex max-h-0 items-center gap-1 overflow-hidden text-xs font-semibold text-gold opacity-0 transition-all duration-[var(--dur-micro)] ease-[var(--ease-out)] group-hover:max-h-6 group-hover:opacity-100">
                לעמוד הספר ›
              </span>
            </div>
          </Link>
        </Reveal>
      ))}
    </div>
  );
}
