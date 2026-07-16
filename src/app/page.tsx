// ⚠ SCAFFOLD STUB — the scaffold ships pages EMPTY on purpose.
//
// Do NOT reskin a prior client's layout (that is how every site ends up the same shape).
// COMPOSE this client's home from STORY.md's spine per
// `~/.claude/skills/site-foundry/references/bootstrap-rail.md` §2:
//   section order = the STORY beats · each section a GENERIC prop-driven component
//   (catalog `brandSpecific:false`) fed from COPY.md · then emit COMPOSE-MAP.md.
// There is NO default rhythm to inherit — the structure comes from the story, not the template.
// (Need to see the design language in action? `src/app/styleguide/` demos every component.)
//
// This stub is ship-blocked: `lint-structure.mjs` fails while `data-scaffold-stub` is present,
// and `lint-copy.mjs` fails on the placeholder below — both clear once you compose the real page.
export default function HomePage() {
  return (
    <main data-scaffold-stub="home" className="mx-auto max-w-2xl px-6 py-32 text-center">
      <p className="text-sm font-bold tracking-[0.2em] text-gold">SCAFFOLD STUB · placeholder</p>
      <h1 className="mt-4 font-serif text-3xl font-black text-navy">עמוד הבית טרם הורכב</h1>
      <p className="mt-4 leading-relaxed text-muted">
        הרכיבו את הבית מ-STORY.md של הלקוח (bootstrap-rail §2) — סדר הסקשנים נגזר מהסיפור,
        לא ממבנה של לקוח קודם. אל תרסקנו פורמט קיים.
      </p>
    </main>
  );
}
