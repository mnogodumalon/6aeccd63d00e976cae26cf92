/**
 * Teilnehmer anmelden — 4-Schritt-Wizard.
 * Steps: 1) Offenes Event wählen → 2) Teilnehmer wählen oder neu anlegen → 3) Disziplin & Bemerkung → 4) Prüfen & anmelden.
 * Reads: events, teilnehmer, anmeldungen (Doppelanmeldung, Auslastung). Writes: teilnehmer (nur bei Neuanlage), anmeldungen
 * (via useTeilnehmerAnmeldenFlow).
 * Composes: IntentWizardShell, EntitySelectStep, Bound, StepNav, BudgetTracker, SummaryStep, SuccessStep.
 */
import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { IconUserPlus, IconSearch } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { Bound } from '@/components/blocks/Bound';
import { StepNav } from '@/components/blocks/StepNav';
import { BudgetTracker } from '@/components/blocks/BudgetTracker';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { fieldText, fieldDate, fieldNumber, fieldLookup, fieldRef, refFilter, combineFilters, useRecordCount } from '@/lib/journey';
import { useTeilnehmerAnmeldenFlow } from '@/lib/journey/flows/TeilnehmerAnmelden';
import { tx } from '@/i18n';

const ACTIVE = "r.v_anmeldestatus in ['angemeldet', 'bestaetigt', 'warteliste']";

