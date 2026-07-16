import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { SectionSeam } from "@/components/layout/SectionSeam";
import { RevealHeading } from "@/components/motion/RevealHeading";
import { SplitText } from "@/components/motion/SplitText";
import { MOrchestrate, MItem } from "@/components/motion/MOrchestrate";
import { MStagger } from "@/components/motion/MStagger";
import { Reveal } from "@/components/Reveal";
import { ResponsePromise } from "@/components/trust/ResponsePromise";

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
  links: [
    { label: "למתכונים ←", href: "/recipes", cta: "testimonials-hero-recipes" },
    { label: "עליי והרישיון ←", href: "/about", cta: "testimonials-hero-about" },
    { label: "בואי נדבר ←", href: "/contact", cta: "testimonials-hero-contact" },
  ],
  // הסלוט השמור נשאר חשוך — הדיסקליימר הוא הטקסט האמיתי היחיד בתוכו.
  darkSlot: "המלצות אמיתיות יופיעו כאן ברגע שיהיו. אני לא ממציאה סיפור שלא קרה.",
} as const;

// COPY: ### סקשן 33 · TestimonialCard grid (מצב-ריק כן)
const GRID = {
  kicker: "במילים שלהן",
  title: "המלצות אמיתיות בלבד",
  emptyLead: "עוד לא פרסמנו המלצות. נעדכן כאן ברגע שיהיו.",
  emptyBody:
    "אנחנו לא ממציאים סיפור שלא קרה. כשיגיעו המלצות אמיתיות, של נשים אמיתיות, הן יופיעו כאן, במילים שלהן ובאישורן.",
  redirectIntro: "בינתיים, הנה מה שאפשר לבדוק כבר עכשיו:",
  redirects: [
    { label: "המתכונים שאני באמת מבשלת ←", href: "/recipes", cta: "testimonials-redirect-recipes" },
    { label: "הרישיון והלימודים שלי ←", href: "/about", cta: "testimonials-redirect-about" },
  ],
  reciprocity: "עבדנו יחד? אשמח אם תשתפי, רק באישורך המלא.",
} as const;

// COPY: ### סקשן 34 · CtaBand → #lead (מצב-ריק)
const CTA = {
  titleLine1: "לא תמצאי כאן סיפור שלא קרה.",
  titleLine2: "בואי נכתוב אחד אמיתי, יחד.",
  body: "המלצות אמיתיות יופיעו כאן עם שם ואישור פרסום, ולא רגע לפני. הכנות הזאת היא בדיוק מה שתקבלי גם בליווי עצמו. בינתיים, הדבר האמיתי ביותר שאני יכולה להציע לך הוא שיחת היכרות קצרה, בלי עלות ובלי התחייבות.",
  packages:
    "הליווי נמכר בחבילות שמתאימות לחיים שלך, ועל זה בדיוק נדבר בשיחה, בלי הפתעות ובלי מחיר שקופץ מהמסך.",
  promise: "אני חוזרת אלייך אישית, עד 4 ימי עסקים.",
  trustToken: "דיאטנית קלינית מוסמכת · R.D. · רישיון משרד הבריאות 204526-11",
  button: { label: "בואי נדבר, שיחת היכרות חינם", href: "/contact#lead", cta: "testimonials-cta-primary" },
  soft: { label: "רוצה עוד משהו לבדוק בעצמך עכשיו? המתכונים כאן ←", href: "/recipes", cta: "testimonials-cta-recipes" },
} as const;

export const metadata: Metadata = {
  title: "המלצות",
  description: HERO.body,
  alternates: { canonical: "/testimonials" },
  // plan 32 שכבה 7 (thin-content, honesty-preserving): העמוד נשאר noindex עד
  // שיחזיק עדויות אמיתיות ומאושרות — נגיש לכל אדם, לא מוגש למנוע.
  robots: { index: false, follow: true },
};

