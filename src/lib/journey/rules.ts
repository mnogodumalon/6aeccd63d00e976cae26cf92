/**
 * Field rules — GENERATED from the app metadata. Do not edit.
 *
 * The mechanical truth about every field: what kind it is, whether the
 * platform's base view marks it required, which lookup keys exist, where an
 * applookup points, what the label is. `useStepForm` validates against these
 * rules and phrases its messages with the real labels; `toWirePayload` uses
 * them to shape the create payload; `SHAPES` tells a page which input FORM
 * fits the data (a date pair wants a calendar, not two fields) — it is a
 * signal, not a gate.
 */
import { appLabel, fieldLabel, lookupLabel } from '@/i18n';
import { policyLabel } from './policy';
import { LOOKUP_OPTIONS } from '@/types/app';

export type EntityKey = 'veranstaltungsorte' | 'events' | 'teilnehmer' | 'anmeldungen';

/** The text fields of each entity — what a search may run over (generated;
 *  `never` for an entity without text of its own, e.g. a link table). */
export interface StringFields {
  "veranstaltungsorte": "ortsname" | "strasse" | "hausnummer" | "plz" | "stadt" | "kontakt_vorname" | "kontakt_nachname" | "kontakt_email" | "kontakt_telefon" | "ortsbeschreibung";
  "events": "eventname" | "veranstalter" | "eventbeschreibung";
  "teilnehmer": "vorname" | "nachname" | "email" | "telefon" | "wohnort" | "team" | "notfall_vorname" | "notfall_nachname" | "notfall_telefon";
  "anmeldungen": "bemerkung";
}
export type StringFieldKey<E extends EntityKey> = E extends keyof StringFields ? StringFields[E] : never;

/** The applookup fields of each entity (generated). A pick stored through
 *  `form.set` on one of these must carry its display name — at compile time
 *  (`StepForm.set`), because the review would otherwise show the id. */
export interface RecordFields {
  "veranstaltungsorte": never;
  "events": "ort";
  "teilnehmer": never;
  "anmeldungen": "event" | "teilnehmer";
}
export type RecordFieldKey<E extends EntityKey> = E extends keyof RecordFields ? RecordFields[E] : never;

export type FieldKind =
  | 'text'
  | 'textarea'
  | 'email'
  | 'tel'
  | 'url'
  | 'number'
  | 'bool'
  | 'date'
  | 'datetime'
  | 'lookup'
  | 'multilookup'
  | 'record'
  | 'multirecord'
  | 'file'
  | 'geo';

export interface FieldRule {
  key: string;
  fulltype: string;
  kind: FieldKind;
  /** From the app's base view. A public page may override this per field. */
  required: boolean;
  /** Build-time label — `labelOf()` prefers the runtime i18n bundle. */
  label: string;
  /** Whether a journey may write it as a value. `file` is false: a file is UPLOADED
   *  (`form.file(key)` → FileField; the chosen file travels in the create as a data URL). */
  writable: boolean;
  maxLength?: number;
  /** lookup / multilookup: the ONLY valid write values. */
  options?: string[];
  /** record / multirecord: the target app (always) and its entity key (when inside this appgroup). */
  targetAppId?: string;
  targetEntity?: EntityKey;
  format?: 'currency';
  /** HTML autocomplete token derived from the field name (given-name, email, tel, …). */
  autoComplete?: string;
}

export interface EntityInfo {
  key: EntityKey;
  appId: string;
  label: string;
  /** PascalCase plural — `get<pascal>()` on the service. */
  pascal: string;
  /** The single-record suffix — `create<single>()` on the service. */
  single: string;
}

/** Input-form signals per entity: which data shape each field (pair) has.
 *  `range`  — two date fields that form a stay/period → AvailabilityRangePicker
 *  `choice` — a lookup with few options → ChoiceGroup pills instead of a select
 *  `record` — an applookup → EntitySelectStep with search, never a raw id field
 *  `stock`  — a quantity that has a stock/capacity counterpart → show it, warn on overshoot */
export type Shape =
  | { kind: 'range'; from: string; to: string }
  | { kind: 'choice'; field: string; count: number }
  | { kind: 'record'; field: string; targetEntity?: EntityKey }
  | { kind: 'stock'; field: string };

