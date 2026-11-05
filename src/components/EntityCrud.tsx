/**
 * EntityCrud — pre-generated CRUD + overlay plumbing for the dashboard.
 * Compose it; NEVER re-roll dialog state, submit handlers, an overlay stack
 * or a RecordOverlayHost in the page — this file owns all of it.
 *
 * API at a glance:
 *   const data = useDashboardData();
 *   const crud = useEntityCrud(data, {
 *     // optional — the ONE semantic slot on the overlay: the record's next
 *     // workflow step. Return undefined for types without one.
 *     footer: (top) => top.type === 'veranstaltungsorte'
 *       ? { label: …, onClick: () => … }
 *       : undefined,
 *   });
 *
 *   `top.type` is the SAME camelCase key as `crud.<entity>` — one spelling
 *   per entity, everywhere in this API.
 *   …
 *   crud.veranstaltungsorte.openCreate({ …defaults })   // create dialog, prefilled — defaults are
 *                                       // shape-tolerant: bare lookup keys / record ids are fine
 *   crud.veranstaltungsorte.openEdit(record)            // edit dialog (recordId + defaults wired)
 *   crud.veranstaltungsorte.openDetail(record)          // record overlay — pass the RAW record,
 *                                       // enrichment is resolved inside
 *   crud.overlay                         // RecordOverlayStack<OverlayItem> for drills:
 *                                       // push / pop / replace / close
 *   crud.enriched.veranstaltungsorte              // the display-ready array for EVERY entity —
 *                                       // Enriched* where relations exist, the raw array
 *                                       // otherwise. Reuse these; never call enrich*()
 *                                       // in the page, and never guess which entity has
 *                                       // one: they all do.
 *   {crud.surfaces}                      // render ONCE at the end of the page JSX:
 *                                       // all entity dialogs + the overlay host
 *
 * Built in (do NOT re-implement): optimistic update + Rückgängig counter-write
 * on edit, fetchAll-on-error, edit-from-overlay, and per-entity overlay bodies
 * (RecordHeader + <{Entity}Details> with every relation reachable and the
 * contextual "+" prefilled; list-field back-references additionally get a
 * "choose existing" picker that links an EXISTING record — built in, do not
 * re-roll). Drag writes (onEventDrop/onCardMove) stay YOURS:
 * optimistic setter first, PATCH in background, undoToast with counter-write.
 *
 * Overlay content per entity (the host renders these — you never compose
 * Details blocks yourself):
 *   veranstaltungsorte: ortsname, ortsart, strasse, hausnummer, plz, stadt, kapazitaet, kontakt_vorname, …  ·  ← events (list + contextual +)
 *   events: eventname, eventart, beginn, ende, ort, max_teilnehmer, gebuehr, eventstatus, …  ·  → veranstaltungsorte · ← anmeldungen (list + contextual +)
 *   teilnehmer: vorname, nachname, email, telefon, geburtsdatum, wohnort, skilllevel, stance, …  ·  ← anmeldungen (list + contextual +)
 *   anmeldungen: event, teilnehmer, anmeldedatum, disziplin, startnummer, zahlungsstatus, anmeldestatus, bemerkung  ·  → events · → teilnehmer
 */
