// Auto-generated. Per-entity form-enhancements config for "Teilnehmer".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: [{"row": ["vorname", "nachname"]}, "email", "telefon", "geburtsdatum", "skilllevel", "stance", "wohnort", "team", {"row": ["notfall_vorname", "notfall_nachname"]}, "notfall_telefon"],
  defaults: {
    'skilllevel': { kind: 'lookup', key: 'anfaenger', label: 'Anfänger' },
  },
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