export const ENTITIES: Record<EntityKey, EntityInfo> = {
  "veranstaltungsorte": {
    "key": "veranstaltungsorte",
    "appId": "6aeccd4c1cae257573767ec9",
    "label": "Veranstaltungsorte",
    "pascal": "Veranstaltungsorte",
    "single": "VeranstaltungsorteEntry"
  },
  "events": {
    "key": "events",
    "appId": "6aeccd519edfe6d5ca3a98a4",
    "label": "Events",
    "pascal": "Events",
    "single": "Event"
  },
  "teilnehmer": {
    "key": "teilnehmer",
    "appId": "6aeccd529c5d8ee2120f563e",
    "label": "Teilnehmer",
    "pascal": "Teilnehmer",
    "single": "TeilnehmerEntry"
  },
  "anmeldungen": {
    "key": "anmeldungen",
    "appId": "6aeccd52cf9f27551ffee87d",
    "label": "Anmeldungen",
    "pascal": "Anmeldungen",
    "single": "AnmeldungenEntry"
  }
};

export const FIELD_RULES: Record<EntityKey, Record<string, FieldRule>> = {
  "veranstaltungsorte": {
    "ortsname": {
      "key": "ortsname",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Name des Ortes",
      "writable": true,
      "maxLength": 4000
    },
    "ortsart": {
      "key": "ortsart",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": false,
      "label": "Art des Ortes",
      "writable": true,
      "options": [
        "skatepark",
        "halle",
        "street_spot",
        "plaza",
        "bowl"
      ]
    },
    "strasse": {
      "key": "strasse",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Straße",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "address-line1"
    },
    "hausnummer": {
      "key": "hausnummer",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Hausnummer",
      "writable": true,
      "maxLength": 4000
    },
    "plz": {
      "key": "plz",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Postleitzahl",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "postal-code"
    },
    "stadt": {
      "key": "stadt",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Stadt",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "address-level2"
    },
    "kapazitaet": {
      "key": "kapazitaet",
      "fulltype": "number",
      "kind": "number",
      "required": false,
      "label": "Kapazität (Personen)",
      "writable": true
    },
    "kontakt_vorname": {
      "key": "kontakt_vorname",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Vorname",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "given-name"
    },
    "kontakt_nachname": {
      "key": "kontakt_nachname",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Nachname",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "family-name"
    },
    "kontakt_email": {
      "key": "kontakt_email",
      "fulltype": "string/email",
      "kind": "email",
      "required": false,
      "label": "E-Mail",
      "writable": true,
      "autoComplete": "email"
    },
    "kontakt_telefon": {
      "key": "kontakt_telefon",
      "fulltype": "string/tel",
      "kind": "tel",
      "required": false,
      "label": "Telefon",
      "writable": true,
      "autoComplete": "tel"
    },
    "ortsbeschreibung": {
      "key": "ortsbeschreibung",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Beschreibung",
      "writable": true
    }
  },
  "events": {
    "eventname": {
      "key": "eventname",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Eventname",
      "writable": true,
      "maxLength": 4000
    },
    "eventart": {
      "key": "eventart",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": true,
      "label": "Eventart",
      "writable": true,
      "options": [
        "contest",
        "workshop",
        "jam",
        "demo",
        "meetup"
      ]
    },
    "beginn": {
      "key": "beginn",
      "fulltype": "date/datetimeminute",
      "kind": "datetime",
      "required": true,
      "label": "Beginn",
      "writable": true
    },
    "ende": {
      "key": "ende",
      "fulltype": "date/datetimeminute",
      "kind": "datetime",
      "required": false,
      "label": "Ende",
      "writable": true
    },
    "ort": {
      "key": "ort",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Veranstaltungsort",
      "writable": true,
      "targetAppId": "6aeccd4c1cae257573767ec9",
      "targetEntity": "veranstaltungsorte"
    },
    "max_teilnehmer": {
      "key": "max_teilnehmer",
      "fulltype": "number",
      "kind": "number",
      "required": false,
      "label": "Maximale Teilnehmerzahl",
      "writable": true
    },
    "gebuehr": {
      "key": "gebuehr",
      "fulltype": "number",
      "kind": "number",
      "required": false,
      "label": "Teilnahmegebühr (€)",
      "writable": true,
      "format": "currency"
    },
    "eventstatus": {
      "key": "eventstatus",
      "fulltype": "lookup/radio",
      "kind": "lookup",
      "required": true,
      "label": "Status",
      "writable": true,
      "options": [
        "geplant",
        "anmeldung_offen",
        "ausgebucht",
        "abgeschlossen",
        "abgesagt"
      ]
    },
    "veranstalter": {
      "key": "veranstalter",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Veranstalter",
      "writable": true,
      "maxLength": 4000
    },
    "eventbeschreibung": {
      "key": "eventbeschreibung",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Beschreibung",
      "writable": true
    }
  },
  "teilnehmer": {
    "vorname": {
      "key": "vorname",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Vorname",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "given-name"
    },
    "nachname": {
      "key": "nachname",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Nachname",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "family-name"
    },
    "email": {
      "key": "email",
      "fulltype": "string/email",
      "kind": "email",
      "required": true,
      "label": "E-Mail",
      "writable": true,
      "autoComplete": "email"
    },
    "telefon": {
      "key": "telefon",
      "fulltype": "string/tel",
      "kind": "tel",
      "required": false,
      "label": "Telefon",
      "writable": true,
      "autoComplete": "tel"
    },
    "geburtsdatum": {
      "key": "geburtsdatum",
      "fulltype": "date/date",
      "kind": "date",
      "required": false,
      "label": "Geburtsdatum",
      "writable": true,
      "autoComplete": "bday"
    },
    "wohnort": {
      "key": "wohnort",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Stadt",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "address-level2"
    },
    "skilllevel": {
      "key": "skilllevel",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": false,
      "label": "Skill-Level",
      "writable": true,
      "options": [
        "anfaenger",
        "fortgeschritten",
        "profi"
      ]
    },
    "stance": {
      "key": "stance",
      "fulltype": "lookup/radio",
      "kind": "lookup",
      "required": false,
      "label": "Stance",
      "writable": true,
      "options": [
        "regular",
        "goofy"
      ]
    },
    "team": {
      "key": "team",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Team oder Crew",
      "writable": true,
      "maxLength": 4000
    },
    "notfall_vorname": {
      "key": "notfall_vorname",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Vorname des Notfallkontakts",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "given-name"
    },
    "notfall_nachname": {
      "key": "notfall_nachname",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Nachname des Notfallkontakts",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "family-name"
    },
    "notfall_telefon": {
      "key": "notfall_telefon",
      "fulltype": "string/tel",
      "kind": "tel",
      "required": false,
      "label": "Telefon des Notfallkontakts",
      "writable": true,
      "autoComplete": "tel"
    }
  },
  "anmeldungen": {
    "event": {
      "key": "event",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Event",
      "writable": true,
      "targetAppId": "6aeccd519edfe6d5ca3a98a4",
      "targetEntity": "events"
    },
    "teilnehmer": {
      "key": "teilnehmer",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Teilnehmer",
      "writable": true,
      "targetAppId": "6aeccd529c5d8ee2120f563e",
      "targetEntity": "teilnehmer"
    },
    "anmeldedatum": {
      "key": "anmeldedatum",
      "fulltype": "date/date",
      "kind": "date",
      "required": false,
      "label": "Anmeldedatum",
      "writable": true
    },
    "disziplin": {
      "key": "disziplin",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": false,
      "label": "Disziplin",
      "writable": true,
      "options": [
        "street",
        "park",
        "bowl",
        "vert",
        "best_trick",
        "game_of_skate"
      ]
    },
    "startnummer": {
      "key": "startnummer",
      "fulltype": "number",
      "kind": "number",
      "required": false,
      "label": "Startnummer",
      "writable": true
    },
    "zahlungsstatus": {
      "key": "zahlungsstatus",
      "fulltype": "lookup/radio",
      "kind": "lookup",
      "required": false,
      "label": "Zahlungsstatus",
      "writable": true,
      "options": [
        "offen",
        "bezahlt",
        "erlassen"
      ]
    },
    "anmeldestatus": {
      "key": "anmeldestatus",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": true,
      "label": "Anmeldestatus",
      "writable": true,
      "options": [
        "angemeldet",
        "bestaetigt",
        "warteliste",
        "storniert"
      ]
    },
    "bemerkung": {
      "key": "bemerkung",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Bemerkung",
      "writable": true
    }
  }
};

