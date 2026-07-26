// sections/registry.ts — what the editor is allowed to change, per section type.
//
// THE REGISTRY LIVES IN CODE, NOT IN THE DATABASE. It has to version-lock with
// the components that render it: a field the desk offers but the component does
// not read is a promise the page cannot keep, and the only way to keep those in
// step is to ship them together.
//
// Every `max` below is derived from the real CSS of the component that renders
// the field — the clamp() font size, the container width in ch, the number of
// lines the design allows, the padding of a chamfered pill. A limit with no such
// derivation is a guess, and a guess here means either a wrapped button or a
// ceiling nobody can reach.

import type { SectionType } from "./schema";

export const HOME_HERO: SectionType = {
  type: "home-hero",
  label: "פתיח — חדר הבוקר",
  purpose: "הרגע הראשון: הסרט מלא-הרוחב, ההבטחה, והכפתור הראשי.",
  required: true,
  pin: "start",
  fields: [
    {
      key: "kicker",
      label: "שורת פתיחה קטנה",
      kind: "text",
      required: true,
      max: 48,
      // text-[13px] font-bold tracking-[0.14em] ≈ 9.5px/char in a 620px column,
      // minus the ◆ glyph and its gap. 48 keeps it to two lines at 390px.
      hint: "היהלום מצויר בקוד, אין צורך להקליד אותו",
    },
    {
      key: "title",
      label: "כותרת ראשית",
      kind: "textarea",
      required: true,
      lines: 2,
      maxPerLine: 26,
      max: 58,
      // RevealHeading splits on \n ONLY and gives each line its own mask.
      // clamp(2.1rem,5vw,3.3rem) → 52.8px cap in a 620px column ≈ 26 chars.
      // A longer line wraps INSIDE its mask and the reveal stutters.
      hint: "שתי שורות. שורה ארוכה מדי תישבר באמצע האנימציה",
    },
    {
      key: "titleAccent",
      label: "המילים עם הקו הוורוד",
      kind: "mark",
      of: "title",
      max: 20,
      hint: "חייב להיות רצף מילים מתוך שורה אחת של הכותרת",
    },
    {
      key: "lede",
      label: "פסקת הפתיחה",
      kind: "textarea",
      required: true,
      max: 160,
      // max-w-[54ch] text-lg leading-[1.7] → 54 chars a line, 3 lines before it
      // pushes the button below the fold on a phone.
    },
    {
      key: "ctaPrimary",
      label: "כפתור ראשי",
      kind: "text",
      required: true,
      max: 18,
      // btn-chamfer px-8 py-4 text-base font-bold. The clipped corner breaks if
      // the label wraps, so this one really is a single line.
      hint: "שורה אחת. טקסט ארוך ישבור את הפינה החתוכה של הכפתור",
    },
    { key: "ctaSub", label: "שורה מתחת לכפתור", kind: "text", max: 28 },
    {
      key: "trustToken",
      label: "תג האמון",
      kind: "text",
      required: true,
      max: 34,
      // rounded-full border px-4 py-2.5 text-sm ≈ 7.4px/char pill
    },
    {
      key: "trustTokenLicense",
      label: "סיפא הרישיון",
      kind: "text",
      max: 32,
      hint: "מוצג רק ממסך 640 פיקסל ומעלה, ולכן מתחיל במפריד ‎ · ‎",
    },
    { key: "ctaRecipes", label: "קישור משני למתכונים", kind: "text", max: 60 },
    {
      key: "poster",
      label: "תמונת הפתיחה של הסרט",
      kind: "image",
      ratio: "wide",
      minWidth: 1600,
      decorative: true,
      locked: true,
      hint: "הפריים האחרון של הסרט חייב להיות זהה לפריים הראשון של סקשן הגלילה",
    },
    {
      key: "filmWebm",
      label: "קובץ הסרט (webm)",
      kind: "video",
      locked: true,
      hint: "מוחלף רק יחד עם הפוסטר, דרך רום",
    },
    { key: "filmMp4", label: "קובץ הסרט (mp4)", kind: "video", locked: true },
  ],
};

export const REGISTRY: Record<string, SectionType> = {
  [HOME_HERO.type]: HOME_HERO,
};

export const getSectionType = (type: string): SectionType | undefined => REGISTRY[type];
