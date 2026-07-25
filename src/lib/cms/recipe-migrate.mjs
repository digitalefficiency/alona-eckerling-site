// recipe-migrate.mjs — the one-time git-markdown → Supabase translation.
//
// WHY THIS IS A SEPARATE MODULE FROM recipe-body.mjs
// recipe-body.mjs is the editor's contract and must stay lossless in both
// directions. This module answers a different question that is asked exactly
// once: what TYPE is each line, so the database can hold it as structure
// instead of as text.
//
// THE ONE RULE THAT MATTERS: classify from the RAW markdown line, never from
// parseRecipeBody's output. itemizeIngredients() strips the bullet glyph
// (recipe-body.mjs:41-47), and the bullet is the only reliable signal in this
// corpus that separates a real ingredient from a structural line. Classify
// after the strip and you are guessing forever with a regex; classify before it
// and you are reading what the author actually wrote.
//
// Pure functions, zero deps, covered by recipe-migrate.test.mjs.

// Bullet glyphs authors actually use across content/recipes/ — the same set
// recipe-body.mjs recognises, kept in sync deliberately.
const BULLET = /^[-*•▪◦]\s+/;

// «**להגשה:** בצל ירוק, כוסברה, בוטנים גרוסים» — a sub-label AND real
// ingredients on one line. Exactly one line in the corpus has this shape
// (green-curry-stir-fry.md), which is why it is a named special case and not a
// heuristic. Today's JSON-LD builder drops this line entirely: its filter is
// /^\s*[-*]\s+/, which needs whitespace after the glyph, and here the next
// character is a second asterisk. So splitting it ADDS an ingredient to the
// structured data. That is an intended improvement, not a regression, and the
// verification report whitelists it by name.
const SUBLABEL_WITH_ITEMS = /^\*\*(.+?:)\*\*\s+(.+)$/;

// «**לרוטב:**» and «**שקדים מקורמלים: (לא לוותר)**» — the colon is not always
// the last character before the closing asterisks, so the pattern cannot anchor
// on it.
const SUBLABEL = /^\*\*(.+?)\*\*\s*$/;

// «(עבור 12 בורקיטסים)», «(4-5 מנות)» — a yield or a quantity note.
const PAREN_NOTE = /^\(.*\)\s*$/;

// Hebrew words that open a serving suggestion and never an ingredient name.
// Same list as recipe-body.mjs's NOTE_OPENER, minus «להגשה» which is handled
// earlier by SUBLABEL_WITH_ITEMS.
const NOTE_OPENER = /^(?:מומלץ|הצעת\s+הגשה|ניתן\s+גם|אפשר\s+גם|להגשה\b)/;

/**
 * Classify ONE raw line from inside a «## רכיבים» section.
 * Returns an array because a sub-label carrying items becomes two entries.
 * `needsReview` marks a shape nobody anticipated: the runner prints every one
 * of them so a human decides once, instead of a regex deciding forever.
 */
export function classifyIngredientLine(raw) {
  const line = String(raw ?? "").trim();
  if (!line) return [];

  // A bare glyph with nothing after it. BULLET requires trailing whitespace, so
  // after trimming this would otherwise fall all the way through and surface as
  // an unrecognised line needing human review — noise in the one report that
  // has to be worth reading.
  if (/^[-*•▪◦]$/.test(line)) return [];

  if (BULLET.test(line)) {
    const text = line.replace(BULLET, "").trim();
    return text ? [{ kind: "item", text }] : [];
  }

  const withItems = SUBLABEL_WITH_ITEMS.exec(line);
  if (withItems) {
    return [
      { kind: "sublabel", text: withItems[1].trim() },
      { kind: "item", text: withItems[2].trim(), split: true },
    ];
  }

  const sub = SUBLABEL.exec(line);
  if (sub) return [{ kind: "sublabel", text: sub[1].trim() }];

  if (PAREN_NOTE.test(line) || NOTE_OPENER.test(line)) {
    return [{ kind: "note", text: line }];
  }

  // Unrecognised. Kept as a note so nothing is lost, and flagged so it is read.
  return [{ kind: "note", text: line, needsReview: true }];
}

/** Classify a whole «## רכיבים» section, preserving author order. */
export function classifyIngredients(rawLines) {
  return (rawLines ?? []).flatMap(classifyIngredientLine);
}

/**
 * Re-serialise the classified list back to markdown, so the round-trip can be
 * proved rather than assumed. Sub-labels regain their bold; notes stay verbatim
 * (they were never bulleted); items regain the "- " that itemize stripped.
 */
export function serializeIngredients(items) {
  return (items ?? [])
    .map((i) => {
      if (i.kind === "sublabel") return `**${i.text}**`;
      if (i.kind === "note") return i.text;
      return `- ${i.text}`;
    })
    .join("\n");
}

