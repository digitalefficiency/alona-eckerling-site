// settings-schema.ts — typed access to content/cms/settings.schema.json.
// The schema drives BOTH the admin form and the lint-content gate: one file, so a
// field the client can edit is exactly a field the gate validates. Ships `{}` —
// the business-info surface stays closed until a project opens it.
import schema from "../../../content/cms/settings.schema.json";
import type { FieldSpec } from "./config";

export type SettingsGroup = {
  label: string; // Hebrew heading in the admin
  array?: boolean; // true → the JSON file holds a list of items (testimonials)
  itemLabel?: string; // singular label for an array group ("המלצה")
  fields: FieldSpec[];
};

export const settingsSchema = schema as unknown as Record<string, SettingsGroup>;
export const settingsGroups = Object.keys(settingsSchema);
export const hasSettings = settingsGroups.length > 0;
