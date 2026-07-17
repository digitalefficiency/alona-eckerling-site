// recipe-paste.mjs — heuristics that turn a pasted "whole recipe" (WhatsApp,
// Word, markdown, bare text) into the journey's model. Deterministic, zero AI,
// zero deps. The contract with the user: nothing is ever DROPPED — anything the
// heuristics cannot place stays visible in `intro` for manual sorting.
const MARKER = /^\s*(?:[-*•▪◦]\s*|\d+[.)]\s*)/;

export function splitPastedLines(text) {
  return String(text ?? "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.replace(MARKER, "").trim())
    .filter(Boolean);
}

// A "section marker" line: optional emoji/symbols/## prefix, a known Hebrew
// section word, optionally a short tail and a colon. Tested against the TRIMMED line.
const SECTIONS = [
  { key: "ingredients", re: /^[^\p{L}\p{N}]*(?:##\s*)?[^\p{L}\p{N}]*(רכיבים|מצרכים|החומרים|חומרים)\s*:?\s*$/u },
  { key: "tip", re: /^[^\p{L}\p{N}]*(?:##\s*)?[^\p{L}\p{N}]*טיפ(?:ים)?(?![\p{L}\p{N}])/u },
  { key: "steps", re: /^[^\p{L}\p{N}]*(?:##\s*)?[^\p{L}\p{N}]*(אופן\s+ה?הכנה|הוראות(?:\s+הכנה)?|שלבי\s+הכנה|דרך\s+ההכנה|הכנה)\s*:?\s*$/u },
];

function sectionOf(line) {
  for (const s of SECTIONS) {
    if (s.re.test(line)) return s;
  }
  return null;
}

export function parsePaste(text) {
  const rawLines = String(text ?? "").replace(/\r\n/g, "\n").split("\n");
  const out = { title: "", intro: "", ingredients: [], steps: [], tip: "" };

  // Pass 1 — explicit section markers.
  let bucket = "top";
  const top = [];
  const tipLines = [];
  let sawSection = false;
  for (const raw of rawLines) {
    const line = raw.trim();
    const sec = line ? sectionOf(line) : null;
    if (sec) {
      sawSection = true;
      bucket = sec.key;
      // "טיפ: מגישים חם" carries content on the marker line itself.
      if (sec.key === "tip") {
        const inlineTip = line.replace(/^[^\p{L}\p{N}]*טיפ(?:ים)?\s*:?\s*/u, "").trim();
        if (inlineTip) tipLines.push(inlineTip);
      }
      continue;
    }
    if (!line) {
      if (bucket === "top") top.push("");
      continue;
    }
    if (bucket === "top") top.push(line);
    else if (bucket === "ingredients") out.ingredients.push(...splitPastedLines(line));
    else if (bucket === "steps") out.steps.push(...splitPastedLines(line));
    else if (bucket === "tip") tipLines.push(line);
  }
  out.tip = tipLines.join("\n").trim();

  // Title: first non-empty top line, if short and not itself a list item.
  const topClean = [];
  for (const l of top) topClean.push(l);
  const firstIdx = topClean.findIndex((l) => l.trim());
  if (firstIdx !== -1) {
    const first = topClean[firstIdx].trim();
    if (first.length <= 70 && !MARKER.test(first) && !first.startsWith("#")) {
      out.title = first;
      topClean.splice(0, firstIdx + 1);
    }
  }

  if (sawSection) {
    out.intro = topClean.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  } else {
    // Pass 2 — no markers: cluster the remaining lines.
    const rest = topClean.join("\n").split("\n");
    const groups = []; // { kind: "prose"|"bullet"|"number", lines: [] }
    for (const raw of rest) {
      const line = raw.trim();
      if (!line) { groups.push(null); continue; }
      const kind = /^\d+[.)]\s*/.test(line) ? "number" : /^[-*•▪◦]\s*/.test(line) ? "bullet" : "prose";
      const last = groups[groups.length - 1];
      if (last && last.kind === kind) last.lines.push(line);
      else groups.push({ kind, lines: [line] });
    }
    const clean = groups.filter(Boolean);
    const numberIdx = clean.findIndex((g) => g.kind === "number" && g.lines.length >= 2);
    const bulletIdx = clean.findIndex((g) => g.kind === "bullet" && g.lines.length >= 2);
    let ingredientsIdx = bulletIdx;
    // WhatsApp habit: ingredients as bare short lines right before the numbered steps.
    if (ingredientsIdx === -1 && numberIdx > 0) {
      const before = clean[numberIdx - 1];
      if (before.kind === "prose" && before.lines.length >= 2 && before.lines.every((l) => l.length <= 80)) {
        ingredientsIdx = numberIdx - 1;
      }
    }
    const introParts = [];
    clean.forEach((g, i) => {
      if (i === ingredientsIdx) out.ingredients = splitPastedLines(g.lines.join("\n"));
      else if (i === numberIdx) out.steps = splitPastedLines(g.lines.join("\n"));
      else introParts.push(g.lines.join("\n"));
    });
    out.intro = introParts.join("\n\n").trim();
  }

  return {
    ...out,
    summary: {
      hasTitle: Boolean(out.title),
      hasIntro: Boolean(out.intro),
      ingredients: out.ingredients.length,
      steps: out.steps.length,
      hasTip: Boolean(out.tip),
    },
  };
}
