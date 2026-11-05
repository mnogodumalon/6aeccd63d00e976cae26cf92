/**
 * Event anlegen — 4-Schritt-Wizard.
 * Steps: 1) Veranstaltungsort wählen → 2) Name, Art, Beginn und Ende → 3) Teilnehmerzahl, Gebühr, Veranstalter → 4) Prüfen & speichern.
 * Reads: veranstaltungsorte (Auswahl), events (Belegung des Ortes). Writes: events (Status „geplant“ setzt der Flow selbst).
 * Composes: IntentWizardShell, EntitySelectStep, Bound, Field, ChoiceGroup, AvailabilityRangePicker, BudgetTracker, StepNav, SummaryStep, SuccessStep.
 */
import { useState } from 'react';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { Bound } from '@/components/blocks/Bound';
import { Field } from '@/components/blocks/Field';
import { ChoiceGroup } from '@/components/blocks/ChoiceGroup';
import { AvailabilityRangePicker } from '@/components/blocks/AvailabilityRangePicker';
import { BudgetTracker } from '@/components/blocks/BudgetTracker';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { fieldText, fieldLookup, fieldNumber, useOccupancy } from '@/lib/journey';
import { useEventAnlegenFlow } from '@/lib/journey/flows/EventAnlegen';
import { tx } from '@/i18n';

export default function EventAnlegenPage() {
  const [step, setStep] = useState(1);
  const flow = useEventAnlegenFlow({
    steps: {
      ort: 1,
      eventname: 2, eventart: 2, beginn: 2, ende: 2,
      max_teilnehmer: 3, gebuehr: 3, veranstalter: 3, eventbeschreibung: 3,
    },
    items: {
      ort: (r, ctx) => ({
        id: r.id,
        title: fieldText(r, 'ortsname'),
        subtitle: [fieldText(r, 'stadt'), fieldLookup(r, 'ortsart')?.label].filter(Boolean).join(' · ') || ctx.ref('ort'),
        stats: fieldNumber(r, 'kapazitaet') != null
          ? [{ label: tx('Kapazität'), value: fieldNumber(r, 'kapazitaet') as number }]
          : undefined,
      }),
    },
  });

  const f = flow.forms.events;
  const ortId = (f.get('ort') as string | null | undefined) ?? null;
  const belegung = useOccupancy(flow.port, 'events', { resource: ortId });

  const ortRecord = ortId ? flow.picks.ort.recordOf(ortId) : undefined;
  const kapazitaet = ortRecord ? fieldNumber(ortRecord, 'kapazitaet') : null;
  const maxRaw = f.get('max_teilnehmer');
  const maxTeilnehmer = maxRaw === '' || maxRaw == null ? 0 : Number(maxRaw);
  const ueberbucht = kapazitaet != null && Number.isFinite(maxTeilnehmer) && maxTeilnehmer > kapazitaet;

  return (
    <IntentWizardShell
      title={tx('Event anlegen')}
      currentStep={step}
      onStepChange={setStep}
      forms={flow.formList}
      draftKey={flow.draftKey}
      intro={{
        description: tx('Lege ein neues Event mit Ort, Zeitraum, Teilnehmerzahl und Gebühr an.'),
        needs: [tx('Veranstaltungsort'), tx('Eventname und Zeitraum'), tx('Maximale Teilnehmerzahl')],
      }}
    >
      <WizardStep label={tx('Ort')} description={tx('Wähle den Veranstaltungsort für dein Event.')}>
        <EntitySelectStep
          {...flow.picks.ort.select}
          {...flow.pick('ort')}
          searchPlaceholder={tx('Ortsname oder Stadt …')}
          avatar="none"
        />
      </WizardStep>

      <WizardStep label={tx('Eckdaten')} description={tx('Gib dem Event einen Namen, wähle die Art und den Zeitraum.')} needs={['ort']}>
        <div className="space-y-4">
          <Bound form={f} name="eventname" />
          <Field form={f} name="eventart">
            <ChoiceGroup {...f.choice('eventart')} />
          </Field>
          <AvailabilityRangePicker
            unit="days"
            {...f.range('beginn', 'ende', { blocked: belegung.blocked, unit: 'days' })}
          />
          <StepNav
            onBack={() => setStep(1)}
            onNext={() => f.validate(['eventname', 'eventart', 'beginn'])}
            nextStepLabel={tx('Teilnehmer und Gebühr')}
          />
        </div>
      </WizardStep>

      <WizardStep label={tx('Teilnahme')} description={tx('Lege Teilnehmerzahl, Gebühr und Veranstalter fest.')} needs={['eventname', 'beginn']}>
        <div className="space-y-4">
          <Bound form={f} name="max_teilnehmer" />
          {kapazitaet != null && kapazitaet > 0 && (
            <div className="space-y-2">
              <BudgetTracker
                format="count"
                unit={tx('Personen')}
                budget={kapazitaet}
                booked={Number.isFinite(maxTeilnehmer) ? maxTeilnehmer : 0}
                label={tx('Kapazität des Ortes')}
              />
              {ueberbucht && (
                <p className="text-xs text-destructive">
                  {tx`Der Ort fasst nur ${kapazitaet} Personen — du planst mit ${maxTeilnehmer}.`}
                </p>
              )}
            </div>
          )}
          <Bound form={f} name="gebuehr" />
          <Bound form={f} name="veranstalter" />
          <Bound form={f} name="eventbeschreibung" rows={4} />
          <StepNav
            onBack={() => setStep(2)}
            onNext={() => f.validate(['max_teilnehmer', 'gebuehr', 'veranstalter', 'eventbeschreibung'])}
            nextStepLabel={tx('Prüfen')}
          />
        </div>
      </WizardStep>

      <WizardStep label={tx('Prüfen')}>
        {!flow.submit.done && (
          <SummaryStep
            forms={flow.formList}
            submit={flow.submit}
            items={[{ key: 'eventstatus', label: tx('Status'), value: tx('Geplant') }]}
            whatHappensNext={tx('Das Event wird mit dem Status „Geplant“ angelegt. Danach kannst du Teilnehmer anmelden.')}
          />
        )}
      </WizardStep>

      {flow.submit.result && (
        <SuccessStep
          result={flow.submit.result}
          forms={flow.formList}
          submit={flow.submit}
          next={[
            { label: tx('Teilnehmer anmelden'), href: '#/intents/teilnehmer-anmelden' },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
        />
      )}
    </IntentWizardShell>
  );
}
