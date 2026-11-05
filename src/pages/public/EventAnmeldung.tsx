import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PublicShell } from '@/components/PublicShell';
import {
  loadPublicPagesConfig,
  type PublicPagesConfig,
  type PublicPageConfig,
} from '@/lib/publicClient';
import {
  useStepForm,
  useJourneySubmit,
  useLiveList,
  fieldText,
  fieldLookup,
  recordLabelOf,
} from '@/lib/journey';
import { createPublicPort } from '@/lib/journey/publicPort';
import { IntentWizardShell } from '@/components/blocks/IntentWizardShell';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { Bound } from '@/components/blocks/Bound';
import { LoadProblem } from '@/components/blocks/LoadProblem';
import { tx } from '@/i18n';

const SLUG = 'event-anmeldung';

function Registration({ cfg, page, eventId }: { cfg: PublicPagesConfig; page: PublicPageConfig; eventId: string }) {
  const port = useMemo(() => createPublicPort(cfg, page), [cfg, page]);
  const [step, setStep] = useState(1);
  const live = useLiveList(port, 'events', { intervalMs: 0 });
  const event = live.records.find(r => r.id === eventId);

  const person = useStepForm('teilnehmer', {
    fields: ['vorname', 'nachname', 'email', 'telefon', 'geburtsdatum', 'wohnort', 'skilllevel', 'stance', 'team', 'notfall_vorname', 'notfall_nachname', 'notfall_telefon'],
    steps: { vorname: 1, nachname: 1, email: 1, telefon: 1, geburtsdatum: 1, wohnort: 1, skilllevel: 1, stance: 1, team: 1, notfall_vorname: 1, notfall_nachname: 1, notfall_telefon: 1 },
    autoComplete: true,
  });
  const reg = useStepForm('anmeldungen', {
    fields: ['disziplin', 'bemerkung'],
    steps: { disziplin: 2, bemerkung: 2 },
    autoComplete: true,
  });

  const submit = useJourneySubmit(
    port,
    [
      { key: 'teilnehmer', entity: 'teilnehmer', form: person },
      {
        key: 'anmeldung',
        entity: 'anmeldungen',
        form: reg,
        primary: true,
        needs: ['teilnehmer'],
        link: { teilnehmer: 'teilnehmer' },
        values: ({ done }) => ({ event: eventId, teilnehmer: done.teilnehmer?.id }),
      },
    ],
    { draftKey: `event-anmeldung-${eventId}` },
  );

  const [prepared, setPrepared] = useState(false);
  useEffect(() => { setPrepared(true); }, []);

  if (!live.loaded && live.error) return <LoadProblem onRetry={live.reload} />;
  if (!live.loaded) return <PublicShell loading />;
  if (!event) {
    return (
      <p className="text-sm text-muted-foreground">
        {tx('Dieser Link passt zu keinem Event mit offener Anmeldung. Scanne bitte den QR-Code noch einmal.')}
      </p>
    );
  }

  const art = fieldLookup(event, 'eventart');
  const ort = recordLabelOf(event.fields.ort);
  const ende = fieldText(event, 'ende');
  const gebuehr = fieldText(event, 'gebuehr');

  const steps = [
    { label: tx('Deine Daten') },
    { label: tx('Anmeldung') },
    { label: tx('Prüfen') },
  ];

  return (
    <div className="space-y-5" data-ready={prepared ? '1' : '0'}>
      <div className="rounded-xl border bg-muted/40 p-4 space-y-1">
        <div className="text-base font-semibold">{fieldText(event, 'eventname')}</div>
        <dl className="text-sm text-muted-foreground grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
          {art && (<><dt>{tx('Art')}</dt><dd className="text-foreground">{art.label}</dd></>)}
          <dt>{tx('Beginn')}</dt>
          <dd className="text-foreground">{fieldText(event, 'beginn')}</dd>
          {ende && (<><dt>{tx('Ende')}</dt><dd className="text-foreground">{ende}</dd></>)}
          {ort && (<><dt>{tx('Ort')}</dt><dd className="text-foreground">{ort}</dd></>)}
          {gebuehr && (<><dt>{tx('Gebühr')}</dt><dd className="text-foreground">{gebuehr}</dd></>)}
        </dl>
      </div>

      <IntentWizardShell
        steps={steps}
        currentStep={step}
        onStepChange={setStep}
        back={false}
        forms={[person, reg]}
        draftKey={`event-anmeldung-${eventId}`}
      >
        {step === 1 && (
          <div className="space-y-4">
            <Bound form={person} name="vorname" />
            <Bound form={person} name="nachname" />
            <Bound form={person} name="email" />
            <Bound form={person} name="telefon" />
            <Bound form={person} name="geburtsdatum" />
            <Bound form={person} name="wohnort" />
            <Bound form={person} name="skilllevel" allowClear />
            <Bound form={person} name="stance" allowClear />
            <Bound form={person} name="team" />
            <Bound form={person} name="notfall_vorname" />
            <Bound form={person} name="notfall_nachname" />
            <Bound form={person} name="notfall_telefon" />
            <StepNav
              hideBack
              nextStepLabel={tx('Anmeldung')}
              onNext={() => person.validate(['vorname', 'nachname', 'email'])}
            />
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4">
            <Bound form={reg} name="disziplin" allowClear />
            <Bound form={reg} name="bemerkung" />
            <StepNav nextStepLabel={tx('Prüfen')} onNext={() => reg.validate(['disziplin', 'bemerkung'])} />
          </div>
        )}
        {step === 3 && !submit.done && (
          <SummaryStep
            forms={[person, reg]}
            submit={submit}
            whatHappensNext={tx('Wir erfassen deine Anmeldung und melden uns bei dir.')}
          />
        )}
        {submit.result && (
          <SuccessStep
            result={submit.result}
            forms={[person, reg]}
            submit={submit}
            title={tx('Du bist angemeldet')}
          />
        )}
      </IntentWizardShell>
    </div>
  );
}

export default function EventAnmeldung() {
  const [cfg, setCfg] = useState<PublicPagesConfig | null>(null);
  const [page, setPage] = useState<PublicPageConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [params] = useSearchParams();
  const eventId = params.get('event');

  useEffect(() => {
    loadPublicPagesConfig(SLUG).then(c => {
      setCfg(c);
      setPage(c?.pages[SLUG] ?? null);
      setLoading(false);
    });
  }, []);

  if (loading || !cfg || !page) {
    return <PublicShell loading={loading} unavailable={!loading} />;
  }

  return (
    <PublicShell title={page.title} description={page.description}>
      {eventId ? (
        <Registration cfg={cfg} page={page} eventId={eventId} />
      ) : (
        <p className="text-sm text-muted-foreground">
          {tx('Dieser Link ist unvollständig. Öffne bitte den Link oder QR-Code, den du vom Veranstalter bekommen hast.')}
        </p>
      )}
    </PublicShell>
  );
}
