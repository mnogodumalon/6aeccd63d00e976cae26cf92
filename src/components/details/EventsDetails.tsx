import type { Events, Veranstaltungsorte, Anmeldungen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';
import { usePermissions } from '@/lib/permissions';

export interface EventsDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Events;
  /** N:1-Ziel „Veranstaltungsorte": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  veranstaltungsorteList: Veranstaltungsorte[];
  /** Klick auf die Veranstaltungsorte-Relation → overlay.push auf dessen Detail. */
  onOpenVeranstaltungsorte?: (record: Veranstaltungsorte) => void;
  /** 1:N „Anmeldungen" (event): VOLLE Liste — der Block filtert auf diesen Record. */
  anmeldungenList: Anmeldungen[];
  /** Zeilen-Klick → overlay.push auf das Anmeldungen-Detail (nie der Edit-Dialog). */
  onOpenAnmeldungen: (record: Anmeldungen) => void;
  /** Kontextuelles „+": öffnet den Anmeldungen-Dialog mit diesem Record vorgesetzt. */
  onAddAnmeldungen?: () => void;
}

export function EventsDetails({
  record,
  veranstaltungsorteList,
  onOpenVeranstaltungsorte,
  anmeldungenList,
  onOpenAnmeldungen,
  onAddAnmeldungen,
}: EventsDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  const ortTarget = veranstaltungsorteList.find(r => r.record_id === extractRecordId(record.fields.ort));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('events', 'eventname')} value={record.fields.eventname} format="text" />
        <RecordField label={fieldLabel('events', 'eventart')} value={record.fields.eventart} format="pill" />
        <RecordField label={fieldLabel('events', 'beginn')} value={record.fields.beginn} format="datetime" />
        <RecordField label={fieldLabel('events', 'ende')} value={record.fields.ende} format="datetime" />
        <RecordField label={fieldLabel('events', 'max_teilnehmer')} value={record.fields.max_teilnehmer} format="text" />
        <RecordField label={fieldLabel('events', 'gebuehr')} value={record.fields.gebuehr} format="text" />
        <RecordField label={fieldLabel('events', 'eventstatus')} value={record.fields.eventstatus} format="pill" />
        <RecordField label={fieldLabel('events', 'veranstalter')} value={record.fields.veranstalter} format="text" />
        <RecordField label={fieldLabel('events', 'eventbeschreibung')} value={record.fields.eventbeschreibung} format="longtext" className="md:col-span-2" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={1}>
        <RecordRelation
          label={fieldLabel('events', 'ort')}
          name={ortTarget?.fields.ortsname ?? '—'}
          meta={[ortTarget?.fields.kontakt_email, ortTarget?.fields.kontakt_telefon].filter(Boolean).join(' · ') || undefined}
          onClick={ortTarget && onOpenVeranstaltungsorte ? () => onOpenVeranstaltungsorte!(ortTarget!) : undefined}
        />
      </RecordSection>

      <SatelliteSection
        title={appLabel('anmeldungen')}
        items={anmeldungenList.filter(r => extractRecordId(r.fields.event) === record.record_id)}
        map={r => ({ name: appLabel('anmeldungen'), meta: r.fields.anmeldedatum })}
        onOpen={onOpenAnmeldungen}
        onAdd={onAddAnmeldungen}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.EVENTS} recordId={record.record_id} readOnly={!perms.canWrite('events')} />
    </>
  );
}
