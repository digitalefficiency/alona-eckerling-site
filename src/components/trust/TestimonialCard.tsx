// Specific-testimonial card — quote + named attribution with REQUIRED context
// (case type / city / company) + optional concrete outcome line. Premium-tier
// ban: vague testimonials ("Great service! — J.") — dev-warns on short quotes
// or missing context so they never slip through unnoticed.
// Example: <TestimonialCard quote="ליוו אותנו מהשומה הראשונה ועד ההכרעה בערר..."
//   attribution={{ name: "משפחת כהן", context: "פינוי-בינוי, חולון" }}
//   outcome="ההיטל הופחת משמעותית" />
export function TestimonialCard({
  quote,
  attribution,
  outcome,
}: {
  quote: string;
  attribution: { name: string; context: string }; // context required — case type/city/company
  outcome?: string;
}) {
  if (process.env.NODE_ENV !== "production") {
    if (quote.trim().length < 40) {
      console.warn(`[TestimonialCard] quote for "${attribution.name}" is under 40 chars — too vague to build trust (premium-tier specificity rule).`);
    }
    if (!attribution.context?.trim()) {
      console.warn(`[TestimonialCard] "${attribution.name}" has no context — add case type/city/company (premium-tier specificity rule).`);
    }
  }
  return (
    <figure className="flex h-full flex-col rounded-[10px] border border-line bg-card p-6 md:p-7">
      <span className="font-serif text-4xl font-black leading-none text-gold" aria-hidden>”</span>
      <blockquote className="mt-2 grow text-[1.05rem] leading-relaxed text-ink">{quote}</blockquote>
      {outcome && (
        <p className="mt-4 flex items-center gap-2.5 text-sm font-bold text-gold-ink">
          <span className="text-[0.55rem] leading-none text-gold" aria-hidden>◆</span>
          {outcome}
        </p>
      )}
      <figcaption className="mt-4 border-t border-line pt-4">
        <span className="block font-semibold text-navy">{attribution.name}</span>
        <span className="mt-0.5 block text-sm text-muted">{attribution.context}</span>
      </figcaption>
    </figure>
  );
}
