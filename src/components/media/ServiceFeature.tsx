import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { SplitText } from "@/components/motion/SplitText";
import { AngularFrame } from "@/components/media/AngularFrame";

// Emerald-style topic feature block: a large angular-framed, topic-matched
// image beside an editorial column — English supertitle, ◆ + Hebrew title, body,
// and a pill CTA. Alternate `imageSide` between instances for left/right rhythm.
export function ServiceFeature({
  kicker,
  title,
  body,
  image,
  alt,
  href,
  cta,
  imageSide = "end",
  tone = "light",
  breakout = false,
}: {
  kicker: string; // English supertitle, e.g. "MAKE THE OLD NEW"
  title: string;
  body: string;
  image: string;
  alt: string;
  href: string;
  cta: string;
  imageSide?: "start" | "end";
  tone?: "light" | "dark";
  breakout?: boolean; // editorial offset-frame "breaks out of the frame" look
}) {
  const dark = tone === "dark";

  const imageCol = (
    <Reveal>
      <AngularFrame src={image} alt={alt} aspectRatio="4 / 5" breakout={breakout} />
    </Reveal>
  );

  const textCol = (
    <Reveal delay={90} className="text-right">
      <p className={`font-serif tracking-wide ${dark ? "text-gold-soft" : "text-gold-ink"}`} style={{ fontSize: "clamp(1.5rem, 3vw, 2.4rem)" }}>
        {kicker}
      </p>
      <div className="mt-3 flex items-center justify-end gap-3">
        <span className={`h-px w-10 ${dark ? "bg-gold/40" : "bg-gold/50"}`} aria-hidden />
        <span className="text-[0.6rem] leading-none text-gold" aria-hidden>◆</span>
        <SplitText
          as="h3"
          text={title}
          className={`font-serif font-black leading-tight ${dark ? "text-white" : "text-navy"}`}
          style={{ fontSize: "clamp(1.6rem, 3.4vw, 2.4rem)" }}
        />
      </div>
      <p className={`mt-5 max-w-[46ch] text-lg leading-relaxed ${dark ? "text-slate-200" : "text-muted"} ms-auto`}>
        {body}
      </p>
      <Link
        href={href}
        data-cta={`service-feature-${href.split("/").pop()}`}
        className={`mt-8 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
          dark
            ? "border border-gold/50 bg-gold-soft/10 text-gold-soft hover:bg-gold-soft/20"
            : "border border-gold bg-gold-soft text-gold-ink hover:bg-gold/30"
        }`}
      >
        <span aria-hidden>←</span>
        {cta}
      </Link>
    </Reveal>
  );

  return (
    <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-14">
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
