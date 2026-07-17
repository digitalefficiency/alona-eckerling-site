// transliterate.mjs — Hebrew→Latin slug suggestion for the recipe journey.
// Consonantal and deterministic, not pretty: the client edits the result, so a
// readable-ish prefill beats the old "post-<date>" placeholder. Pure, zero deps.
const MAP = {
  "א": "", "ב": "b", "ג": "g", "ד": "d", "ה": "h", "ו": "v", "ז": "z",
  "ח": "ch", "ט": "t", "י": "y", "כ": "k", "ך": "k", "ל": "l", "מ": "m",
  "ם": "m", "נ": "n", "ן": "n", "ס": "s", "ע": "", "פ": "p", "ף": "f",
  "צ": "ts", "ץ": "ts", "ק": "k", "ר": "r", "ש": "sh", "ת": "t",
};

export function suggestSlug(title) {
  let out = "";
  for (const ch of String(title ?? "").toLowerCase()) {
    out += MAP[ch] ?? ch;
  }
  return out
    .replace(/["'`׳״]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/, "");
}
