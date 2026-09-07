// sections/payloads.ts — the typed shape of each section's payload.
//
// The registry describes a section to the EDITOR (labels, limits, what is
// locked). This describes the same section to the COMPILER, so a page cannot
// read a field the section does not have and a rename cannot pass silently.
//
// WHAT IS DELIBERATELY ABSENT: art direction. The 14 film frames, the scroll
// windows and screen positions of the thought-chips, the rung stills, the
// generated room backgrounds — none of them appear here, because none of them
// are hers to change. They stay as constants beside the component that renders
// them, and the payload carries only the words.

export type HomeHeroPayload = {
  kicker: string;
  /** two lines, split on \n by RevealHeading */
  title: string;
  /** a substring of one line of `title`; a mismatch costs the underline, not the page */
  titleAccent: string;
  lede: string;
  ctaPrimary: string;
  trustToken: string;
  /** hidden below sm so the masthead row stays one line — starts with its own separator */
  trustTokenLicense: string;
  ctaRecipes: string;
  /**
   * the REAL hero photograph. Editable from the desk since 2026-08-15 (Rom's
   * call): she owns the dish on the cover. Empty string = the shipped photo.
   */
  image?: string;
  imageAlt: string;
};

export type HomeGuidePayload = {
  kicker: string;
  title: string;
  titleAccent: string;
  /** her voice as the standfirst under the title (Rom, 2026-08-12) */
  empathy: string;
  /** a substring of `empathy` — the rose rule draws under it; a mismatch costs the line, not the page */
  empathyAccent: string;
  name: string;
  role: string;
  /** the REAL portrait in the hairline frame. Desk-editable (2026-08-15); empty = the shipped portrait */
  portrait?: string;
  portraitAlt: string;
  credentials: string[];
  /** the serif opening breath of the ruled band — «היי, אני אלונה.» */
  introHello: string;
  /** first person, one breath — the four mechanism labels live on inside these sentences */
  intro: string;
  areasLabel: string;
  areas: string[];
  /** the YMYL guardrail, rendered — never a promise to move a lab value */
  areasNote: string;
  cta: string;
};

/**
 * The dish ribbon — §03's proof-of-craft extension AND the Instagram channel.
 * The tiles here are the authored DEFAULT set: when the desk fills the social
 * wall in settings, that set (with its per-post links) takes the strip over.
 */
export type HomeRibbonPayload = {
  kicker: string;
  note: string;
  follow: string;
  /** screen-reader only — appended to each linked tile's accessible name */
  linkHint: string;
  tiles: { src: string; alt: string }[];
};

export type HomePlanPayload = {
  kicker: string;
  title: string;
  titleAccent: string;
  lead: string;
  steps: { n: string; t: string; d: string }[];
  cta: string;
};

export type HomeProofPayload = {
  kicker: string;
  title: string;
  titleAccent: string;
  body: string;
  countChip: string;
  cta: string;
};

export type HomeStakesPayload = {
  kicker: string;
  title: string;
  titleAccent: string;
  cue: string;
  quiet: { label: string; note: string; points: string[] };
  noisy: { label: string; note: string; points: string[] };
  band: string;
  bandCta: string;
  bandSecondary: string;
};

/**
 * The articles study (§06b, 2026-08-12) — the strip's own words only. The three
 * article cards themselves come LIVE from the articles collection (title +
 * frontmatter description), never from this payload: zero invention, and the
 * third slot fills itself on publish.
 */
export type HomeArticlesPayload = {
  kicker: string;
  /** first part of the masthead title — keeps its trailing space, the accent continues the sentence */
  titleA: string;
  /** the accented tail of the title — the rose rule rests under it (u-rose-draw) */
  titleAccent: string;
  lead: string;
  /** the per-card read link — the ← arrow is part of the text */
  itemCta: string;
  allCta: string;
};

export type HomeSuccessPayload = {
  kicker: string;
  /** three lines, split on \n by RevealHeading */
  lines: string;
  bridge: string;
};

export type HomeCtaPayload = {
  /** two lines, split on \n by SplitText */
  title: string;
  body: string;
  packages: string;
  promise: string;
  trustToken: string;
  trustTokenLicense: string;
};

// ── the four remaining pages ────────────────────────────────────────────────
// Generated from the same map that produced the registry and the documents, so
// a field cannot be described to the editor, stored in the document and unknown
// to the compiler.

// /testimonials
export type TestimonialsHeroPayload = {
  kicker: string;
  title: string;
  body: string;
  bridge: string;
  invite: string;
  cta: string;
};

export type TestimonialsGridPayload = {
  title: string;
  emptyLead: string;
  emptyBody: string;
  redirectIntro: string;
  redirects: string[];
  reciprocity: string;
};

export type TestimonialsCtaPayload = {
  title: string;
  body: string;
  packages: string;
  promise: string;
  trustToken: string;
  ctaPrimary: string;
  ctaRecipes: string;
};

