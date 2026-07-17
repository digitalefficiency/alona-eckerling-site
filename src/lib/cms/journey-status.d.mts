// Type surface of journey-status.mjs (per-station completeness for the recipe journey).
export type StationId = "dish" | "story" | "ingredients" | "steps" | "image" | "catalog" | "publish";
export declare const STATION_ORDER: readonly StationId[];
export type JourneyInput = {
  title: string; prepTime: string; intro: string;
  ingredients: string[]; steps: string[];
  image: string; imageAlt: string;
  category: string; tags: string[]; date: string;
  description: string; slug: string; isNew: boolean;
};
export declare function stationStatus(input: JourneyInput): Record<StationId, boolean>; // true = done
export declare function missingStations(input: JourneyInput): StationId[];
export declare const SLUG_RE: RegExp; // /^[a-z0-9]+(?:-[a-z0-9]+)*$/
