'use client';

import { useState } from 'react';
import { Icon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { approveBrief } from './actions';

/** The sticky bar at the foot of the shared brief: approve, or ask a question. */
export function ApproveBar({
  token,
  approvedAt,
  clientName,
  agency,
  replyTo,
  total,
  weeks,
}: {
  token: string;
  approvedAt: string | null;
  clientName: string;
  agency: string;
  replyTo: string;
  total: string;
  weeks: string;
}) {
  const toast = useToast();
  const [approved, setApproved] = useState(approvedAt);
  const [busy, setBusy] = useState(false);
  const first = clientName.split(' ')[0] || clientName;
  return (
    <div className="appr no-print" aria-live="polite">
      <div className="sdoc row between wrapf appr-in">
        {approved ? (
          <div className="row a-in-y" style={{ gap: 10 }}>
            <Icon name="statusWon" className="won-ic" />
            <span className="col">
              <span className="w5">Brief approved. Thank you, {first}.</span>
              <span className="t-sm muted">
                {agency} has been told and will be in touch to book your kickoff call.
              </span>
            </span>
          </div>
        ) : (
          <div className="col">
            <span className="w5">Happy with this brief?</span>
            <span className="t-sm muted">
              Total estimate <span className="mono brass w5">{total}</span> · {weeks}
            </span>
          </div>
        )}
        <div className="row wrapf" style={{ gap: 10 }}>
          {replyTo && (
            <a
              className="btn btn-secondary"
              href={`mailto:${replyTo}?subject=${encodeURIComponent('Question about my project brief')}`}
            >
              Ask a question
            </a>
          )}
          {!approved && (
            <Button
              variant="primary"
              icon="check"
              loading={busy}
              onClick={async () => {
                setBusy(true);
                const res = await approveBrief(token).catch(() => null);
                setBusy(false);
                if (res?.ok) setApproved(res.approvedAt);
                else toast.show(res?.error ?? 'Couldn’t approve. Check your connection.', { tone: 'error' });
              }}
            >
              Approve brief
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
