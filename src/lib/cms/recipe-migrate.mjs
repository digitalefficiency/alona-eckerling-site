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

// «**להגשה:** בצל ירוק, כוסברה, בוטנים גרוסים» — a sub-label with content on
// the same line. Exactly one line in the corpus has this shape
// (green-curry-stir-fry.md), which is why it is a named case and not a
// heuristic.
//
// It is DETECTED but not split. Splitting it into a sub-label plus an item
// looked like an improvement — today's JSON-LD filter is /^\s*[-*]\s+/, which
// needs whitespace after the glyph, so the line is dropped entirely and adding
// it back reads as a gain. But what would be added is «בצל ירוק, כוסברה,
// בוטנים גרוסים» as ONE recipeIngredient: three garnishes crammed into a single
// structured-data string. Malformed structured data is worse than absent
// structured data, and the line is a serving suggestion rather than a
// quantified ingredient. recipe-body.mjs already classifies it as a note; this
// agrees with it, which also makes the round trip exact.
const SUBLABEL_WITH_ITEMS = /^\*\*(.+?:)\*\*\s+(.+)$/;

// «**לרוטב:**» and «**שקדים מקורמלים: (לא לוותר)**» — the colon is not always
// the last character before the closing asterisks, so the pattern cannot anchor
// on it.
const SUBLABEL = /^\*\*(.+?)\*\*\s*$/;

// «(עבור 12 בורקיטסים)», «(4-5 מנות)» — a yield or a quantity note.
const PAREN_NOTE = /^\(.*\)\s*$/;

// Hebrew words that open a serving suggestion and never an ingredient name.
// Same list as recipe-body.mjs's NOTE_OPENER, kept in sync deliberately.
const NOTE_OPENER = /^(?:מומלץ|הצעת\s+הגשה|ניתן\s+גם|אפשר\s+גם|להגשה\b)/;

/**
 * Classify ONE raw line from inside a «## רכיבים» section. Returns an array so
 * a line can expand or vanish (a bare bullet yields nothing).
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

  // kept whole, as a note — see the comment on SUBLABEL_WITH_ITEMS. `inline`
  // marks it for the human review report without changing what is stored.
  if (SUBLABEL_WITH_ITEMS.test(line)) {
    return [{ kind: "note", text: line, inline: true }];
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
  // A blank line before every structural line and nowhere else — the same rule
  // serializeRecipeBody uses, for the same reason: without it markdown folds a
  // sub-label into the bullet above it.
  const lines = [];
  for (const [idx, i] of (items ?? []).entries()) {
    if (idx > 0 && i.kind !== "item") lines.push("");
    lines.push(i.kind === "sublabel" ? `**${i.text}**` : i.kind === "note" ? i.text : `- ${i.text}`);
  }
  return lines.join("\n");
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

// ── generated-SQL safety ────────────────────────────────────────────────────

/**
 * Returns the 1-based line where a string literal was opened and never closed,
 * or null when the SQL is balanced. `--` comments run to end of line and cannot
 * open a literal; a doubled '' inside a literal is an escaped quote.
 *
 * The generator doubles every quote, so escaping is correct by construction.
 * This asserts the construction, because the failure it guards against is not a
 * loud syntax error: a literal that closes early turns the rest of a recipe
 * into executable SQL.
 */
export function findUnterminatedString(sql) {
  const text = String(sql ?? "");
  let i = 0;
  let line = 1;
  let inString = false;
  let openedAt = 0;

  while (i < text.length) {
    const c = text[i];

    if (!inString && c === "-" && text[i + 1] === "-") {
      const nl = text.indexOf("\n", i);
      if (nl === -1) break;
      line++;
      i = nl + 1;
      continue;
    }

    if (c === "\n") line++;

    if (c === "'") {
      if (inString && text[i + 1] === "'") {
        i += 2;
        continue;
      }
      inString = !inString;
      if (inString) openedAt = line;
    }
    i++;
  }

  return inString ? openedAt : null;
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
