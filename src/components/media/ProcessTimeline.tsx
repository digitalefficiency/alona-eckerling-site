// A horizontal (RTL) numbered process timeline — gold nodes on a hairline rail,
// stacking vertically on mobile. Accessible ordered list. Server component.
// Use for "how the process works" content (YMYL: describe steps/scope only).
// `headingAs` lets the caller keep heading order valid (h3 when a section h2
// precedes; defaults to h4 for the in-article context).
export function ProcessTimeline({
  steps,
  headingAs: Heading = "h4",
}: {
  steps: { t: string; d?: string }[];
  headingAs?: "h3" | "h4";
}) {
  return (
    <ol className="relative flex flex-col gap-8 md:flex-row md:gap-0">
      {/* connecting rail (md+) — nodes sit on top */}
      <span className="absolute right-5 left-5 top-5 hidden h-px bg-gold/25 md:block" aria-hidden />
      {steps.map((s, i) => (
        <li key={i} className="relative flex-1 md:px-3 md:first:ps-0 md:last:pe-0">
          <span className="relative z-10 grid h-10 w-10 place-items-center rounded-full border border-gold/60 bg-sand font-serif text-base font-bold text-gold-ink">
            {i + 1}
          </span>
          <Heading className="mt-4 font-serif text-base font-bold leading-snug text-navy">{s.t}</Heading>
          {s.d && <p className="mt-1.5 text-sm leading-relaxed text-muted">{s.d}</p>}
        </li>
      ))}
    </ol>
  );
}
