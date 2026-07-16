// Accessible FAQ accordion built on native <details> — works without JS,
// keyboard-operable, content always in the DOM (crawlable). Server component.
// Card language ported from SmoothAccordion (separated ivory cards) so the two
// accordion families read as one system.
//
// Motion (progressive enhancement, tokens only): where the browser supports
// `interpolate-size: allow-keywords` + `::details-content` (Chromium 131+),
// the answer's height eases open/closed on --dur-micro/--ease-out. Everywhere
// else — and under prefers-reduced-motion or the site's a11y stop-motion
// switch — the native instant toggle IS the floor (the reduced-motion twin).
const FAQ_ACC_CSS = `
.faq-acc { interpolate-size: allow-keywords; }
.faq-acc details::details-content {
  block-size: 0;
  overflow: clip;
  transition:
    block-size var(--dur-micro) var(--ease-out),
    content-visibility var(--dur-micro) var(--ease-out) allow-discrete;
}
.faq-acc details[open]::details-content { block-size: auto; }
@media (prefers-reduced-motion: reduce) {
  .faq-acc details::details-content { transition: none; }
}
html.a11y-stop-motion .faq-acc details::details-content { transition: none; }
`;

export function FaqAccordion({
  items,
  name,
}: {
  items: { q: string; a: string }[];
  /** shared name → native single-open (exclusive) accordion */
  name?: string;
}) {
  if (!items.length) return null;
  return (
    <div className="faq-acc flex flex-col gap-3">
      {/* hoisted + deduped by React (href/precedence) — motion tokens only */}
      <style href="faq-acc-motion" precedence="default">
        {FAQ_ACC_CSS}
      </style>
      {items.map((f, i) => (
        <details key={i} name={name} className="group rounded-[10px] border border-line bg-card">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 transition hover:bg-sand/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-inset [&::-webkit-details-marker]:hidden">
            <span className="font-serif text-lg font-bold text-navy">{f.q}</span>
            <span
              className="shrink-0 text-xl leading-none text-gold transition-transform duration-[var(--dur-micro)] ease-[var(--ease-out)] group-open:rotate-45 motion-reduce:transition-none"
              aria-hidden
            >
              +
            </span>
          </summary>
          <p className="px-6 pb-6 leading-relaxed text-muted">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
