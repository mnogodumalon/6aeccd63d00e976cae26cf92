/**
 * useEventAnlegenFlow — the plumbing of the flow « Event anlegen », generated from the plan.
 *
 * Writes `events`: asks `eventname`, `eventart`, `beginn`, `ende`, `ort`, `max_teilnehmer`, `gebuehr`, `veranstalter`, `eventbeschreibung`; sets `eventstatus` itself.
 * The hook OWNS: the form(s) with exactly these fields and the plan's required
 * ingredients, one record search per picked field (columns and filter from
 * the plan), and the submit plan with its fixed and derived values. A page
 * that only calls `flow.submit.run()` cannot write a field the plan does not
 * know — there is no way to spell it.
 *
 * YOU decide what a person notices, through the options:
 *   steps     which wizard step asks which field (default: one step per pick,
 *             then one for the typed fields, then "Prüfen" = step 3)
 *   items     how a search hit is displayed per pick (title, subtitle, status …)
 *   initial   prefills for typed fields
 *   messages  the sentence for an empty required field, per field
 *
 *   const flow = useEventAnlegenFlow({
 *     steps: { ort: 1, eventname: 2, eventart: 2, beginn: 2, ende: 2, max_teilnehmer: 2, gebuehr: 2, veranstalter: 2, eventbeschreibung: 2 },
 *     items: { ort: r => ({ id: r.id, title: fieldText(r, 'ortsname') }) },
 *   });
 *   <IntentWizardShell forms={flow.forms} draftKey={flow.draftKey} …>
 *     <EntitySelectStep {...flow.picks.ort.select} {...flow.pick('ort')} />
 *     <Bound form={flow.forms.events} name="eventname" />
 *     <Bound form={flow.forms.events} name="eventart" />
 *     <Bound form={flow.forms.events} name="beginn" />
 *     <Bound form={flow.forms.events} name="ende" />
 *     <Bound form={flow.forms.events} name="max_teilnehmer" />
 *     <Bound form={flow.forms.events} name="gebuehr" />
 *     <Bound form={flow.forms.events} name="veranstalter" />
 *     <Bound form={flow.forms.events} name="eventbeschreibung" />
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

export type EventAnlegenFieldKey = 'beginn' | 'ende' | 'eventart' | 'eventbeschreibung' | 'eventname' | 'gebuehr' | 'max_teilnehmer' | 'ort' | 'veranstalter';

export interface EventAnlegenForms {
  events: StepForm<'events'>;
}

// Alias so the option generics stay readable.
type Key = EventAnlegenFieldKey;

export interface EventAnlegenFlowOptions {
  /** field → wizard step that asks it; drives „Ändern“ links and answer chips. */
  steps?: Partial<Record<Key, number>>;
  initial?: Partial<Record<Key, unknown>>;
  messages?: Partial<Record<Key, string>>;
  /** How a search hit reads — the card's title/subtitle/status per pick. */
  items?: {
    ort?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
  };
  /** A page-side narrowing per pick, on top of the plan's filter (J-3): the
   *  questions of the picked event, the open ones — `r => fieldRef(r, 'veranstaltung') === eventId`. */
  where?: {
    ort?: (record: JourneyRecord) => boolean;
  };
}

const DEFAULT_STEPS: Record<string, number> = {"beginn": 2, "ende": 2, "eventart": 2, "eventbeschreibung": 2, "eventname": 2, "gebuehr": 2, "max_teilnehmer": 2, "ort": 1, "veranstalter": 2};
export const EVENTANLEGEN_REVIEW_STEP = 3;

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

