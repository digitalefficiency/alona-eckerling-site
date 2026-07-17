// Type surface of recipe-body.mjs (recipe body markdown ⇄ structured model).
export type RecipeBodyModel = {
  intro: string;          // prose before the first "## " heading
  ingredients: string[];  // items of the רכיבים/מצרכים section, markers stripped
  steps: string[];        // items of the הכנה/הוראות section, numbering stripped
  tip: string;            // prose of a טיפ section
  extra: string;          // every unrecognized "## " section, verbatim, original order
  headings: { ingredients: string; steps: string; tip: string }; // original heading text (round-trip fidelity)
};
export declare function emptyRecipeBody(): RecipeBodyModel;
export declare function parseRecipeBody(markdown: string): RecipeBodyModel;
export declare function serializeRecipeBody(model: RecipeBodyModel): string;
