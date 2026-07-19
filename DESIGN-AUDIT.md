# DESIGN-AUDIT — אלונה אקרלינג · 2026-07-16
> 5 מבקרים (אחידות · הערות-רום · pain-fit · YMYL · שלמות) על צילומי כל העמודים + קוד. ממצאים בסדר חומרה. כל תיקון מסומן בעת ביצועו.

**סה"כ: 67** — blocker: 8 · high: 17 · medium: 27 · low: 15

## 1. [BLOCKER] home + testimonials (all viewports) · Header / primary nav  (design-auditor)
- **בעיה:** Primary navigation is invisible on page load: the floating header defaults to its 'over dark hero' treatment (white wordmark, text-slate-100 nav links, white hamburger), but both pages open on LIGHT heroes (warm-paper wash / blush card). White-on-cream is ~1.1:1 contrast — 7 nav links, the wordmark, and the mobile hamburger cannot be seen until the user scrolls 64px.
- **תיקון:** In /Users/romkoren/Desktop/RomKaStudio/clients/alona-eckerling/site/src/app/page.tsx line 209, add `data-light-hero` to the HOOK hero `<section className="relative overflow-hidden">`; same for the first section of /Users/romkoren/Desktop/RomKaStudio/clients/alona-eckerling/site/src/app/testimonials/page.tsx line 76. Safer long-term: invert the default in Header.tsx — require an explicit `data-dark-hero` marker for the white treatment so light pages can never ship an invisible nav.
- **ראיה:** Live screenshot at http://localhost:3012 top-of-page shows white links over the washed-out hero; contrast-boosted zoom of home-desktop-full.jpeg (y=30-110) reveals 7 ghost nav items; testimonials-desktop-full.jpeg top shows the same. Header.tsx line 62 `const light = !solid && !open` with line 102 `
- **סטטוס:** ☐ פתוח

