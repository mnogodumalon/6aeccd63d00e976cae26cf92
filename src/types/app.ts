import { lookupLabel } from '@/i18n';

// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
/** A raw record URL (applookup reference). NEVER render this directly
 *  in JSX — it is a URL, not a display value. Show the enriched `*Name`
 *  field or resolve it via the entity map instead. Assignable to/from
 *  string everywhere; the `& {}` keeps the alias NAME visible in tsc
 *  error messages (a plain primitive alias gets normalized away). */
export type RecordUrl = string & {};
export type GeoLocation = { lat: number; long: number; info?: string };

export type AttachmentType = 'file' | 'note' | 'url' | 'json';
export interface Attachment {
  id: string;
  type: AttachmentType;
  label: string | null;
  value: string | null;
  active: boolean;
  createdat?: string | null;
  updatedat?: string | null;
}

export interface AttachmentInput {
  type: AttachmentType;
  label?: string;
  value: string;
  active?: boolean;
}

export interface Veranstaltungsorte {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    ortsname?: string;
    ortsart?: LookupValue;
    strasse?: string;
    hausnummer?: string;
    plz?: string;
    stadt?: string;
    kapazitaet?: number;
    kontakt_vorname?: string;
    kontakt_nachname?: string;
    kontakt_email?: string;
    kontakt_telefon?: string;
    ortsbeschreibung?: string;
  };
}

export interface Events {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    eventname?: string;
    eventart?: LookupValue;
    beginn?: string; // Format: YYYY-MM-DD oder ISO String
    ende?: string; // Format: YYYY-MM-DD oder ISO String
    ort?: RecordUrl; // applookup -> URL zu 'Veranstaltungsorte' Record
    max_teilnehmer?: number;
    gebuehr?: number;
    eventstatus?: LookupValue;
    veranstalter?: string;
    eventbeschreibung?: string;
  };
}

export interface Teilnehmer {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    vorname?: string;
    nachname?: string;
    email?: string;
    telefon?: string;
    geburtsdatum?: string; // Format: YYYY-MM-DD oder ISO String
    wohnort?: string;
    skilllevel?: LookupValue;
    stance?: LookupValue;
    team?: string;
    notfall_vorname?: string;
    notfall_nachname?: string;
    notfall_telefon?: string;
  };
}

export interface Anmeldungen {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    event?: RecordUrl; // applookup -> URL zu 'Events' Record
    teilnehmer?: RecordUrl; // applookup -> URL zu 'Teilnehmer' Record
    anmeldedatum?: string; // Format: YYYY-MM-DD oder ISO String
    disziplin?: LookupValue;
    startnummer?: number;
    zahlungsstatus?: LookupValue;
    anmeldestatus?: LookupValue;
    bemerkung?: string;
  };
}

