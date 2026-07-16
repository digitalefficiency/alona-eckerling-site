export function Prose({ html }: { html: string }) {
  return (
    <div className="prose-rtl" dangerouslySetInnerHTML={{ __html: html }} />
  );
}