export default function TeilnehmerAnmeldenPage() {
  const [step, setStep] = useState(1);
  const [newMode, setNewMode] = useState(false);

  const flow = useTeilnehmerAnmeldenFlow({
    steps: {
      event: 1, teilnehmer: 2,
      vorname: 2, nachname: 2, email: 2, telefon: 2, geburtsdatum: 2, wohnort: 2, skilllevel: 2, stance: 2, team: 2,
      notfall_vorname: 2, notfall_nachname: 2, notfall_telefon: 2,
      disziplin: 3, bemerkung: 3,
    },
    items: {
      event: (r, ctx) => {
        const beginn = fieldDate(r, 'beginn');
        const gebuehr = fieldNumber(r, 'gebuehr');
        return {
          id: r.id,
          title: fieldText(r, 'eventname'),
          subtitle: [ctx.ref('ort'), beginn ? format(parseISO(beginn), 'dd.MM.yyyy HH:mm') : null].filter(Boolean).join(' · '),
          status: fieldLookup(r, 'eventart') ?? undefined,
          stats: gebuehr != null ? [{ label: tx('Gebühr'), value: `${gebuehr} €` }] : undefined,
        };
      },
      teilnehmer: r => ({
        id: r.id,
        title: `${fieldText(r, 'vorname')} ${fieldText(r, 'nachname')}`.trim(),
        subtitle: fieldText(r, 'email'),
      }),
    },
    where: {
      event: r => fieldLookup(r, 'eventstatus')?.key === 'anmeldung_offen',
    },
  });

  const anm = flow.forms.anmeldungen;
  const tn = flow.forms.teilnehmer;
  const eventId = (anm.get('event') as string | undefined) || undefined;
  const teilnehmerId = (anm.get('teilnehmer') as string | undefined) || undefined;
  const eventRecord = eventId ? flow.picks.event.recordOf(eventId) : undefined;
  const maxTeilnehmer = eventRecord ? fieldNumber(eventRecord, 'max_teilnehmer') : null;

  const belegt = useRecordCount(flow.port, 'anmeldungen', {
    filter: eventId ? combineFilters(refFilter('event', eventId), ACTIVE) : undefined,
    where: a => fieldRef(a, 'event') === eventId && ['angemeldet', 'bestaetigt', 'warteliste'].includes(fieldLookup(a, 'anmeldestatus')?.key ?? ''),
    enabled: Boolean(eventId),
  });
  const doppelt = useRecordCount(flow.port, 'anmeldungen', {
    filter: eventId && teilnehmerId ? combineFilters(refFilter('event', eventId), refFilter('teilnehmer', teilnehmerId)) : undefined,
    where: a => fieldRef(a, 'event') === eventId && fieldRef(a, 'teilnehmer') === teilnehmerId,
    enabled: Boolean(eventId && teilnehmerId),
  });

  const teilnehmerPick = flow.pick('teilnehmer');
  const sel = flow.picks.teilnehmer.select;
  const noneYet = !sel.loading && !sel.error && sel.items.length === 0 && !teilnehmerId;
  const showNew = newMode || noneYet;

  const nextFromStep2 = () => {
    if (showNew) return tn.validate(['vorname', 'nachname', 'email']);
    if (!teilnehmerId) return tx('Bitte einen Teilnehmer auswählen oder neu anlegen.');
    if ((doppelt.count ?? 0) > 0) return tx('Dieser Teilnehmer ist für das Event bereits angemeldet.');
    return true;
  };

  return (
    <IntentWizardShell
      title={tx('Teilnehmer anmelden')}
      currentStep={step}
      onStepChange={setStep}
      forms={flow.formList}
      draftKey={flow.draftKey}
      intro={{
        description: tx('Melde einen Teilnehmer für ein Event mit offener Anmeldung an.'),
        needs: [tx('Das Event'), tx('Name oder Kontaktdaten des Teilnehmers')],
      }}
    >
      <WizardStep label={tx('Event')} description={tx('Für welches Event mit offener Anmeldung soll angemeldet werden?')}>
        <EntitySelectStep
          {...flow.picks.event.select}
          {...flow.pick('event')}
          searchPlaceholder={tx('Eventname suchen …')}
          emptyText={tx('Aktuell ist für kein Event die Anmeldung offen.')}
        />
      </WizardStep>

      <WizardStep
        label={tx('Teilnehmer')}
        description={tx('Wähle einen vorhandenen Teilnehmer oder lege einen neuen an.')}
        needs={['event']}
      >
        <div className="space-y-4">
          {!showNew ? (
            <>
              <EntitySelectStep
                {...flow.picks.teilnehmer.select}
                {...teilnehmerPick}
                onSelect={id => { setNewMode(false); tn.reset(); teilnehmerPick.onSelect(id); }}
                create={false}
                avatar="initials"
                searchPlaceholder={tx('Name oder E-Mail suchen …')}
              />
              <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setNewMode(true)}>
                <IconUserPlus size={16} className="shrink-0" />
                {tx('Neuen Teilnehmer anlegen')}
              </Button>
            </>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Bound form={tn} name="vorname" />
                <Bound form={tn} name="nachname" />
                <Bound form={tn} name="email" />
                <Bound form={tn} name="telefon" />
                <Bound form={tn} name="geburtsdatum" />
                <Bound form={tn} name="wohnort" />
                <Bound form={tn} name="team" />
              </div>
              <Bound form={tn} name="skilllevel" allowClear />
              <Bound form={tn} name="stance" allowClear />
              <div className="grid gap-4 sm:grid-cols-3">
                <Bound form={tn} name="notfall_vorname" />
                <Bound form={tn} name="notfall_nachname" />
                <Bound form={tn} name="notfall_telefon" />
              </div>
              {!noneYet && (
                <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => { tn.reset(); setNewMode(false); }}>
                  <IconSearch size={16} className="shrink-0" />
                  {tx('Stattdessen vorhandenen Teilnehmer suchen')}
                </Button>
              )}
            </>
          )}
          <StepNav onBack={() => setStep(1)} onNext={nextFromStep2} nextStepLabel={tx('Disziplin')} />
        </div>
      </WizardStep>

      <WizardStep
        label={tx('Disziplin')}
        description={tx('In welcher Disziplin startet der Teilnehmer? Eine Bemerkung ist optional.')}
        needs={['event']}
      >
        <div className="space-y-4">
          {eventId && maxTeilnehmer != null && maxTeilnehmer > 0 && belegt.count != null && (
            <BudgetTracker
              format="count"
              unit={tx('Plätze')}
              budget={maxTeilnehmer}
              booked={belegt.count}
              label={tx('Auslastung des Events')}
            />
          )}
          <Bound form={anm} name="disziplin" allowClear />
          <Bound form={anm} name="bemerkung" rows={3} />
          <StepNav onBack={() => setStep(2)} onNext={() => flow.validateStep(3)} nextStepLabel={tx('Prüfen')} />
        </div>
      </WizardStep>

      <WizardStep label={tx('Prüfen')}>
        {!flow.submit.done && (
          <SummaryStep
            forms={flow.formList}
            submit={flow.submit}
            items={[
              { key: 'anmeldedatum', label: tx('Anmeldedatum'), value: format(new Date(), 'dd.MM.yyyy') },
              { key: 'anmeldestatus', label: tx('Anmeldestatus'), value: tx('Angemeldet') },
              { key: 'zahlungsstatus', label: tx('Zahlungsstatus'), value: tx('Offen') },
            ]}
            confirmLabel={tx('Jetzt anmelden')}
            whatHappensNext={tx('Die Anmeldung wird mit Status „Angemeldet“ angelegt. Die Zahlung bleibt zunächst offen.')}
          />
        )}
      </WizardStep>

      {flow.submit.result && (
        <SuccessStep
          result={flow.submit.result}
          forms={flow.formList}
          submit={flow.submit}
          restartLabel={tx('Weiteren Teilnehmer anmelden')}
          next={[
            { label: tx('Anmeldung bestätigen'), href: '#/intents/anmeldung-bestaetigen' },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
          whatHappensNext={tx('Als Nächstes kannst du die Anmeldung bestätigen.')}
        />
      )}
    </IntentWizardShell>
  );
}
