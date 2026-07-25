import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { SectionSeam } from "@/components/layout/SectionSeam";
import { RevealHeading } from "@/components/motion/RevealHeading";
import { SplitText } from "@/components/motion/SplitText";
import { MOrchestrate, MItem } from "@/components/motion/MOrchestrate";
import { MStagger } from "@/components/motion/MStagger";
import { slideIn } from "@/lib/motion-variants";
import { Reveal } from "@/components/Reveal";
import { ResponsePromise } from "@/components/trust/ResponsePromise";
import { TestimonialCard } from "@/components/trust/TestimonialCard";
import { testimonials } from "@/lib/settings";

// YMYL gate: a quote is publishable ONLY with a recorded consent trail. An entry
// missing consentBy/consentAt is treated as not-yet-approved and stays dark, so
// a half-filled admin row can never reach the page.
const published = testimonials.filter(
  (t) => t.quote?.trim() && t.name?.trim() && t.context?.trim() && t.consentBy?.trim() && t.consentAt?.trim(),
);

// ============================================================================
// עמוד המלצות — "המלצות אמיתיות, כשיהיו" (plan/sections/32–34)
// העמוד חשוך מבנית בכוונה: אפס עדויות מומצאות, אפס כרטיסים מזויפים, אפס raster.
// הריק המכובד הוא העיצוב (STORY: הסלוט נשאר חשוך עד עדות אמיתית ומאושרת).
// ============================================================================

// COPY: ### סקשן 32 · Section width=prose (מסגור כן)
const HERO = {
  kicker: "רק אמיתי",
  title: "המלצות אמיתיות, כשיהיו",
  body: "כאן יופיעו סיפורים של נשים שליוויתי, במילים שלהן ובאישור שלהן. עוד אין לי כאלה להראות לך, ואני מעדיפה להשאיר את המקום הזה ריק מאשר להמציא סיפור שלא קרה.",
  bridge:
    "עד אז, מה שכן אפשר לראות באמת: המתכונים שאני מבשלת, הרישיון והלימודים שלי, ושיחת היכרות שבה תתרשמי בעצמך.",
  invite: "ואם בא לך, את מוזמנת להיות אחת הראשונות שמספרות.",
  // חלוקת-בעלות על נתיבי היציאה (ביקורת UX): פסקת-הגשר כבר מספרת על המתכונים
  // והרישיון במילים; ההירו שומר קישור אחד בלבד. צ'יפי recipes/about בבעלות
  // סקשן 33, והאזכור הרך של המתכונים בבעלות סקשן 34.
  links: [{ label: "בואי נדבר ←", href: "/contact", cta: "testimonials-hero-contact" }],
} as const;

// COPY: ### סקשן 33 · TestimonialCard grid (מצב-ריק כן)
const GRID = {
  // הקיקר «במילים שלהן» ירד: הכותרת קופלה לתוך כרטיס מצב-הריק, ומוטיב הגרשיים
  // פותח במקומו (ראו סקשן 33 למטה). לסנכרון COPY.md.
  title: "המלצות אמיתיות בלבד",
  emptyLead: "עוד לא פרסמתי המלצות. אעדכן כאן ברגע שיהיו.",
  emptyBody:
    "אני לא ממציאה סיפור שלא קרה. כשיגיעו המלצות אמיתיות, של נשים אמיתיות, הן יופיעו כאן, במילים שלהן ובאישורן.",
  redirectIntro: "בינתיים, הנה מה שאפשר לבדוק כבר עכשיו:",
  redirects: [
    { label: "המתכונים שאני באמת מבשלת ←", href: "/recipes", cta: "testimonials-redirect-recipes" },
    { label: "הרישיון והלימודים שלי ←", href: "/about", cta: "testimonials-redirect-about" },
  ],
  reciprocity: "עבדנו יחד? אשמח אם תשתפי, רק באישורך המלא ←",
} as const;

