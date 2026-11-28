'use client';

import { useActionState } from 'react';
import { saveTimeline } from '@/app/(app)/settings/actions';
import type { Settings } from '@/lib/domain/settings';
import { OPTIONAL_STEPS } from '@/lib/settings/forms';
import { Button } from '../ui/button';
import { FormSwitch, Group, UnitRow } from './fields';
import { submitKeepingValues, useResultToast } from './use-result-toast';

const STEP_NOTES: Record<string, string> = {
  goals: 'Up to three goals',
  audience: 'Who they want to reach',
  features: 'What the site should do',
  content: 'Logo, photos and text',
  inspiration: 'Sites they like',
  budget: 'Ranges, not exact figures',
};

export function TimelineForm({ timeline, intake }: Pick<Settings, 'timeline' | 'intake'>) {
  const [state, action, pending] = useActionState(saveTimeline, {});
  useResultToast(state);
  const e = state.fieldErrors ?? {};
  const total = timeline.phases.reduce((s, p) => s + p.weeks, 0);
  return (
    <form onSubmit={submitKeepingValues(action)} noValidate>
      <div className="set-head">
        <h1 className="d-2">Timeline and intake</h1>
        <p className="muted">Defaults for new briefs, and which questions clients see.</p>
      </div>

      <Group title="Phase defaults" hint={`In weeks, half weeks allowed. Currently ${total} weeks in total.`}>
        {timeline.phases.map((p) => (
          <UnitRow
            key={p.id}
            label={p.name}
            name={`phase.${p.id}`}
            suffix="wk"
            inputMode="decimal"
            defaultValue={p.weeks}
            error={e[`phase.${p.id}`]}
          />
        ))}
        <UnitRow
          label="Extra build weeks for every 5 pages beyond 7"
          name="extraWeeksPer5Pages"
          suffix="wk"
          inputMode="decimal"
          defaultValue={timeline.extraWeeksPer5Pages}
          error={e.extraWeeksPer5Pages}
        />
      </Group>

      <Group title="Intake questions" hint="Turn steps off to keep the intake shorter.">
        <FormSwitch name="step.about" label="About you" description="Always on" defaultChecked disabled />
        {OPTIONAL_STEPS.map((s) => (
          <FormSwitch
            key={s.key}
            name={`step.${s.key}`}
            label={s.label}
            description={STEP_NOTES[s.key]}
            defaultChecked={intake.steps[s.key] !== false}
          />
        ))}
        <FormSwitch
          name="followUps"
          label="Smart follow-ups"
          description="One to three tailored questions before review"
          defaultChecked={intake.followUps}
        />
        {e.steps && (
          <span className="err-msg" role="alert" style={{ marginTop: 10 }}>
            {e.steps}
          </span>
        )}
      </Group>

      <div className="set-actions">
        <Button type="submit" variant="primary" loading={pending} icon="check">
          Save timeline and intake
        </Button>
      </div>
    </form>
  );
}
