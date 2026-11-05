/**
 * useTeilnehmerAnmeldenFlow — the plumbing of the flow « Teilnehmer zu Event anmelden », generated from the plan.
 *
 * Writes `teilnehmer` (only when the person fills it): asks `vorname`, `nachname`, `email`, `telefon`, `geburtsdatum`, `wohnort`, `skilllevel`, `stance`, `team`, `notfall_vorname`, `notfall_nachname`, `notfall_telefon`.
Writes `anmeldungen`: asks `event`, `teilnehmer`, `disziplin`, `bemerkung`; sets `anmeldedatum`, `zahlungsstatus`, `anmeldestatus` itself; links `teilnehmer` ← the created `teilnehmer`.
 * The hook OWNS: the form(s) with exactly these fields and the plan's required
 * ingredients, one record search per picked field (columns and filter from
 * the plan), and the submit plan with its fixed and derived values. A page
 * that only calls `flow.submit.run()` cannot write a field the plan does not
 * know — there is no way to spell it.
 *
 * YOU decide what a person notices, through the options:
 *   steps     which wizard step asks which field (default: one step per pick,
 *             then one for the typed fields, then "Prüfen" = step 4)
 *   items     how a search hit is displayed per pick (title, subtitle, status …)
 *   initial   prefills for typed fields
 *   messages  the sentence for an empty required field, per field
 *
 *   const flow = useTeilnehmerAnmeldenFlow({
 *     steps: { event: 1, teilnehmer: 2, vorname: 3, nachname: 3, email: 3, telefon: 3, geburtsdatum: 3, wohnort: 3, skilllevel: 3, stance: 3, team: 3, notfall_vorname: 3, notfall_nachname: 3, notfall_telefon: 3, disziplin: 3, bemerkung: 3 },
 *     items: { event: r => ({ id: r.id, title: fieldText(r, 'eventname') }) },
 *   });
 *   <IntentWizardShell forms={flow.forms} draftKey={flow.draftKey} …>
 *     <EntitySelectStep {...flow.picks.event.select} {...flow.pick('event')} />
 *     <EntitySelectStep {...flow.picks.teilnehmer.select} {...flow.pick('teilnehmer')} />
 *     <Bound form={flow.forms.teilnehmer} name="vorname" />
 *     <Bound form={flow.forms.teilnehmer} name="nachname" />
 *     <Bound form={flow.forms.teilnehmer} name="email" />
 *     <Bound form={flow.forms.teilnehmer} name="telefon" />
 *     <Bound form={flow.forms.teilnehmer} name="geburtsdatum" />
 *     <Bound form={flow.forms.teilnehmer} name="wohnort" />
 *     <Bound form={flow.forms.teilnehmer} name="skilllevel" />
 *     <Bound form={flow.forms.teilnehmer} name="stance" />
 *     <Bound form={flow.forms.teilnehmer} name="team" />
 *     <Bound form={flow.forms.teilnehmer} name="notfall_vorname" />
 *     <Bound form={flow.forms.teilnehmer} name="notfall_nachname" />
 *     <Bound form={flow.forms.teilnehmer} name="notfall_telefon" />
 *     <Bound form={flow.forms.anmeldungen} name="disziplin" />
 *     <Bound form={flow.forms.anmeldungen} name="bemerkung" />
 *     <StepNav onNext={() => flow.validateStep(n)} />
 *     {!flow.submit.done && <SummaryStep forms={flow.formList} submit={flow.submit} />}
 *     {flow.submit.result && <SuccessStep result={flow.submit.result} forms={flow.formList} submit={flow.submit} />}
 *   </IntentWizardShell>
 */
import { useEffect, useRef, useState } from 'react';
import { readJourneyExtra, writeJourneyExtra } from '@/lib/journey/draft';
import { nounOne } from '@/config/plan';
import {
  useStepForm, useJourneySubmit, useRecordSearch,
  fieldText, fieldLookup, fieldLookups, fieldNumber, fieldDate, fieldRef,
  todayIso, nowIso, isEmptyValue, policyFixedValue, withPickPolicy, usePolicyVersion,  type StepForm, type JourneyRecord, type RefContext, type SelectItemLike, type FormValues, type PlanStep, type SummaryItem,} from '@/lib/journey';
import { servicePort } from '@/services/journeyPort';
import { pickHint, whereSentence, type PickWhere } from '@/lib/journey/policy';
import { labelOf, optionsOf, type EntityKey } from '@/lib/journey/rules';
import { entityLabel } from '@/lib/journey/rules';

