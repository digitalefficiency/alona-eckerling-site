import { Breadcrumbs } from "@/components/Breadcrumbs";

// Editorial page header (Emerald language): breadcrumbs + ◆ eyebrow + giant
// serif title + lead, on a quiet sand band that sets the chapter.
export function PageHero({
  crumbs,
  title,
  lead,
  eyebrow,
}: {
  crumbs: { label: string; href: string }[];
  title: string;
  lead?: string;
  eyebrow?: string;
}) {
  return (
    <section className="border-b border-line bg-sand">
      <div className="mx-auto max-w-[1240px] px-6 py-14 md:py-20">
        <Breadcrumbs items={crumbs} />
        {eyebrow && (
          <div className="mt-6 flex items-center gap-2.5">
            <span className="text-[0.65rem] leading-none text-gold" aria-hidden>◆</span>
            <span className="text-xs font-bold tracking-eyebrow text-gold-ink">{eyebrow}</span>
          </div>
        )}
        <h1
          className="mt-4 max-w-[20ch] font-serif font-black leading-[1.06] text-navy"
          style={{ fontSize: "clamp(2.1rem, 5vw, 3.4rem)" }}
        >
          {title}
        </h1>
        {lead && <p className="mt-5 max-w-[62ch] text-lg leading-relaxed text-muted">{lead}</p>}
      </div>
    </section>
  );
}