## 2. [BLOCKER] all pages · Footer legal line  (design-auditor)
- **בעיה:** Real-estate template leak in the sitewide legal disclaimer: 'המידע באתר... ואינו מהווה ייעוץ שמאי, משפטי או מקצועי פרטני' — 'ייעוץ שמאי' (property-appraisal advice) is Barzilay-template text. On a YMYL dietitian site the disclaimer must reference medical/nutritional advice; the current line is both nonsensical and legally wrong for the business.
- **תיקון:** In Footer.tsx line 75 replace 'ייעוץ שמאי, משפטי' with 'ייעוץ רפואי, תזונתי-קליני' (e.g. 'המידע באתר הוא כללי ואינו מהווה ייעוץ רפואי או תזונתי פרטני. כל מקרה נבחן לגופו...'). Delete the dead real-estate component /site/src/components/UrbanRenewalLeadForm.tsx (and BooksArticles/WhyBarzilay if equally unused) so no more appraiser copy can leak.
- **ראיה:** Rendered in the live footer on every page (verified via DOM read on http://localhost:3012). Source: /Users/romkoren/Desktop/RomKaStudio/clients/alona-eckerling/site/src/components/Footer.tsx lines 74-75. A second leak lives in the unused components/UrbanRenewalLeadForm.tsx line 258.
- **סטטוס:** ☐ פתוח

## 3. [BLOCKER] בית · 01 · Hero (HOOK)  (pain-fit)
- **בעיה:** The entire hero decision zone — kicker, promise lede, the 'בואי נדבר' CTA, the R.D. credential token, and the soft recipes CTA — becomes invisible ~1.5s after load, as soon as the entrance animation settles. Only the H1 and the photo remain. The STORY's hero job (anchor pain + promise + easy step + credential token in the 50ms zone) is destroyed for every JS-enabled visitor.
- **תיקון:** site/src/app/page.tsx hero section (~line 209): copy the coaching pattern which does this correctly (src/app/coaching/page.tsx ~line 268) — make the section `relative isolate overflow-hidden` and add `-z-10` to the `pointer-events-none absolute inset-0` media wrapper. Then grep all pages for `absolute inset-0` media wrappers without `-z-10`/`isolate` beside static text — src/app/sane-voice/page.tsx booklet panel (~line 292) has the same hazard. Rebuild and re-verify with a post-animation screenshot, not a load-time one.
- **ראיה:** Served build (localhost:3012, commit e282bcc 'media: 6 layer-8 stills wired'): the hero photo stack (img /media/generated/01-hero-kitchen.jpg + gradient scrim) is an `absolute inset-0` wrapper, while the text Container is `position: static`. Per CSS paint order, positioned media paints above in-flow
- **סטטוס:** ☐ פתוח

## 4. [BLOCKER] ALL pages (footer chrome) · Footer legal line  (ymyl)
- **בעיה:** The site-wide footer disclaimer is the Barzilay real-estate template's: «המידע באתר הוא כללי ואינו מהווה ייעוץ שמאי, משפטי או מקצועי פרטני. כל מקרה נבחן לגופו ואין באמור התחייבות לתוצאה.» — 'ייעוץ שמאי' (appraiser advice) on a clinical dietitian's YMYL site. The only disclaimer a visitor sees on every page names the wrong profession, and the correct nutrition-medical disclaimer exists only inside terms §5.
- **תיקון:** In components/Footer.tsx:74-75 replace with the dietitian disclaimer already approved in terms §5 wording, e.g. «התכנים באתר הם מידע כללי ואינם ייעוץ רפואי או תחליף לו. במצב רפואי, הריון או רקע של הפרעת אכילה, התייעצי עם הרופא המטפל.» (no em-dashes).
- **ראיה:** Rendered on every fetched route (home/coaching/about/recipes/sane-voice/testimonials/contact/terms/privacy/accessibility + recipe pages). Source: /Users/romkoren/Desktop/RomKaStudio/clients/alona-eckerling/site/src/components/Footer.tsx lines 74-75.
- **סטטוס:** ☐ פתוח

## 5. [BLOCKER] all pages (social share) · OG / Twitter images  (completeness)
- **בעיה:** The site-wide share images are the PREVIOUS client's brand: src/app/opengraph-image.png and src/app/twitter-image.png both render the Barzilay real-estate card — 'שלושה דורות. תשובה אחת נכונה. · משרד ברזילי · שמאות מקרקעין · מאז 1987' on dark navy/gold. WhatsApp is Alona's primary referral channel, so every shared link previews as a real-estate appraisal office.
- **תיקון:** Replace src/app/opengraph-image.png and src/app/twitter-image.png with 1200x630 Alona-branded cards (warm paper bg, Frank Ruhl Libre headline, sage accent, 'אלונה אקרלינג · דיאטנית קלינית מוסמכת R.D.').
- **ראיה:** Read both PNGs visually — identical Barzilay artwork. layout.tsx metadata has no images override, so Next's file convention serves these on every page.
- **סטטוס:** ☐ פתוח

## 6. [BLOCKER] all pages (browser tab / PWA) · favicon + icons  (completeness)
- **בעיה:** favicon.ico, icon.svg and apple-icon.png are the old brand mark: a gold diamond (#C8A45C) on Barzilay navy (#0A1E3F). Alona's palette is navy #22304C + garden-sage #3E7B5C + rose — the tab icon is literally another business's logo in another palette.
- **תיקון:** Redraw src/app/icon.svg, favicon.ico, apple-icon.png with an Alona mark (e.g. leaf/letter-א monogram) in #22304C/#3E7B5C matching brand.config.ts colors.
- **ראיה:** src/app/icon.svg hardcodes fill=#0A1E3F / stroke=#C8A45C diamond; apple-icon.png read visually = same gold diamond.
- **סטטוס:** ☐ פתוח

## 7. [BLOCKER] manifest.webmanifest · PWA manifest  (completeness)
- **בעיה:** src/app/manifest.ts still ships the appraiser description: 'שלושה דורות של מומחיות בשמאות מקרקעין — היטל השבחה, ירידת ערך, הפקעות וחוות דעת מומחה.' plus old theme/background color #0a1e3f (Barzilay navy, not Alona's #22304C).
- **תיקון:** In src/app/manifest.ts set description to site.description (or a dietitian one-liner) and theme_color/background_color to brand navy #22304C.
- **ראיה:** src/app/manifest.ts lines 8-14; served live at /manifest.webmanifest (200).
- **סטטוס:** ☐ פתוח

## 8. [BLOCKER] all pages (footer) · legal disclaimer  (completeness)
- **בעיה:** The site-wide footer disclaimer is the appraiser's: '…אינו מהווה ייעוץ שמאי, משפטי או מקצועי פרטני' (does not constitute APPRAISAL advice). On a YMYL clinical-dietitian site the required disclaimer is medical/nutritional ('המידע באתר אינו תחליף לייעוץ רפואי או תזונתי אישי').
- **תיקון:** Rewrite the Footer.tsx copyright paragraph: 'המידע באתר הוא כללי ואינו מהווה ייעוץ רפואי, תזונתי או מקצועי פרטני ואינו תחליף להתייעצות עם גורם מוסמך.'
- **ראיה:** src/components/Footer.tsx lines 73-76.
- **סטטוס:** ☐ פתוח

## 9. [HIGH] home (desktop + mobile) · Signature scroll-film «בניית המנה» (TENSION)  (design-auditor)
- **בעיה:** The site's one signature moment renders as ~6,160px (desktop) / ~5,000px (mobile) of empty sand in every automated capture — no plate frames, no thought-chips, no captions. Root cause of fragility: 15 stacked full-viewport <img> elements ALL carrying `willChange:'opacity'` (15 permanent composited GPU layers ≈ 60MB+ each at dpr2), plus frames 4-14 `loading="lazy"` (mid-scroll white pop-in risk). DOM logic verified working live (frames swap via framer-motion useScroll), but the layer strategy breaks compositing in both capture pipelines and is a real blank-stage risk on low-GPU devices (tablets/older phones) — exactly the anxious-audience YMYL page where a blank screen is most costly.
- **תיקון:** In SequenceFilm.tsx: render/promote only the active frame pair (set willChange dynamically on frames i and i+1, remove it from the other 13; or draw frames to a single <canvas> per the scroll-cinema recipe); eager-load all 14 frames (they ARE the moment — preload on section approach); keep the static twin as poster until first frame decoded. Then re-run the QA capture to prove the film actually photographs.
- **ראיה:** home-desktop-full.jpeg y≈1500-7600 and home-mobile-full.jpeg y≈1550-6500 are pure empty sand; live browser-pane compositor froze/blanked in the same section (red-box paint test failed after scroll). Source: /Users/romkoren/Desktop/RomKaStudio/clients/alona-eckerling/site/src/components/SequenceFilm.
- **סטטוס:** ☐ פתוח

## 10. [HIGH] home + testimonials (header state) · Header CTA (light mode)  (design-auditor)
- **בעיה:** The header CTA over light heroes renders navy text on sage green (#22304C on #3E7B5C) ≈ 2.6:1 — fails WCAG AA for its 14px bold label, and is inconsistent with every other sage CTA on the site (all use white text, 4.8:1 per the locked palette: 'לבן-על-ירוק AA ~4.8:1').
- **תיקון:** Header.tsx line 114: change light-mode CTA classes to `bg-gold text-white hover:bg-gold-dark` (matching line 43 of CinematicTeaser and the hero CTA), keeping focus ring as is. One CTA recipe sitewide.
- **ראיה:** Zoom of home-desktop-full.jpeg (100,20)-(210,70): dark muddy text on green pill. Source: /Users/romkoren/Desktop/RomKaStudio/clients/alona-eckerling/site/src/components/Header.tsx line 114 `bg-gold text-navy hover:bg-gold-soft` in the `light` branch. DESIGN-DIRECTION.md D1 locks white-on-sage as the
- **סטטוס:** ☐ פתוח

## 11. [HIGH] home, about, testimonials · Empty-slot placeholders on trust surfaces  (design-auditor)
- **בעיה:** Three core trust surfaces ship visible placeholders: (1) home GUIDE 4:5 portrait slot is a dashed-border sand box with just name+role; (2) about hero leads with a dashed blush box captioned 'אלונה אקרלינג... פורטרט' where the DESIGN-DIRECTION-mandated real 4:5 portrait should be; (3) testimonials page shows THREE empty beige cards containing only ghost quote-marks, stacked under an already-honest empty-state card — a full page that reads broken rather than 'structurally dark'. The honest-slot policy is right; the rendering of it fails the $5-10k bar.
- **תיקון:** Before handoff: obtain Alona's real 4:5 portrait (hard dependency — chase the client). Until then style the slot as intentional art (soft sage-wash panel with the ◆ + hand-script signature accent, no dashed 'developer' border). On /testimonials, delete the 3-card ghost grid (app/testimonials/page.tsx line 133 section) and keep ONE well-set empty-state band + the CTA links card.
- **ראיה:** home-desktop-full.jpeg y≈7900 (dashed portrait card); about-desktop-full.jpeg hero (dashed pink 4:5 box); testimonials-desktop-full.jpeg y≈1300-1500 (3 empty quote cards + caption 'עבדנו יחד? אשמח אם תשתפי'). Source: /site/src/app/page.tsx lines 297-302; /site/src/app/about/page.tsx hero; /site/src/
- **סטטוס:** ☐ פתוח

## 12. [HIGH] home · Film overlay typography  (design-auditor)
- **בעיה:** The film's persistent kicker 'מוכר לך? · צלחת אחת, ערב אחד' is white 13px (`text-card`) centered at top of the frames, but the frames are BRIGHT warm kitchen photos (white window light at top-center of most frames) with only a 16% navy top gradient — white-on-bright fails contrast for the entire 6-viewport scroll.
- **תיקון:** In /site/src/components/SequenceFilm.tsx line 156: restyle the kicker like the thought-chips — `rounded-full bg-bg/85 px-4 py-1.5 text-ink border border-line` (paper chip over image), or raise the top gradient to rgba(34,48,76,.45) and keep white.
- **ראיה:** SequenceFilm.tsx line 156 `text-card` + line 142 gradient `rgba(34,48,76,.16) 0%`; frame /media/generated/02-problem-s05.jpg is blown-bright at top-center (verified pixel inspection of downloaded frame).
- **סטטוס:** ☐ פתוח

## 13. [HIGH] /sane-voice (הקול השפוי) · 26 · hero (product panel)  (owner-notes)
- **בעיה:** IMAGERY: 26-booklet-object.jpg is the only landed generated still not placed anywhere (grep over src finds 01/04/09/11 wired by the in-flight diff, 26 nowhere). The product hero is a typographic cover floating on an empty blush panel — the page selling a physical-feeling object has zero object photography.
- **תיקון:** In src/app/sane-voice/page.tsx hero panel (lines ~290-295), set 26-booklet-object.jpg as an aria-hidden backdrop <Image fill> under a blush/sand veil (like the home-hero veil pattern), keeping the honest typographic BookletCover on top; reuse the same still in the /recipes magnet card media slot (src/app/recipes/page.tsx:216-227) instead of the bare rotated card.
- **ראיה:** public/media/generated/26-booklet-object.jpg is untracked+unused; src/app/sane-voice/page.tsx:290-295 renders only bg-blush + grain; product-desktop-full.jpeg slice 0 shows the flat panel.
- **סטטוס:** ☐ פתוח

## 14. [HIGH] / (בית) · 01 · HOOK hero  (owner-notes)
- **בעיה:** IMAGERY/PERF: the just-wired hero kitchen still uses a plain <img> with no priority — it is now the LCP element of the most important page and will be discovered late (it sits behind an eslint-disable).
- **תיקון:** Replace with next/Image fill + priority + sizes="100vw" + style objectPosition:'30% center' (mirror ImageHero.tsx), keeping the bg-gradient-to-l veil and washes exactly as wired.
- **ראיה:** src/app/page.tsx:211-216 (working-tree diff): <img src="/media/generated/01-hero-kitchen.jpg"> inside aria-hidden div; contrast components/media/ImageHero.tsx:38 which uses next/Image fill priority fetchPriority="high".
- **סטטוס:** ☐ פתוח

## 15. [HIGH] / (בית) · 02 · SequenceFilm «בניית המנה»  (owner-notes)
- **בעיה:** ANIMATIONS (mobile correctness): the 5 noise-chips are whitespace-nowrap at fixed % positions inside an overflow-hidden sticky viewport; the longest chip ("טחינה זה שמן... אבל אני אוהבת.", ~30 chars at clamp(15px,1.9vw,21px)) is wider than a 375px viewport → clipped mid-word; the chip at top 24% / insetInlineStart 34% collides with the kicker on small screens.
- **תיקון:** Add a per-chip mobile policy: below md render only 3 shortest chips (add optional mobile?: boolean to FilmChip and filter), and give chips max-w-[80vw] + whitespace-normal + smaller mobile font; keep desktop positions untouched.
- **ראיה:** components/SequenceFilm.tsx:167-188 (nowrap, absolute %, overflow-hidden container at :122); chip positions src/app/page.tsx:69-73.
- **סטטוס:** ☐ פתוח

## 16. [HIGH] / (בית) · 05 · PROOF «היא באמת מבשלת»  (owner-notes)
- **בעיה:** CARDS: the 3 home recipe cards are the flattest card in the system (border-only hover, title under image) while the recipes archive already ships the rich treatment (image-bleed tile, navy scrim, white serif title, hover lift + shadow + 1.02 image zoom). The homepage shows the weaker card exactly where proof-of-craft must shine.
- **תיקון:** Reuse the archive ImageTile look for the 3 home proof cards: image-topped full-bleed tile with bottom navy scrim carrying the serif title + category chip, hover lift/zoom on the same tokens — one card language across home and archive.
- **ראיה:** src/app/page.tsx:381-407 (hover:border-gold/60 only) vs src/components/RecipesArchive.tsx:132-160 (ImageTile: hover:-translate-y-1, elevation-2, group-hover:scale-[1.02], bottom scrim).
- **סטטוס:** ☐ פתוח

## 17. [HIGH] /coaching + /sane-voice · 15 · FAQ (11 items) / 30 · FAQ (7 items)  (owner-notes)
- **בעיה:** ANIMATIONS+CARDS: both FAQ accordions snap open/closed with zero height ease (native <details>, only the + icon rotates) — the single most-interacted element on the two money pages has no motion, while the house SmoothAccordion (animated .smooth-acc, still native/SEO-safe, reduced-motion floor built in) sits unused.
- **תיקון:** Swap FaqAccordion → SmoothAccordion on both pages (pass name for native single-open), or port the .smooth-acc open-ease + card styling into FaqAccordion; JSON-LD derivation stays unchanged.
- **ראיה:** src/components/FaqAccordion.tsx (bare details/summary); src/components/section/SmoothAccordion.tsx + globals.css .smooth-acc unused in app/ (grep: 0 usages); coaching/page.tsx:474, sane-voice/page.tsx:491.
- **סטטוס:** ☐ פתוח

## 18. [HIGH] בית · 02 · SequenceFilm (TENSION)  (pain-fit)
- **בעיה:** SequenceFilm keeps 14 permanent full-viewport `will-change: opacity` image layers alive for the whole page lifetime. On constrained GPUs this exhausts raster memory and Chromium drops tiles — and the sections that stop painting are exactly the ones after the film: Guide (the license), Proof, Stakes, and the lead form. The skeptic's credential beat is the first casualty.
- **תיקון:** In SequenceFilm.tsx, set will-change only on the active and next frame inside the useMotionValueEvent handler (clear it on all others), or drop will-change entirely (opacity flips on decoded JPEGs don't need pre-promotion), or draw frames into a single <canvas>. Also release layers when the film section leaves the viewport (IntersectionObserver already available).
- **ראיה:** src/components/SequenceFilm.tsx line 133: `style={{ opacity: ..., willChange: "opacity" }}` on every frame img, never released. Two independent Chromium environments in this audit degraded deterministically on this page: film frames painted only their top tile rows mid-scroll, then Guide/Plan/Proof/
- **סטטוס:** ☐ פתוח

## 19. [HIGH] בית · 02 · Film captions (the turn)  (pain-fit)
- **בעיה:** The film's pivot caption 'שומעת את הרעש הזה?' renders in sage-green serif directly over the busy food photo with no scrim, and its payoff line 'זה לא רעב. זו כל דיאטה שנשארה לך בראש.' is ~14px muted gray on wood texture. This is the שקט-axis moment (the most differentiated pain in the hierarchy, weight 12) and it is not readable in the ~1s a scrolling user gives it — the tension never resolves into meaning.
- **תיקון:** In SequenceFilm.tsx caption layer, give captions the same treatment as chips — a rounded bg-bg/85 backdrop or a localized radial scrim behind the caption block; render the 'turn' big line in navy with a sage accent bar instead of sage-colored text over food.
- **ראיה:** Playwright capture at 62% film progress: green big-line and small gray line sit over the salmon-plate frame with zero backdrop; the thought-chips by contrast get bg-bg/85 pill backgrounds and read fine at 30% progress.
- **סטטוס:** ☐ פתוח

## 20. [HIGH] /sane-voice (product) · Checkout card + FAQ  (ymyl)
- **בעיה:** Untrue purchase-flow claim for a 149₪ paid product: visible copy promises «לוחצים, משלמים בעמוד סליקה מאובטח של משולם, ומקבלים קובץ דיגיטלי... ההצטרפות לקבוצה מיד אחרי» and «התשלום מתבצע בעמוד מאובטח של משולם. פרטי התשלום שלך לא נשמרים אצלנו» — but the buy button (data-cta="product-checkout-buy") actually links to https://wa.me/972526359404. No Meshulam page is wired; the promise is false at click time.
- **תיקון:** In app/sane-voice/page.tsx, until the real Meshulam URL is wired: change line 140 FAQ answer and the line 159 'secure' microcopy to the honest interim flow («כרגע קונים דרך וואטסאפ: כותבים לי ומקבלים קישור תשלום מאובטח של משולם») or hold the buy CTA behind the same honest empty-state discipline used for testimonials. Swap back when CHECKOUT_HREF gets the real slika URL.
- **ראיה:** site/src/app/sane-voice/page.tsx line 27 (CHECKOUT_HREF = wa.me fallback, per its own comment 'קישור עמוד הסליקה של משולם טרם חובר'), lines 140 and 159 (the Meshulam claims). Confirmed in rendered HTML: anchor «אני רוצה את החוברת · 149 ₪» → wa.me/972526359404.
- **סטטוס:** ☐ פתוח

## 21. [HIGH] home + /coaching (lead form) · ContactLeadForm (section 08 CTA / coaching CTA)  (ymyl)
- **בעיה:** Template-default form chrome leaked into client copy: «השאירו פרטים» / «נחזור אליכם בשעה שנוחה לכם» — masculine-plural voice on a strictly feminine-singular site, and a 'we'll call you back at your convenient hour' promise that sits directly under Alona's own COPY-approved promise «אני חוזרת אלייך אישית, עד 4 ימי עסקים», creating two conflicting response commitments. Field «שעת חזרה מועדפת» implies a phone-callback service that was never promised.
- **תיקון:** In components/ContactLeadForm.tsx replace the heading/subtitle with feminine-singular COPY-consistent wording (e.g. «השאירי פרטים» / «אני חוזרת אלייך אישית, עד 4 ימי עסקים») so the form carries the same single response promise as the section above it.
- **ראיה:** Rendered on home (page.tsx section 08) and /coaching. Source: site/src/components/ContactLeadForm.tsx lines 118, 132-133.
- **סטטוס:** ☐ פתוח

## 22. [HIGH] sitemap.xml · sitemap coverage  (completeness)
- **בעיה:** sitemap.ts is still the raw template: it emits 4 dead URLs — /services, /services/coaching-60, /services/coaching-120, /services/single-session (all verified 404 on the live build, no such route exists) — and OMITS three real money pages: /coaching, /sane-voice, /testimonials.
- **תיקון:** In src/app/sitemap.ts replace the /services block with '/coaching', '/sane-voice', '/testimonials' (keep /about, /team, collections, /contact + legal).
- **ראיה:** src/app/sitemap.ts lines 12-23 ('/services', services.map(...)); curl http://localhost:3012/services/coaching-60 → 404; live /sitemap.xml contains the /services URLs and lacks /coaching, /sane-voice, /testimonials.
- **סטטוס:** ☐ פתוח

## 23. [HIGH] /404 (not-found) · 404 page  (completeness)
- **בעיה:** The branded 404 is broken three ways: (1) its 'אולי חיפשתם' recovery links point to /services/${slug} — routes that 404, so the 404 page links to more 404s; (2) its background image /media/texture/blueprint.webp does not exist (verified 404 — public/media has no texture/ dir); (3) copy is masculine-plural office voice ('נשמח לכוון אתכם', 'דברו איתנו', 'חזרה לעמוד הבית') on a site that speaks feminine-singular ('בואי נדבר').
- **תיקון:** In src/app/not-found.tsx: point quick links at /coaching, /recipes, /sane-voice; drop or replace the blueprint texture with a warm-paper/grain treatment; rewrite copy in the site's feminine-singular voice.
- **ראיה:** src/app/not-found.tsx line 20 (blueprint.webp), line 58 (href={`/services/${s.slug}`}), lines 29/45; curl /media/texture/blueprint.webp → 404.
- **סטטוס:** ☐ פתוח

## 24. [HIGH] /testimonials · navigation / internal links  (completeness)
- **בעיה:** The testimonials page — fully built per plan sections 32-34 with metadata and the honest empty-state — is completely orphaned: not in nav (lib/site.ts nav array), not in the footer, not linked from any page (grep across src/app + src/components finds zero inbound hrefs), and also absent from the sitemap. A planned trust page nobody can reach.
- **תיקון:** Add { href: "/testimonials", label: "המלצות" } to nav in src/lib/site.ts (or at minimum a footer link + a link from the home PROOF section), and add '/testimonials' to sitemap.ts.
- **ראיה:** src/lib/site.ts nav lines 67-74 has no /testimonials; grep '"/testimonials' across src returns only the page itself; plan/WIREFRAME.md lines 207-225 define it as a delivery page.
- **סטטוס:** ☐ פתוח

## 25. [HIGH] all pages (chrome) · WhatsApp floating button  (completeness)
- **בעיה:** No persistent WhatsApp entry point exists anywhere. The brief says the phone is unpublished (Q4) and WhatsApp (972526359404) is THE referral channel, yet: desktop has no floating WhatsApp button; the mobile StickyContactBar renders only a '/contact' link (its tel: action is hidden because site.phone is empty). wa.me links exist only inline on contact/coaching/sane-voice.
- **תיקון:** Add a WhatsApp action to StickyContactBar (wa.me/${site.whatsapp}, data-cta='sticky-bar-whatsapp') so mobile shows WhatsApp + 'בואי נדבר'; optionally add a desktop floating WhatsApp button in layout.tsx chrome.
- **ראיה:** src/components/StickyContactBar.tsx — two actions: tel (phone empty → hidden) + cta.primary.href='/contact'; no wa.me anywhere in layout chrome.
- **סטטוס:** ☐ פתוח

## 26. [MEDIUM] recipes · ImageHero scrim (RTL)  (design-auditor)
- **בעיה:** Hero lede and inline link sit partly OUTSIDE the navy scrim's protected zone: the RTL gradient falls to 15% opacity by the 72% mark, while the white lede (max-width ~62ch) and the sage-soft eyebrow extend left over bright hummus/chickpea texture — marginal-to-failing legibility. The scrim also hardcodes the TEMPLATE navy rgba(10,30,63,…) instead of brand ink #22304C.
- **תיקון:** In ImageHero.tsx: deepen the gradient mid-stop (e.g. .45→.3 out to 85%) and cap hero text block at ~46ch so copy stays inside the ≥45% zone; swap hardcoded rgba(10,30,63,…) for color-mix on var(--color-navy) so the grade matches the locked palette.
- **ראיה:** recipes-desktop-full.jpeg hero: lede 'מתכונים פשוטים שאנחנו באמת מבשלת...' spans x≈420-1130 over the bright bowl; eyebrow 'בלי טריקים מיותרים' barely reads. Source: /site/src/components/media/ImageHero.tsx lines 44-47.
- **סטטוס:** ☐ פתוח

## 27. [MEDIUM] all pages · Footer copyright  (design-auditor)
- **בעיה:** Year range renders visually reversed in RTL: '© 2026–2023' instead of '2023–2026' — the LTR numeric range has no direction isolation inside the RTL paragraph.
- **תיקון:** Wrap the range in a direction-isolated span: `<span dir="ltr">{site.foundingYear}–{currentYear()}</span>` (or use ⁦…⁩ isolates) in Footer.tsx line 74.
- **ראיה:** Visible in every footer capture (e.g. recipes-desktop-full.jpeg footer legal row); DOM text confirmed live. Source: /site/src/components/Footer.tsx line 74 `© {site.foundingYear}–{currentYear()}`.
- **סטטוס:** ☐ פתוח

## 28. [MEDIUM] all pages (worst: contact, coaching, about) · Reveal system / first paint  (design-auditor)
- **בעיה:** Nearly all section content is opacity-0 until client hydration + entrance animation completes (~1.5-2s): on /contact first paint shows ONLY the kicker on a blush void — H1, lede and CTA land seconds later; the audit's own full-page captures caught 15+ sections as empty bands (coaching's 4-card grid, package cards, FAQ intro; about's story timeline; product's deliverables grid; final navy CTA bands). Slow, all-or-nothing reveals on a YMYL site read as a broken page and also make automated QA blind.
- **תיקון:** Tighten MOrchestrate/Reveal (site/src/components/motion/): initial delay ≤100ms, duration ≤400ms, translateY ≤12px; trigger via IntersectionObserver rootMargin '0px 0px -10%' so content is never blank in-viewport; honor prefers-reduced-motion by rendering visible; give the QA pipeline an animations-off switch (e.g. `?motion=off` sets the a11y stop-motion flag) so future audits photograph real content.
- **ראיה:** Live: fresh load of http://localhost:3012/contact painted kicker-only, full hero after ~2s. Captures: coaching-desktop-full.jpeg y≈650-2200 & 2900-4200 empty; about-desktop-full.jpeg y≈850-2200 empty; SSR HTML verified to CONTAIN all content (curl grep), so this is purely reveal timing.
- **סטטוס:** ☐ פתוח

## 29. [MEDIUM] home · HOOK→TENSION seam  (design-auditor)
- **בעיה:** Hard cut between the hero image bottom edge and the film's flat sand stage — the only section boundary on the page without a soft-arc/leaf seam, and it lands exactly at the emotional handoff the design brief calls out; on mobile the plate photo is guillotined mid-plate at the fold.
- **תיקון:** In /site/src/app/page.tsx, close the HOOK section (line 209 block) with the same ShapedSection/SectionSeam arc used before GUIDE, tinted to the film's sand (#F4EDE4), so hero exhales into the film.
- **ראיה:** home-desktop-full.jpeg y≈1500 (image ends, sand begins, no seam) vs. GUIDE section which gets SectionSeam (page.tsx line 293); home-mobile-full.jpeg y≈1550. DESIGN-DIRECTION.md 'שלד': 'מפרידי soft-arc / leaf-edge בין הסקשנים הפסיכולוגיים'.
- **סטטוס:** ☐ פתוח

## 30. [MEDIUM] home (desktop + mobile) · PLAN sticky ladder  (design-auditor)
- **בעיה:** The sticky media slot of the 3-step ladder is a huge blank white card with only a ghost numeral (01/02/03) — no media at all — held on screen across a ~300vh scroll. It is the visually weakest passage of the homepage and reads unfinished next to the photographic film above it.
- **תיקון:** Give each step a real still in the sticky card (generated kitchen/consult/WhatsApp-journal stills via the media-engine into /site/public/media/generated/), keeping the numeral as a corner badge; or halve the track height and shrink the card so the ghost-number treatment reads as intentional typography.
- **ראיה:** home-desktop-full.jpeg y≈9050-9650 (white card + pale '01'); home-mobile strips 2 (cards 01/02/03 empty); live DOM: PLAN section contains 0 <img> elements.
- **סטטוס:** ☐ פתוח

## 31. [MEDIUM] /coaching · 09 · hero  (owner-notes)
- **בעיה:** IMAGERY: the newly wired consultation-table still is desktop-only (hidden md:block) — mobile visitors (the Instagram-referred majority) still get a wash-only hero with no clinic imagery at all.
- **תיקון:** Add a mobile treatment: a short 16/9 image band (MediaFrame with the same still, veiled) directly under the hero copy for <md, or unhide the absolute image with a stronger sand gradient so the H1 keeps AA.
- **ראיה:** working-tree diff src/app/coaching/page.tsx:270-276: className="... hidden ... md:block" on the 09-coaching-table.jpg img and its veil.
- **סטטוס:** ☐ פתוח

## 32. [MEDIUM] /coaching · 14 · PROOF «מהמטבח של אלונה»  (owner-notes)
- **בעיה:** ANIMATIONS: the section's three real dish photos enter with the generic fadeUp only — the house signature ink-wipe (ClipReveal, named in DESIGN-DIRECTION D2 as the default media reveal) never runs on any standalone still on the site.
- **תיקון:** Add an optional reveal prop to components/media/MediaFrame.tsx that wraps the Image in ClipReveal (absolute inset-0 inside the aspect frame); enable it on coaching §14 stills and, when Alona's real portrait lands, on the About/home portrait slots. Reduced-motion twin is already built into .clip-frame.
- **ראיה:** coaching/page.tsx:448-452 routes stills through MediaFrame (static, no reveal); ClipReveal + .clip-frame/.clip-uncover exist (components/motion/ClipReveal.tsx, globals.css:339-341) and are used only inside FeatureAlternating/Gallery/heroes; DESIGN-DIRECTION.md D2 «חשיפות fade-up / ink-wipe רכות (ברי
- **סטטוס:** ☐ פתוח

## 33. [MEDIUM] /sane-voice · 27 · FORYOU «זה נכתב בשבילך»  (owner-notes)
- **בעיה:** TEXT DIVISION: the body is one 4-line wall whose first sentence is literally a noise-list — "קטו, פחמימות זה רע, רק חלבון, בלי לאכול אחרי שבע." — buried in prose instead of scannable pieces.
- **תיקון:** Re-layout, zero rewording: render the four trend fragments as tilted noise-chips (reuse the SequenceFilm chip styling — the home film motif echoes on the product page), then the remaining sentences ("הפיד לא מפסיק..." onward) as a short paragraph. Every word from COPY.md preserved, order intact.
- **ראיה:** src/app/sane-voice/page.tsx:50 (FORYOU.body, single paragraph rendered at :386-388).
- **סטטוס:** ☐ פתוח

## 34. [MEDIUM] /coaching · 12 · packages «בחרי את הליווי שמתאים לך»  (owner-notes)
- **בעיה:** CARDS: the recommended card (coaching-120, highlight:true) differs from siblings only by a bg/border tint, and none of the three cards has any hover response — the page's decision moment reads flat.
- **תיקון:** Give the highlight card elevation (style boxShadow: var(--elevation-2)) + md:-translate-y-2, and all three cards the archive hover tokens (hover:-translate-y-1 hover:shadow-[var(--elevation-2)] transition duration-300 ease-[var(--ease-out)]); copy untouched.
- **ראיה:** coaching/page.tsx:386-388 (highlight → border-gold/50 bg-gold-soft only, no shadow/scale/hover); coaching-desktop-full.jpeg slice 1 shows the grid area.
- **סטטוס:** ☐ פתוח

## 35. [MEDIUM] /coaching · 10 · PROBLEM + 12 · packages (fact band)  (owner-notes)
- **בעיה:** TEXT DIVISION: (a) PROBLEM body is a single 62ch paragraph carrying three beats; (b) the page's honest, checkable numbers (60–75 דקות · ליווי 60 יום · ליווי 120 יום · מענה עד 4 ימי עסקים) live only inside prose — no scannable stat/fact row exists anywhere on the site (StatCounters unused).
- **תיקון:** (a) Split PROBLEM.body at its sentence boundaries into two short paragraphs, letting the existing PullQuote breathe between them (re-layout only). (b) Add a quiet 4-item fact band above the packages grid composed ONLY of existing COPY strings (chip row or StatCounters without counting animation) — honest numbers, no invented metrics.
- **ראיה:** coaching/page.tsx:44 (one paragraph); numbers scattered across PACKAGE_COPY:93-122 and HERO.micro:36; src/components/StatCounters.tsx unused in app/.
- **סטטוס:** ☐ פתוח

## 36. [MEDIUM] /recipes · 24 · archive bento  (owner-notes)
- **בעיה:** CARDS: the 4 recipes without photos (baked-corn-fritters, easy-pea-soup, protein-pancakes, tofu-honey-mustard) render as plain sand TextTiles that read as failed image loads sitting between rich photo tiles.
- **תיקון:** Restyle TextTile as an intentional 'recipe-card' object: alternating blush/sage wash bg + the leaf/booklet glyph (already coded in sane-voice/page.tsx) or a large faint serif ״ + category chip — so no-photo tiles look designed, not broken.
- **ראיה:** grep -L '^image:' content/recipes → 4 files; recipes-desktop-full.jpeg slice 1 shows the flat sand tiles beside grey lazy-load placeholders; RecipesArchive.tsx:168-186 (TextTile).
- **סטטוס:** ☐ פתוח

## 37. [MEDIUM] / (בית) · 05 · PROOF dark slots  (owner-notes)
- **בעיה:** CARDS: the two honest empty-slots (testimonials pending / logos pending) render as two card-shaped dashed ghosts in a 2-col grid directly under the real recipe cards — equal visual weight to content, doubling the 'unfinished' impression.
- **תיקון:** Collapse both into ONE slim full-width band (single line each, ◆ separator, dashed border kept) placed under the section CTA — structural honesty preserved, footprint quartered.
- **ראיה:** src/app/page.tsx:409-418; home-desktop-full.jpeg slice 4 shows two pale dashed boxes mid-section.
- **סטטוס:** ☐ פתוח

## 38. [MEDIUM] /about (עליי) · 20 · credentials bento  (owner-notes)
- **בעיה:** CARDS/TRUST: the anchor tile's core promise — "בדקי אותי במאגר משרד הבריאות" — is a non-interactive <p>; the page built around checkability gives nothing to click. Tiles also have no hover response.
- **תיקון:** Make the verify line a real <a> to the MOH practitioners registry (https://practitioners.health.gov.il — confirm exact deep-link) with target=_blank rel=noopener, styled as the existing gold-soft line + underline on hover; add the same hover lift tokens used by archive tiles to the four bento cells.
- **ראיה:** src/app/about/page.tsx:301-306 (plain <p> with ◆); no href anywhere in the tile.
- **סטטוס:** ☐ פתוח

## 39. [MEDIUM] / (בית) · 03 · GUIDE portrait slot  (owner-notes)
- **בעיה:** IMAGERY/CARDS: the portrait placeholder is a dashed-border box that reads as a broken embed on the highest-trust section (real-portrait-only rule is right — the empty-state styling is the problem, not the honesty).
- **תיקון:** Restyle the empty-state as a designed blush-wash card: signature-script "אלונה" (the Solitreo font already loaded on /about) + name + license chip on a soft wash, solid hairline border — reads as a deliberate calling-card until the real 4:5 photo lands (then wrap it in ClipReveal).
- **ראיה:** src/app/page.tsx:290-294 (border-2 border-dashed bg-sand); home-desktop-full.jpeg slice 2/3 shows the hollow frame beside the credentials.
- **סטטוס:** ☐ פתוח

## 40. [MEDIUM] בית · 03 · Guide (authority beat)  (pain-fit)
- **בעיה:** The portrait slot is a literal wireframe: an aspect-4/5 box with a 2px dashed border holding just the name and role, with the age-answer quote hanging beneath it. For avatar C — whose acuity-4 pain is authority-doubt — the first-glance read of the credibility section is 'unfinished website', which confirms 'עוד אינפלואנסרית / לא מקצועי' instead of answering it. Honest empty-state is the right policy; dashed-wireframe aesthetics are the wrong rendering of it.
- **תיקון:** site/src/app/page.tsx GUIDE portrait slot: style the placeholder as a finished design object — sand/sage wash card, serif monogram, gold ◆, solid hairline border, no dashes — or drop the box entirely and let the credential strip + rose-bordered quote carry the column until the real photo arrives.
- **ראיה:** Served DOM: `div.flex.aspect-[4/5]...border-2.border-dashed.border-line.bg-sand` containing only name + role; same in mockup/qa/audit/home-desktop-full.jpeg (chunk at y≈8100).
- **סטטוס:** ☐ פתוח

## 41. [MEDIUM] בית · 05 · Proof  (pain-fit)
- **בעיה:** The proof beat gives two full card-sized dashed empty states ('המלצות אמיתיות יופיעו כאן...' + 'שיתופי פעולה ומדיה יתווספו...') a whole row directly under only 3 recipe cards — half the section's card real estate says 'אין הוכחות' twice. For the skeptic this inverts the section's job (belief through specificity) into confirmation of her doubt. Additionally 'אנחנו לא ממציאים סיפור שלא קרה' breaks the site's first-person voice — the whole site is Alona's 'אני', and the plural 'אנחנו' reads corporate exactly at the honesty moment.
- **תיקון:** Collapse the two dark slots into one quiet single-line first-person footnote under the recipe grid (e.g. 'המלצות ולוגו מדיה יעלו כאן רק כשיהיו אמיתיים. ככה אני עובדת.') with no card chrome; let the recipes + the honest count-chip own the section until real proof lands (STORY §מיקוד ההשקה already plans for the dark slot — it just shouldn't be louder than the proof).
- **ראיה:** page.tsx lines ~409-418 (two dashed bg-bg2 cards in md:grid-cols-2) + PROOF.darkTestimonial copy; visible in audit capture home-desktop-full.jpeg chunk 07.
- **סטטוס:** ☐ פתוח

## 42. [MEDIUM] בית · 02 · Film runway length  (pain-fit)
- **בעיה:** The tension corridor costs ~7.7 viewport-heights of mandatory scrolling (14 frames × 55vh) between the hook and the guide, with no skip affordance, and the captions go silent from 12% to 56% of progress (~3.4 screens of chips only). Avatar A arrives exhausted at 23:00 and avatar C wants the license now — both must scrub the full film to reach the credential beat; the STORY's signature moment becomes a toll gate.
- **תיקון:** Cut the runway to ~420–450vh (30vh/frame keeps the crossfade readable), or add a quiet fixed 'דלגי ↓' link in the sticky layer's bottom corner that jumps past the runway. Keep the gold progress bar.
- **ראיה:** SequenceFilm.tsx line 110: `height = Math.max(400, frames.length * 55)` → 770vh; FILM_CAPTIONS windows in page.tsx: caption 1 ends at 0.12, caption 2 starts at 0.56; no skip control exists in the component (grep 'skip|דלג' returns nothing).
- **סטטוס:** ☐ פתוח

## 43. [MEDIUM] בית · 07 · Success (peak-end)  (pain-fit)
- **בעיה:** The peak-end felt-lines ('בפעם הראשונה, אני לא בדיאטה. אכלתי בחוץ, נהניתי, ובלי אשמה...') are large first-person serif lines whose only future-framing is a text-xs letterspaced kicker ('ככה זה יכול להרגיש'). At first glance they scan as an anonymous customer testimonial — precisely the fabricated-proof pattern the STORY's ethics ban and that avatar C is primed to catch ('זה שיווק, לא אמת'). The peak risks backfiring for the exact reader it must convert.
- **תיקון:** Make the frame unmissable: promote the kicker into the composition as a readable serif lead-in line (e.g. 'ככה זה יכול להרגיש, עוד כמה חודשים:') sized ~1.1-1.25rem in navy above the felt-lines, so the 'possible future' reading is locked before the quote-like lines are scanned.
- **ראיה:** page.tsx SUCCESS block: kicker is text-xs tracking-[0.18em] vs lines at clamp(1.6rem,3.6vw,2.6rem); no attribution, no future-tense marker in the lines themselves.
- **סטטוס:** ☐ פתוח

## 44. [MEDIUM] ALL pages (cookie banner + footer + form success) · Chrome text  (ymyl)
- **בעיה:** Em/en dashes in rendered chrome, violating COPY.md's absolute house rule («אפס מקפים ארוכים בקובץ כולו, כולל כל קופי ללקוחה»): (a) cookie banner has two em-dashes: «ובעוגיות מדידה — בכפוף להסכמתכם — כדי לשפר...» (visible in every audit screenshot); (b) footer «© 2023–2026» en-dash on every page; (c) lead-form success message «הפרטים התקבלו — תודה!» shown after submit on home/coaching.
- **תיקון:** CookieConsent.tsx:36 → «ובעוגיות מדידה, בכפוף להסכמתכם, כדי לשפר...»; Footer.tsx:74 → «© 2023-2026» (regular hyphen) or just the current year; ContactLeadForm.tsx:117 → «הפרטים התקבלו, תודה!».
- **ראיה:** components/CookieConsent.tsx:36; components/Footer.tsx:74; components/ContactLeadForm.tsx:117. Confirmed visually in testimonials-desktop-full.jpeg and home-desktop-full.jpeg (banner).
- **סטטוס:** ☐ פתוח

## 45. [MEDIUM] home (CTA section), /coaching (hero) · Trust token wording  (ymyl)
- **בעיה:** Credential-token drift from COPY.md's per-section spec: COPY section 8 (home CTA) specifies the FULL token «דיאטנית קלינית מוסמכת · R.D. · רישיון משרד הבריאות 204526-11» but the rendered home CTA shows the short token without the license number; conversely COPY section 9 (coaching hero) specifies the short token but the rendered coaching hero shows the full number. Hero (section 1) short-token is correct per COPY («מספר הרישיון מודפס רק בעמוד עליי» note applies to the hero only); contact tokens match COPY.
- **תיקון:** app/page.tsx:194 → append « 204526-11» to the CTA trustToken; app/coaching/page.tsx hero trustToken → drop the number (or get a one-line COPY amendment approving full-number everywhere, then align COPY.md).
- **ראיה:** site/src/app/page.tsx:194 (CTA trustToken lacks 204526-11) vs COPY.md section 8 token; rendered page-coaching hero shows «...204526-11» vs COPY.md line ~90 short token.
- **סטטוס:** ☐ פתוח

## 46. [MEDIUM] home + /coaching (lead form) · Consent checkbox  (ymyl)
- **בעיה:** Grammar error in the legally-meaningful consent text: «אני מאשר/ת שאלונה אקרלינג ייצור עמי קשר» — masculine verb «ייצור» with the feminine subject אלונה אקרלינג (template brand-name substitution left the verb masculine). Consent wording should be unambiguous.
- **תיקון:** ContactLeadForm.tsx:169 → «אני מאשרת שאלונה אקרלינג תיצור איתי קשר בנוגע לפנייתי» (feminine verb, matches the site's feminine-singular address like the contact page's «אני מאשרת שאלונה תחזור אליי»).
- **ראיה:** components/ContactLeadForm.tsx:169; rendered on home and /coaching («אני מאשר/ת שאלונה אקרלינג ייצור עמי קשר בנוגע לפנייתי»).
- **סטטוס:** ☐ פתוח

## 47. [MEDIUM] /coaching, /contact, /sane-voice · WhatsApp CTAs (wa.me links)  (ymyl)
- **בעיה:** Two open pre-launch items ride on the live WhatsApp channel: (1) COPY.md REDLINES line 488 marks the coaching secondary CTA «אפשר גם לכתוב לי בוואטסאפ» as [להכרעה] — «לאישור אלונה/רום» — yet it is already rendered and clickable; (2) the number behind every wa.me link (972526359404) is itself marked unverified in site.ts («לאימות מולה שהוואטסאפ העסקי על המספר הזה»). No phone number is PRINTED anywhere (Q4 respected: site.phone="", sticky bar renders no tel:, JSON-LD has no telephone) — but a wa.me click reveals the number, so the pending approvals must close before launch.
- **תיקון:** Get the two sign-offs recorded (Alona/Rom approval of the coaching WhatsApp CTA; verification that 972526359404 is the business WhatsApp) before go-live; no code change if approved — otherwise remove the coaching secondary CTA and repoint wa.me links.
- **ראיה:** wa.me/972526359404 hrefs on coaching (2), contact (2), sane-voice (4); COPY.md:488 [להכרעה]; site/src/lib/site.ts:24 [לאימות].
- **סטטוס:** ☐ פתוח

## 48. [MEDIUM] /blog · blog collection  (completeness)
- **בעיה:** The 'טיפים ומאמרים' blog collection is configured (content/cms/collections.json) and its index /blog is live (200) AND listed in the sitemap — but content/blog is empty (0 entries), the route is linked from nowhere (no nav/footer link), and the index renders only a bare PageHero with no empty-state message or CTA. Once indexing is enabled, the sitemap advertises a thin empty page.
- **תיקון:** Either (a) seed 2-3 launch articles and add a nav/footer link, or (b) skip empty collections in collectionSitemapRoutes() (only push the index when published.length > 0) and add an honest empty state to [collection]/page.tsx.
- **ראיה:** content/blog/ is empty; collectionSitemapRoutes() in src/lib/collections.ts pushes '/blog' unconditionally; src/app/[collection]/page.tsx renders BlogCardGrid only when posts.length > 0, nothing otherwise.
- **סטטוס:** ☐ פתוח

## 49. [MEDIUM] /team/alona · internal links  (completeness)
- **בעיה:** /team/alona is live with real content (credentials, Person + EducationalOccupationalCredential JSON-LD, breadcrumbs) and sits in the sitemap — but has zero inbound links: the about page never links to it, nav/footer don't either. An indexed orphan that duplicates /about's Person story.
- **תיקון:** Either link it from /about (e.g. the credentials block → 'לעמוד ההסמכות המלא') or drop team routes from sitemap.ts and let /about be the single bio page.
- **ראיה:** grep '/team/alona' across src/app + src/components → no matches; sitemap.ts includes team.map(...); curl /team/alona → 200 with Person schema.
- **סטטוס:** ☐ פתוח

## 50. [MEDIUM] /sane-voice · JSON-LD  (completeness)
- **בעיה:** The booklet product page shows a price chip and a WhatsApp checkout CTA, but emits no Product/Offer JSON-LD — live page carries only FAQPage + BreadcrumbList. The one commercial product on the site is invisible to rich results.
- **תיקון:** Add a Product schema block in src/app/sane-voice/page.tsx ({"@type":"Product", name, description, image, offers:{"@type":"Offer", price, priceCurrency:"ILS", availability}}) sourced from the same HERO/CHECKOUT consts, rendered via <JsonLd>.
- **ראיה:** curl /sane-voice JSON-LD types: FAQPage, Question/Answer, BreadcrumbList only; src/app/sane-voice/page.tsx defines only faqSchema.
- **סטטוס:** ☐ פתוח

## 51. [MEDIUM] /sane-voice → /contact · newsletter capture  (completeness)
- **בעיה:** Two CTAs on the product page promise 'הצטרפי לרשימה השפויה, חינם' but LIST_HREF is plain '/contact' — landing on a generic contact page where joining the list is a small opt-in checkbox buried inside ContactQuietForm, unchecked, with no anchor and no pre-selection. There is no dedicated newsletter signup form anywhere (home, recipes, footer have none). The promised one-click free action becomes a 5-field form + hidden checkbox.
- **תיקון:** Minimum: change LIST_HREF to '/contact?list=1#lead' and make ContactQuietForm read the param to scroll + pre-check the newsletter opt-in. Better: a dedicated 2-field list-signup block (name+email) on /sane-voice and the recipes magnet section.
- **ראיה:** src/app/sane-voice/page.tsx line 29: const LIST_HREF = "/contact" (no anchor/param); src/components/ContactQuietForm.tsx newsletter useState(false).
- **סטטוס:** ☐ פתוח

## 52. [MEDIUM] / (home) · JSON-LD  (completeness)
- **בעיה:** The home page emits zero JSON-LD (verified live: 0 application/ld+json blocks) and has no page metadata export. The ProfessionalService business schema lives only on /contact — the entity's front door carries no structured identity (no Person/ProfessionalService), weaker for GEO/AI answers which the robots.ts explicitly courts (GPTBot/PerplexityBot allowed).
- **תיקון:** Add <JsonLd data={professionalService(site, services)} /> (or a Person schema referencing /about) to src/app/page.tsx.
- **ראיה:** curl http://localhost:3012/ | grep -c 'application/ld+json' → 0; src/app/page.tsx has no metadata or JsonLd import.
- **סטטוס:** ☐ פתוח

## 53. [LOW] home · PROOF media band images  (design-auditor)
- **בעיה:** next/image used without `sizes` on the 3-tile recipe band: browser requests the w=3840 variant for a 377px-wide tile (~4-10x oversized transfer) — needless LCP/bandwidth cost on a mobile-first audience.
- **תיקון:** Add `sizes="(max-width: 768px) 100vw, 33vw"` to the PROOF band Image components in /site/src/app/page.tsx (and audit other fill-images sitewide for missing sizes).
- **ראיה:** Live DOM: img src '/_next/image?url=%2Fmedia%2Fclient%2Frecipes%2Ftofu-shawarma.jpg&w=3840&q=75' at rendered width 377px (home PROOF section).
- **סטטוס:** ☐ פתוח

## 54. [LOW] all pages (mobile) · Footer legal links row  (design-auditor)
- **בעיה:** The 4 legal links + dot separators wrap untidily on 375px — 'ניהול הגדרות עוגיות' orphans onto its own line with a dangling '·' separator at line start.
- **תיקון:** In /site/src/components/Footer.tsx legal row: use `flex flex-wrap justify-center gap-x-3 gap-y-1` with the '·' rendered via CSS `::before` on non-first items (so separators disappear at wrap points), or drop separators on mobile.
- **ראיה:** home-mobile-full.jpeg footer legal row (y≈16050); testimonials-mobile strip1 footer.
- **סטטוס:** ☐ פתוח

## 55. [LOW] product (sane-voice), mobile · Cookie banner overlap  (design-auditor)
- **בעיה:** On mobile the fixed cookie banner covers the primary purchase CTA ('אני רוצה את החוברת · 149 ₪') at the natural first-scroll position — the money button is obscured until consent is answered.
- **תיקון:** Reduce mobile banner height (single-line copy + inline links) in /site/src/components/CookieConsent.tsx, and add bottom padding/scroll-margin to hero CTA clusters while the banner is mounted (body[data-consent-open] .hero-cta { margin-bottom: banner-height }).
- **ראיה:** product-mobile-full.jpeg y≈650-840: banner overlays the green CTA pill.
- **סטטוס:** ☐ פתוח

## 56. [LOW] / (בית) · 02 · SequenceFilm pacing  (owner-notes)
- **בעיה:** ANIMATIONS: the pinned film occupies 14×55vh = 770vh (~8 full screens of scroll) for the one signature moment — the crossfade pace reads sluggish and delays the GUIDE section that answers the tension.
- **תיקון:** Pass lengthVh={520} (≈37vh/frame) from src/app/page.tsx and consider holdEnd 0.78 so the resolution caption lands earlier; chips/caption windows are progress-relative so they need no retuning.
- **ראיה:** components/SequenceFilm.tsx:110 (height = max(400, frames.length*55)); home-desktop-full.jpeg slices 1-2 are ~5000px of flat sand scroll-track.
- **סטטוס:** ☐ פתוח

## 57. [LOW] /about + / (בית) · 19 · AGE quote / 07 · SUCCESS  (owner-notes)
- **בעיה:** ANIMATIONS: the two her-voice signature moments end on static rules — the rose bar under the אלונה signature and the rose underline on the SUCCESS last line don't draw in, though the house rule-draw keyframe exists and is already used by SectionSeam/MChapter.
- **תיקון:** Apply the rule-draw pattern: give the AGE figcaption bar the .rule-draw class inside a useReveal-armed wrapper, and swap the SUCCESS last-line text-decoration for a border-bottom span that scaleX-draws on first view — a11y-stop-motion/reduced-motion already resolve rule-draw to static.
- **ראיה:** about/page.tsx:279 (static h-[3px] span); page.tsx:503 lastLineClass static underline; globals.css:320-327 .rule-draw available.
- **סטטוס:** ☐ פתוח

## 58. [LOW] /recipes · 24 · filter chips  (owner-notes)
- **בעיה:** ANIMATIONS: category/tag filtering swaps the whole bento with a hard cut — the page's main interaction has no transition.
- **תיקון:** Wrap the tile grid in a motion container with a soft opacity/layout transition on filter change (softTransition token; instant when motionAllowed() is false) — no per-tile springs, one quiet crossfade.
- **ראיה:** src/components/RecipesArchive.tsx — setCategory/setTags re-render, no layout/fade animation on the grid.
- **סטטוס:** ☐ פתוח

## 59. [LOW] all pages (QA process) · audit evidence  (owner-notes)
- **בעיה:** Every whileInView-gated block (MStagger/MOrchestrate/Reveal content) captures as BLANK in the full-page audit screenshots — the armed-hidden state was photographed, so the evidence set dramatically under-represents the built site and likely fed the 'flat/empty cards' impression.
- **תיקון:** Have the QA capture script add class a11y-stop-motion to <html> (the site's built-in static-twin switch) before taking full-page screenshots, so audits photograph the final visible design.
- **ראיה:** components/motion/MStagger.tsx:47-63 arms hidden pre-paint until IntersectionObserver fires; home/coaching/about/product/contact desktop-full.jpeg all show empty card zones (e.g. packages grid, credentials bento, contact form card).
- **סטטוס:** ☐ פתוח

## 60. [LOW] בית · 01 · Hero + cookie consent  (pain-fit)
- **בעיה:** On first visit at common laptop sizes (1280×800) the fixed cookie banner sits exactly over the hero decision zone: the primary CTA (y≈672-731) and the R.D. trust token (y≈691-735) are underneath the banner. The 50ms zone shows consent UI instead of the credential and the easy step on every first impression.
- **תיקון:** In CookieConsent.tsx, render the desktop banner as a compact corner card (max-w-sm, inset-inline-start, bottom) instead of a full-width bottom bar, so the hero CTA column stays clear on first paint.
- **ראיה:** Playwright measurement at 1280×800 first visit: banner occupies the bottom ~190px band; CTA/token rects fall inside it (screenshot pf-hero-firstvisit).
- **סטטוס:** ☐ פתוח

## 61. [LOW] QA evidence set · mockup/qa/audit/*  (pain-fit)
- **בעיה:** The audit screenshots are stale and misleading: they were captured at 15:17 from the pre-media build (no hero kitchen still), with entrance animations frozen at opacity-0 (guide mechanism items, recipe cards, the Stakes comparison, and the Success lines are all missing from the captures), and with a stitching artifact that repeats the hero at the bottom of the page. Any design sign-off against these images approves a page that no longer exists.
- **תיקון:** Recapture the audit set from the current build with a capture profile that either scrolls to trigger whileInView before shooting or forces the reduced-motion path (SSR final-visible state); assert screenshot mtime > .next/BUILD_ID mtime in the audit script.
- **ראיה:** Screenshot mtimes 15:17 vs src/app/page.tsx 15:22 and .next rebuild 15:25 (commit e282bcc); home-desktop-full.jpeg shows wash-only hero + ~6000px blank film runway + blank proof grid, and a duplicate hero after the footer.
- **סטטוס:** ☐ פתוח

## 62. [LOW] /styleguide (+ dead template components) · Internal demo surface  (ymyl)
- **בעיה:** /styleguide returns 200 in the production build and contains Barzilay-domain demo content (שמאי, fabricated demo names/quotes — self-labeled «כל הנתונים כאן הם דוגמה מובהקת»). It is noindex'd and robots.txt currently Disallows everything (pre-launch guard), but once robots opens at launch the page remains reachable by URL. Additionally ~15 unused Barzilay components (WhyBarzilay, ScrollStory, ProcessSteps, CtaBand, EditorialHero, urban-renewal/*, etc.) full of appraiser copy and em-dashes remain in src/components — one accidental import re-leaks another business's content (exactly what already happened with Footer).
- **תיקון:** Delete or env-gate app/styleguide before launch, and remove the unused Barzilay components from site/src/components so no future import can resurrect appraiser copy on the dietitian site.
- **ראיה:** curl http://localhost:3012/styleguide → 200, body contains שמאי; app/styleguide/page.tsx:32 robots:{index:false}; string-literal scan of components/ lists Barzilay copy in WhyBarzilay.tsx, ScrollStory.tsx, ProcessSteps.tsx, CtaBand.tsx, urban-renewal/*.
- **סטטוס:** ☐ פתוח

## 63. [LOW] repo / bundle · dead template code  (completeness)
- **בעיה:** Barzilay-specific components ship in the delivered repo with appraiser copy hardcoded, all unused by any page: OurStory, WhyBarzilay, ScrollStory (full Barzilay dynasty story), EditorialHero, ProcessSteps, BooksArticles, StatCounters, JuxtaposeSlider, UrbanRenewalLeadForm + components/urban-renewal/. CtaBand is used (testimonials, with overridden props) but its DEFAULT subtitle is still 'שיחת ייעוץ ראשונית עם שמאי מהמשרד'.
- **תיקון:** Delete the unused Barzilay components from src/components (and public/_examples if shipped), and neutralize CtaBand's default subtitle prop.
- **ראיה:** grep of each component name across src/app matches nothing except CtaBand; src/components/WhyBarzilay.tsx, ScrollStory.tsx etc. contain 'שמאות מקרקעין'/'ברזילי' strings.
- **סטטוס:** ☐ פתוח

## 64. [LOW] public/ · template assets  (completeness)
- **בעיה:** Next.js starter junk still ships to production: public/next.svg, vercel.svg, file.svg, globe.svg, window.svg, window.svg.rebuild.
- **תיקון:** Delete the six starter SVGs from public/.
- **ראיה:** ls public/ shows all six files.
- **סטטוס:** ☐ פתוח

## 65. [LOW] /styleguide · internal demo route  (completeness)
- **בעיה:** The internal styleguide is publicly reachable on the production build (200). It is noindexed and out of the sitemap (deliberate), but it ships demo copy and the full token/motion inventory to anyone with the URL — a delivery decision the client should sign off on.
- **תיקון:** Before handoff, either gate /styleguide behind the CMS session (like /admin), strip it from the production build (env-gated notFound()), or record the client's OK to leave it public-but-noindexed.
- **ראיה:** curl /styleguide → 200; src/app/styleguide/page.tsx robots {index:false}.
- **סטטוס:** ☐ פתוח

## 66. [LOW] /accessibility + /privacy · legal completeness  (completeness)
- **בעיה:** site.accessibilityCoordinator and site.privacyOfficer are empty strings, so the accessibility statement falls back to a generic 'via the contact page' channel and privacy has no named officer. Statement is functional but incomplete for a premium delivery; needs the client's answers before launch.
- **תיקון:** Collect coordinator/officer name+channel from Alona ([לאימות]) and fill site.accessibilityCoordinator / site.privacyOfficer in src/lib/site.ts; also swap the temporary gmail for alona@alonaeck.com when the domain mailbox exists.
- **ראיה:** src/lib/site.ts lines 36-37 (empty objects); src/app/accessibility/page.tsx hasCoordinator fallback branch.
- **סטטוס:** ☐ פתוח

## 67. [LOW] mobile chrome · dormant copy leftover  (completeness)
- **בעיה:** StickyContactBar's default callLabel is 'שיחה למשרד' ('call the office') — appraiser-office language. Currently invisible because site.phone is empty, but it's a landmine if a phone is ever added.
- **תיקון:** Change the default to feminine-singular clinic voice (e.g. 'שיחה לאלונה') or remove the tel action entirely given the no-published-phone decision.
- **ראיה:** src/components/StickyContactBar.tsx line 13.
- **סטטוס:** ☐ פתוח

---

## סריקת-איכות רוחבית · 2026-07-17 (workflow: 7 בוחנים + אימות אדוורסרי; 21 ממצאים → 15 אומתו, 6 הופרכו)
מחלקת-הכשל: "סקשנים שנקראים לא-גמורים / נשברים במסכים רחבים" (בעקבות פסילת home-success ו-about-quote ע"י רום).

### תוקן מיידית (קומיט הסריקה)
- S1 [HIGH] coaching 09: מסך-הסנד של ההירו היה הפוך — הצילום נקבר בקצה ונחתך חד ליד הטקסט → הפכתי לסדר של סקשן 14 (from-sand→to-transparent).
- S2 [HIGH] coaching 11: פאנלים 3–4 של הפין היו מלבני-פסטל ריקים → חוברו 11-method-science.jpg (חדש) + 11-method-two-cups.jpg (היה קיים ולא מחובר).
- S3 [HIGH] contact 37: מפת-ישראל הייתה sand-על-sand (1.008:1) → fill-card + קו-חוף gold/45 + זוהר gold + טבעות 0.24+.
- S4 [HIGH] about 17 + home 03: באג-מחלקה — frame-double עם overflow-hidden על אותו אלמנט חתך את הטבעת החיצונית; הקו הפנימי line-על-קרם היה בלתי-נראה → overflow הוסר (grain-overlay קיבל border-radius:inherit גלובלית), --frame-color: gold.
- S5 [HIGH] testimonials 32: ההירו היחיד בלי רצועת-רקע לרוחב מלא → רצועת-blush מלאה + כרטיס-קלף (card/85 + line + elevation-1).
- S6 [MED] home 01: ה-H1 נשבר ל-4 שורות בכל רוחב ≥1200px (תקרת 4.75rem מול 760px) → תקרה 4rem; שתי שורות-COPY נשמרות.
- S7 [MED] home 04: ספרת שלב-03 בסולם הייתה 15% (בלתי-נראית) → 40%.
- S8 [MED] sane-voice 29: שלוש בועות-השיחה מתחת ל-1.3:1 → gold/50, card+border-line, rose/60.
- S9 [MED] contact 35/37: SoftArc בלתי-נראית (נקודת-rose מרחפת) → stroke-gold/50.
- S10 [LOW] contact 36: "בריכת-האור" gold-soft הכהתה את ראש-הכרטיס → white/75 radial (אור אמיתי).

### מאומת, נדחה לאיטרציה עם רום (דורש הכרעת-עיצוב)
- D1 [MED] about 18: חצי-הרקע משאיר רצועת-מת שטוחה בקצה במסכים רחבים (עד ~432px ב-2056) — פתרון: full-bleed מסגור או cap.
- D2 [MED] coaching 11: חלון-הפין נעול ב-1240px אבל sticky h-screen — ב-2056 ~42% סנד מת והפאנלים נחתכים באוויר — פתרון: מסכות-קצה/פריים.
- D3 [HIGH] recipes 24: אריחי-טקסט חסרי-תמונה נופלים בדיוק על סלוטי-הפיצ'ר (spanFor עיוור לתמונה) — פתרון: span רק לבעלי-תמונה.
- D4 [LOW] recipes 23: מקור-ההירו 1477px מוגש ב-0.36–0.49 צפיפות ברטינה רחבה — פתרון: נכס רחב יותר או קרופ אחר.
- D5 [—] recipes: המיון tie-inconsistent ב-collections.ts:101 (השוואת מחרוזות תאריך) — יציבות סדר האריחים.

### הופרכו באימות (ללא פעולה)
home 08 CTA · testimonials 34 CTA (חשבון-גליפים שגוי) · recipes גליף-גרשיים · recipes רדיד-החוברת · sane-voice רמז-השדרה (שקט-בכוונה).

---

# חקירת-עומק — עיכובי IntersectionObserver (2026-07-17)
> תלונה: אנימציות-כניסה מתחילות 2–4ש' אחרי שהסקשן נכנס לוויופורט אחרי גלילות פרוגרמטיות; IO טרי על אלמנט שכבר בוויופורט לא יורה תוך 1.5ש'; סקשנים חולפים ריקים בגלילה מהירה. נחקר שיטתית בשלוש סביבות (Playwright נקי · הדפדפן הפנימי · Chrome אמיתי + תוסף).

**פסק-דין: תקלת סביבת-אוטומציה בלבד — לא באג באתר. משתמשים אמיתיים אינם מושפעים.**

- **שורש:** בזמן ביקורת דרך התוסף חלון-Chrome מוסתר מאחורי חלון Claude. macOS native window occlusion ⇒ Chrome מסמן את העמוד `visibilityState:"hidden"` (ה-viewport נשאר אמיתי — 743×1470, בדיוק ה"~740" מהעדות המקורית) ומכבה את לולאת ה-BeginFrame לגמרי: 0 קריאות rAF ב-3ש', נמדד. IntersectionObserver מחושב רק בתוך rendering frame ⇒ בלי פריימים אין אף callback — גם לא ה-entry הראשוני שהספק מחייב.
- **מנגנון ה"2–4 שניות":** כל screenshot של ה-CDP כופה פרץ-פריימים קצר גם על עמוד מוסתר. נמדד חד-משמעית: observer שהותקן ב-t=47.0s שתק 16.9ש' ומסר בדיוק בתוך פרץ ה-rAF של הצילום (t=63.9s, 6 פריימים). מסירת ה-IO מתקוונטת לרגעי-הצילומים ⇒ נראה כ"עיכוב" של שניות, וסקשנים שנגללו בין צילומים נראים ריקים.
- **הפרכת "ה-rAF לא הורעב":** המדידה המקורית הייתה vacuous — כשאין אף קריאת rAF, מונה-פערים לא רושם כלום. בפועל rAF לא רץ בכלל.
- **סביבה נקייה (Playwright, בלי תוספים, אותו build):** IO יורה תוך 1.2ms במנוחה, 20ms אחרי גלילה עמוקה מיידית, 8ms תוך גלילה חלקה; תור-המשימות ריק (מקס' 6.4ms על 510k דגימות MessageChannel); rAF יציב 60fps; long task יחיד (109ms hydration). אין הצפת-תור, אין באצ'ינג של framer-motion, אין decode storm — הקוד בריא.
- **ה-failsafe (poll גיאומטרי 700ms, קומיט c4878db) נשאר:** בעמוד מוסתר ה-event loop רץ רגיל (362k דגימות, מקס' 47ms) ו-scrollTo/getBoundingClientRect עובדים on-demand ⇒ הפול הוא מה שמונע סקשנים-ריקים בצילומי-ביקורת — וכל שרשרת-הביקורות של הסטודיו רצה בדיוק בסביבה המוסתרת הזו. עלות למשתמש אמיתי ~0 (interval יחיד לכל reveal חמוש, מתנקה בירייה ראשונה; משתמש בטאב גלוי מקבל IO תוך <20ms והפול לא מספיק לירות). הערה: בעמוד מוסתר Chrome מהדק DOM timers ל-≥1s ⇒ הפול האפקטיבי שם הוא ~1s.
- **כיסוי:** חמשת פרימיטיבי-ה-reveal (useReveal/SplitText · Reveal · RevealHeading · MOrchestrate · MStagger) מכוסים ✓. `whileInView` של framer אינו בשימוש בשום מקום; MItem הוא variants-child טהור בלי IO משלו. שאר ה-IO בקוד (ShaderHero/KenBurns/SequenceFilm/scrollspy/טפסים/גבולות) הם play-pause או lazy — הרעבה מנוונת אנימציה, לא מסתירה תוכן. אין צורך בשינוי קוד נוסף.
- **הנחיה לביקורות עתידיות:** ממצא "סקשן ריק / אנימציה לא ירתה" בצילום שנלקח כשחלון-Chrome מוסתר הוא false positive של הסביבה. לפני רישום ממצא כזה: לבדוק `document.visibilityState === "visible"`, או להצמיד צילום שני אחרי ≥1.5ש' (מעבר לפול) ולראות שהתוכן הופיע.

---

## הכרעת-לקוח 2026-07-17 (רום, מול צילומי-מסך) — גובר על שני ממצאי אנטי-AI
- **מתכונים · אריחי-הארכיון:** הלקוח מעדיף מפורשות את המראה המגזיני — התמונה ממלאת את כל הכרטיס והכיתוב **על** התמונה (scrim navy למטה, טקסט לבן, צ'יפ-קטגוריה בפינה). זה הופך את ממצא lens-2 #4 ("כותרת לבנה על scrim = טל-תבנית"): החלטת-טעם של הלקוח גוברת, וזה קריא כאדיטוריאל עם הצילומים האמיתיים שלה. **לא לסמן שוב כטל-AI.**
- **ליווי · עמודי-השיטה (HorizontalPin):** הכיתוב (מעוין+כותרת) עבר ל**מעל** התמונה במקום מתחתיה, לבקשת הלקוח (מבנה: תווית → תמונת-מנה → גוף).
- **ליווי · "מהמטבח של אלונה" (§14):** הלקוח אישר את המבנה (כרטיס-טקסט + סטילס ממוסגרים) — נשאר.

---

## ביקורת-פלטה «ירוק צלול» · 2026-07-19 (סוכן-חישוב, קריאה-בלבד → תוקן ע"י המנצח)
העובדה המבנית: gold (‎#2F6B4F) ו-navy (‎#17382C) הם עכשיו שני ירוקים כהים — 2.04:1 זה מול זה. כל מחוות "זהב-על-נייבי" איבדה ניגודיות.
**תוקן:** CookieConsent (כפתור-אישור לטקסט-לבן, hover/focus ל-gold-soft) · team/[slug] שורת-זהב → gold-soft · StickyContactBar (ring-white, קו-עליון gold-soft) · פס-הפוטר → **rose** (החוט-שנשאר חותם כל עמוד, 5.07:1) · תעודת-הרישיון ב-about (מסגרת+מעוין+כפתור-אימות → gold-soft) · שני CTA על פאנלים כהים (about/sane-voice) → מילוי gold-soft עם תווית-navy ‏(10.36:1) · a11y highlight-links outline → currentColor · prose-rtl דיו → var(--color-ink) · צללים כחולים מקודדים (Header/AccessibilityMenu/BookShelf/RecipesArchive) → color-mix מהטוקן · מיילי-הכניסה של ה-CMS → אורן · 404 hover → gold-soft.
**התקבל במודע:** קצב-הרצועות לבן↔sand ירד ל-1.123 (עדין אך מורגש; seam/border מפצים) · slate-200/300 על פאנלים כהים עוברות AA (סטייה גוונית קלה בלבד).
**הסגר (רכיבי-תבנית לא-רכובים עם נייבי/קרמל מקודד — אסור להרכיב בלי ריטוקון):** CtaBand · CinematicTeaser · three/StoryScene · media/StoryPanel · StoryJourney · AngularFrame · StatCounters · HomeLeadSection · LeadWizard (נקודות-התקדמות) · Toast (globals:900) · אפקטי hero-shutter/curtain (globals).

---

## סבב-ביצועים · 2026-07-19 — בית 70→89-90, ליווי 82→90 (מובייל, throttling מלא)
נקודת-פתיחה: בית 70 / LCP 13.9s · ליווי 82 / CLS 0.778. יעד: ≥90. כל המהלכים נמדדו אחד-אחד (Lighthouse mobile, שרת prod מקומי :3012).

**מה עשה את ההבדל (לפי סדר תגלית):**
1. **render-delay של כניסות-כותרת = שניות על ה-LCP.** ה-arming של reveal אחרי הידרציה דחה את ציור-הכותרת. נבנה מצב `autoplay` ל-RevealHeading/SplitText: אנימציית-CSS טהורה (`rh-rise` / `is-animating` ב-SSR) שרצה מהצבע-הראשון בלי JS. הוחל על כל H1 של הירו בכל העמודים. שערי reduced-motion נשמרים (`animation: none !important`).
2. **סופת-הפריימים של הסרט:** 14 פריימים × ~70-190KB = ‏1.4MB נטענו ב-220ms — כי כולם ערומים על ה-sticky stage בגובה viewport אחד מתחת לקפל, ושם native lazy טוען הכל מיד. IO-קרבה לא עוזר (הסרט צמוד להירו). **הפתרון: שער-load** — הקולנוע נחמש רק אחרי `window load + 300ms`; עד אז התאום-הסטטי (SSR) מוצג. אומת ב-Playwright: הקולנוע עולה, פריים 0 נראה, סקראב עד פריים 13.
3. **תמונה כפולה בליווי:** פאנל-הדסקטופ (plain img, `hidden lg:block`) הוריד 67KB גם במובייל לצד רצועת-המובייל. `loading="lazy"` על תמונה בתוך display:none = אפס-הורדה (אין קופסה → אין intersection). אומת: מובייל מוריד אחת, דסקטופ מקבל את שלו.
4. **next/image לתמונות התוכן הכבדות** (two-cups ‏171→22KB, פולבק-הסרט 71→24KB, hero דרך ה-optimizer ~38KB) + דחיסת sharp mozjpeg לכל המדיה (client 13.8→6.6MB, generated 4.8→2.3MB; hashes עודכנו ב-assets-manifest).
5. **CLS 0.097 בבית = ארטיפקט-מדידה, לא באג.** טרייס-LH חשף shift יחיד ב-247ms עם `had_recent_input:true` (רה-לייאאוט של אמולציית-המסך של LH עצמו; כרום לא סופר אותו ב-CLS אמיתי). אומת אפס-shift ב-PerformanceObserver בכרום אמיתי, כולל תחת CPU×4 + רשת-איטית. prove.mjs עבר ל-`--screenEmulation.disabled --window-size=412,823 --form-factor=mobile` — אותו lantern throttling, בלי הארטיפקט.

**רצפת ה-LCP הנוכחית (~3.5s מדומה, FCP 1.2s):** גרף-ה-JS (‏~240KB chunks + ‏92KB פונטים preloaded) תחת 1.6Mbps מדומה. חסימת כל פריימי-הסרט לא שינתה כלום (נוסה) — הפריימים כבר מחוץ לחלון. `priority` על ההירו נתן ~0.2s (בגבול הרעש) ולא הוחזר (מס-הרפליי הצולב של preload-on-RSC). **המנוף הבא אם יידרש 93+:** דיאטת-motion — הוצאת framer-motion מהנתיב-הקריטי (ניתוח כבד, סבב נפרד).

**מלכודות שנלמדו:** ה-optimizer של next/image קר ב-first-hit מקומי (לחמם לפני מדידה; בפרודקשן CDN) · `loading="lazy"` הוא רעש בתוך viewport-margin — מיקום פיזי קובע, לא כוונה · תמונת fallback צריכה width/height מפורשים גם כשהיא ממילא "בגודל נכון".
