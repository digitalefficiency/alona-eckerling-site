// journey-status.mjs — per-station completeness for the recipe journey's
// progress rail and pre-publish checklist. Mirrors (does not replace) the
// server validator: the server stays the authority; this only paints the rail.
export const STATION_ORDER = ["dish", "story", "ingredients", "steps", "image", "catalog", "publish"];
export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const filled = (s) => Boolean(String(s ?? "").trim());

export function stationStatus(i) {
  return {
    dish: filled(i.title) && String(i.title).trim().length <= 70 && filled(i.prepTime),
    story: filled(i.intro),
    ingredients: i.ingredients.filter(filled).length >= 1,
    steps: i.steps.filter(filled).length >= 1,
    image:
      filled(i.image) &&
      filled(i.imageAlt) &&
      // validateDoc's gallery case requires every alt non-empty; the rail must not
      // read "done" on a state the server will reject.
      (i.gallery ?? []).every((url, idx) => !filled(url) || filled((i.galleryAlt ?? [])[idx])),
    catalog: filled(i.category) && i.tags.filter(filled).length >= 1 && filled(i.date),
    publish:
      String(i.description ?? "").trim().length >= 70 &&
      String(i.description ?? "").trim().length <= 160 &&
      (!i.isNew || SLUG_RE.test(i.slug)),
  };
}

export function missingStations(i) {
  const st = stationStatus(i);
  return STATION_ORDER.filter((id) => !st[id]);
}
