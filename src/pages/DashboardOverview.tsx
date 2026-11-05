import { useMemo, useState } from 'react';
import { format, parseISO, isValid, differenceInCalendarDays } from 'date-fns';
import { IconPlus, IconCalendarEvent, IconClockHour4, IconCash, IconUsers } from '@tabler/icons-react';
import type { DashboardData } from '@/hooks/useDashboardData';
import { useEntityCrud } from '@/components/EntityCrud';
import { flowActionFor, countOf } from '@/config/plan';
import { lookupKey, formatDate, formatCurrency } from '@/lib/formatters';
import { extractRecordId } from '@/services/livingAppsService';
import { tx, appLabel, dateFnsLocale } from '@/i18n';
import { useClock, gruss, namen } from '@/lib/polish';
import { DashboardGrid } from '@/components/DashboardGrid';
import { StatStrip, StatStripItem } from '@/components/StatCard';
import { WorkList, type WorkListItem } from '@/components/WorkList';
import { Button } from '@/components/ui/button';
import { CalendarWidget, type CalendarEvent, type CalendarTone } from '@/components/widgets/CalendarWidget';

type ListFocus = 'offen' | 'unbezahlt' | 'warteliste';

export default function DashboardOverview({ data }: { data: DashboardData }) {
  const clock = useClock();
  const [focus, setFocus] = useState<ListFocus>('offen');

  const crud = useEntityCrud(data, {
    footer: (top) => {
      if (top.type !== 'anmeldungen') return undefined;
      const status = lookupKey(top.record.fields.anmeldestatus);
      const pay = lookupKey(top.record.fields.zahlungsstatus);
      if (status === 'angemeldet' || status === 'warteliste') {
        const go = flowActionFor('anmeldungen', 'anmeldestatus', top.record.record_id, 'bestaetigt');
        if (go) return { label: tx('Anmeldung bestätigen'), onClick: go };
      }
      if (pay === 'offen' && status !== 'storniert') {
        const go = flowActionFor('anmeldungen', 'zahlungsstatus', top.record.record_id, 'bezahlt');
        if (go) return { label: tx('Zahlung erfassen'), onClick: go };
      }
      return undefined;
    },
  });
  const enrichedEvents = crud.enriched.events;
  const enrichedAnmeldungen = crud.enriched.anmeldungen;
  const { events } = data;

  const todayKey = format(clock, 'yyyy-MM-dd');

  const upcoming = useMemo(
    () => events
      .filter(e => e.fields.beginn && e.fields.beginn.slice(0, 10) >= todayKey
        && !['abgesagt', 'abgeschlossen'].includes(lookupKey(e.fields.eventstatus) ?? ''))
      .sort((a, b) => (a.fields.beginn ?? '').localeCompare(b.fields.beginn ?? '')),
    [events, todayKey],
  );

  const active = useMemo(
    () => enrichedAnmeldungen.filter(a => lookupKey(a.fields.anmeldestatus) !== 'storniert'),
    [enrichedAnmeldungen],
  );
  const offen = active.filter(a => lookupKey(a.fields.anmeldestatus) === 'angemeldet');
  const warteliste = active.filter(a => lookupKey(a.fields.anmeldestatus) === 'warteliste');
  const unbezahlt = active.filter(a => lookupKey(a.fields.zahlungsstatus) === 'offen');

  const eventById = useMemo(() => new Map(events.map(e => [e.record_id, e])), [events]);
  const unbezahltSumme = unbezahlt.reduce(
    (s, a) => s + (eventById.get(extractRecordId(a.fields.event) ?? '')?.fields.gebuehr ?? 0), 0);

  const calendarEvents = useMemo<CalendarEvent[]>(
    () => enrichedEvents
      .filter(e => !!e.fields.beginn)
      .map(e => {
        const st = lookupKey(e.fields.eventstatus);
        const tone: CalendarTone = st === 'abgesagt' ? 'destructive'
          : st === 'ausgebucht' ? 'warning'
          : st === 'anmeldung_offen' ? 'primary'
          : 'default';
        return {
          id: `events:${e.record_id}`,
          start: e.fields.beginn!,
          end: e.fields.ende,
          title: e.fields.eventname ?? '—',
          subtitle: e.ortName || undefined,
          tone,
        };
      }),
    [enrichedEvents],
  );

  const rawById = (id: string) => data.anmeldungen.find(a => a.record_id === id);

  const rowOf = (a: (typeof enrichedAnmeldungen)[number], kind: ListFocus): WorkListItem => {
    const advance = kind === 'unbezahlt'
      ? flowActionFor('anmeldungen', 'zahlungsstatus', a.record_id, 'bezahlt')
      : flowActionFor('anmeldungen', 'anmeldestatus', a.record_id, 'bestaetigt');
    const label = kind === 'unbezahlt' ? tx('✓ Bezahlt') : tx('✓ Bestätigen');
    const fee = eventById.get(extractRecordId(a.fields.event) ?? '')?.fields.gebuehr;
    return {
      id: a.record_id,
      title: a.teilnehmerName || '—',
      secondLine: (
        <>
          <span className={kind === 'warteliste' ? 'font-medium text-amber-600' : 'font-medium text-primary'}>
            {kind === 'unbezahlt' ? tx('Zahlung offen') : kind === 'warteliste' ? tx('Warteliste') : tx('Angemeldet')}
          </span>
          <span className="text-muted-foreground"> · {a.eventName}{kind === 'unbezahlt' && fee ? ` · ${formatCurrency(fee)}` : ''}</span>
        </>
      ),
      action: advance ? { label, onClick: advance } : undefined,
    };
  };

  const focusList = focus === 'offen' ? offen : focus === 'unbezahlt' ? unbezahlt : warteliste;
  const focusTitle = focus === 'offen' ? tx('Offene Anmeldungen')
    : focus === 'unbezahlt' ? tx('Unbezahlte Anmeldungen')
    : tx('Warteliste');

  const occupancy = (eventId: string) =>
    active.filter(a => extractRecordId(a.fields.event) === eventId && lookupKey(a.fields.anmeldestatus) !== 'warteliste').length;

  const eventRows: WorkListItem[] = upcoming.slice(0, 8).map(e => {
    const n = occupancy(e.record_id);
    const max = e.fields.max_teilnehmer;
    const full = max != null && n >= max;
    return {
      id: e.record_id,
      title: e.fields.eventname ?? '—',
      secondLine: (
        <>
          <span className={full ? 'font-medium text-destructive' : 'font-medium'}>
            {max != null ? `${n} / ${max}` : `${n}`}
          </span>
          <span className="text-muted-foreground"> · {formatDate(e.fields.beginn)}</span>
        </>
      ),
    };
  });

  const next = upcoming[0];
  const nextDays = next?.fields.beginn ? differenceInCalendarDays(parseISO(next.fields.beginn), clock) : null;
  const context = next
    ? offen.length > 0
      ? tx`Als Nächstes: ${next.fields.eventname ?? ''} am ${formatDate(next.fields.beginn)} — ${namen(offen.map(a => a.teilnehmerName))} warten auf Bestätigung.`
      : tx`Als Nächstes: ${next.fields.eventname ?? ''} am ${formatDate(next.fields.beginn)} — alle Anmeldungen sind bearbeitet.`
    : tx`Aktuell ist kein Event geplant — lege das nächste an.`;

  const openEvent = (id: string) => {
    const rec = events.find(e => e.record_id === id);
    if (rec) crud.events.openDetail(rec);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{gruss(clock)}</h1>
          <p className="text-sm text-muted-foreground">{context}</p>
          {nextDays !== null && nextDays >= 0 && nextDays <= 14 && (
            <p className="text-xs text-muted-foreground mt-1">
              {nextDays === 0 ? tx('Das nächste Event ist heute.') : tx`Das nächste Event startet in ${nextDays} Tagen.`}
            </p>
          )}
        </div>
        {crud.events.canWrite && (
          <Button onClick={() => crud.events.openCreate({ eventstatus: 'geplant' })}>
            <IconPlus size={16} className="shrink-0" />
            <span>{tx('Neues Event')}</span>
          </Button>
        )}
      </div>

      <DashboardGrid
        variant="split"
        kpis={
          <StatStrip>
            <StatStripItem
              title={tx('Offene Anmeldungen')}
              value={offen.length}
              icon={<IconClockHour4 size={18} className="text-muted-foreground" />}
              tone={offen.length > 0 ? 'primary' : 'default'}
              onClick={() => setFocus('offen')}
              active={focus === 'offen'}
            />
            <StatStripItem
              title={tx('Unbezahlt')}
              value={unbezahlt.length > 0 ? formatCurrency(unbezahltSumme) : tx('Alles bezahlt')}
              icon={<IconCash size={18} className="text-muted-foreground" />}
              tone={unbezahlt.length > 0 ? 'warning' : 'default'}
              onClick={() => setFocus('unbezahlt')}
              active={focus === 'unbezahlt'}
            />
            <StatStripItem
              title={tx('Warteliste')}
              value={warteliste.length}
              icon={<IconUsers size={18} className="text-muted-foreground" />}
              onClick={() => setFocus('warteliste')}
              active={focus === 'warteliste'}
            />
          </StatStrip>
        }
        aside={
          <>
            <WorkList
              title={focusTitle}
              icon={<IconClockHour4 size={16} />}
              items={focusList.map(a => rowOf(a, focus))}
              onItemClick={id => { const r = rawById(id); if (r) crud.anmeldungen.openDetail(r); }}
              empty={{
                text: focus === 'offen' ? tx('Alle Anmeldungen sind bearbeitet.')
                  : focus === 'unbezahlt' ? tx('Alle Gebühren sind beglichen.')
                  : tx('Niemand wartet auf einen Platz.'),
                action: crud.anmeldungen.canWrite
                  ? { label: tx('Anmeldung erfassen'), onClick: () => crud.anmeldungen.openCreate({ anmeldestatus: 'angemeldet', zahlungsstatus: 'offen', anmeldedatum: todayKey }) }
                  : undefined,
              }}
            />
            <WorkList
              title={tx('Kommende Events · Auslastung')}
              icon={<IconCalendarEvent size={16} />}
              items={eventRows}
              onItemClick={openEvent}
              empty={{
                text: tx('Keine kommenden Events.'),
                action: crud.events.canWrite
                  ? { label: tx('Event anlegen'), onClick: () => crud.events.openCreate({ eventstatus: 'geplant' }) }
                  : undefined,
              }}
            />
          </>
        }
        primary={
          <CalendarWidget
            events={calendarEvents}
            locale={dateFnsLocale()}
            onEventClick={ev => openEvent(ev.id.split(':')[1] ?? '')}
            onEmptyClick={crud.events.canWrite ? (date) => {
              if (!isValid(date)) return;
              crud.events.openCreate({ eventstatus: 'geplant', beginn: format(date, "yyyy-MM-dd'T'HH:mm") });
            } : undefined}
          />
        }
      />
      <p className="sr-only">{countOf('anmeldungen', active.length, appLabel('anmeldungen'))}</p>
      {crud.surfaces}
    </div>
  );
}