// COPY: ### סקשן 34 · CtaBand → #lead (מצב-ריק)
const CTA = {
  titleLine1: "לא תמצאי כאן סיפור שלא קרה.",
  titleLine2: "בואי נכתוב אחד אמיתי, יחד.",
  body: "המלצות אמיתיות יופיעו כאן עם שם ואישור פרסום, ולא רגע לפני. הכנות הזאת היא בדיוק מה שתקבלי גם בליווי עצמו. בינתיים, הדבר האמיתי ביותר שאני יכולה להציע לך הוא שיחת היכרות קצרה, בלי עלות ובלי התחייבות.",
  packages:
    "הליווי נמכר בחבילות שמתאימות לחיים שלך. על החבילה והמחיר נדבר בשיחה עצמה, בגובה העיניים.",
  promise: "אני חוזרת אלייך אישית, עד 4 ימי עסקים.",
  trustToken: "דיאטנית קלינית מוסמכת · R.D. · רישיון משרד הבריאות 204526-11",
  button: { label: "בואי נדבר, שיחת היכרות חינם", href: "/contact#lead", cta: "testimonials-cta-primary" },
  soft: { label: "משהו לבדוק בעצמך עכשיו: המתכונים כאן ←", href: "/recipes", cta: "testimonials-cta-recipes" },
} as const;

export const metadata: Metadata = {
  title: "המלצות",
  description: HERO.body,
  alternates: { canonical: "/testimonials" },
  openGraph: { url: "/testimonials" },
  // plan 32 שכבה 7 (thin-content, honesty-preserving): העמוד נשאר noindex עד
  // שיחזיק עדויות אמיתיות ומאושרות — נגיש לכל אדם, לא מוגש למנוע.
  // מתהפך לבד ברגע שיש עדות מאושרת, יחד עם הכניסה ל-sitemap (app/sitemap.ts
  // מסנן את המסלול באותו תנאי) — כדי ששני המקומות לא יסתרו זה את זה.
  robots: { index: published.length > 0, follow: true },
};