export function useEventAnlegenFlow(options: EventAnlegenFlowOptions = {}) {
  const steps = { ...DEFAULT_STEPS, ...(options.steps ?? {}) } as Record<string, number>;
  const events = useStepForm('events', {
    fields: ["eventname", "eventart", "beginn", "ende", "ort", "max_teilnehmer", "gebuehr", "veranstalter", "eventbeschreibung"],
    steps: only(steps, ["eventname", "eventart", "beginn", "ende", "ort", "max_teilnehmer", "gebuehr", "veranstalter", "eventbeschreibung"]) as Record<string, number>,
    initial: only(options.initial as FormValues | undefined, ["eventname", "eventart", "beginn", "ende", "ort", "max_teilnehmer", "gebuehr", "veranstalter", "eventbeschreibung"]),
    messages: only(options.messages as Record<string, string> | undefined, ["eventname", "eventart", "beginn", "ende", "ort", "max_teilnehmer", "gebuehr", "veranstalter", "eventbeschreibung"]),
  });
  const forms: EventAnlegenForms = { events };
  // the editor of a list is not a record of its own: the review and the success
  // page read the entries (PlanStep.review), never the half-filled editor
  const formList: StepForm[] = [events];
  // The owner's rules after the build (intent-policies.json): a fixed value
  // for a field this flow sets itself, a narrower or wider pick — read at
  // render time, so a change works on the running application.
  usePolicyVersion();
  const searches = {
    ort: useRecordSearch(servicePort, 'veranstaltungsorte', withPickPolicy('ort', {
      searchFields: ["ortsname"] as never,
      where: options.where?.ort,
      toItem: options.items?.ort as never,
    })),
  };
  // Whether a pick offers „Neu anlegen“ is the plan's call: off for the record
  // this flow changes, for multi picks, for a catalogue entity and for an
  // entity with its own flow. The page spreads `.select` and writes no `create=`.
  // what the person sees under the search field: the rule that narrows the
  // pick (the owner's, else the plan's) — and the link that changes it
  const hintFor = (key: string, entity: EntityKey, planned: PickWhere | null) => pickHint(key, planned,
    w => whereSentence(w, f => labelOf(entity, f), (f, v) => optionsOf(entity, f).find(o => o.key === String(v))?.label ?? String(v)),
    `#/verwaltung/anwendung?line=intent:event-anlegen:read:${entity}`);
  // a fixed value the flow sets itself, as a review row with the link that changes it
  const setting = (entity: EntityKey, field: string, value: unknown): SummaryItem => ({
    key: `setting:${entity}.${field}`, label: labelOf(entity, field),
    value: optionsOf(entity, field).find(o => o.key === String(value))?.label ?? String(value ?? ''),
    href: `#/verwaltung/anwendung?line=intent:event-anlegen:write:${entity}.${field}`,
  });
  const picks = {
    ort: { ...searches.ort, select: { ...searches.ort.select, create: false as boolean, hint: hintFor('ort', 'veranstaltungsorte', null as PickWhere | null) } },
  };

  const plan: PlanStep[] = [
    {
      key: 'events', entity: 'events', form: events, label: nounOne('events', entityLabel('events')), primary: true,
      values: (): FormValues => ({
        eventstatus: policyFixedValue('events', 'eventstatus') ?? "geplant",
      }),

      // the review shows what this step sets itself — changeable on „Deine Anwendung“, not here
      settings: () => [setting('events', 'eventstatus', policyFixedValue('events', 'eventstatus') ?? "geplant")],
    },
  ];

  const submit = useJourneySubmit(servicePort, plan, { draftKey: 'event-anlegen' });

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
    { const v = linkedParams.get('eventname'); if (v !== null && isEmptyValue(events.get('eventname'))) (events.set as (k: string, v: unknown) => void)('eventname', coerce(events, 'eventname', v)); }
    { const v = linkedParams.get('eventart'); if (v !== null && isEmptyValue(events.get('eventart'))) (events.set as (k: string, v: unknown) => void)('eventart', coerce(events, 'eventart', v)); }
    { const v = linkedParams.get('beginn'); if (v !== null && isEmptyValue(events.get('beginn'))) (events.set as (k: string, v: unknown) => void)('beginn', coerce(events, 'beginn', v)); }
    { const v = linkedParams.get('ende'); if (v !== null && isEmptyValue(events.get('ende'))) (events.set as (k: string, v: unknown) => void)('ende', coerce(events, 'ende', v)); }
    { const v = linkedParams.get('max_teilnehmer'); if (v !== null && isEmptyValue(events.get('max_teilnehmer'))) (events.set as (k: string, v: unknown) => void)('max_teilnehmer', coerce(events, 'max_teilnehmer', v)); }
    { const v = linkedParams.get('gebuehr'); if (v !== null && isEmptyValue(events.get('gebuehr'))) (events.set as (k: string, v: unknown) => void)('gebuehr', coerce(events, 'gebuehr', v)); }
    { const v = linkedParams.get('veranstalter'); if (v !== null && isEmptyValue(events.get('veranstalter'))) (events.set as (k: string, v: unknown) => void)('veranstalter', coerce(events, 'veranstalter', v)); }
    { const v = linkedParams.get('eventbeschreibung'); if (v !== null && isEmptyValue(events.get('eventbeschreibung'))) (events.set as (k: string, v: unknown) => void)('eventbeschreibung', coerce(events, 'eventbeschreibung', v)); }
    {
      const cur = forms.events.get('ort');
      const fromLink = linkedParams.get('ort');
      const unnamed = typeof cur === 'string' && cur !== '' && !forms.events.labels[cur] ? cur : null;
      const id = fromLink && isEmptyValue(cur) ? fromLink : unnamed;
      if (id) void servicePort.get('veranstaltungsorte', id).then(rec => {
        if (!on || !rec) return;
        picks.ort.adopt(rec);
        const name = picks.ort.labelOf(rec.id) ?? rec.id;
        (forms.events.set as (k: string, v: unknown, l?: string) => void)('ort', rec.id, name);
        prefillFrom('ort', rec);
      }).catch(() => undefined);
    }
    return () => { on = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per link
  }, []);

  /** Props for a single-record pick step: {...flow.picks.x.select} {...flow.pick('x')} */
  const pick = (field: EventAnlegenFieldKey) => {
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
  const pickMany = (field: EventAnlegenFieldKey) => {
    const owner = formList.find(f => f.keys.includes(field)) ?? formList[0];
    const search = (picks as Record<string, { labelOf(id: string): string | undefined }>)[field];
    return owner.records(field, id => search?.labelOf(id));
  };
  /** Validate every field the wizard asks in step `n` — for StepNav.onNext. */
  const validateStep = (n: number): boolean =>
    formList.every(f => f.validate(f.keys.filter(k => steps[k] === n)));
  const reset = () => { submit.reset(); formList.forEach(f => f.reset()); };

  return {
    slug: 'event-anlegen' as const,
    draftKey: 'event-anlegen' as const,    entity: 'events' as const,
    form: events,
    forms, formList, picks, submit, steps,    reviewStep: EVENTANLEGEN_REVIEW_STEP,
    pick, pickMany, validateStep, reset,    // the door the hook reads through — for what it does not own: availability
    // (useOccupancy(flow.port, …)), a count (useRecordCount(flow.port, …)). A page
    // importing servicePort next to the hook fails gate 3 (fewo 05.10.2026: the
    // gate taught useOccupancy(servicePort, …) and forbade servicePort at once)
    port: servicePort,
  };
}

export type EventAnlegenFlow = ReturnType<typeof useEventAnlegenFlow>;
