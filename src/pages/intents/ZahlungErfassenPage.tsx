/**
 * Zahlung erfassen — 4-Schritt-Wizard.
 * Steps: 1) Anmeldung mit offener Zahlung wählen → 2) Zahlungsstatus setzen → 3) Startnummer vergeben → 4) Prüfen & speichern.
 * Reads: anmeldungen (Event, Teilnehmer, Zahlungsstatus, Startnummer, Anmeldestatus). Writes: anmeldungen (update, via useZahlungErfassenFlow).
 * Composes: IntentWizardShell, EntitySelectStep, Bound, StepNav, SummaryStep, SuccessStep.
 */
import { useState } from 'react';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { Bound } from '@/components/blocks/Bound';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { fieldLookup, fieldNumber } from '@/lib/journey';
import { useZahlungErfassenFlow } from '@/lib/journey/flows/ZahlungErfassen';
import { tx } from '@/i18n';

export default function ZahlungErfassenPage() {
  const [step, setStep] = useState(1);
  const flow = useZahlungErfassenFlow({
    steps: { anmeldungen: 1, zahlungsstatus: 2, startnummer: 3 },
    items: {
      anmeldungen: (r, ctx) => {
        const nummer = fieldNumber(r, 'startnummer');
        return {
          id: r.id,
          title: ctx.ref('teilnehmer') ?? tx('Ohne Teilnehmer'),
          subtitle: ctx.ref('event'),
          status: fieldLookup(r, 'anmeldestatus') ?? undefined,
          stats: nummer != null ? [{ label: tx('Startnummer'), value: nummer }] : undefined,
        };
      },
    },
  });

  return (
    <IntentWizardShell
      title={tx('Zahlung erfassen')}
      currentStep={step}
      onStepChange={setStep}
      forms={flow.formList}
      draftKey={flow.draftKey}
      intro={{
        description: tx('Eine offene Gebühr als bezahlt oder erlassen markieren und bei Bedarf eine Startnummer vergeben.'),
        needs: [tx('Die Anmeldung mit offener Zahlung'), tx('Ggf. die Startnummer')],
      }}
    >
      <WizardStep label={tx('Anmeldung')} description={tx('Welche Anmeldung hat noch eine offene Gebühr?')}>
        <EntitySelectStep
          {...flow.picks.anmeldungen.select}
          {...flow.pick('anmeldungen')}
          searchPlaceholder={tx('Anmeldung suchen …')}
          emptyText={tx('Keine Anmeldung mit offener Zahlung gefunden.')}
        />
      </WizardStep>
      <WizardStep label={tx('Zahlung')} description={tx('Wie steht es um die Gebühr?') } needs={['anmeldungen']}>
        <div className="space-y-4">
          <Bound form={flow.forms.anmeldungen} name="zahlungsstatus" />
          <StepNav
            onBack={() => setStep(1)}
            onNext={() => flow.validateStep(2)}
            nextStepLabel={tx('Startnummer')}
          />
        </div>
      </WizardStep>
      <WizardStep label={tx('Startnummer')} description={tx('Optional: eine Startnummer für das Event vergeben.')} needs={['anmeldungen']}>
        <div className="space-y-4">
          <Bound form={flow.forms.anmeldungen} name="startnummer" hint={tx('Jede Nummer ist pro Event nur einmal vergeben.')} />
          <StepNav
            onBack={() => setStep(2)}
            onNext={() => flow.validateStep(3)}
            nextStepLabel={tx('Prüfen')}
          />
        </div>
      </WizardStep>
      <WizardStep label={tx('Speichern')}>
        {!flow.submit.done && (
          <SummaryStep
            forms={flow.formList}
            submit={flow.submit}
            variants={flow.actions}
            whatHappensNext={tx('Die Anmeldung wird aktualisiert. Du kannst die Zahlung danach wieder zurücknehmen.')}
          />
        )}
      </WizardStep>
      {flow.submit.result && (
        <SuccessStep
          result={flow.submit.result}
          forms={flow.formList}
          submit={flow.submit}
          undo={flow.undo}
          next={[
            { label: tx('Weitere Zahlung erfassen'), onClick: () => { flow.reset(); setStep(1); } },
            { label: tx('Anmeldung bestätigen'), href: '#/intents/anmeldung-bestaetigen' },
            { label: tx('Teilnehmer anmelden'), href: '#/intents/teilnehmer-anmelden' },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
        />
      )}
    </IntentWizardShell>
  );
}
