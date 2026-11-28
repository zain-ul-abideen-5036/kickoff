'use client';

import { useActionState } from 'react';
import { saveNotifications } from '@/app/(app)/settings/actions';
import type { Settings } from '@/lib/domain/settings';
import { Icon } from '../icons';
import { Button } from '../ui/button';
import { TextAreaField } from '../ui/field';
import { FormSwitch, Group, UnitRow } from './fields';
import { submitKeepingValues, useResultToast } from './use-result-toast';

export function NotificationsForm({
  notifications,
  shareDays,
  emailConfigured,
}: {
  notifications: Settings['notifications'];
  shareDays: number;
  emailConfigured: boolean;
}) {
  const [state, action, pending] = useActionState(saveNotifications, {});
  useResultToast(state);
  const e = state.fieldErrors ?? {};
  return (
    <form onSubmit={submitKeepingValues(action)} noValidate>
      <div className="set-head">
        <h1 className="d-2">Notifications</h1>
        <p className="muted">Know the moment a new brief lands or a client approves.</p>
      </div>

      {!emailConfigured && (
        <div className="note">
          <Icon name="mail" />
          <span>
            Email is off because no Resend key is set. Your choices are saved and start working once{' '}
            <span className="mono">RESEND_API_KEY</span> and <span className="mono">EMAIL_FROM</span> are
            added. Share links work either way.
          </span>
        </div>
      )}

      <Group title="Email me when" hint="Sent from your reply-to address.">
        <FormSwitch
          name="newBrief"
          label="A new brief arrives"
          description="Includes the summary and estimate"
          defaultChecked={notifications.newBrief}
        />
        <FormSwitch
          name="approved"
          label="A client approves a brief"
          description="From the shared link"
          defaultChecked={notifications.approved}
        />
        <div style={{ paddingTop: 16, maxWidth: 480 }}>
          <TextAreaField
            label="Send to"
            name="recipients"
            defaultValue={notifications.recipients.join(', ')}
            error={e.recipients}
            hint="Separate addresses with commas. Up to 10."
            rows={2}
            style={{ minHeight: 64 }}
          />
        </div>
      </Group>

      <Group title="Share links" hint="How long a client's private link stays open.">
        <UnitRow
          label="Links expire after"
          name="shareDays"
          suffix="days"
          defaultValue={shareDays}
          error={e.shareDays}
        />
      </Group>

      <div className="set-actions">
        <Button type="submit" variant="primary" loading={pending} icon="check">
          Save notifications
        </Button>
      </div>
    </form>
  );
}
