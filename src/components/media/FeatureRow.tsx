import Link from "next/link";
import { SectionHeading } from "@/components/SectionHeading";
import { Reveal } from "@/components/Reveal";
import { ClipReveal } from "@/components/motion/ClipReveal";

type Stat = { n: string; l: string };

// The content-page workhorse: an asymmetric image + text row. Alternate
// `imageSide` between instances for the editorial left/right rhythm. Renders the
// inner grid only — wrap it in <Section tone=...> for the band background.
export function FeatureRow({
  eyebrow,
  title,
  body,
  image,
  alt,
  imageSide = "end",
  ratio = "feature",
  stats,
  cta,
  tone = "light",
}: {
  eyebrow: string;
  title: string;
  body?: React.ReactNode;
  image: string;
  alt: string;
  imageSide?: "start" | "end"; // "end" = image on the left (RTL inline-end)
  ratio?: "feature" | "wide";
  stats?: Stat[];
  cta?: { label: string; href: string; dataCta?: string };
  tone?: "light" | "dark";
}) {
  const dark = tone === "dark";
  const ar = ratio === "wide" ? "var(--aspect-wide)" : "var(--aspect-feature)";

  const imageCol = (
    <Reveal>
      <div
        className={`relative overflow-hidden rounded-[10px] ${dark ? "" : "border border-line"}`}
        style={{ aspectRatio: ar }}
      >
        <ClipReveal src={image} alt={alt} sizes="(max-width:768px) 100vw, 620px" />
        <span className="tick tick-1" aria-hidden />
        <span className="tick tick-2" aria-hidden />
        <span className="tick tick-3" aria-hidden />
        <span className="tick tick-4" aria-hidden />
      </div>
    </Reveal>
  );

  const textCol = (
    <Reveal delay={90}>
      <SectionHeading eyebrow={eyebrow} title={title} tone={dark ? "dark" : "light"} />
      {body && (
        <div className={`mt-5 text-lg leading-relaxed ${dark ? "text-slate-200" : "text-muted"}`}>
          {body}
        </div>
      )}
      {stats && stats.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-x-12 gap-y-5">
          {stats.map((s) => (
            <div key={s.l}>
              <div className={`font-serif text-3xl font-black md:text-4xl ${dark ? "text-white" : "text-navy"}`}>
                {s.n}
              </div>
              <div className={`mt-1 text-xs font-semibold tracking-wide ${dark ? "text-gold-soft" : "text-gold-ink"}`}>
                {s.l}
              </div>
            </div>
          ))}
        </div>
      )}
      {cta && (
        <Link
          href={cta.href}
          data-cta={cta.dataCta ?? "feature-cta"}
          className={`mt-9 inline-block rounded-[4px] px-7 py-3.5 font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
            dark
              ? "bg-gold text-navy hover:bg-gold-soft"
              : "bg-navy text-white hover:bg-navy-700 focus-visible:ring-offset-2"
          }`}
        >
          {cta.label} ›
        </Link>
      )}
    </Reveal>
  );

  return (
    <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-[0.95fr_1.05fr]">
      {imageSide === "end" ? (
        <>
          {textCol}
          {imageCol}
        </>
      ) : (
        <>
          {imageCol}
          {textCol}
        </>
      )}
    </div>
  );
}
