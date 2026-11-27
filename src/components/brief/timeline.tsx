'use client';

import { LAUNCHES } from '@/lib/domain/catalog';
import type { Edit } from '@/lib/brief-edit/edits';
import type { Phase } from '@/lib/domain/brief';
import { phaseSpans, totalWeeks } from '@/lib/engine/timeline';
import { Icon } from '../icons';

/** A construction-schedule timeline: bars grow left to right; the requested launch is marked. */
export function TimelineChart({
  phases,
  launchId,
  editable,
  onEdit,
}: {
  phases: Phase[];
  launchId: string;
  editable: boolean;
  onEdit?: (e: Edit) => void;
}) {
  const total = totalWeeks(phases);
  const spans = phaseSpans(phases);
  const launch = LAUNCHES.find((l) => l.id === launchId);
  const mark = launch && Number.isFinite(launch.weeks) && launch.weeks < total ? launch.weeks : null;
  const pct = (w: number) => `${(w / total) * 100}%`;
  const ticks = Array.from({ length: Math.ceil(total) }, (_, k) => k);
  return (
    <div className="tl">
      <span className="hide-m" />
      <div className="tl-ticks hide-m" aria-hidden="true">
        {ticks.map((k) => (
          <span key={k} style={{ left: pct(k) }}>
            W{k + 1}
          </span>
        ))}
      </div>
      {phases.map((p, i) => {
        const s = spans[i]!;
        const cls =
          i === phases.length - 1 ? 'tl-bar brassy' : p.id === 'content' ? 'tl-bar hatch' : 'tl-bar';
        return (
          <div key={p.id} className="tl-row">
            <div className="row between" style={{ gap: 8 }}>
              <span className="t-sm w5">{p.name}</span>
              {editable ? (
                <span className="wk" role="group" aria-label={`${p.name} length`}>
                  <button
                    type="button"
                    aria-label={`Shorten ${p.name}`}
                    disabled={p.weeks <= 0.5}
                    onClick={() => onEdit?.({ type: 'phase.weeks', id: p.id, weeks: p.weeks - 0.5 })}
                  >
                    <Icon name="minus" size="sm" />
                  </button>
                  <span className="mono t-sm" aria-live="polite">
                    {p.weeks}
                  </span>
                  <button
                    type="button"
                    aria-label={`Lengthen ${p.name}`}
                    onClick={() => onEdit?.({ type: 'phase.weeks', id: p.id, weeks: p.weeks + 0.5 })}
                  >
                    <Icon name="plus" size="sm" />
                  </button>
                </span>
              ) : (
                <span className="mono t-sm muted">{p.weeks} wk</span>
              )}
            </div>
            <div className="tl-track" style={{ backgroundSize: `calc(100% / ${total * 2}) 100%` }}>
              <span
                className={cls}
                style={{ left: pct(s.start), width: pct(p.weeks), ['--d' as string]: `${i * 80}ms` }}
              >
                {p.id === 'content' ? <span>{p.weeks}w</span> : `${p.weeks}w`}
              </span>
              {mark !== null && (
                <span className="tl-mark" style={{ left: pct(mark) }}>
                  {i === 0 && <b>Requested launch · wk {mark}</b>}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
