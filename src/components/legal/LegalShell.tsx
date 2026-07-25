import type { ReactNode } from "react";
import { site } from "@/lib/site";
import { Section } from "@/components/layout/Section";
import { Reveal } from "@/components/Reveal";

// Shared chrome for the legal documents (privacy / terms / accessibility): a navy
// title band + a prose-width body on white. RTL-correct. The styled element helpers
// (LH/LP/LUL/LLI/LNote) keep the three documents visually consistent.
export function LegalShell({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <>
      <Section tone="navy">
        <Reveal as="div" className="text-right">
          <div className="flex items-center justify-end gap-2.5">
            <span className="text-xs font-bold tracking-eyebrow text-gold-soft">{eyebrow}</span>
            <span className="text-[0.7rem] leading-none text-gold" aria-hidden>◆</span>
          </div>
          <h1 className="mt-4 font-serif font-black text-white" style={{ fontSize: "var(--text-hero)" }}>
            {title}
          </h1>
          {intro && (
            <p className="ms-auto mt-5 max-w-[60ch] text-lg leading-relaxed text-on-navy">{intro}</p>
          )}
          <p className="mt-5 text-sm text-on-navy-muted">עודכן לאחרונה: {site.legalUpdated}</p>
        </Reveal>
      </Section>

      <Section tone="white" width="prose" border>
        <div className="text-right">{children}</div>
      </Section>
    </>
  );
}

export const LH = ({ children, id }: { children: ReactNode; id?: string }) => (
  <h2 id={id} className="mt-10 font-serif text-xl font-bold text-navy first:mt-0">
    {children}
  </h2>
);

export const LP = ({ children }: { children: ReactNode }) => (
  <p className="mt-3 leading-relaxed text-ink">{children}</p>
);

export const LUL = ({ children }: { children: ReactNode }) => (
  <ul className="mt-3 list-disc space-y-1.5 ps-5 leading-relaxed text-ink marker:text-gold">{children}</ul>
);

export const LLI = ({ children }: { children: ReactNode }) => <li>{children}</li>;

// For [לבדיקת עו״ד] / [לאימות] placeholders — visually flagged so they are never
// shipped to a public launch unreviewed.
export const LFlag = ({ children }: { children: ReactNode }) => (
  <mark className="rounded bg-amber/15 px-1 text-gold-ink">{children}</mark>
);
