import Link from "next/link";
import { Portrait } from "@/components/media/Portrait";

// Provider bio card — environmental photo + name + one-line "what I do for
// clients" role + REQUIRED credential rows (◆) + optional narrative excerpt.
// Premium-tier rule: EVERY provider gets a credentialed bio (bar/license,
// education, affiliations) — never a name-and-photo-only card.
// Example: <BioCard name="עו״ד דנה לוי" role="מלווה משפחות בהסדרי ירושה"
//   credentials={["חברת לשכת עורכי הדין משנת 2009", "LL.M האוניברסיטה העברית"]} ... />
export function BioCard({
  name,
  role,
  photo,
  credentials,
  narrative,
  href,
  cta,
}: {
  name: string;
  role: string; // one line: what this provider does for clients
  photo: { src: string; alt: string };
  credentials: string[]; // required — license, education, affiliations
  narrative?: string;
  href?: string; // full bio page
  cta?: { label: string; href: string; dataCta?: string };
}) {
  if (process.env.NODE_ENV !== "production" && credentials.length === 0) {
    console.warn(`[BioCard] "${name}" has no credentials — every provider bio must list at least one (premium-tier trust rule).`);
  }
  return (
    <article className="flex h-full flex-col rounded-[10px] border border-line bg-card p-6 transition hover:border-gold/70 md:p-7">
      <Portrait src={photo.src} alt={photo.alt} variant="portrait" />
      <div className="mt-5 flex grow flex-col">
        {href ? (
          <Link
            href={href}
            data-cta="bio-card-name"
            className="font-serif text-2xl font-black leading-snug text-navy transition hover:text-navy-600"
          >
            {name}
          </Link>
        ) : (
          <p className="font-serif text-2xl font-black leading-snug text-navy">{name}</p>
        )}
        <p className="mt-1 text-sm font-semibold text-gold-ink">{role}</p>
        <ul className="mt-4 grid gap-2">
          {credentials.map((c) => (
            <li key={c} className="flex items-start gap-2.5 text-sm leading-relaxed text-muted">
              <span className="mt-1.5 text-[0.55rem] leading-none text-gold" aria-hidden>◆</span>
              {c}
            </li>
          ))}
        </ul>
        {narrative && <p className="mt-4 text-sm leading-relaxed text-muted">{narrative}</p>}
        {cta && (
          <Link
            href={cta.href}
            data-cta={cta.dataCta ?? "bio-card-cta"}
            className="mt-5 inline-block text-sm font-bold text-gold-ink underline underline-offset-4 transition hover:text-gold-dark"
          >
            {cta.label} ›
          </Link>
        )}
      </div>
    </article>
  );
}
