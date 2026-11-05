// Auto-generated. Per-entity form-enhancements config for "Anmeldungen".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: [{"row": ["event", "teilnehmer"], "cols": "1fr 1fr"}, "anmeldestatus", "anmeldedatum", {"row": ["disziplin", "startnummer"], "cols": "2fr 1fr"}, "zahlungsstatus", "bemerkung"],
  defaults: {
    'anmeldedatum': { kind: 'today' },
    'zahlungsstatus': { kind: 'lookup', key: 'offen', label: 'Offen' },
    'anmeldestatus': { kind: 'lookup', key: 'angemeldet', label: 'Angemeldet' },
  },
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
