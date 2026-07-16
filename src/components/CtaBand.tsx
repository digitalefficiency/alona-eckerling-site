import Link from "next/link";
import { cta } from "@/lib/site";
import { MagneticButton } from "@/components/motion/MagneticButton";

export function CtaBand({
  title = "רוצים לדעת אם אתם משלמים יותר מדי?",
  subtitle = "שיחת ייעוץ ראשונית עם שמאי מהמשרד — ללא התחייבות. נבדוק את המקרה שלכם ונאמר לכם איפה אתם עומדים.",
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <section className="relative overflow-hidden bg-navy text-white">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(900px 360px at 80% 120%, rgba(200,164,92,.20), transparent 60%), linear-gradient(135deg,#0A1E3F,#15355f)",
        }}
      />
      <div className="relative z-10 mx-auto max-w-[1120px] px-6 py-14 text-center">
        <h2 className="text-2xl font-extrabold text-white md:text-3xl">{title}</h2>
        <p className="mx-auto mt-3 max-w-[60ch] text-slate-200">{subtitle}</p>
        <div className="mt-7 flex flex-wrap justify-center gap-4">
          <MagneticButton
            href={cta.primary.href}
            dataCta="ctaband-primary"
            className="rounded-[4px] bg-gold px-6 py-3.5 font-bold text-navy transition-colors hover:bg-gold-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy"
          >
            {cta.primary.label}
          </MagneticButton>
          <Link
            href={cta.secondary.href}
            data-cta="ctaband-secondary"
            className="rounded-[4px] border border-white/25 px-6 py-3.5 font-semibold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            {cta.secondary.label}
          </Link>
        </div>
      </div>
    </section>
  );
}