// ── prep time ───────────────────────────────────────────────────────────────
// 24 of the 34 recipes say «לא צוין». The text is what the page shows and it
// migrates verbatim; the integer only feeds JSON-LD, and only when it is a
// real positive number. Never return 0: prepTime PT0M fails Google's Recipe
// validator and can drop the rich result for the whole archive.

const HOUR_HALF = /שעה\s+וחצי/;
const TWO_HOURS = /שעתיים/;
const HOURS_N = /(\d+)\s*שעות/;
const ONE_HOUR = /שעה/;
const MINUTES_RANGE = /(\d+)\s*[-–]\s*(\d+)\s*דק/;
const MINUTES_N = /(\d+)\s*דק/;

/**
 * «20 דקות» → 20 · «40-50 דקות» → 50 (upper bound, never promise the faster
 * one) · «שעה וחצי» → 90 · «שעתיים» → 120 · «שעה ו-20 דקות» → 80 ·
 * «לא צוין» and anything unparseable → null.
 */
export function parsePrepMinutes(raw) {
  const text = String(raw ?? "").trim();
  if (!text || text === "לא צוין") return null;

  let minutes = 0;
  let matched = false;

  if (HOUR_HALF.test(text)) {
    minutes += 90;
    matched = true;
  } else if (TWO_HOURS.test(text)) {
    minutes += 120;
    matched = true;
  } else {
    const hoursN = HOURS_N.exec(text);
    if (hoursN) {
      minutes += Number(hoursN[1]) * 60;
      matched = true;
    } else if (ONE_HOUR.test(text)) {
      minutes += 60;
      matched = true;
    }
  }

  const range = MINUTES_RANGE.exec(text);
  if (range) {
    minutes += Number(range[2]);
    matched = true;
  } else {
    const mins = MINUTES_N.exec(text);
    if (mins) {
      minutes += Number(mins[1]);
      matched = true;
    }
  }

  if (!matched || minutes <= 0 || minutes > 2147483647) return null;
  return minutes;
}

// ── the row builder ─────────────────────────────────────────────────────────

/**
 * Turn one parsed file into the shape `recipes` holds.
 * `body` is the model from parseRecipeBody (for intro/steps/tip/extra/headings);
 * `rawIngredientLines` are the RAW lines of the ingredients section, because
 * that is the only place the bullet glyph still exists.
 */
export function buildRecipeRow({ slug, data, body, rawIngredientLines, imagePathToId }) {
  const ingredients = classifyIngredients(rawIngredientLines);
  const imagePath = typeof data.image === "string" && data.image ? data.image : null;

  return {
    slug,
    legacy_slug: data.legacySlug ?? null,
    title: data.title,
    description: data.description,
    date: data.date,
    category: data.category,
    tags: Array.isArray(data.tags) ? data.tags : [],
    prep_time_text: data.prepTime ?? null,
    prep_minutes: parsePrepMinutes(data.prepTime),
    servings: data.servings ?? null,
    image_id: imagePath ? (imagePathToId?.get(imagePath) ?? null) : null,
    image_path: imagePath,
    image_alt: data.imageAlt ?? null,
    intro: body.intro ?? "",
    ingredients,
    steps: body.steps ?? [],
    tip: body.tip ?? "",
    extra: body.extra ?? "",
    headings: body.headings,
    // Nothing in the corpus carries `draft: true`; the check is here so that a
    // draft added between now and the migration is not silently published.
    status: data.draft === true ? "draft" : "published",
    published_at: data.draft === true ? null : `${data.date}T00:00:00Z`,
  };
}

/**
 * Extract the RAW lines of the ingredients section straight from the file body.
 * Deliberately does not reuse parseRecipeBody: that function is what strips the
 * bullets, and the bullets are the whole point.
 */
export function rawIngredientSection(markdown) {
  const lines = String(markdown ?? "").replace(/\r\n/g, "\n").split("\n");
  const out = [];
  let inside = false;
  let done = false;
  for (const line of lines) {
    const m = /^(#{2,})\s+(.+?)\s*$/.exec(line);
    if (m) {
      // Any heading of level 2 or deeper closes the section, matching the
      // terminator the JSON-LD builder already uses. Only the FIRST ingredients
      // section counts, mirroring parseRecipeBody's `!model.ingredients.length`
      // guard — otherwise a second one would silently append to the first.
      if (inside) done = true;
      inside = !done && m[1] === "##" && /רכיבים|מצרכים|חומרים/.test(m[2]);
      continue;
    }
    if (inside) out.push(line);
  }
  return out;
}
