'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { getShareLink, saveBriefEdit } from '@/app/(app)/briefs/[id]/actions';
import { EditError, applyWithActivity, type Edit } from '@/lib/brief-edit/edits';
import type { Brief } from '@/lib/domain/brief';
import { briefFacts } from '@/lib/engine/generate';
import { formatGbp, formatWeeks } from '@/lib/format';
import { Icon } from '../icons';
import { Button, ButtonLink } from '../ui/button';
import { useToast } from '../ui/toast';
import { BriefDocument, SECTIONS } from './document';
import { ActivityCard, NotesCard, StatusCard } from './rail';

type SaveState = 'saved' | 'saving' | 'error';

/**
 * Edits apply instantly in the browser with the same reducer the server uses, then save one at a
 * time in order, so a slow network can never reorder changes.
 */
export function useBriefEditor(initial: Brief) {
  const toast = useToast();
  const [brief, setBrief] = useState(initial);
  const [state, setState] = useState<SaveState>('saved');
  const chain = useRef<Promise<unknown>>(Promise.resolve());
  const pending = useRef(0);

  const send = useCallback(
    (edit: Edit) => {
      pending.current += 1;
      setState('saving');
      chain.current = chain.current.then(async () => {
        let ok = false;
        try {
          const res = await saveBriefEdit(initial.id, edit);
          ok = res.ok;
          if (!res.ok) toast.show(res.error, { tone: 'error' });
        } catch {
          toast.show('Couldn’t save. Check your connection.', {
            tone: 'error',
            action: { label: 'Retry', run: () => send(edit) },
          });
        }
        pending.current -= 1;
        setState(!ok ? 'error' : pending.current ? 'saving' : 'saved');
      });
    },
    [initial.id, toast],
  );

  const apply = useCallback(
    (edit: Edit) => {
      setBrief((b) => {
        try {
          return applyWithActivity(b, edit, new Date().toISOString());
        } catch (e) {
          if (e instanceof EditError) toast.show(e.message, { tone: 'error' });
          return b;
        }
      });
      send(edit);
    },
    [send, toast],
  );

  /** Runs other saves (such as notes) on the same chain, so nothing writes the brief at once. */
  const enqueue = useCallback((task: () => Promise<void>) => {
    chain.current = chain.current.then(task).catch(() => undefined);
  }, []);

  return { brief, state, apply, enqueue };
}

export function SaveStatus({ state }: { state: SaveState }) {
  const map = {
    saved: { icon: 'check' as const, text: 'All changes saved', cls: 'save-ok' },
    saving: { icon: 'clock' as const, text: 'Saving…', cls: 'muted' },
    error: { icon: 'alert' as const, text: 'Not saved', cls: 'save-err' },
  }[state];
  return (
    <span className={`t-xs row save-status ${map.cls}`} role="status" aria-live="polite">
      <Icon name={map.icon} size="sm" />
      {map.text}
    </span>
  );
}

function useActiveSection() {
  const [active, setActive] = useState<string>('summary');
  useEffect(() => {
    const els = SECTIONS.map(([id]) => document.getElementById(id)).filter((e): e is HTMLElement => !!e);
    const io = new IntersectionObserver(
      (entries) => {
        const top = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (top) setActive(top.target.id);
      },
      { rootMargin: '-90px 0px -60% 0px' },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);
  return active;
}

export function ShareButton({ briefId }: { briefId: string }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      size="sm"
      icon="link"
      loading={busy}
      onClick={async () => {
        setBusy(true);
        const res = await getShareLink(briefId).catch(() => null);
        setBusy(false);
        if (!res || !res.ok)
          return toast.show(res?.ok === false ? res.error : 'Couldn’t create a link.', { tone: 'error' });
        try {
          await navigator.clipboard.writeText(res.url);
          toast.show('Share link copied. It works for the days set in Settings.');
        } catch {
          window.prompt('Copy this share link', res.url);
        }
      }}
    >
      Copy share link
    </Button>
  );
}

export function BriefEditor({
  initial,
  vatRate,
  agency,
  rail,
  actions,
}: {
  initial: Brief;
  vatRate: number;
  agency: string;
  /** Extra right-rail cards (status, notes, activity), given the live brief and the edit function. */
  rail?: (brief: Brief, apply: (e: Edit) => void) => ReactNode;
  /** Extra top-bar actions, such as Send to client. */
  actions?: ReactNode;
}) {
  const { brief, state, apply, enqueue } = useBriefEditor(initial);
  const active = useActiveSection();
  const f = briefFacts(brief, vatRate);
  return (
    <div className="editor">
      <header className="ed-top">
        <Link href="/briefs" className="btn btn-ghost btn-sm" style={{ paddingLeft: 6 }}>
          <Icon name="arrowLeft" />
          Briefs
        </Link>
        <div className="col grow" style={{ minWidth: 0 }}>
          <span className="w5 ed-title">{brief.answers.about.business}</span>
          <span className="t-xs mono muted">{brief.ref}</span>
        </div>
        <SaveStatus state={state} />
        <span className="hide-t row" style={{ gap: 8 }}>
          <ShareButton briefId={brief.id} />
          <ButtonLink href={`/api/briefs/${brief.id}/pdf`} size="sm" icon="download">
            Download PDF
          </ButtonLink>
        </span>
        {actions}
      </header>
      <div className="ed">
        <nav className="snav" aria-label="Brief sections">
          <p className="eyebrow" style={{ padding: '0 10px 8px' }}>
            Sections
          </p>
          {SECTIONS.map(([id, label], i) => (
            <a
              key={id}
              href={`#${id}`}
              className={active === id ? 'on' : undefined}
              aria-current={active === id ? 'location' : undefined}
            >
              <span>{String(i + 1).padStart(2, '0')}</span>
              {label}
            </a>
          ))}
        </nav>
        <article className="card paperdoc">
          <BriefDocument
            brief={brief}
            vatRate={vatRate}
            agency={agency}
            editable
            onEdit={apply}
            quoteHref={`/briefs/${brief.id}/quote`}
          />
        </article>
        <aside className="rail" aria-label="Brief controls">
          <div className="card rail-card">
            <div className="row between">
              <span className="t-sm muted">Estimate</span>
              <span className="mono brass w5">{formatGbp(f.total)}</span>
            </div>
            <div className="row between">
              <span className="t-sm muted">Timeline</span>
              <span className="mono">{formatWeeks(f.weeks)}</span>
            </div>
            <div className="row between">
              <span className="t-sm muted">Pages</span>
              <span className="mono">{f.pageCount}</span>
            </div>
          </div>
          <StatusCard brief={brief} apply={apply} />
          {rail?.(brief, apply)}
          <div className="card rail-card">
            <span className="label">Share and export</span>
            <ShareButton briefId={brief.id} />
            <ButtonLink href={`/api/briefs/${brief.id}/pdf`} size="sm" icon="download" className="rail-btn">
              Download PDF
            </ButtonLink>
            <ButtonLink href={`/api/briefs/${brief.id}/tasks.csv`} size="sm" icon="list" className="rail-btn">
              Export tasks CSV
            </ButtonLink>
            <p className="t-xs muted">
              The CSV imports into Trello or Asana: one task per page, feature and content item.
            </p>
          </div>
          <NotesCard brief={initial} enqueue={enqueue} />
          <ActivityCard brief={brief} />
        </aside>
      </div>
    </div>
  );
}
