// recipe-body.mjs — the recipe journey's body contract. The markdown files in
// content/recipes/ stay the source of truth (intro + "## רכיבים" bullets +
// "## אופן הכנה" numbered steps); the admin edits a structured model and this
// module converts both ways. Unrecognized "## " sections pass through `extra`
// VERBATIM so no hand-authored content can ever be lost by the editor.
// Pure string functions, zero deps, client-bundleable.
const ING_RE = /רכיבים|מצרכים|חומרים/;
const TIP_RE = /טיפ/;
const STEP_RE = /הכנה|הוראות/;

export function emptyRecipeBody() {
  return {
    intro: "",
    ingredients: [],
    steps: [],
    tip: "",
    extra: "",
    headings: { ingredients: "רכיבים", steps: "אופן הכנה", tip: "טיפ" },
  };
}

// Bullet glyphs authors actually use across content/recipes/ (- * • ▪ ◦).
const BULLET = /^[-*•▪◦]\s+/;
const STEP_ITEM = /^(?:\d+[.)]\s*|[-*•▪◦]\s+)/;

// A non-bullet line inside the ingredients section is structural, not an item:
// a bold sub-label ("**לרוטב:**"), a fully-parenthesized note ("(4-5 מנות)"),
// a stray heading ("#..."), or a serving-suggestion note. Real ingredients are
// always bulleted in the corpus, so an unbulleted line is never an item; these
// are the shapes such lines take. We keep it VERBATIM so it re-serializes
// without a spurious "- " prefix (serializeRecipeBody mirrors this).
// NOTE_OPENER = Hebrew words that begin a serving suggestion, never an
// ingredient name ("recommended", "serving suggestion", "can also / optionally").
const NOTE_OPENER = /^(?:מומלץ|הצעת\s+הגשה|ניתן\s+גם|אפשר\s+גם|להגשה\b)/;
function isIngredientNote(item) {
  return /^(?:\*\*|\(.*\)\s*$|#)/.test(item) || NOTE_OPENER.test(item);
}

// The ingredients section interleaves bullets with structural lines; keep the
// exact sequence, stripping the bullet glyph only from real items.
function itemizeIngredients(lines) {
  return lines
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => (BULLET.test(l) ? l.replace(BULLET, "").trim() : l))
    .filter(Boolean);
}

// The steps section is a leading run of numbered/bulleted items followed, in
// some recipes, by a trailing block (nutrition values, a closing note). Only the
// leading run is renumbered on serialize; the trailing block passes through
// `extra` verbatim so nothing after the last step is renumbered or lost.
function splitSteps(lines) {
  const steps = [];
  const trailing = [];
  let inTrailing = false;
  for (const raw of lines) {
    const t = raw.trim();
    if (inTrailing) { trailing.push(raw); continue; }
    if (!t) continue; // blank separators between steps are dropped
    if (STEP_ITEM.test(t)) {
      steps.push(t.replace(STEP_ITEM, "").trim());
    } else {
      inTrailing = true;
      trailing.push(raw);
    }
  }
  return { steps: steps.filter(Boolean), trailing: trailing.join("\n").replace(/^\n+|\n+$/g, "") };
}

export function parseRecipeBody(markdown) {
  const model = emptyRecipeBody();
  const lines = String(markdown ?? "").replace(/\r\n/g, "\n").split("\n");

  const sections = [];
  let cur = { hash: null, heading: null, lines: [] };
  for (const line of lines) {
    // "##" real sections plus deeper "###..." (nutrition tables) are boundaries;
    // the exact hash level round-trips so an "### x" never collapses to "## x".
    const m = /^(#{2,})\s+(.+?)\s*$/.exec(line);
    if (m) {
      sections.push(cur);
      cur = { hash: m[1], heading: m[2], lines: [] };
    } else {
      cur.lines.push(line);
    }
  }
  sections.push(cur);

  const extras = [];
  for (const s of sections) {
    const text = s.lines.join("\n").replace(/^\n+|\n+$/g, "");
    if (s.heading === null) {
      model.intro = text;
      continue;
    }
    const pushExtra = (t) => extras.push(t ? `${s.hash} ${s.heading}\n\n${t}` : `${s.hash} ${s.heading}`);
    // Only "##"-level headings are journey sections; "###..." always passes
    // through. Order matters: "טיפים להכנה" must classify as tip, not steps.
    if (s.hash === "##" && ING_RE.test(s.heading) && !model.ingredients.length) {
      model.headings.ingredients = s.heading;
      model.ingredients = itemizeIngredients(s.lines);
    } else if (s.hash === "##" && TIP_RE.test(s.heading) && !model.tip) {
      model.headings.tip = s.heading;
      model.tip = text;
    } else if (s.hash === "##" && STEP_RE.test(s.heading) && !model.steps.length) {
      model.headings.steps = s.heading;
      const { steps, trailing } = splitSteps(s.lines);
      model.steps = steps;
      if (trailing) extras.push(trailing);
    } else {
      pushExtra(text);
    }
  }
  model.extra = extras.join("\n\n");
  return model;
}

export function serializeRecipeBody(model) {
  const parts = [];
  if (model.intro.trim()) parts.push(model.intro.trim());
  if (model.ingredients.length) {
    parts.push(
      `## ${model.headings.ingredients}\n\n` +
        model.ingredients.map((i) => (isIngredientNote(i) ? i : `- ${i}`)).join("\n"),
    );
  }
  if (model.steps.length) {
    parts.push(`## ${model.headings.steps}\n\n` + model.steps.map((s, i) => `${i + 1}. ${s}`).join("\n"));
  }
  if (model.tip.trim()) parts.push(`## ${model.headings.tip}\n\n${model.tip.trim()}`);
  if (model.extra.trim()) parts.push(model.extra.trim());
  return parts.join("\n\n");
}
