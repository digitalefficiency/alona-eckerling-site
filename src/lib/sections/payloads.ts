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
