/**
 * Anmeldung bestätigen — 3-Schritt-Wizard.
 * Steps: 1) Offene Anmeldung auswählen → 2) Anmeldestatus setzen → 3) Prüfen & speichern
 * (Bestätigen oder Auf Warteliste setzen).
 * Reads: anmeldungen (nur Status „angemeldet“). Writes: anmeldungen (anmeldestatus, update).
 * Composes: IntentWizardShell, EntitySelectStep, Bound, StepNav, SummaryStep, SuccessStep.
 */
import { useState } from 'react';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { Bound } from '@/components/blocks/Bound';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { fieldText, fieldDate, fieldLookup } from '@/lib/journey';
import { useAnmeldungBestaetigenFlow } from '@/lib/journey/flows/AnmeldungBestaetigen';
import { tx } from '@/i18n';

export default function AnmeldungBestaetigenPage() {
  const [step, setStep] = useState(1);
  const flow = useAnmeldungBestaetigenFlow({
    steps: { anmeldungen: 1, anmeldestatus: 2 },
    items: {
      anmeldungen: (r, ctx) => ({
        id: r.id,
        title: ctx.ref('teilnehmer') ?? tx('Ohne Teilnehmer'),
        subtitle: [ctx.ref('event'), fieldLookup(r, 'disziplin')?.label, fieldDate(r, 'anmeldedatum')]
          .filter(Boolean)
          .join(' · ') || fieldText(r, 'bemerkung'),
      }),
    },
  });

  return (
    <IntentWizardShell
      title={tx('Anmeldung bestätigen')}
      currentStep={step}
      onStepChange={setStep}
      forms={flow.formList}
      draftKey={flow.draftKey}
      intro={{
        description: tx('Offene Anmeldungen bestätigen oder auf die Warteliste setzen.'),
        needs: [tx('Eine offene Anmeldung')],
      }}
    >
      <WizardStep label={tx('Anmeldung')} description={tx('Welche offene Anmeldung möchtest du bearbeiten?')}>
        <EntitySelectStep
          {...flow.picks.anmeldungen.select}
          {...flow.pick('anmeldungen')}
          searchPlaceholder={tx('Teilnehmer oder Event suchen …')}
          emptyText={tx('Es gibt keine offenen Anmeldungen mehr.')}
        />
      </WizardStep>
      <WizardStep label={tx('Status')} description={tx('Setze den Anmeldestatus für diese Anmeldung.')} needs={['anmeldungen']}>
        <div className="space-y-4">
          <Bound form={flow.forms.anmeldungen} name="anmeldestatus" />
          <StepNav
            onBack={() => setStep(1)}
            onNext={() => flow.validateStep(2)}
            nextStepLabel={tx('Prüfen')}
          />
        </div>
      </WizardStep>
      <WizardStep label={tx('Prüfen')}>
        {!flow.submit.done && (
          <SummaryStep
            forms={flow.formList}
            submit={flow.submit}
            variants={flow.actions}
            whatHappensNext={tx('Der Status der Anmeldung wird sofort aktualisiert.')}
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
            { label: tx('Zahlung erfassen'), href: '#/intents/zahlung-erfassen' },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
        />
      )}
    </IntentWizardShell>
  );
}
