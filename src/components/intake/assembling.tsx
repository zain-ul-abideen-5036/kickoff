'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Icon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/ui/progress';

type Fail = { ok: false; message: string };
export interface AssemblingProps {
  draftId: string;
  business: string;
  agencyName: string;
  read: (id: string) => Promise<{ ok: true; sections: number; answered: number; done: boolean } | Fail>;
  plan: (id: string) => Promise<{ ok: true; pages: string[]; weeks: number } | Fail>;
  write: (id: string) => Promise<{ ok: true; briefId: string } | Fail>;
}

/** Where each stage starts and ends on the bar. */
const BANDS = [
  [0, 0.33],
  [0.33, 0.72],
  [0.72, 1],
] as const;
/** A stage stays on screen at least this long, so the client can read it. */
const MIN_MS = 900;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * "Assembling your brief": three real server stages. The bar creeps within the current stage
 * while it runs and jumps to the end of the stage when it finishes, so progress is honest.
 */
export function Assembling({ draftId, business, agencyName, read, plan, write }: AssemblingProps) {
  const router = useRouter();
  const [stage, setStage] = useState(0);
  const [value, setValue] = useState(0);
  const [details, setDetails] = useState<string[]>(['', '', '']);
  const [pages, setPages] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [run, setRun] = useState(0);
  const started = useRef(-1);

  useEffect(() => {
    if (error) return;
    const band = BANDS[Math.min(stage, 2)]!;
    const t = setInterval(() => setValue((v) => Math.min(band[1] - 0.02, v + 0.01)), 80);
    return () => clearInterval(t);
  }, [stage, error]);

  useEffect(() => {
    if (started.current === run) return;
    started.current = run;
    const timed = async <T,>(p: Promise<T>) => (await Promise.all([p, wait(MIN_MS)]))[0];
    const fail = (m: string) => setError(m);
    (async () => {
      try {
        setError('');
        setStage(0);
        const r = await timed(read(draftId));
        if (!r.ok) return fail(r.message);
        if (r.done) return router.replace(`/start/${draftId}/ready`);
        setDetails((d) => [`Read ${r.sections} sections and ${r.answered} answers`, d[1]!, d[2]!]);
        setValue(BANDS[0][1]);
        setStage(1);
        const p = await timed(plan(draftId));
        if (!p.ok) return fail(p.message);
        setPages(p.pages);
        setDetails((d) => [
          d[0]!,
          `${p.pages.length} pages planned: ${p.pages.slice(0, 3).join(', ')}${p.pages.length > 3 ? ` and ${p.pages.length - 3} more` : ''}`,
          d[2]!,
        ]);
        setValue(BANDS[1][1]);
        setStage(2);
        const w = await timed(write(draftId));
        if (!w.ok) return fail(w.message);
        setDetails((d) => [d[0]!, d[1]!, `Priced from ${agencyName}’s rate card`]);
        setValue(1);
        setStage(3);
      } catch {
        fail('We lost the connection for a moment. Your answers are safe: try again.');
      }
    })();
  }, [run, draftId, read, plan, write, agencyName, router]);

  const done = stage === 3;
  const labels = ['Reading your answers', 'Planning pages', 'Calculating estimate'];
  const waiting = [
    'Reading your sections of answers',
    'Working out which pages you need',
    `Using ${agencyName}’s own prices`,
  ];
  const now = done ? 'All three steps complete' : `${labels[stage]}…`;

  return (
    <main id="main" className="as paper-grid">
      <div className="sketch" aria-hidden="true">
        {pages.length > 0 && (
          <div className="tree">
            <span className="node root">{pages[0]}</span>
            <span className="vstem" style={{ ['--d' as string]: '100ms' } as CSSProperties} />
            <div className="kids">
              {pages.slice(1).map((p, i) => (
                <div
                  key={p}
                  className="kid"
                  style={{ ['--d' as string]: `${200 + i * 80}ms` } as CSSProperties}
                >
                  <span
                    className="node sub"
                    style={{ ['--d' as string]: `${200 + i * 80}ms` } as CSSProperties}
                  >
                    {p}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="as-card card float" role="status" aria-live="polite">
        {done ? (
          <div className="col a-in-y" style={{ gap: 10 }}>
            <p className="eyebrow brass">Done</p>
            <h1 className="d-2">Your brief is ready</h1>
            <p className="muted">{agencyName} will check it before anything is final.</p>
          </div>
        ) : (
          <div className="col" style={{ gap: 10 }}>
            <p className="eyebrow">{business} · new website</p>
            <h1 className="d-2">Assembling your brief</h1>
            <p className="muted">This usually takes under a minute. Please keep this page open.</p>
          </div>
        )}
        <div className="col" style={{ gap: 10 }}>
          <div className="row between t-sm">
            <span className="w5">{error ? 'Paused' : now}</span>
            <span className="mono brass">{Math.round(value * 100)}%</span>
          </div>
          <ProgressBar value={value} label="Brief progress" />
        </div>
        <ol>
          {labels.map((l, i) => {
            const isDone = stage > i;
            const isNow = stage === i && !done;
            return (
              <li key={l} className="stg">
                <span className={isDone ? 'dot done' : isNow ? 'dot now' : 'dot'}>
                  {isDone ? <Icon name="check" size="sm" /> : i + 1}
                </span>
                <span className="col" style={{ gap: 2 }}>
                  <span className={isNow ? 'w5 brass' : isDone ? 'w5' : 'muted'}>{l}</span>
                  <span className="t-sm muted">{isDone ? details[i] : waiting[i]}</span>
                </span>
              </li>
            );
          })}
        </ol>
        {error && (
          <div className="note note-err" role="alert">
            <Icon name="alert" />
            <span className="grow">{error}</span>
            <Button size="sm" onClick={() => setRun((r) => r + 1)}>
              Try again
            </Button>
          </div>
        )}
        {done && (
          <Button
            variant="primary"
            size="lg"
            iconAfter="arrowRight"
            className="a-in-y"
            onClick={() => router.push(`/start/${draftId}/ready`)}
            autoFocus
          >
            See your brief
          </Button>
        )}
      </div>
    </main>
  );
}
