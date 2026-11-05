import type { Veranstaltungsorte, Events } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';
import { usePermissions } from '@/lib/permissions';

export interface VeranstaltungsorteDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Veranstaltungsorte;
  /** 1:N „Events" (ort): VOLLE Liste — der Block filtert auf diesen Record. */
  eventsList: Events[];
  /** Zeilen-Klick → overlay.push auf das Events-Detail (nie der Edit-Dialog). */
  onOpenEvents: (record: Events) => void;
  /** Kontextuelles „+": öffnet den Events-Dialog mit diesem Record vorgesetzt. */
  onAddEvents?: () => void;
}

export function VeranstaltungsorteDetails({
  record,
  eventsList,
  onOpenEvents,
  onAddEvents,
}: VeranstaltungsorteDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('veranstaltungsorte', 'ortsname')} value={record.fields.ortsname} format="text" />
        <RecordField label={fieldLabel('veranstaltungsorte', 'ortsart')} value={record.fields.ortsart} format="pill" />
        <RecordField label={fieldLabel('veranstaltungsorte', 'strasse')} value={record.fields.strasse} format="text" />
        <RecordField label={fieldLabel('veranstaltungsorte', 'hausnummer')} value={record.fields.hausnummer} format="text" />
        <RecordField label={fieldLabel('veranstaltungsorte', 'plz')} value={record.fields.plz} format="text" />
        <RecordField label={fieldLabel('veranstaltungsorte', 'stadt')} value={record.fields.stadt} format="text" />
        <RecordField label={fieldLabel('veranstaltungsorte', 'kapazitaet')} value={record.fields.kapazitaet} format="text" />
        <RecordField label={fieldLabel('veranstaltungsorte', 'kontakt_vorname')} value={record.fields.kontakt_vorname} format="text" />
        <RecordField label={fieldLabel('veranstaltungsorte', 'kontakt_nachname')} value={record.fields.kontakt_nachname} format="text" />
        <RecordField label={fieldLabel('veranstaltungsorte', 'kontakt_email')} value={record.fields.kontakt_email} format="email" />
        <RecordField label={fieldLabel('veranstaltungsorte', 'kontakt_telefon')} value={record.fields.kontakt_telefon} format="text" />
        <RecordField label={fieldLabel('veranstaltungsorte', 'ortsbeschreibung')} value={record.fields.ortsbeschreibung} format="longtext" className="md:col-span-2" />
      </RecordSection>

      <SatelliteSection
        title={appLabel('events')}
        items={eventsList.filter(r => extractRecordId(r.fields.ort) === record.record_id)}
        map={r => ({ name: r.fields.eventname ?? appLabel('events'), meta: r.fields.beginn })}
        onOpen={onOpenEvents}
        onAdd={onAddEvents}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.VERANSTALTUNGSORTE} recordId={record.record_id} readOnly={!perms.canWrite('veranstaltungsorte')} />
    </>
  );
}