// /contact
export type ContactDoorPayload = {
  crumb: string;
  kicker: string;
  title: string;
  body: string;
  bodyAccent: string;
  cta: string;
  ctaSub: string;
  promise: string;
  place: string;
  trustToken: string;
};

export type ContactLeadPayload = {
  title: string;
  titleAccent: string;
  body: string;
  packages: string;
  nameLabel: string;
  phoneLabel: string;
  messageLabel: string;
  emailLabel: string;
  consentLabel: string;
  submitLabel: string;
  submittingLabel: string;
  whatsappLabel: string;
  thanks: string;
  thanksLink: string;
  promise: string;
  place: string;
  trustToken: string;
};

export type ContactWherePayload = {
  kicker: string;
  title: string;
  body: string;
  items: { title: string; body: string }[];
  chip: string;
  /**
   * heading above the social chips row — the fourth, no-commitment way in.
   * Optional because published rows written before this field existed lack the
   * key, and SocialLinks drops a falsy label by design.
   */
  socialLabel?: string;
};

// /about
export type AboutHeroPayload = {
  crumbLabel: string;
  kicker: string;
  title: string;
  lede: string;
  licenseChip: string;
  ctaPrimary: string;
  ctaPrimarySub: string;
  ctaMicro: string;
  ctaSecondary: string;
  /** the portrait's accessible description; the photo path is art direction in code */
  portraitLabel: string;
};

export type AboutStoryPayload = {
  kicker: string;
  title: string;
  p1: string;
  p2: string;
  credo1: string;
  credo2: string;
  credo2Accent: string;
  signOff: string;
  signature: string;
  image: string;
  imageAlt: string;
};

export type AboutStandardPayload = {
  kicker: string;
  /** two lines, split on \n by SplitText */
  title: string;
  /** a substring of one line of `title`; a mismatch costs the underline, not the page */
  titleAccent: string;
  body: string;
  principles: { t: string; d: string }[];
  areasLabel: string;
  areas: string[];
};

/**
 * «הדרך לכאן» (2026-08-12) — the personal essay that replaced the credentials
 * wall. The checkable records survive as its ruled ledger; every stated fact
 * in them changes only against a certificate.
 */
export type AboutRoadPayload = {
  kicker: string;
  /** two lines, split on \n by SplitText inside SectionHeading */
  title: string;
  /** a substring of one line of `title`; a mismatch costs the underline, not the page */
  titleAccent: string;
  p1: string;
  p2: string;
  p3: string;
  /** also the hero portrait card's foot line */
  roleLine: string;
  recordsLabel: string;
  records: string[];
  bridge: string;
  bridgeCta: string;
};

export type AboutCtaPayload = {
  promise: string;
  kicker: string;
  title: string;
  body: string;
  recipes: string;
  /**
   * heading above the social chips row — the sceptic's watch-first off-ramp.
   * Optional for the same pre-existing-rows reason as ContactWherePayload.
   */
  socialLabel?: string;
  trustToken: string;
  button: string;
  signature: string;
};

// /coaching
export type PageMetaPayload = {
  title: string;
  serviceName: string;
  serviceType: string;
};

export type CoachingHeroPayload = {
  breadcrumb: string;
  kicker: string;
  title: string;
  body: string;
  trustToken: string;
  ctaPrimary: string;
  ctaSub: string;
  ctaWhatsapp: string;
  micro: string;
};

export type CoachingProblemPayload = {
  kicker: string;
  title: string;
  titleAccent: string;
  lead: string;
  body1: string;
  quote: string;
  quoteAccent: string;
  body2: string;
  cta: string;
};

export type CoachingMethodPayload = {
  kicker: string;
  title: string;
  titleAccent: string;
  pillars: { title: string; body: string }[];
  cta: string;
};

export type CoachingPackagesPayload = {
  kicker: string;
  title: string;
  titleAccent: string;
  lead: string;
  facts: string[];
  fitLabel: string;
  includedLabel: string;
  cardCta: string;
  sharedLine: string;
  packages: { slug: string; name: string; chip: string; fit: string; included: string[]; highlight: boolean }[];
};

export type CoachingProcessPayload = {
  kicker: string;
  title: string;
  lead: string;
  steps: { t: string; d: string }[];
  cta: string;
};

export type CoachingProofPayload = {
  kicker: string;
  title: string;
  titleAccent: string;
  lead: string;
  photo: string;
  photoAlt: string;
  tiles: { src: string; alt: string }[];
  testimonialEmpty: string;
  cta: string;
};

export type CoachingFaqPayload = {
  kicker: string;
  title: string;
  lead: string;
  items: { q: string; a: string }[];
  closeLine: string;
  closeCta: string;
  magnet: string;
};

export type CoachingCtaPayload = {
  title: string;
  body: string;
  packagesLine: string;
  promise: string;
  trustToken: string;
  aboutPointer: string;
  formHeading: string;
};

export type RecipesHeroPayload = {
  eyebrow: string;
  title: string;
  lead: string;
  /** empty = the newest-archive art-directed pick keeps choosing the cover */
  image?: string;
  imageAlt: string;
};
