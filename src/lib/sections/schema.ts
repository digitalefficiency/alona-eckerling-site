// sections/schema.ts — the field vocabulary the page editor is generated from.
//
// This EXTENDS the recipe/blog FieldSpec in lib/cms/config.ts rather than
// replacing it. That one describes a flat frontmatter document and is doing its
// job; a marketing section needs three things it does not have: a highlighted
// substring, a link with a picker, and a repeating group.
//
// The shape here is the shape the admin form generator reads AND the shape the
// Zod validators will mirror. One vocabulary, so a field cannot be described
// one way to the editor and another way to the database.

export type Ratio = "wide" | "3:2" | "4:5" | "16:9" | "1:1" | "3:4";

type Base = {
  key: string;
  /** Hebrew, shown as the field label in the desk. */
  label: string;
  required?: boolean;
  /** One line of guidance, shown under the field. */
  hint?: string;
  /**
   * Art direction the editor may see but not change. A locked field renders
   * read-only with an explanation — never hidden, because a field that vanishes
   * reads as a bug, and never editable, because the value is load-bearing for
   * a composition she did not author.
   */
  locked?: boolean;
};

export type TextField = Base & {
  kind: "text" | "textarea";
  /**
   * Character ceiling derived from the real CSS tolerance, never guessed.
   * SOFT by default: typing past it is always allowed and the counter turns
   * amber. A hard block on a headline someone is mid-thought on is hostile,
   * and the existing CMS never did that either.
   */
  max?: number;
  /** The few places a limit really is a block: slug, SEO description, alt. */
  hardMax?: boolean;
  /** Rendered as N separate lines split on \n, each with its own ceiling. */
  lines?: number;
  maxPerLine?: number;
};

/**
 * A substring of a sibling field that gets the drawn rose underline.
 * It is NEVER a save blocker: SplitText already degrades to the plain line when
 * the accent is not found (motion/SplitText.tsx), so a mismatch costs an
 * underline, not a page. The desk warns and offers the sibling's words as chips.
 */
export type MarkField = Base & {
  kind: "mark";
  /** the field this must be a substring of */
  of: string;
  max?: number;
};

export type LinkField = Base & {
  kind: "link";
  /** internal targets are picked from real routes; external must parse as https */
  allowExternal?: boolean;
};

export type ImageField = Base & {
  kind: "image";
  ratio: Ratio;
  minWidth?: number;
  /**
   * alt="" in the rendered markup. A decorative slot shows NO alt field at all:
   * asking for alt text on a texture teaches people to write noise, and noise
   * in alt text is worse for a screen reader than silence.
   */
  decorative?: boolean;
};

export type VideoField = Base & { kind: "video" };
export type BooleanField = Base & { kind: "boolean" };

export type RepeaterField = Base & {
  kind: "repeater";
  min?: number;
  max?: number;
  /** Hebrew singular, for the "add" button */
  itemLabel: string;
  fields: FieldSpec[];
};

export type FieldSpec =
  | TextField
  | MarkField
  | LinkField
  | ImageField
  | VideoField
  | BooleanField
  | RepeaterField;

export type SectionType = {
  /** registry key, e.g. "home-hero" */
  type: string;
  /** Hebrew name shown on the section card */
  label: string;
  /** one line: what this section is for, shown under the name */
  purpose?: string;
  /** the page is broken without it — no delete, no hide */
  required?: boolean;
  /** pinned to the top or bottom of the page */
  pin?: "start" | "end";
  /** may appear more than once on a page */
  duplicable?: boolean;
  fields: FieldSpec[];
};

/** One section instance on a page. Same shape as a `pages.sections` element. */
export type SectionInstance = {
  id: string;
  type: string;
  schema_version: number;
  visible: boolean;
  payload: Record<string, unknown>;
};

export type PageDocument = {
  slug: string;
  title: string;
  description?: string;
  sections: SectionInstance[];
  /** the order the site shipped with, for "restore the original order" */
  baseline_order: { id: string; type: string }[];
};
