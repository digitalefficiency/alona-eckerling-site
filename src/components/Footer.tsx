import Link from "next/link";
import { site, services, nav, currentYear } from "@/lib/site";
import { CookiePrefsButton } from "@/components/CookiePrefsButton";

export function Footer() {
  return (
    <footer className="mt-auto border-t-4 border-rose bg-navy text-slate-300">
      <div className="mx-auto grid max-w-[1120px] grid-cols-1 gap-10 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div>
          <p className="font-serif text-lg font-black text-white">{site.name}</p>
          <p className="mt-2 text-sm leading-relaxed">{site.tagline}</p>
          <p className="mt-3 text-sm text-slate-400">מאז {site.foundingYear}</p>
        </div>

        <div>
          <p className="mb-3 text-sm font-bold text-white">ניווט</p>
          <ul className="space-y-2 text-sm">
            {nav.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="transition-colors duration-[var(--dur-micro)] hover:text-gold-soft">{n.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-3 text-sm font-bold text-white">שירותים</p>
          <ul className="space-y-2 text-sm">
            {services.map((s) => (
              <li key={s.slug}>
                <Link href="/coaching" className="transition-colors duration-[var(--dur-micro)] hover:text-gold-soft">{s.title}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-3 text-sm font-bold text-white">יצירת קשר</p>
          <ul className="space-y-2 text-sm">
            <li>{site.address.city}, {site.address.region}</li>
            {site.phone && (
              <li>
                טלפון:{" "}
                <a href={`tel:${site.phone}`} dir="ltr" data-cta="footer-phone" className="transition-colors duration-[var(--dur-micro)] hover:text-gold-soft">{site.phone}</a>
              </li>
            )}
            {site.email && (
              <li>
                דוא״ל:{" "}
                <a href={`mailto:${site.email}`} data-cta="footer-email" className="transition-colors duration-[var(--dur-micro)] hover:text-gold-soft">{site.email}</a>
              </li>
            )}
            <li>
              <Link href="/contact" data-cta="footer-contact" className="font-semibold text-gold-soft hover:underline">
                לעמוד יצירת הקשר ›
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 px-4 py-6 text-xs text-slate-400 sm:px-6">
        <div className="mx-auto flex max-w-[1120px] flex-col items-center gap-3 text-center">
          <nav aria-label="עמודים משפטיים" className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
            <Link href="/privacy" className="transition-colors duration-[var(--dur-micro)] hover:text-gold-soft">מדיניות פרטיות</Link>
            <Link href="/terms" className="transition-colors duration-[var(--dur-micro)] hover:text-gold-soft">תקנון ותנאי שימוש</Link>
            <Link href="/accessibility" className="transition-colors duration-[var(--dur-micro)] hover:text-gold-soft">הצהרת נגישות</Link>
            <CookiePrefsButton className="underline-offset-2 transition-colors duration-[var(--dur-micro)] hover:text-gold-soft hover:underline" />
          </nav>
          <p className="leading-relaxed">
            © <span dir="ltr">{site.foundingYear}-{currentYear()}</span> {site.name} · המידע באתר הוא
            כללי ואינו מהווה ייעוץ רפואי או תזונתי אישי, ואינו תחליף להתייעצות עם גורם מקצועי מוסמך.
          </p>
        </div>
      </div>
    </footer>
  );
}