export default function TestimonialsPage() {
  return (
    <>
      {/* ===== 32 · hero — centered-prose · מסגור כן (נייר חם + blush-wash) ===== */}
      <section className="relative">
        <Container width="prose" className="pt-16 sm:pt-20 md:pt-28">
          <div className="rounded-[16px] bg-blush/60 px-6 py-12 text-center sm:px-10 md:px-14 md:py-16">
            <MOrchestrate>
              {/* המוטיב השקט היחיד — גרשיים פתוחים ברוז, "כאן שייך ציטוט" בלי לזייף אחד */}
              <MItem>
                <span className="block font-serif text-5xl leading-none text-rose" aria-hidden>
                  ״
                </span>
              </MItem>
              <MItem as="p" className="mt-4 flex items-center justify-center gap-2.5">
                <span className="text-[0.65rem] leading-none text-gold" aria-hidden>◆</span>
                <span className="text-xs font-bold tracking-[.18em] text-gold-ink">{HERO.kicker}</span>
              </MItem>
              <MItem>
                <RevealHeading
                  as="h1"
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
                    className="font-semibold text-gold-ink underline-offset-4 transition-colors hover:text-gold-dark hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
                  >
                    {l.label}
                  </Link>
                ))}
              </MItem>
            </MOrchestrate>
          </div>

          {/* הסלוט השמור — חשוך בכוונה, סטטי בכוונה (לא זוכה לאנימציה, plan 32 שכבה 6) */}
          <div className="mx-auto mt-10 max-w-md rounded-[16px] border border-dashed border-muted/40 px-6 py-8 text-center">
            <span className="block font-serif text-4xl leading-none text-muted/30" aria-hidden>
              ״
            </span>
            <p className="mt-3 text-sm leading-relaxed text-muted">{HERO.darkSlot}</p>
          </div>
        </Container>
      </section>

      {/* ===== 33 · grid — card-grid במצב-ריק כן (סלוטים שמורים, אפס מילים מזויפות) ===== */}
      <section>
        <Container width="standard" className="py-16 sm:py-20 md:py-28">
          <SectionSeam className="mb-12" />
          <div className="text-center">
            <p className="flex items-center justify-center gap-2.5">
              <span className="text-[0.65rem] leading-none text-gold" aria-hidden>◆</span>
              <span className="text-xs font-bold tracking-[.18em] text-gold-ink">{GRID.kicker}</span>
            </p>
            <SplitText
              as="h2"
              text={GRID.title}
              className="mt-4 font-serif font-black leading-[1.08] text-navy"
              style={{ fontSize: "var(--text-section)" }}
            />
            <span className="mx-auto mt-4 block h-[3px] w-16 rounded-full bg-rose" aria-hidden />
          </div>

          <MStagger className="mt-10 space-y-8">
            <div className="mx-auto max-w-[42rem] rounded-[16px] bg-gold-soft/70 px-6 py-8 text-center sm:px-10">
              <p className="text-lg font-bold text-navy">{GRID.emptyLead}</p>
              <p className="mt-3 leading-relaxed text-ink">{GRID.emptyBody}</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-muted">{GRID.redirectIntro}</p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                {GRID.redirects.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    data-cta={l.cta}
                    className="rounded-full border border-gold/45 bg-card px-5 py-2.5 text-sm font-semibold text-gold-ink transition-colors hover:border-gold hover:text-gold-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          </MStagger>

          {/* כרטיסי-רפאים שמורים — דקורטיביים, בלי מילה מזויפת אחת; סטטיים בכוונה
              (לעולם לא shimmer/skeleton — הבטחת-שווא, plan 33 שכבה 6) */}
          <div aria-hidden className="mt-12 grid gap-6 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="flex min-h-44 items-center justify-center rounded-[16px] border border-line bg-sand"
              >
                <span className="font-serif text-6xl leading-none text-muted/15">״</span>
              </div>
            ))}
          </div>

          {/* שורת-הדדיות — ללקוחות-עבר אמיתיות בלבד */}
          <p className="mt-8 text-center text-sm leading-relaxed text-muted">{GRID.reciprocity}</p>
        </Container>
      </section>

      {/* ===== 34 · cta — asymmetric-split · שדה-נייבי + דלת-מרווה אחת → #lead ===== */}
      <section>
        <Container width="standard" className="pb-20 pt-4 sm:pb-24 md:pb-32">
          <SectionSeam className="mb-12" />
          <div className="grid gap-6 md:grid-cols-[3fr_2fr] md:items-stretch">
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
                  <p className="text-xs tracking-wide text-white/60">{CTA.trustToken}</p>
                </MItem>
              </MOrchestrate>
            </div>

            {/* פאנל הצעד — שנהב מורם, דלת מרווה אחת, חמה ולא רועשת */}
            <Reveal className="flex">
              <div className="flex w-full flex-col items-center justify-center gap-6 rounded-[16px] border border-line bg-sand px-6 py-12 text-center sm:px-8">
                <Link
                  href={CTA.button.href}
                  data-cta={CTA.button.cta}
                  className="inline-block rounded-full bg-gold px-8 py-4 text-lg font-bold text-white transition-colors hover:bg-gold-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-sand"
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
            </Reveal>
          </div>
        </Container>
      </section>
    </>
  );
}