export type TeilnehmerAnmeldenFieldKey = 'bemerkung' | 'disziplin' | 'email' | 'event' | 'geburtsdatum' | 'nachname' | 'notfall_nachname' | 'notfall_telefon' | 'notfall_vorname' | 'skilllevel' | 'stance' | 'team' | 'teilnehmer' | 'telefon' | 'vorname' | 'wohnort';

export interface TeilnehmerAnmeldenForms {
  teilnehmer: StepForm<'teilnehmer'>;
  anmeldungen: StepForm<'anmeldungen'>;
}

// Alias so the option generics stay readable.
type Key = TeilnehmerAnmeldenFieldKey;

export interface TeilnehmerAnmeldenFlowOptions {
  /** field → wizard step that asks it; drives „Ändern“ links and answer chips. */
  steps?: Partial<Record<Key, number>>;
  initial?: Partial<Record<Key, unknown>>;
  messages?: Partial<Record<Key, string>>;
  /** How a search hit reads — the card's title/subtitle/status per pick. */
  items?: {
    event?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    teilnehmer?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
  };
  /** A page-side narrowing per pick, on top of the plan's filter (J-3): the
   *  questions of the picked event, the open ones — `r => fieldRef(r, 'veranstaltung') === eventId`. */
  where?: {
    event?: (record: JourneyRecord) => boolean;
    teilnehmer?: (record: JourneyRecord) => boolean;
  };
}

const DEFAULT_STEPS: Record<string, number> = {"bemerkung": 3, "disziplin": 3, "email": 3, "event": 1, "geburtsdatum": 3, "nachname": 3, "notfall_nachname": 3, "notfall_telefon": 3, "notfall_vorname": 3, "skilllevel": 3, "stance": 3, "team": 3, "teilnehmer": 2, "telefon": 3, "vorname": 3, "wohnort": 3};
export const TEILNEHMERANMELDEN_REVIEW_STEP = 4;

