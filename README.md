# Site Foundry starter

A brandable Next.js 16 starter scaffolded from the site-foundry design system
("editorial-luxury": navy primary + gold accent + warm sand, serif display + sans
body, sharp radius, RTL-first). It ships the full offerings stack out of the box —
you reskin it and fill in content; you don't rebuild plumbing.

## What's inside

- **Offerings stack (pre-mounted in `src/app/layout.tsx` — don't strip):**
  - Accessibility menu (`AccessibilityMenu`, IL ת״י 5568) + `/accessibility` page
  - Cookie consent (`CookieConsent`) gating all analytics (`MarketingBootstrap`,
    `lib/consent|analytics|attribution|engagement`)
  - Legal pages: `/privacy`, `/terms`, `/accessibility` (template-grade text)
  - SEO: JSON-LD (`JsonLd` + `organizationSchema`/`faqSchema`), `robots.ts`,
    `sitemap.ts`, per-page metadata, indexing gate
  - Lead capture: `ContactLeadForm` → `POST /api/lead` with attribution + engagement
- **Reskin knob:** `src/brand.config.ts` — name, lang, direction (rtl/ltr), the 9
  brandable color roles (`navy*`, `gold*`, `sand`) injected as `--brand-*` CSS vars,
  and font names. Palette changes need zero component edits.
- **Content config:** `src/lib/site.ts` — identity, NAP, hours, nav, services,
  team, CTA, credentials, and `contactForm` (form subjects + consent brand name).
  Components read from here; replace the placeholder values per project.
- **60+ components** under `src/components/` (layout bands, heroes, media sections,
  chrome, forms, motion). Compose pages from the PROP-DRIVEN ones — the
  Barzilay-legacy hardcoded ones are flagged in the foundry `catalog.json`.

## Run

```bash
corepack enable   # if pnpm is missing
pnpm install
pnpm dev          # http://localhost:3000
pnpm build        # must pass before shipping
```

## Fill-in checklist (before launch)

1. **Brand:** `src/brand.config.ts` — colors mapped to the navy/gold/sand roles
   (keep gold-ink-on-white and white-on-navy ≥ 4.5:1), fonts, direction.
2. **Content:** `src/lib/site.ts` (identity, NAP, services, team, CTA,
   `contactForm.subjects` + `contactForm.consentBrandName`), page copy in
   `src/app/*`, markdown in `content/` if used. Never fabricate numbers,
   testimonials, credentials, or outcomes — YMYL rules apply.
3. **Assets:** drop imagery in `public/media/`; add a logo
   (`public/media/logo*.png`) or the wordmark fallback renders.
4. **Legal review:** the privacy/terms/accessibility texts are templates —
   **have a lawyer review them** before going live.
5. **Env vars:** configure the lead destination for `/api/lead` and analytics/GTM
   ids as needed (see `.env*` usage in `src/lib/analytics.ts` and
   `src/app/api/lead/route.ts`).
6. **Indexing gate:** the site is `noindex` until `NEXT_PUBLIC_ALLOW_INDEXING="true"`.
   Set it only at the real launch, after legal review.

## Deploy

Vercel-ready (`vercel.json`, `.vercelignore`). `pnpm build` must pass first; keep
the indexing gate off until explicit launch approval.

## For agents

Read `AGENTS.md` (Next.js 16 rules: consult `node_modules/next/dist/docs/` before
unfamiliar APIs) and the foundry references in `~/.claude/skills/site-foundry/references/`.
