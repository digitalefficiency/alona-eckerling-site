// Type surface of recipe-paste.mjs (heuristic "paste-anything" recipe parser).
export type PasteResult = {
  title: string;                 // "" when not confidently detected
  intro: string;
  ingredients: string[];
  steps: string[];
  tip: string;
  summary: { hasTitle: boolean; hasIntro: boolean; ingredients: number; steps: number; hasTip: boolean };
};
export declare function parsePaste(text: string): PasteResult;
export declare function splitPastedLines(text: string): string[]; // multi-line paste → clean items (markers stripped)
