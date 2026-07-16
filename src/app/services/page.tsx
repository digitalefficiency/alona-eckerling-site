import type { Metadata } from "next";

// ⚠ SCAFFOLD STUB — compose the Services page from STORY.md/COPY.md per
// `~/.claude/skills/site-foundry/references/bootstrap-rail.md` §2. There is NO default layout to
// colour-swap: the section order comes from the client's story, not from a prior client's page.
// Ship-blocked by lint-structure.mjs (stub) + lint-copy.mjs (placeholder) until composed.
export const metadata: Metadata = {
  title: "שירותים",
  alternates: { canonical: "/services" },
};

export default function ServicesPage() {
  return (
    <main data-scaffold-stub="services" className="mx-auto max-w-2xl px-6 py-32 text-center">
      <p className="text-sm font-bold tracking-[0.2em] text-gold">SCAFFOLD STUB · placeholder</p>
      <h1 className="mt-4 font-serif text-3xl font-black text-navy">עמוד השירותים טרם הורכב</h1>
      <p className="mt-4 leading-relaxed text-muted">
        הרכיבו מ-STORY.md / COPY.md (bootstrap-rail §2) — סדר הסקשנים נגזר מהסיפור. אל תרסקנו פורמט קיים.
      </p>
    </main>
  );
}