export default function TestimonialsPage() {
  return (
    <>
      {/* ===== 32 · hero — centered-prose · מסגור כן (נייר חם + blush-wash) =====
          ה-Header מוגן כברירת-מחדל: הטיפול הלבן דורש [data-dark-hero] מפורש,
          ולכן היר בהיר לא יכול לשלוח ניווט לבן-על-קרם. הסימון data-light-hero
          הישן היה no-op (אף אחד לא קרא אותו) והוסר. */}
      <section
        className="relative"
        style={{ background: "linear-gradient(180deg, var(--color-blush) 0%, color-mix(in srgb, var(--color-blush) 35%, var(--color-bg)) 62%, transparent 100%)" }}
      >
        <Container width="prose" className="pt-24 sm:pt-28">
          {/* חוט-הרוז מקבל מסגרת: frame-double ורוד — אותה מחווה של תעודת-הרישיון
              בעמוד «עליי», כאן בצבע השרשור של העדות. שובר את מונו-התרבות של rounded-[16px]. */}
          <div
            className="frame-double relative rounded-[16px] bg-card/85 px-6 py-12 text-center shadow-[var(--elevation-1)] sm:px-10 md:px-14 md:py-16"
            style={{ "--frame-gap": "8px", "--frame-color": "var(--color-rose)" } as React.CSSProperties}
          >
            <MOrchestrate>
              {/* המוטיב השקט היחיד — גרשיים פתוחים ברוז, "כאן שייך ציטוט" בלי לזייף אחד */}
              <MItem>
                <span className="block font-serif text-5xl leading-none text-rose" aria-hidden>
                  ״
                </span>
              </MItem>
              <MItem as="p" className="mt-4 flex items-center justify-center gap-2.5">
                <span className="text-[0.65rem] leading-none text-gold" aria-hidden>◆</span>
                <span className="text-xs font-bold tracking-eyebrow text-gold-ink">{HERO.kicker}</span>
              </MItem>
              <MItem>
                <RevealHeading
                  as="h1"
                  autoplay
                  text={HERO.title}
                  className="mt-5 font-serif font-black leading-[1.12] text-navy"
                  style={{ fontSize: "var(--text-hero)" }}
                />
              </MItem>
              <MItem as="p" className="mx-auto mt-6 max-w-[42rem] text-[1.08rem] leading-relaxed text-ink">
                {HERO.body}
              </MItem>
              <MItem as="p" className="mx-auto mt-4 max-w-[42rem] text-[1.02rem] leading-relaxed text-muted">
                {HERO.bridge}
              </MItem>
              <MItem as="p" className="mx-auto mt-2 max-w-[42rem] text-[1.02rem] leading-relaxed text-muted">
                {HERO.invite}
              </MItem>
              <MItem as="div" className="mt-8 flex flex-wrap items-center justify-center gap-x-7 gap-y-3">
                {HERO.links.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    data-cta={l.cta}
                    className="inline-flex min-h-11 items-center font-semibold text-gold-ink underline-offset-4 transition-colors hover:text-gold-dark hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
                  >
                    {l.label}
                  </Link>
                ))}
              </MItem>
            </MOrchestrate>
          </div>
        </Container>
      </section>

      {/* ===== 33 · grid — card-grid במצב-ריק כן (סלוטים שמורים, אפס מילים מזויפות) ===== */}
      <section>
        <Container width="standard" className="py-16 sm:py-20 md:py-32">
          <SectionSeam className="mb-12" />
          <MStagger className="space-y-8">
            {/* מצב B (plan 33 שכבה 5): ברגע שנכנסת המלצה אמיתית ומאושרת דרך
                /admin → content/settings/testimonials.json, הרשת מחליפה את
                מצב-הריק לבד. עד אז נשאר הריק המכובד. בלי הענף הזה העמוד היה
                נעול על "ריק" לתמיד, ואלונה הייתה צריכה מפתח כדי לפרסם עדות. */}
            {published.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2">
                {published.map((t) => (
                  <TestimonialCard
                    key={`${t.name}-${t.context}`}
                    quote={t.quote}
                    attribution={{ name: t.name, context: t.context }}
                    outcome={t.outcome}
                  />
                ))}
              </div>
            ) : (
              // מצב-הריק הכן — רצועה מעוצבת אחת (wash רך + ◆ + מוטיב הגרשיים),
              // לא כרטיסי-רפאים ולא מסגרות מקווקוות (audit #11). הטקס קופל
              // פנימה (דפוס-הבית «כותרת בתוך הכרטיס»): הגרשיים הוורודים פותחים,
              // «המלצות אמיתיות בלבד» היא כותרת הכרטיס עצמו, ושורת-הקיקר
              // העצמאית + פס-הרוז ירדו. אותן מילים, חצי מהטקס.
              <div
              className="frame-double relative mx-auto max-w-[42rem] rounded-[16px] bg-gold-soft/60 px-6 py-10 text-center sm:px-10"
              style={{ "--frame-gap": "8px", "--frame-color": "var(--color-rose)" } as React.CSSProperties}
            >
              {/* מדרגה מתחת להירו (ביקורת UX): גרשיים קטנים יותר וכותרת בגודל
                  כותרת-כרטיס — המוטיב נשאר, אך רק ההירו נשאר הירו. */}
              <span className="block font-serif text-4xl leading-none text-rose/70" aria-hidden>
                ״
              </span>
              <SplitText
                as="h2"
                text={GRID.title}
                className="mt-4 font-serif text-2xl font-black leading-[1.15] text-navy sm:text-[1.75rem]"
              />
              <p className="mt-6 text-lg font-bold text-navy">{GRID.emptyLead}</p>
              <p className="mt-3 leading-relaxed text-ink">{GRID.emptyBody}</p>
              <span aria-hidden className="mx-auto mt-7 flex items-center justify-center gap-3">
                <span className="h-px w-14 bg-gold/45" />
                <span className="text-[0.55rem] leading-none text-gold">◆</span>
                <span className="h-px w-14 bg-gold/45" />
              </span>
            </div>
            )}
            <div className="text-center">
              <p className="text-sm font-semibold text-muted">{GRID.redirectIntro}</p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                {GRID.redirects.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    data-cta={l.cta}
                    className="btn-chamfer inline-block rounded-[6px] border border-gold/45 bg-card px-5 py-3 text-sm font-semibold text-gold-ink transition-colors hover:border-gold hover:text-gold-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          </MStagger>

          {/* שורת-הדדיות — ללקוחות-עבר אמיתיות בלבד. עכשיו עם דלת (ביקורת UX):
              אותן מילים, כקישור אמיתי אל טופס ההיכרות. */}
          <p className="mt-8 text-center text-sm leading-relaxed">
            <Link
              href="/contact#lead"
              data-cta="testimonials-reciprocity"
              className="inline-flex min-h-11 items-center justify-center font-semibold text-gold-ink underline-offset-4 transition-colors hover:text-gold-dark hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
            >
              {GRID.reciprocity}
            </Link>
          </p>
        </Container>
      </section>

      {/* ===== 34 · cta — asymmetric-split · שדה-נייבי + דלת-מרווה אחת → #lead ===== */}
      <section>
        <Container width="standard" className="py-16 sm:py-20 md:py-32">
          <SectionSeam className="mb-12" />
          {/* הפיצול נדחה ל-lg (ביקורת UX): בטאבלט 768–1023 שני הפאנלים נערמים
              ברוחב מלא, כך שפאנל הפעולה לא נמחץ לעמודה של ~212px. */}
          <div className="grid gap-6 lg:grid-cols-[3fr_2fr] lg:items-stretch">
            {/* פאנל ההזמנה — נייבי שקט, שום הוכחה שאולה על הקירות */}
            <div className="relative overflow-hidden rounded-[16px] bg-navy p-8 text-white sm:p-10 md:p-12">
              <div aria-hidden className="grain-overlay" />
              <svg
                aria-hidden
                viewBox="0 0 200 200"
                className="pointer-events-none absolute -bottom-16 -start-16 h-56 w-56 text-gold-soft/10"
                fill="currentColor"
              >
                <circle cx="100" cy="100" r="100" />
              </svg>
              <MOrchestrate className="relative z-10">
                <MItem>
                  <SplitText
                    as="h2"
                    text={`${CTA.titleLine1}\n${CTA.titleLine2}`}
                    lastLineClass="text-gold-soft"
                    className="font-serif font-black leading-[1.18] text-white"
                    style={{ fontSize: "clamp(1.6rem, 3.6vw, 2.6rem)" }}
                  />
                </MItem>
                <MItem>
                  <span className="mt-5 block h-[3px] w-16 rounded-full bg-rose" aria-hidden />
                </MItem>
                <MItem as="p" className="mt-6 max-w-[58ch] leading-relaxed text-white/85">
                  {CTA.body}
                </MItem>
                <MItem as="p" className="mt-4 max-w-[58ch] text-sm leading-relaxed text-white/70">
                  {CTA.packages}
                </MItem>
                <MItem as="div" className="mt-8 space-y-3">
                  <ResponsePromise promise={CTA.promise} tone="dark" />
                  <p className="text-[13px] tracking-wide text-white/60">{CTA.trustToken}</p>
                </MItem>
              </MOrchestrate>
            </div>

            {/* פאנל הצעד — שנהב מורם, דלת מרווה אחת, נכנסת מהצד (מראה מזלג-הבית) */}
            <MStagger className="flex" itemClassName="flex w-full" variants={slideIn("inline-end", 40)}>
              <div className="flex w-full flex-col items-center justify-center gap-6 rounded-[16px] border border-line bg-sand px-6 py-12 text-center sm:px-8">
                <Link
                  href={CTA.button.href}
                  data-cta={CTA.button.cta}
                  className="inline-block btn-chamfer rounded-[6px] bg-gold px-8 py-4 text-base font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-sand lg:text-lg"
                >
                  {CTA.button.label}
                </Link>
                <Link
                  href={CTA.soft.href}
                  data-cta={CTA.soft.cta}
                  className="text-sm font-semibold text-gold-ink underline-offset-4 transition-colors hover:text-gold-dark hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-sand"
                >
                  {CTA.soft.label}
                </Link>
              </div>
            </MStagger>
          </div>
        </Container>
      </section>
    </>
  );
}
