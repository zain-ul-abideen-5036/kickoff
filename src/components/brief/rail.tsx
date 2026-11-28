'use client';

import { useId, useState } from 'react';
import { addBriefNote, removeBriefNote } from '@/app/(app)/briefs/[id]/actions';
import type { Edit } from '@/lib/brief-edit/edits';
import { MAX_NOTE, recentActivity, relativeTime } from '@/lib/brief-edit/notes';
import { STATUSES, type Brief, type Status } from '@/lib/domain/brief';
import { Icon } from '../icons';
import { StatusBadge } from '../ui/badges';
import { Button } from '../ui/button';
import { useToast } from '../ui/toast';

export function StatusCard({ brief, apply }: { brief: Brief; apply: (e: Edit) => void }) {
  const id = useId();
  return (
    <div className="card rail-card">
      <div className="row between">
        <label className="label" htmlFor={id}>
          Status
        </label>
        <StatusBadge status={brief.status} />
      </div>
      <select
        id={id}
        className="input input-sm"
        value={brief.status}
        onChange={(e) => apply({ type: 'status', status: e.target.value as Status })}
      >
        {STATUSES.map((s) => (
          <option key={s}>{s}</option>
        ))}
      </select>
      {brief.share?.approvedAt && (
        <p className="ok-msg">
          <Icon name="check" size="sm" />
          Client approved {relativeTime(brief.share.approvedAt)}
        </p>
      )}
    </div>
  );
}

/** Team-only notes. Saved through the editor's queue so they never race an edit. */
export function NotesCard({
  brief,
  enqueue,
}: {
  brief: Brief;
  enqueue: (task: () => Promise<void>) => void;
}) {
  const toast = useToast();
  const id = useId();
  const [notes, setNotes] = useState(brief.notes);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const add = () => {
    const value = text.trim();
    if (!value) return;
    setBusy(true);
    enqueue(async () => {
      const res = await addBriefNote(brief.id, value).catch(() => null);
      setBusy(false);
      if (res?.ok) {
        setNotes(res.notes);
        setText('');
      } else toast.show(res?.error ?? 'Couldn’t save the note.', { tone: 'error' });
    });
  };
  return (
    <div className="card rail-card">
      <div className="row between">
        <label className="label" htmlFor={id}>
          Internal notes
        </label>
        <span className="row t-xs muted" style={{ gap: 4 }}>
          <Icon name="lock" size="sm" />
          Team only
        </span>
      </div>
      <textarea
        id={id}
        className="input notes-input"
        placeholder="Add a note for the team"
        value={text}
        maxLength={MAX_NOTE}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) add();
        }}
      />
      <div className="row between">
        <span className="t-xs muted mono">
          {text.length}/{MAX_NOTE}
        </span>
        <Button size="sm" onClick={add} loading={busy} disabled={!text.trim()}>
          Add note
        </Button>
      </div>
      {notes.length > 0 && (
        <ul className="col rt notes-list">
          {[...notes].reverse().map((n) => (
            <li key={n.id} className="col" style={{ gap: 2 }}>
              <span className="row between t-xs">
                <span>
                  <span className="w5">{n.author.split(' ')[0]}</span>{' '}
                  <span className="muted mono">· {relativeTime(n.at)}</span>
                </span>
                <button
                  type="button"
                  className="btn btn-quiet btn-sm btn-icon note-rm"
                  aria-label={`Delete note from ${relativeTime(n.at)}`}
                  onClick={() =>
                    enqueue(async () => {
                      const res = await removeBriefNote(brief.id, n.id).catch(() => null);
                      if (res?.ok) setNotes(res.notes);
                      else toast.show('Couldn’t delete the note.', { tone: 'error' });
                    })
                  }
                >
                  <Icon name="close" size="sm" />
                </button>
              </span>
              <span className="t-sm note-text">{n.text}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ActivityCard({ brief }: { brief: Brief }) {
  const items = recentActivity(brief, 8);
  return (
    <div className="col activity" style={{ gap: 8 }}>
      <span className="eyebrow">Activity</span>
      <ol className="col" style={{ gap: 6 }}>
        {items.map((a, i) => (
          <li key={`${a.at}-${i}`} className="t-xs muted">
            <span className="mono">{relativeTime(a.at)}</span> · {a.text}
          </li>
        ))}
      </ol>
    </div>
  );
}
