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
  ctaSub: string;
  trustToken: string;
  /** hidden below sm so the pill stays one line — starts with its own separator */
  trustTokenLicense: string;
  ctaRecipes: string;
  /** art direction: the film's last frame must match the scroll section's first */
  poster: string;
  filmWebm: string;
  filmMp4: string;
};

/**
 * The scroll film. `chips` and `captions` carry TEXT ONLY; each entry is paired
 * by index with the choreography in page.tsx. The static* fields are not a
 * fallback — they are what crawlers, no-JS readers and anyone with reduced
 * motion actually get, which makes them the SEO copy of the page's largest
 * section.
 */
export type HomeFilmPayload = {
  kicker: string;
  staticKicker: string;
  staticHeading: string;
  staticBody: string;
  finalAlt: string;
  /** text only — paired by index with the choreography in page.tsx */
  chips: string[];
  captions: { big: string; small?: string }[];
};

export type HomeGuidePayload = {
  kicker: string;
  title: string;
  titleAccent: string;
  empathy: string;
  name: string;
  role: string;
  credentials: string[];
  mechanism: string[];
  cta: string;
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
  darkTestimonial: string;
  darkLogos: string;
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
  portraitLabel: string;
  portraitSignature: string;
  portraitRole: string;
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

export type AboutAgePayload = {
  kicker: string;
  quote: string;
  quoteAccent: string;
  support: string;
  signature: string;
};

export type AboutCredentialsPayload = {
  kicker: string;
  title: string;
  titleAccent: string;
  anchorTitle: string;
  anchorLine: string;
  anchorVerify: string;
  anchorVerifyHref: string;
  bscTitle: string;
  bscLine: string;
  internTitle: string;
  internLine: string;
  craftTitle: string;
  craftLine: string;
  craftLink: string;
  craftMicro: string;
  craftImage: string;
  craftImageAlt: string;
  bridge: string;
  teamLink: string;
};

export type AboutPressPayload = {
  reserved: string;
};

export type AboutCtaPayload = {
  kicker: string;
  title: string;
  body: string;
  recipes: string;
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