export const SHAPES: Record<EntityKey, Shape[]> = {
  "veranstaltungsorte": [
    {
      "kind": "choice",
      "field": "ortsart",
      "count": 5
    },
    {
      "kind": "stock",
      "field": "kapazitaet"
    }
  ],
  "events": [
    {
      "kind": "range",
      "from": "beginn",
      "to": "ende"
    },
    {
      "kind": "choice",
      "field": "eventart",
      "count": 5
    },
    {
      "kind": "choice",
      "field": "eventstatus",
      "count": 5
    },
    {
      "kind": "record",
      "field": "ort",
      "targetEntity": "veranstaltungsorte"
    }
  ],
  "teilnehmer": [
    {
      "kind": "choice",
      "field": "skilllevel",
      "count": 3
    },
    {
      "kind": "choice",
      "field": "stance",
      "count": 2
    }
  ],
  "anmeldungen": [
    {
      "kind": "choice",
      "field": "disziplin",
      "count": 6
    },
    {
      "kind": "choice",
      "field": "zahlungsstatus",
      "count": 3
    },
    {
      "kind": "choice",
      "field": "anmeldestatus",
      "count": 4
    },
    {
      "kind": "record",
      "field": "event",
      "targetEntity": "events"
    },
    {
      "kind": "record",
      "field": "teilnehmer",
      "targetEntity": "teilnehmer"
    }
  ]
};

