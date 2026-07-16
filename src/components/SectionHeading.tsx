import { SplitText } from "@/components/motion/SplitText";

// Consistent premium section header: ◆ gold diamond + eyebrow + serif title that
// reveals line-by-line with the signature RTL ink-wipe (SplitText) on scroll-in.
export function SectionHeading({
  eyebrow,
  title,
  lead,
  tone = "light",
  align = "start",
}: {
  eyebrow: string;
  title: string;
  lead?: string;
  tone?: "light" | "dark";
  align?: "start" | "center";
}) {
  const titleColor = tone === "dark" ? "text-white" : "text-navy";
  const leadColor = tone === "dark" ? "text-slate-200" : "text-muted";
  const eyebrowColor = tone === "dark" ? "text-gold-soft" : "text-gold-ink";
  return (
    <div className={align === "center" ? "flex flex-col items-center text-center" : ""}>
      <div className="flex items-center gap-2.5">
        <span className="text-[0.65rem] leading-none text-gold" aria-hidden>◆</span>
        <span className={`text-xs font-bold tracking-[.18em] ${eyebrowColor}`}>{eyebrow}</span>
      </div>
      <SplitText
        as="h2"
        text={title}
        className={`mt-4 font-serif font-black leading-[1.08] ${titleColor}`}
        style={{ fontSize: "clamp(2rem, 4.4vw, 3.25rem)" }}
      />
      {lead && (
        <p className={`mt-4 max-w-[60ch] text-[1.08rem] leading-relaxed ${leadColor}`}>{lead}</p>
      )}
    </div>
  );
}
