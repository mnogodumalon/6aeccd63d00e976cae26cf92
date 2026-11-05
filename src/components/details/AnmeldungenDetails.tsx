import type { Anmeldungen, Events, Teilnehmer } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { usePermissions } from '@/lib/permissions';

export interface AnmeldungenDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Anmeldungen;
  /** N:1-Ziel „Events": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  eventsList: Events[];
  /** Klick auf die Events-Relation → overlay.push auf dessen Detail. */
  onOpenEvents?: (record: Events) => void;
  /** N:1-Ziel „Teilnehmer": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  teilnehmerList: Teilnehmer[];
  /** Klick auf die Teilnehmer-Relation → overlay.push auf dessen Detail. */
  onOpenTeilnehmer?: (record: Teilnehmer) => void;
}

export function AnmeldungenDetails({
  record,
  eventsList,
  onOpenEvents,
  teilnehmerList,
  onOpenTeilnehmer,
}: AnmeldungenDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  const eventTarget = eventsList.find(r => r.record_id === extractRecordId(record.fields.event));
  const teilnehmerTarget = teilnehmerList.find(r => r.record_id === extractRecordId(record.fields.teilnehmer));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('anmeldungen', 'anmeldedatum')} value={record.fields.anmeldedatum} format="date" />
        <RecordField label={fieldLabel('anmeldungen', 'disziplin')} value={record.fields.disziplin} format="pill" />
        <RecordField label={fieldLabel('anmeldungen', 'startnummer')} value={record.fields.startnummer} format="text" />
        <RecordField label={fieldLabel('anmeldungen', 'zahlungsstatus')} value={record.fields.zahlungsstatus} format="pill" />
        <RecordField label={fieldLabel('anmeldungen', 'anmeldestatus')} value={record.fields.anmeldestatus} format="pill" />
        <RecordField label={fieldLabel('anmeldungen', 'bemerkung')} value={record.fields.bemerkung} format="longtext" className="md:col-span-2" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={2}>
        <RecordRelation
          label={fieldLabel('anmeldungen', 'event')}
          name={eventTarget?.fields.eventname ?? '—'}
          meta={[eventTarget?.fields.veranstalter].filter(Boolean).join(' · ') || undefined}
          onClick={eventTarget && onOpenEvents ? () => onOpenEvents!(eventTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('anmeldungen', 'teilnehmer')}
          name={teilnehmerTarget?.fields.vorname ?? '—'}
          meta={[teilnehmerTarget?.fields.email, teilnehmerTarget?.fields.telefon].filter(Boolean).join(' · ') || undefined}
          onClick={teilnehmerTarget && onOpenTeilnehmer ? () => onOpenTeilnehmer!(teilnehmerTarget!) : undefined}
        />
      </RecordSection>

      <RecordAttachments appId={APP_IDS.ANMELDUNGEN} recordId={record.record_id} readOnly={!perms.canWrite('anmeldungen')} />
    </>
  );
}