/** The fields a record of this entity is recognised by (a person: first and
 *  last name; else its title-like text field) — the same choice the dashboard's
 *  enrichment makes for `<key>Name`. `useRecordSearch` resolves an applookup to
 *  this name (`ctx.ref('gast')` in `toItem`). */
export const DISPLAY_FIELDS: Record<EntityKey, string[]> = {
  "veranstaltungsorte": [
    "ortsname"
  ],
  "events": [
    "eventname"
  ],
  "teilnehmer": [
    "vorname",
    "nachname"
  ],
  "anmeldungen": [
    "bemerkung"
  ]
};

/** The display name of a record: its display fields joined, else the first
 *  non-empty text value, else ''. */
/** A display-field value as text: strings as they are, a lookup `{ key, label }`
 *  (either door hydrates lookups to objects) by its label — an entity whose
 *  only title-like field is a lookup/select otherwise had no name at all. */
function displayPart(v: unknown): string {
  if (typeof v === 'string') return v.trim();
  if (v && typeof v === 'object' && 'label' in v) {
    const l = (v as { label?: unknown }).label;
    return l === null || l === undefined ? '' : String(l).trim();
  }
  return '';
}

export function displayNameOf(entity: EntityKey, fields: Record<string, unknown>): string {
  const parts = (DISPLAY_FIELDS[entity] ?? [])
    .map(k => displayPart(fields[k]))
    .filter(v => v !== '');
  if (parts.length > 0) return parts.join(' ');
  for (const [k, rule] of Object.entries(FIELD_RULES[entity] ?? {})) {
    if (rule.kind !== 'text' && rule.kind !== 'email') continue;
    const v = fields[k];
    if (typeof v === 'string' && v.trim() !== '') return v.trim();
  }
  return '';
}

export function ruleOf(entity: EntityKey, key: string): FieldRule | undefined {
  return FIELD_RULES[entity]?.[key];
}

/** The field label as the user sees it — the owner's policy label first (a
 *  public page's "Felder anpassen"), runtime bundle second, generated label last. */
export function labelOf(entity: EntityKey, key: string): string {
  const own = policyLabel(entity, key);
  if (own) return own;
  const fromBundle = fieldLabel(entity, key);
  if (fromBundle !== key) return fromBundle;
  return ruleOf(entity, key)?.label ?? key;
}

export function entityLabel(entity: EntityKey): string {
  const fromBundle = appLabel(entity);
  if (fromBundle !== entity) return fromBundle;
  return ENTITIES[entity]?.label ?? entity;
}

/** Lookup options with runtime labels — the only legitimate source of `{key,label}` pairs. */
export function optionsOf(entity: EntityKey, key: string): Array<{ key: string; label: string }> {
  const generated = (LOOKUP_OPTIONS as Record<string, Record<string, Array<{ key: string; label: string }>>>)[entity]?.[key];
  if (generated && generated.length) return generated.map(o => ({ key: o.key, label: o.label }));
  const keys = ruleOf(entity, key)?.options ?? [];
  return keys.map(k => ({ key: k, label: lookupLabel(entity, key, k) ?? k }));
}

/** „Nicht ausgefüllt“ for a required field, by its kind: a checkbox that is
 *  `false` is NOT filled — the person did not consent (live 03.11.2026: a
 *  consent page validated with the box unticked and the grant took it). Every
 *  other kind is isEmptyValue. */
export function isUnfilled(entity: EntityKey, key: string, v: unknown): boolean {
  if (ruleOf(entity, key)?.kind === 'bool') return v !== true;
  return isEmptyValue(v);
}

export function isEmptyValue(v: unknown): boolean {
  if (v === undefined || v === null) return true;
  if (typeof v === 'string') return v.trim() === '';
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === 'object' && 'from' in (v as object) && 'to' in (v as object)) {
    const r = v as { from: unknown; to: unknown };
    return isEmptyValue(r.from) && isEmptyValue(r.to);
  }
  return false;
}
