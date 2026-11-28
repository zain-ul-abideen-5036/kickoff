'use client';

import { useActionState } from 'react';
import { saveAi, updatePassword } from '@/app/(app)/settings/actions';
import { Icon } from '../icons';
import { Button } from '../ui/button';
import { TextField } from '../ui/field';
import { FormSwitch, Group } from './fields';
import { submitKeepingValues, useResultToast } from './use-result-toast';

export interface AiProps {
  enabled: boolean;
  keyConfigured: boolean;
  model: string;
}

function Item({ yes, children }: { yes: boolean; children: React.ReactNode }) {
  return (
    <li className="row t-sm" style={{ gap: 8, alignItems: 'flex-start' }}>
      <Icon name={yes ? 'check' : 'close'} size="sm" />
      <span>{children}</span>
    </li>
  );
}

export function AiForm({ enabled, keyConfigured, model }: AiProps) {
  const [state, action, pending] = useActionState(saveAi, {});
  useResultToast(state);
  return (
    <form onSubmit={submitKeepingValues(action)}>
      <div className="set-head">
        <h1 className="d-2">AI and privacy</h1>
        <p className="muted">
          AI writes the summary, audience profiles and follow-up wording. It never sets prices.
        </p>
      </div>

      <Group title="Use AI to write briefs" hint="Off: briefs are written from your templates.">
        <FormSwitch
          name="aiEnabled"
          label="AI writing"
          description="Quotes, timelines, page counts and risks always come from your rules."
          defaultChecked={enabled}
        />
        {!keyConfigured && (
          <div className="note" style={{ marginTop: 14 }}>
            <Icon name="info" />
            <span>
              No Gemini key is set, so briefs are written from templates even with AI on. Add{' '}
              <span className="mono">GEMINI_API_KEY</span> to the environment to turn it on.
            </span>
          </div>
        )}
      </Group>

      <Group title="Provider" hint="Where answers are processed.">
        <div className="card col" style={{ padding: 18, gap: 6 }}>
          <span className="row between">
            <span className="w5">Google Gemini</span>
            <span className={`st ${keyConfigured ? 'st-won' : 'st-new'}`}>
              <Icon name={keyConfigured ? 'statusWon' : 'statusNew'} />
              {keyConfigured ? 'Key configured' : 'No key'}
            </span>
          </span>
          <span className="t-sm muted">
            Model <span className="mono">{model}</span>. The key stays on the server and is never shown here.
          </span>
        </div>
      </Group>

      <Group title="What we send">
        <ul className="card col" style={{ padding: 18, gap: 10 }}>
          <Item yes>The client’s answers, only to write their brief</Item>
          <Item yes={false}>Never your rate card, notes, quotes or other clients</Item>
          <Item yes={false}>Never used to set prices: any figure the AI writes must match our maths</Item>
        </ul>
      </Group>

      <div className="set-actions">
        <Button type="submit" variant="primary" loading={pending} icon="check">
          Save AI setting
        </Button>
      </div>
    </form>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, {});
  useResultToast(state);
  const e = state.fieldErrors ?? {};
  return (
    <form onSubmit={submitKeepingValues(action)} noValidate style={{ marginTop: 40 }}>
      <Group title="Change password" hint="Signs you out everywhere else.">
        <div className="col" style={{ gap: 16, maxWidth: 420 }}>
          <TextField
            label="Current password"
            name="current"
            type="password"
            autoComplete="current-password"
            error={e.current}
          />
          <TextField
            label="New password"
            name="next"
            type="password"
            autoComplete="new-password"
            error={e.next}
            hint="At least 10 characters. A short phrase works well."
          />
          <TextField
            label="Confirm new password"
            name="confirm"
            type="password"
            autoComplete="new-password"
            error={e.confirm}
          />
          <div>
            <Button type="submit" loading={pending} icon="lock">
              Change password
            </Button>
          </div>
        </div>
      </Group>
    </form>
  );
}
