'use client';

import { useId, useRef, useState } from 'react';
import { sendToClient } from '@/app/(app)/briefs/[id]/actions';
import { announceBriefSent } from '@/lib/brief-edit/sent-event';
import { CopyButton } from '../app/copy-button';
import { Icon } from '../icons';
import { Button } from '../ui/button';
import { useToast } from '../ui/toast';

/**
 * "Send to client": a native modal dialog (focus is trapped and Escape closes it) with an optional
 * message. With email off, it hands over the private link to share by hand.
 */
export function SendToClient({
  briefId,
  clientName,
  clientEmail,
  emailOn,
}: {
  briefId: string;
  clientName: string;
  clientEmail: string;
  emailOn: boolean;
}) {
  const toast = useToast();
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const msgId = useId();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ url: string; emailed: boolean; note?: string } | null>(null);

  const open = () => {
    setResult(null);
    ref.current?.showModal();
  };
  const send = async (form: FormData) => {
    setBusy(true);
    const res = await sendToClient(briefId, String(form.get('message') ?? '')).catch(() => null);
    setBusy(false);
    if (!res || !res.ok) {
      toast.show(res?.ok === false ? res.error : 'Couldn’t send. Check your connection.', { tone: 'error' });
      return;
    }
    setResult(res);
    announceBriefSent({ id: briefId, fields: res.saved });
    if (res.emailed) toast.show(`Sent to ${clientName} with a private link.`);
  };

  return (
    <>
      <Button variant="primary" size="sm" icon="send" onClick={open}>
        Send to client
      </Button>
      <dialog ref={ref} className="dialog send-dialog" aria-labelledby={titleId}>
        {result ? (
          <div className="col" style={{ gap: 14 }}>
            <h2 className="d-3" id={titleId}>
              {result.emailed ? `Sent to ${clientName}` : 'Your share link is ready'}
            </h2>
            <p className="t-sm muted">
              {result.emailed
                ? `${clientEmail} has the brief and a private link to approve it.`
                : (result.note ??
                  'Email isn’t set up, so copy this private link and send it to your client yourself.')}
            </p>
            <div className="share-url mono t-sm">{result.url}</div>
            <div className="row" style={{ gap: 8, justifyContent: 'flex-end' }}>
              <CopyButton text={result.url} done="Share link copied" />
              <Button variant="primary" size="sm" onClick={() => ref.current?.close()}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form action={send} className="col" style={{ gap: 14 }}>
            <h2 className="d-3" id={titleId}>
              Send brief to {clientName}?
            </h2>
            <p className="t-sm muted">
              {emailOn
                ? `They'll get an email at ${clientEmail} with a private link they can approve.`
                : 'Email isn’t set up, so we’ll create a private link for you to send.'}
            </p>
            {emailOn && (
              <div className="field">
                <label className="label" htmlFor={msgId}>
                  Message <span className="opt">Optional</span>
                </label>
                <textarea
                  id={msgId}
                  name="message"
                  className="input"
                  maxLength={1000}
                  placeholder="Add a short personal note"
                />
              </div>
            )}
            {!emailOn && (
              <div className="note t-sm">
                <Icon name="mail" />
                <span>Add a Resend key in your deployment settings to email clients directly.</span>
              </div>
            )}
            <div className="row" style={{ gap: 8, justifyContent: 'flex-end' }}>
              <Button variant="ghost" size="sm" onClick={() => ref.current?.close()}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                icon={emailOn ? 'send' : 'link'}
                loading={busy}
              >
                {emailOn ? 'Send brief' : 'Create link'}
              </Button>
            </div>
          </form>
        )}
      </dialog>
    </>
  );
}
