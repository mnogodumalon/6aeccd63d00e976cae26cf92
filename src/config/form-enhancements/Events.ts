// Auto-generated. Per-entity form-enhancements config for "Events".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: ["eventname", {"row": ["eventart", "eventstatus"], "cols": "1fr 1fr"}, {"row": ["beginn", "ende"]}, "ort", {"row": ["max_teilnehmer", "gebuehr"], "cols": "1fr 1fr"}, "veranstalter", "eventbeschreibung"],
  defaults: {
    'beginn': { kind: 'today', withTime: true },
    'ende': { kind: 'todayOffset', days: 1, withTime: true },
    'eventstatus': { kind: 'lookup', key: 'geplant', label: 'Geplant' },
  },
  computed: {
    '_event_dauer_stunden': { kind: 'dateDiff', from: 'beginn', to: 'ende', unit: 'hours' },
    'max_teilnehmer': { kind: 'applookup', ownKey: 'ort', lookupKey: 'kapazitaet' },
  },
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
