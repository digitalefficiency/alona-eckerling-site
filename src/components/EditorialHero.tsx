import Link from "next/link";
import Image from "next/image";
import { site } from "@/lib/site";
import { HeroEntrance } from "@/components/HeroEntrance";
import { HeroCurtain } from "@/components/HeroCurtain";
import { SplitText } from "@/components/motion/SplitText";
import { MagneticButton } from "@/components/motion/MagneticButton";

// Full-bleed editorial hero (magazine-cover composition): a purpose-shot
// blue-hour tower with deliberate negative space in the upper-right (RTL start)
// where the giant serif headline sits. Choreographed first-paint entrance:
// background Ken-Burns settle → eyebrow → headline RTL ink-wipe → lead/CTAs.
// SSR markup is the final state (LCP-safe: Image keeps priority).
export function EditorialHero() {
  return (
    <HeroEntrance className="relative isolate overflow-hidden bg-navy">
      {/* Background photograph */}
      <div className="hero-bg absolute inset-0 -z-10">
        <div className="clip-scale absolute inset-0">
          <Image
            src="/media/hero/tower-bluehour.webp"
            alt="מגדל מגורים מודרני בהרצליה בשעת בין הערביים"
            fill
            priority
            sizes="100vw"
            className="object-cover object-left-bottom"
          />
        </div>
        {/* contrast scrim — darker toward the right (text side) and top */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to left, rgba(10,30,63,.78) 0%, rgba(10,30,63,.45) 38%, rgba(10,30,63,.12) 70%, transparent 100%), linear-gradient(to bottom, rgba(10,30,63,.45), transparent 30%)",
          }}
        />
      </div>

      {/* Overlaid content — sits on the right (RTL reading start) */}
      <div className="mx-auto flex min-h-[100svh] max-w-[1240px] flex-col justify-center px-6 py-20 text-right sm:py-24">
        <div className="hero-eyebrow flex items-center justify-end gap-2.5">
          <span className="text-xs font-bold tracking-[.2em] text-gold-soft">
            שמאות מקרקעין · מאז {site.foundingYear}
          </span>
          <span className="text-[0.7rem] leading-none text-gold" aria-hidden>◆</span>
        </div>

        <SplitText
          as="h1"
          text={"שלושה דורות.\nתשובה אחת נכונה."}
          lastLineClass="text-gold"
          baseDelay={160}
          className="mt-5 font-serif font-black leading-[1.04] text-white"
          style={{ fontSize: "clamp(2.15rem, 7vw, 6rem)" }}
        />

        <p className="hero-lead mt-7 max-w-[44ch] self-end text-lg leading-relaxed text-slate-200">
          משרד בוטיק לשמאות מקרקעין בהובלת דוקטור למקרקעין ושמאי מכריע. אלפי חוות דעת מול
          ועדות, רשויות ובתי משפט — עם שיקול דעת שנבנה דור אחר דור.
        </p>

        <div className="hero-cta mt-9 flex flex-wrap justify-end gap-3">
          <MagneticButton
            href="/contact"
            dataCta="home-hero-consult"
            className="rounded-[4px] bg-gold px-7 py-3.5 text-[0.95rem] font-bold text-navy transition-colors hover:bg-gold-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy"
          >
            שיחת ייעוץ ראשונית
          </MagneticButton>
          <Link
            href="/services"
            data-cta="home-hero-services"
            className="rounded-[4px] border border-white/30 px-7 py-3.5 text-[0.95rem] font-bold text-white transition hover:border-gold hover:text-gold-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            תחומי ההתמחות
          </Link>
        </div>
        <p className="hero-cta mt-4 flex items-center justify-end gap-2 text-sm text-slate-300">
          <span className="text-[0.5rem] leading-none text-gold" aria-hidden>◆</span>
          שיחה ראשונית ללא התחייבות
        </p>
      </div>

      {/* brand intro curtain: holds closed ~8s (logo + animated title/subtitle),
          then splits open from both sides to reveal the hero (opt-in, LCP-safe) */}
      <HeroCurtain />

      {/* blueprint corner ticks framing the full hero */}
      <span className="tick tick-1" aria-hidden />
      <span className="tick tick-2" aria-hidden />
      <span className="tick tick-3" aria-hidden />
      <span className="tick tick-4" aria-hidden />
    </HeroEntrance>
  );
}
