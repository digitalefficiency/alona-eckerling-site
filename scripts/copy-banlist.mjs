// copy-banlist.mjs — the ONE source of truth for the copy-discipline word lists
// (references/premium-tier.md ban list). Pure data, no shebang, no side effects,
// shared by BOTH consumers so the lists can never drift:
//   • scripts/lint-copy.mjs    — the composed-TSX copy gate (build-time)
//   • src/lib/cms/validate.mjs — the client-content validator (admin publish + lint-content)
// EDIT ME per project if the client's vertical has its own filler phrases.
//
// This file deliberately lives in scripts/ (NOT src/) — launch-verify scans the
// shipped src/ surface for these very strings, so the detector patterns must sit
// outside the scanned zone.

// Placeholder / template markers that must never ship.
export const PLACEHOLDER_MARKERS = [
  "lorem",
  "ipsum",
  "TODO",
  "placeholder",
  "החליפו", // "replace this" — the template's own swap-me markers
  "כותרת על", // template eyebrow filler
  "כותרת ראשית גדולה", // template hero-title filler
  "משפט פתיח שמסביר", // template lead-sentence filler
  "תוכן זמני", // "temporary content"
];

// Banned stock phrases (premium-tier ban list).
export const BANNED_PHRASES = [
  // English
  "committed to excellence",
  "your trusted partner",
  "we treat you like family",
  "fighting for you",
  "fierce advocate",
  "compassionate care",
  "exceptional solutions",
  // Hebrew
  "מחויבים למצוינות", // committed to excellence
  "השותף האמין שלך", // your trusted partner
  "יחס אישי ומקצועי", // "personal & professional treatment" — the #1 Hebrew filler
  "נלחמים עבורך", // fighting for you
  "מצוינות ללא פשרות", // excellence without compromise
  "שירות ברמה הגבוהה ביותר", // service at the highest level
  "פתרונות מותאמים אישית", // tailor-made solutions
];

// YMYL / unverified-fact markers (launch-verify blocks these at go-live; the
// content validator catches them at PUBLISH time, where the client can still fix).
// Built from parts so this file itself never contains the exact bracketed token.
// ONE mixed he/en list (no structural split): the English tokens [unverified]/[missing]
// catch the same placeholder on an English-content site. phraseRe substring-matches
// these bracketed tokens, so a cross-language phrase can never false-match.
export const YMYL_MARKERS = ["לאימות", "חסר", "unverified", "missing"].map((w) => "[" + w + "]");
