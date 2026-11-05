import type { EnrichedAnmeldungen, EnrichedEvents } from '@/types/enriched';
import type { Anmeldungen, Events, Teilnehmer, Veranstaltungsorte } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveDisplay(url: unknown, map: Map<string, any>, ...fields: string[]): string {
  if (!url) return '';
  const id = extractRecordId(url);
  if (!id) return '';
  const r = map.get(id);
  if (!r) return '';
  return fields.map(f => String(r.fields[f] ?? '')).join(' ').trim();
}

interface EventsMaps {
  veranstaltungsorteMap: Map<string, Veranstaltungsorte>;
}

export function enrichEvents(
  events: Events[],
  maps: EventsMaps
): EnrichedEvents[] {
  return events.map(r => ({
    ...r,
    ortName: resolveDisplay(r.fields.ort, maps.veranstaltungsorteMap, 'ortsname'),
  }));
}

interface AnmeldungenMaps {
  eventsMap: Map<string, Events>;
  teilnehmerMap: Map<string, Teilnehmer>;
}

export function enrichAnmeldungen(
  anmeldungen: Anmeldungen[],
  maps: AnmeldungenMaps
): EnrichedAnmeldungen[] {
  return anmeldungen.map(r => ({
    ...r,
    eventName: resolveDisplay(r.fields.event, maps.eventsMap, 'eventname'),
    teilnehmerName: resolveDisplay(r.fields.teilnehmer, maps.teilnehmerMap, 'vorname', 'nachname'),
  }));
}