export const APP_IDS = {
  VERANSTALTUNGSORTE: '6aeccd4c1cae257573767ec9',
  EVENTS: '6aeccd519edfe6d5ca3a98a4',
  TEILNEHMER: '6aeccd529c5d8ee2120f563e',
  ANMELDUNGEN: '6aeccd52cf9f27551ffee87d',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {
  'veranstaltungsorte': {
    ortsart: [{ key: "skatepark", get label() { return lookupLabel('veranstaltungsorte', 'ortsart', "skatepark") ?? "Skatepark"; } }, { key: "halle", get label() { return lookupLabel('veranstaltungsorte', 'ortsart', "halle") ?? "Halle"; } }, { key: "street_spot", get label() { return lookupLabel('veranstaltungsorte', 'ortsart', "street_spot") ?? "Street-Spot"; } }, { key: "plaza", get label() { return lookupLabel('veranstaltungsorte', 'ortsart', "plaza") ?? "Plaza"; } }, { key: "bowl", get label() { return lookupLabel('veranstaltungsorte', 'ortsart', "bowl") ?? "Bowl"; } }],
  },
  'events': {
    eventart: [{ key: "contest", get label() { return lookupLabel('events', 'eventart', "contest") ?? "Contest"; } }, { key: "workshop", get label() { return lookupLabel('events', 'eventart', "workshop") ?? "Workshop"; } }, { key: "jam", get label() { return lookupLabel('events', 'eventart', "jam") ?? "Jam"; } }, { key: "demo", get label() { return lookupLabel('events', 'eventart', "demo") ?? "Demo"; } }, { key: "meetup", get label() { return lookupLabel('events', 'eventart', "meetup") ?? "Meetup"; } }],
    eventstatus: [{ key: "geplant", get label() { return lookupLabel('events', 'eventstatus', "geplant") ?? "Geplant"; } }, { key: "anmeldung_offen", get label() { return lookupLabel('events', 'eventstatus', "anmeldung_offen") ?? "Anmeldung offen"; } }, { key: "ausgebucht", get label() { return lookupLabel('events', 'eventstatus', "ausgebucht") ?? "Ausgebucht"; } }, { key: "abgeschlossen", get label() { return lookupLabel('events', 'eventstatus', "abgeschlossen") ?? "Abgeschlossen"; } }, { key: "abgesagt", get label() { return lookupLabel('events', 'eventstatus', "abgesagt") ?? "Abgesagt"; } }],
  },
  'teilnehmer': {
    skilllevel: [{ key: "anfaenger", get label() { return lookupLabel('teilnehmer', 'skilllevel', "anfaenger") ?? "Anfänger"; } }, { key: "fortgeschritten", get label() { return lookupLabel('teilnehmer', 'skilllevel', "fortgeschritten") ?? "Fortgeschritten"; } }, { key: "profi", get label() { return lookupLabel('teilnehmer', 'skilllevel', "profi") ?? "Profi"; } }],
    stance: [{ key: "regular", get label() { return lookupLabel('teilnehmer', 'stance', "regular") ?? "Regular"; } }, { key: "goofy", get label() { return lookupLabel('teilnehmer', 'stance', "goofy") ?? "Goofy"; } }],
  },
  'anmeldungen': {
    disziplin: [{ key: "street", get label() { return lookupLabel('anmeldungen', 'disziplin', "street") ?? "Street"; } }, { key: "park", get label() { return lookupLabel('anmeldungen', 'disziplin', "park") ?? "Park"; } }, { key: "bowl", get label() { return lookupLabel('anmeldungen', 'disziplin', "bowl") ?? "Bowl"; } }, { key: "vert", get label() { return lookupLabel('anmeldungen', 'disziplin', "vert") ?? "Vert"; } }, { key: "best_trick", get label() { return lookupLabel('anmeldungen', 'disziplin', "best_trick") ?? "Best Trick"; } }, { key: "game_of_skate", get label() { return lookupLabel('anmeldungen', 'disziplin', "game_of_skate") ?? "Game of Skate"; } }],
    zahlungsstatus: [{ key: "offen", get label() { return lookupLabel('anmeldungen', 'zahlungsstatus', "offen") ?? "Offen"; } }, { key: "bezahlt", get label() { return lookupLabel('anmeldungen', 'zahlungsstatus', "bezahlt") ?? "Bezahlt"; } }, { key: "erlassen", get label() { return lookupLabel('anmeldungen', 'zahlungsstatus', "erlassen") ?? "Erlassen"; } }],
    anmeldestatus: [{ key: "angemeldet", get label() { return lookupLabel('anmeldungen', 'anmeldestatus', "angemeldet") ?? "Angemeldet"; } }, { key: "bestaetigt", get label() { return lookupLabel('anmeldungen', 'anmeldestatus', "bestaetigt") ?? "Bestätigt"; } }, { key: "warteliste", get label() { return lookupLabel('anmeldungen', 'anmeldestatus', "warteliste") ?? "Warteliste"; } }, { key: "storniert", get label() { return lookupLabel('anmeldungen', 'anmeldestatus', "storniert") ?? "Storniert"; } }],
  },
};

// Optimistic LookupValue writes: never re-type a label — resolve the schema
// option instead (its label is a locale-aware getter; falls back to the key).
// WRONG: status: { key: 'offen', label: 'Offen' }   (frozen in one language)
// RIGHT: status: lookupOption('<appKey>', 'status', 'offen')
export function lookupOption(app: string, field: string, key: string): LookupValue {
  return LOOKUP_OPTIONS[app]?.[field]?.find(o => o.key === key) ?? { key, label: key };
}

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'veranstaltungsorte': {
    'ortsname': 'string/text',
    'ortsart': 'lookup/select',
    'strasse': 'string/text',
    'hausnummer': 'string/text',
    'plz': 'string/text',
    'stadt': 'string/text',
    'kapazitaet': 'number',
    'kontakt_vorname': 'string/text',
    'kontakt_nachname': 'string/text',
    'kontakt_email': 'string/email',
    'kontakt_telefon': 'string/tel',
    'ortsbeschreibung': 'string/textarea',
  },
  'events': {
    'eventname': 'string/text',
    'eventart': 'lookup/select',
    'beginn': 'date/datetimeminute',
    'ende': 'date/datetimeminute',
    'ort': 'applookup/select',
    'max_teilnehmer': 'number',
    'gebuehr': 'number',
    'eventstatus': 'lookup/radio',
    'veranstalter': 'string/text',
    'eventbeschreibung': 'string/textarea',
  },
  'teilnehmer': {
    'vorname': 'string/text',
    'nachname': 'string/text',
    'email': 'string/email',
    'telefon': 'string/tel',
    'geburtsdatum': 'date/date',
    'wohnort': 'string/text',
    'skilllevel': 'lookup/select',
    'stance': 'lookup/radio',
    'team': 'string/text',
    'notfall_vorname': 'string/text',
    'notfall_nachname': 'string/text',
    'notfall_telefon': 'string/tel',
  },
  'anmeldungen': {
    'event': 'applookup/select',
    'teilnehmer': 'applookup/select',
    'anmeldedatum': 'date/date',
    'disziplin': 'lookup/select',
    'startnummer': 'number',
    'zahlungsstatus': 'lookup/radio',
    'anmeldestatus': 'lookup/select',
    'bemerkung': 'string/textarea',
  },
};

export const HUB_TOPOLOGY: Record<string, { field: string; entity: string }[]> = {
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | LookupValue | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | LookupValue[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateVeranstaltungsorte = StripLookup<Veranstaltungsorte['fields']>;
export type CreateEvents = StripLookup<Events['fields']>;
export type CreateTeilnehmer = StripLookup<Teilnehmer['fields']>;
export type CreateAnmeldungen = StripLookup<Anmeldungen['fields']>;