function fromPick<T>(pick: { recordOf(id: string): JourneyRecord | undefined }, form: StepForm, field: string, read: (r: JourneyRecord) => T): T | undefined {
  const id = form.get(field);
  const rec = typeof id === 'string' && id ? pick.recordOf(id) : undefined;
  return rec ? read(rec) : undefined;
}
// local calendar day — the ISO-string of a Date is UTC and flips the date in the evening (J-7)
function isoDaysFromToday(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Returns T, not Partial<T>: a Record's index signature is already "maybe
// absent", and Partial<Record<string, string>> does not assign to the
// Record<string, string> useStepForm wants (tsc, live 23.09.2026 — eight
// errors, one per hook, caught only in the sandbox build).
function only<T extends Record<string, unknown>>(obj: T | undefined, keys: string[]): T | undefined {
  if (!obj) return undefined;
  const out: Record<string, unknown> = {};
  for (const k of keys) if (k in obj) out[k] = obj[k];
  return out as T;
}

function hasValues(form: StepForm): boolean {
  return form.keys.some(k => !isEmptyValue(form.values[k]));
}

export function useTeilnehmerAnmeldenFlow(options: TeilnehmerAnmeldenFlowOptions = {}) {
  const steps = { ...DEFAULT_STEPS, ...(options.steps ?? {}) } as Record<string, number>;
  const teilnehmer = useStepForm('teilnehmer', {
    fields: ["vorname", "nachname", "email", "telefon", "geburtsdatum", "wohnort", "skilllevel", "stance", "team", "notfall_vorname", "notfall_nachname", "notfall_telefon"],
    steps: only(steps, ["vorname", "nachname", "email", "telefon", "geburtsdatum", "wohnort", "skilllevel", "stance", "team", "notfall_vorname", "notfall_nachname", "notfall_telefon"]) as Record<string, number>,
    initial: only(options.initial as FormValues | undefined, ["vorname", "nachname", "email", "telefon", "geburtsdatum", "wohnort", "skilllevel", "stance", "team", "notfall_vorname", "notfall_nachname", "notfall_telefon"]),
    messages: only(options.messages as Record<string, string> | undefined, ["vorname", "nachname", "email", "telefon", "geburtsdatum", "wohnort", "skilllevel", "stance", "team", "notfall_vorname", "notfall_nachname", "notfall_telefon"]),
  });
  const anmeldungen = useStepForm('anmeldungen', {
    fields: ["event", "teilnehmer", "disziplin", "bemerkung"],
    steps: only(steps, ["event", "teilnehmer", "disziplin", "bemerkung"]) as Record<string, number>,
    initial: only(options.initial as FormValues | undefined, ["event", "teilnehmer", "disziplin", "bemerkung"]),
    messages: only(options.messages as Record<string, string> | undefined, ["event", "teilnehmer", "disziplin", "bemerkung"]),
  });
  const forms: TeilnehmerAnmeldenForms = { teilnehmer, anmeldungen };
  // the editor of a list is not a record of its own: the review and the success
  // page read the entries (PlanStep.review), never the half-filled editor
  const formList: StepForm[] = [teilnehmer, anmeldungen];
  // The owner's rules after the build (intent-policies.json): a fixed value
  // for a field this flow sets itself, a narrower or wider pick — read at
  // render time, so a change works on the running application.
  usePolicyVersion();
  const searches = {
    event: useRecordSearch(servicePort, 'events', withPickPolicy('event', {
      searchFields: ["eventname"] as never,
      filter: "r.v_eventstatus == 'anmeldung_offen'",
      where: (r: JourneyRecord) => ((fieldLookup(r, "eventstatus")?.key ?? null) === "anmeldung_offen") && (options.where?.event?.(r) ?? true),
      toItem: options.items?.event as never,
    })),
    teilnehmer: useRecordSearch(servicePort, 'teilnehmer', withPickPolicy('teilnehmer', {
      searchFields: ["vorname", "nachname"] as never,
      where: options.where?.teilnehmer,
      toItem: options.items?.teilnehmer as never,
    })),
  };
  // Whether a pick offers „Neu anlegen“ is the plan's call: off for the record
  // this flow changes, for multi picks, for a catalogue entity and for an
  // entity with its own flow. The page spreads `.select` and writes no `create=`.
  // what the person sees under the search field: the rule that narrows the
  // pick (the owner's, else the plan's) — and the link that changes it
  const hintFor = (key: string, entity: EntityKey, planned: PickWhere | null) => pickHint(key, planned,
    w => whereSentence(w, f => labelOf(entity, f), (f, v) => optionsOf(entity, f).find(o => o.key === String(v))?.label ?? String(v)),
    `#/verwaltung/anwendung?line=intent:teilnehmer-anmelden:read:${entity}`);
  // a fixed value the flow sets itself, as a review row with the link that changes it
  const setting = (entity: EntityKey, field: string, value: unknown): SummaryItem => ({
    key: `setting:${entity}.${field}`, label: labelOf(entity, field),
    value: optionsOf(entity, field).find(o => o.key === String(value))?.label ?? String(value ?? ''),
    href: `#/verwaltung/anwendung?line=intent:teilnehmer-anmelden:write:${entity}.${field}`,
  });
  const picks = {
    event: { ...searches.event, select: { ...searches.event.select, create: false as boolean, hint: hintFor('event', 'events', {"conditions": [{"field": "eventstatus", "op": "eq", "value": "anmeldung_offen"}], "mode": "all"} as PickWhere | null) } },
    teilnehmer: { ...searches.teilnehmer, select: { ...searches.teilnehmer.select, create: false as boolean, hint: hintFor('teilnehmer', 'teilnehmer', null as PickWhere | null) } },
  };

  const teilnehmerFilled = hasValues(teilnehmer);
  const plan: PlanStep[] = [
    ...(teilnehmerFilled ? [{
      key: 'teilnehmer', entity: 'teilnehmer', form: teilnehmer, label: nounOne('teilnehmer', entityLabel('teilnehmer')),    } as PlanStep] : []),
    {
      key: 'anmeldungen', entity: 'anmeldungen', form: anmeldungen, label: nounOne('anmeldungen', entityLabel('anmeldungen')), primary: true,      needs: [teilnehmerFilled ? 'teilnehmer' : null].filter((x): x is string => !!x),
      link: { ...(teilnehmerFilled ? { teilnehmer: 'teilnehmer' } : {}) },

      values: (): FormValues => ({
        anmeldedatum: policyFixedValue('anmeldungen', 'anmeldedatum') ?? todayIso(),
        zahlungsstatus: policyFixedValue('anmeldungen', 'zahlungsstatus') ?? "offen",
        anmeldestatus: policyFixedValue('anmeldungen', 'anmeldestatus') ?? "angemeldet",
      }),

      // the review shows what this step sets itself — changeable on „Deine Anwendung“, not here
      settings: () => [setting('anmeldungen', 'zahlungsstatus', policyFixedValue('anmeldungen', 'zahlungsstatus') ?? "offen"), setting('anmeldungen', 'anmeldestatus', policyFixedValue('anmeldungen', 'anmeldestatus') ?? "angemeldet")],
    },
  ];

  const submit = useJourneySubmit(servicePort, plan, { draftKey: 'teilnehmer-anmelden' });

  // A typed field the plan prefills from the picked record (`user:from_pick`),
  // still the person's to change: filled once, only while empty (PV-12)
  const prefillFrom = (pickKey: string, rec: JourneyRecord) => {
    void pickKey; void rec;
  };

  // Opened with `?<field>=<value>` for a field this flow asks — a dashboard
  // link that pre-picks the event, a form that hands the question on (J-2):
  // a typed field takes the value while it is empty (a draft wins), a pick
  // loads the record, takes it into the pick and selects it WITH its name.
  // `initial` with a bare record id gets its name the same way.
  const [linkedParams] = useState(() => new URLSearchParams(window.location.hash.split('?')[1] ?? ''));
  useEffect(() => {
    let on = true;
    const coerce = (form: StepForm, key: string, raw: string): unknown => {
      const kind = form.rules[key]?.kind;
      if (kind === 'number') { const n = Number(raw); return Number.isFinite(n) ? n : raw; }
      if (kind === 'bool') return raw === 'true' || raw === '1' || raw === 'ja';
      return raw;
    };
    { const v = linkedParams.get('vorname'); if (v !== null && isEmptyValue(teilnehmer.get('vorname'))) (teilnehmer.set as (k: string, v: unknown) => void)('vorname', coerce(teilnehmer, 'vorname', v)); }
    { const v = linkedParams.get('nachname'); if (v !== null && isEmptyValue(teilnehmer.get('nachname'))) (teilnehmer.set as (k: string, v: unknown) => void)('nachname', coerce(teilnehmer, 'nachname', v)); }
    { const v = linkedParams.get('email'); if (v !== null && isEmptyValue(teilnehmer.get('email'))) (teilnehmer.set as (k: string, v: unknown) => void)('email', coerce(teilnehmer, 'email', v)); }
    { const v = linkedParams.get('telefon'); if (v !== null && isEmptyValue(teilnehmer.get('telefon'))) (teilnehmer.set as (k: string, v: unknown) => void)('telefon', coerce(teilnehmer, 'telefon', v)); }
    { const v = linkedParams.get('geburtsdatum'); if (v !== null && isEmptyValue(teilnehmer.get('geburtsdatum'))) (teilnehmer.set as (k: string, v: unknown) => void)('geburtsdatum', coerce(teilnehmer, 'geburtsdatum', v)); }
    { const v = linkedParams.get('wohnort'); if (v !== null && isEmptyValue(teilnehmer.get('wohnort'))) (teilnehmer.set as (k: string, v: unknown) => void)('wohnort', coerce(teilnehmer, 'wohnort', v)); }
    { const v = linkedParams.get('skilllevel'); if (v !== null && isEmptyValue(teilnehmer.get('skilllevel'))) (teilnehmer.set as (k: string, v: unknown) => void)('skilllevel', coerce(teilnehmer, 'skilllevel', v)); }
    { const v = linkedParams.get('stance'); if (v !== null && isEmptyValue(teilnehmer.get('stance'))) (teilnehmer.set as (k: string, v: unknown) => void)('stance', coerce(teilnehmer, 'stance', v)); }
    { const v = linkedParams.get('team'); if (v !== null && isEmptyValue(teilnehmer.get('team'))) (teilnehmer.set as (k: string, v: unknown) => void)('team', coerce(teilnehmer, 'team', v)); }
    { const v = linkedParams.get('notfall_vorname'); if (v !== null && isEmptyValue(teilnehmer.get('notfall_vorname'))) (teilnehmer.set as (k: string, v: unknown) => void)('notfall_vorname', coerce(teilnehmer, 'notfall_vorname', v)); }
    { const v = linkedParams.get('notfall_nachname'); if (v !== null && isEmptyValue(teilnehmer.get('notfall_nachname'))) (teilnehmer.set as (k: string, v: unknown) => void)('notfall_nachname', coerce(teilnehmer, 'notfall_nachname', v)); }
    { const v = linkedParams.get('notfall_telefon'); if (v !== null && isEmptyValue(teilnehmer.get('notfall_telefon'))) (teilnehmer.set as (k: string, v: unknown) => void)('notfall_telefon', coerce(teilnehmer, 'notfall_telefon', v)); }
    { const v = linkedParams.get('disziplin'); if (v !== null && isEmptyValue(anmeldungen.get('disziplin'))) (anmeldungen.set as (k: string, v: unknown) => void)('disziplin', coerce(anmeldungen, 'disziplin', v)); }
    { const v = linkedParams.get('bemerkung'); if (v !== null && isEmptyValue(anmeldungen.get('bemerkung'))) (anmeldungen.set as (k: string, v: unknown) => void)('bemerkung', coerce(anmeldungen, 'bemerkung', v)); }
    {
      const cur = forms.anmeldungen.get('event');
      const fromLink = linkedParams.get('event');
      const unnamed = typeof cur === 'string' && cur !== '' && !forms.anmeldungen.labels[cur] ? cur : null;
      const id = fromLink && isEmptyValue(cur) ? fromLink : unnamed;
      if (id) void servicePort.get('events', id).then(rec => {
        if (!on || !rec) return;
        picks.event.adopt(rec);
        const name = picks.event.labelOf(rec.id) ?? rec.id;
        (forms.anmeldungen.set as (k: string, v: unknown, l?: string) => void)('event', rec.id, name);
        prefillFrom('event', rec);
      }).catch(() => undefined);
    }
    {
      const cur = forms.anmeldungen.get('teilnehmer');
      const fromLink = linkedParams.get('teilnehmer');
      const unnamed = typeof cur === 'string' && cur !== '' && !forms.anmeldungen.labels[cur] ? cur : null;
      const id = fromLink && isEmptyValue(cur) ? fromLink : unnamed;
      if (id) void servicePort.get('teilnehmer', id).then(rec => {
        if (!on || !rec) return;
        picks.teilnehmer.adopt(rec);
        const name = picks.teilnehmer.labelOf(rec.id) ?? rec.id;
        (forms.anmeldungen.set as (k: string, v: unknown, l?: string) => void)('teilnehmer', rec.id, name);
        prefillFrom('teilnehmer', rec);
      }).catch(() => undefined);
    }
    return () => { on = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per link
  }, []);

  /** Props for a single-record pick step: {...flow.picks.x.select} {...flow.pick('x')} */
  const pick = (field: TeilnehmerAnmeldenFieldKey) => {
    const owner = formList.find(f => f.keys.includes(field)) ?? formList[0];
    const search = (picks as Record<string, { labelOf(id: string): string | undefined; recordOf?(id: string): JourneyRecord | undefined }>)[field];
    return {
      selectedId: (typeof owner.get(field) === 'string' ? (owner.get(field) as string) : null) || null,
      // `field as never` collapsed the conditional SetArgs<E, never> to never and
      // no argument was assignable any more (tsc, live 23.09.2026); widen `set`
      // itself instead — the label stays a required third argument.
      onSelect: (id: string) => {
        (owner.set as (k: string, v: unknown, l?: string) => void)(field, id, search?.labelOf(id));
        const rec = search?.recordOf?.(id);
        if (rec) prefillFrom(field, rec);
      },
    };
  };
  /** Props for a multi-record pick step: {...flow.picks.x.select} {...flow.pickMany('x')} */
  const pickMany = (field: TeilnehmerAnmeldenFieldKey) => {
    const owner = formList.find(f => f.keys.includes(field)) ?? formList[0];
    const search = (picks as Record<string, { labelOf(id: string): string | undefined }>)[field];
    return owner.records(field, id => search?.labelOf(id));
  };
  /** Validate every field the wizard asks in step `n` — for StepNav.onNext. */
  const validateStep = (n: number): boolean =>
    formList.every(f => f.validate(f.keys.filter(k => steps[k] === n)));
  const reset = () => { submit.reset(); formList.forEach(f => f.reset()); };

  return {
    slug: 'teilnehmer-anmelden' as const,
    draftKey: 'teilnehmer-anmelden' as const,    entity: 'anmeldungen' as const,
    form: anmeldungen,
    forms, formList, picks, submit, steps,    reviewStep: TEILNEHMERANMELDEN_REVIEW_STEP,
    pick, pickMany, validateStep, reset,    // the door the hook reads through — for what it does not own: availability
    // (useOccupancy(flow.port, …)), a count (useRecordCount(flow.port, …)). A page
    // importing servicePort next to the hook fails gate 3 (fewo 05.10.2026: the
    // gate taught useOccupancy(servicePort, …) and forbade servicePort at once)
    port: servicePort,
  };
}

export type TeilnehmerAnmeldenFlow = ReturnType<typeof useTeilnehmerAnmeldenFlow>;
