// Auto-generated. Per-entity form-enhancements config for "Veranstaltungsorte".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: [{"row": ["ortsname", "stadt"], "cols": "2fr 1fr"}, "ortsart", {"row": ["strasse", "hausnummer"], "cols": "3fr 1fr"}, "plz", "kapazitaet", {"row": ["kontakt_vorname", "kontakt_nachname"], "cols": "1fr 1fr"}, {"row": ["kontakt_email", "kontakt_telefon"], "cols": "1fr 1fr"}, "ortsbeschreibung"],
  defaults: {},
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
