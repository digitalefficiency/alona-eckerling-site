// Oversized editorial pull-quote — breaks a wall of prose into a scannable rest
// point and lifts one strong sentence. Server component, pure CSS, RTL-correct
// (border-inline-start). Extends the existing .prose-rtl blockquote language.
export function PullQuote({
  children,
  cite,
}: {
  children: React.ReactNode;
  cite?: string;
}) {
  return (
    <figure className="my-12 border-s-4 border-gold ps-6">
      <blockquote className="font-serif text-2xl font-bold leading-snug text-navy md:text-[1.7rem]">
        {children}
      </blockquote>
      {cite && <figcaption className="mt-3 text-sm font-semibold tracking-wide text-gold-ink">— {cite}</figcaption>}
    </figure>
  );
}