import { useState, useMemo, type ReactNode } from 'react';
import type { Veranstaltungsorte, Events, Teilnehmer, Anmeldungen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { LivingAppsService, createRecordUrl } from '@/services/livingAppsService';
import { enrichEvents, enrichAnmeldungen } from '@/lib/enrich';
import type { EnrichedEvents, EnrichedAnmeldungen } from '@/types/enriched';
import { useDashboardData } from '@/hooks/useDashboardData';
import {
  useRecordOverlayStack, RecordOverlayHost, RecordHeader,
  type RecordOverlayStack,
} from '@/components/widgets/RecordView';
import { VeranstaltungsorteDialog, type VeranstaltungsorteDialogDefaults } from '@/components/dialogs/VeranstaltungsorteDialog';
import { VeranstaltungsorteDetails } from '@/components/details/VeranstaltungsorteDetails';
import { EventsDialog, type EventsDialogDefaults } from '@/components/dialogs/EventsDialog';
import { EventsDetails } from '@/components/details/EventsDetails';
import { TeilnehmerDialog, type TeilnehmerDialogDefaults } from '@/components/dialogs/TeilnehmerDialog';
import { TeilnehmerDetails } from '@/components/details/TeilnehmerDetails';
import { AnmeldungenDialog, type AnmeldungenDialogDefaults } from '@/components/dialogs/AnmeldungenDialog';
import { AnmeldungenDetails } from '@/components/details/AnmeldungenDetails';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import { t, appLabel } from '@/i18n';
import { undoToast } from '@/lib/polish';
import { usePermissions } from '@/lib/permissions';
import { toast } from 'sonner';
import { formatDate } from '@/lib/formatters';

// The overlay union — one branch per entity, `record` typed the way the data
// flows: Enriched* where enrichment exists, the raw record type otherwise.
// The host resolves enrichment itself; pages pass raw records everywhere.
export type OverlayItem =
  | { type: 'veranstaltungsorte'; record: Veranstaltungsorte }
  | { type: 'events'; record: EnrichedEvents }
  | { type: 'teilnehmer'; record: Teilnehmer }
  | { type: 'anmeldungen'; record: EnrichedAnmeldungen };

/** The useDashboardData() return — pass it in, never re-fetch inside. */
export type EntityCrudData = ReturnType<typeof useDashboardData>;

export interface EntityCrudOptions {
  /** Per-type overlay footer — the record's next workflow step. */
  /** The action may return a sentence — the reason the step was NOT taken; the overlay shows it under the button. */
  footer?: (top: OverlayItem) => ReactNode | { label: ReactNode; onClick: () => void | string | Promise<void | string> } | undefined;
  placement?: 'side' | 'center';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface EntityCrudApi<TRecord, TDefaults> {
  /** Open the create dialog, optionally prefilled (shape-tolerant defaults). */
  openCreate: (defaults?: TDefaults) => void;
  /** Open the edit dialog for a record (recordId + defaults are wired). */
  openEdit: (record: TRecord) => void;
  /** Open the record overlay (raw record is fine — enrichment resolved inside). */
  openDetail: (record: TRecord) => void;
  /** May the signed-in user create/change records of this list? (the
   *  platform's rights — show a „+ Neu“ only when true; openCreate/openEdit
   *  refuse with a notice otherwise). */
  canWrite: boolean;
}

export interface EntityCrud {
  /** The overlay stack for drills: push / pop / replace / close. */
  overlay: RecordOverlayStack<OverlayItem>;
  /** Render ONCE at the end of the page JSX — all dialogs + the overlay host. */
  surfaces: ReactNode;
  veranstaltungsorte: EntityCrudApi<Veranstaltungsorte, VeranstaltungsorteDialogDefaults>;
  events: EntityCrudApi<Events, EventsDialogDefaults>;
  teilnehmer: EntityCrudApi<Teilnehmer, TeilnehmerDialogDefaults>;
  anmeldungen: EntityCrudApi<Anmeldungen, AnmeldungenDialogDefaults>;
  /** The display-ready array per entity: Enriched* where an enrich function
   *  exists, the raw array otherwise. One key per entity so no page has to
   *  know which is which. Reuse these; never re-enrich in the page. */
  enriched: { veranstaltungsorte: Veranstaltungsorte[]; events: EnrichedEvents[]; teilnehmer: Teilnehmer[]; anmeldungen: EnrichedAnmeldungen[] };
}

export function useEntityCrud(data: EntityCrudData, options?: EntityCrudOptions): EntityCrud {
  const overlay = useRecordOverlayStack<OverlayItem>();
  // the platform's rights of the signed-in user (lib/permissions.ts) — unknown = allowed
  const perms = usePermissions();
  const refuse = () => { toast.error(t('perm_denied_title'), { description: t('perm_denied_desc') }); };
  const [veranstaltungsorteDialog, setVeranstaltungsorteDialog] = useState<{ defaults?: VeranstaltungsorteDialogDefaults; editing?: Veranstaltungsorte } | null>(null);
  const [eventsDialog, setEventsDialog] = useState<{ defaults?: EventsDialogDefaults; editing?: Events } | null>(null);
  const [teilnehmerDialog, setTeilnehmerDialog] = useState<{ defaults?: TeilnehmerDialogDefaults; editing?: Teilnehmer } | null>(null);
  const [anmeldungenDialog, setAnmeldungenDialog] = useState<{ defaults?: AnmeldungenDialogDefaults; editing?: Anmeldungen } | null>(null);
  const enrichedEvents = useMemo(() => enrichEvents(data.events, { veranstaltungsorteMap: data.veranstaltungsorteMap }), [data.events, data.veranstaltungsorteMap]);
  const enrichedAnmeldungen = useMemo(() => enrichAnmeldungen(data.anmeldungen, { eventsMap: data.eventsMap, teilnehmerMap: data.teilnehmerMap }), [data.anmeldungen, data.eventsMap, data.teilnehmerMap]);

  function detailVeranstaltungsorte(record: Veranstaltungsorte, push = false) {
    const item: OverlayItem = { type: 'veranstaltungsorte', record };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitVeranstaltungsorte(fields: Veranstaltungsorte['fields']) {
    const editing = veranstaltungsorteDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setVeranstaltungsorte(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateVeranstaltungsorteEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('veranstaltungsorte')} — ${t('crud_updated')}`, async () => {
        data.setVeranstaltungsorte(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateVeranstaltungsorteEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createVeranstaltungsorteEntry(fields);
      undoToast(`${appLabel('veranstaltungsorte')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailEvents(record: Events, push = false) {
    const rec = enrichedEvents.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'events', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitEvents(fields: Events['fields']) {
    const editing = eventsDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setEvents(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateEvent(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('events')} — ${t('crud_updated')}`, async () => {
        data.setEvents(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateEvent(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createEvent(fields);
      undoToast(`${appLabel('events')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailTeilnehmer(record: Teilnehmer, push = false) {
    const item: OverlayItem = { type: 'teilnehmer', record };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitTeilnehmer(fields: Teilnehmer['fields']) {
    const editing = teilnehmerDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setTeilnehmer(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateTeilnehmerEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('teilnehmer')} — ${t('crud_updated')}`, async () => {
        data.setTeilnehmer(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateTeilnehmerEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createTeilnehmerEntry(fields);
      undoToast(`${appLabel('teilnehmer')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailAnmeldungen(record: Anmeldungen, push = false) {
    const rec = enrichedAnmeldungen.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'anmeldungen', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitAnmeldungen(fields: Anmeldungen['fields']) {
    const editing = anmeldungenDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setAnmeldungen(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateAnmeldungenEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('anmeldungen')} — ${t('crud_updated')}`, async () => {
        data.setAnmeldungen(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateAnmeldungenEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createAnmeldungenEntry(fields);
      undoToast(`${appLabel('anmeldungen')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  const surfaces = (
    <>
      <VeranstaltungsorteDialog
        open={veranstaltungsorteDialog !== null}
        onClose={() => setVeranstaltungsorteDialog(null)}
        onSubmit={submitVeranstaltungsorte}
        defaultValues={veranstaltungsorteDialog?.defaults}
        recordId={veranstaltungsorteDialog?.editing?.record_id}
        enablePhotoScan={AI_PHOTO_SCAN['Veranstaltungsorte']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Veranstaltungsorte']}
      />
      <EventsDialog
        open={eventsDialog !== null}
        onClose={() => setEventsDialog(null)}
        onSubmit={submitEvents}
        defaultValues={eventsDialog?.defaults}
        recordId={eventsDialog?.editing?.record_id}
        veranstaltungsorteList={data.veranstaltungsorte}
        enablePhotoScan={AI_PHOTO_SCAN['Events']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Events']}
      />
      <TeilnehmerDialog
        open={teilnehmerDialog !== null}
        onClose={() => setTeilnehmerDialog(null)}
        onSubmit={submitTeilnehmer}
        defaultValues={teilnehmerDialog?.defaults}
        recordId={teilnehmerDialog?.editing?.record_id}
        enablePhotoScan={AI_PHOTO_SCAN['Teilnehmer']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Teilnehmer']}
      />
      <AnmeldungenDialog
        open={anmeldungenDialog !== null}
        onClose={() => setAnmeldungenDialog(null)}
        onSubmit={submitAnmeldungen}
        defaultValues={anmeldungenDialog?.defaults}
        recordId={anmeldungenDialog?.editing?.record_id}
        eventsList={data.events}
        teilnehmerList={data.teilnehmer}
        enablePhotoScan={AI_PHOTO_SCAN['Anmeldungen']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Anmeldungen']}
      />
      <RecordOverlayHost
        overlay={overlay}
        placement={options?.placement}
        size={options?.size}
        footer={options?.footer}
        render={(top) => {
          if (top.type === 'veranstaltungsorte') {
            return (
              <>
                <RecordHeader title={top.record.fields.ortsname ?? appLabel('veranstaltungsorte')} subtitle={undefined} />
                <VeranstaltungsorteDetails
                  record={top.record}
                  eventsList={data.events}
                  onOpenEvents={(r) => detailEvents(r, true)}
                  onAddEvents={perms.canWrite('events') ? () => setEventsDialog({ defaults: { ort: createRecordUrl(APP_IDS.VERANSTALTUNGSORTE, top.record.record_id) } }) : undefined}
                />
              </>
            );
          }
          if (top.type === 'events') {
            return (
              <>
                <RecordHeader title={top.record.fields.eventname ?? appLabel('events')} subtitle={top.record.fields.beginn ? formatDate(top.record.fields.beginn) : undefined} />
                <EventsDetails
                  record={top.record}
                  veranstaltungsorteList={data.veranstaltungsorte}
                  onOpenVeranstaltungsorte={(r) => detailVeranstaltungsorte(r, true)}
                  anmeldungenList={data.anmeldungen}
                  onOpenAnmeldungen={(r) => detailAnmeldungen(r, true)}
                  onAddAnmeldungen={perms.canWrite('anmeldungen') ? () => setAnmeldungenDialog({ defaults: { event: createRecordUrl(APP_IDS.EVENTS, top.record.record_id) } }) : undefined}
                />
              </>
            );
          }
          if (top.type === 'teilnehmer') {
            return (
              <>
                <RecordHeader title={top.record.fields.vorname ?? appLabel('teilnehmer')} subtitle={top.record.fields.geburtsdatum ? formatDate(top.record.fields.geburtsdatum) : undefined} />
                <TeilnehmerDetails
                  record={top.record}
                  anmeldungenList={data.anmeldungen}
                  onOpenAnmeldungen={(r) => detailAnmeldungen(r, true)}
                  onAddAnmeldungen={perms.canWrite('anmeldungen') ? () => setAnmeldungenDialog({ defaults: { teilnehmer: createRecordUrl(APP_IDS.TEILNEHMER, top.record.record_id) } }) : undefined}
                />
              </>
            );
          }
          if (top.type === 'anmeldungen') {
            return (
              <>
                <RecordHeader title={appLabel('anmeldungen')} subtitle={top.record.fields.anmeldedatum ? formatDate(top.record.fields.anmeldedatum) : undefined} />
                <AnmeldungenDetails
                  record={top.record}
                  eventsList={data.events}
                  onOpenEvents={(r) => detailEvents(r, true)}
                  teilnehmerList={data.teilnehmer}
                  onOpenTeilnehmer={(r) => detailTeilnehmer(r, true)}
                />
              </>
            );
          }
          return null;
        }}
        canEdit={(top) => {
          if (top.type === 'veranstaltungsorte') return perms.canWrite('veranstaltungsorte');
          if (top.type === 'events') return perms.canWrite('events');
          if (top.type === 'teilnehmer') return perms.canWrite('teilnehmer');
          if (top.type === 'anmeldungen') return perms.canWrite('anmeldungen');
          return true;
        }}
        onEdit={(top) => {
          overlay.close();
          if (top.type === 'veranstaltungsorte') setVeranstaltungsorteDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'events') setEventsDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'teilnehmer') setTeilnehmerDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'anmeldungen') setAnmeldungenDialog({ editing: top.record, defaults: top.record.fields });
        }}
      />
    </>
  );

  return {
    overlay,
    surfaces,
    veranstaltungsorte: {
      openCreate: (defaults?: VeranstaltungsorteDialogDefaults) => (perms.canWrite('veranstaltungsorte') ? setVeranstaltungsorteDialog({ defaults }) : refuse()),
      openEdit: (record: Veranstaltungsorte) => (perms.canWrite('veranstaltungsorte') ? setVeranstaltungsorteDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Veranstaltungsorte) => detailVeranstaltungsorte(record, false),
      canWrite: perms.canWrite('veranstaltungsorte'),
    },
    events: {
      openCreate: (defaults?: EventsDialogDefaults) => (perms.canWrite('events') ? setEventsDialog({ defaults }) : refuse()),
      openEdit: (record: Events) => (perms.canWrite('events') ? setEventsDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Events) => detailEvents(record, false),
      canWrite: perms.canWrite('events'),
    },
    teilnehmer: {
      openCreate: (defaults?: TeilnehmerDialogDefaults) => (perms.canWrite('teilnehmer') ? setTeilnehmerDialog({ defaults }) : refuse()),
      openEdit: (record: Teilnehmer) => (perms.canWrite('teilnehmer') ? setTeilnehmerDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Teilnehmer) => detailTeilnehmer(record, false),
      canWrite: perms.canWrite('teilnehmer'),
    },
    anmeldungen: {
      openCreate: (defaults?: AnmeldungenDialogDefaults) => (perms.canWrite('anmeldungen') ? setAnmeldungenDialog({ defaults }) : refuse()),
      openEdit: (record: Anmeldungen) => (perms.canWrite('anmeldungen') ? setAnmeldungenDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Anmeldungen) => detailAnmeldungen(record, false),
      canWrite: perms.canWrite('anmeldungen'),
    },
    enriched: { veranstaltungsorte: data.veranstaltungsorte, events: enrichedEvents, teilnehmer: data.teilnehmer, anmeldungen: enrichedAnmeldungen },
  };
}
