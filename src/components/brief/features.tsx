'use client';

import { useState } from 'react';
import type { Edit } from '@/lib/brief-edit/edits';
import { PRIORITIES, type FeatureItem, type Priority } from '@/lib/domain/brief';
import { GripIcon, Icon } from '../icons';
import { PriorityChip } from '../ui/badges';
import { cx } from '../ui/cx';

/** Must, Should and Could columns. Drag chips between them, or use the arrow buttons. */
export function FeatureColumns({
  features,
  editable,
  onEdit,
}: {
  features: FeatureItem[];
  editable: boolean;
  onEdit?: (e: Edit) => void;
}) {
  const [drag, setDrag] = useState<string | null>(null);
  const [over, setOver] = useState<Priority | null>(null);
  return (
    <div className="g3 fcols" style={{ gap: 12 }}>
      {PRIORITIES.map((p, gi) => {
        const items = features.filter((f) => f.priority === p);
        return (
          <div
            key={p}
            className={cx('fcol', over === p && 'over')}
            aria-label={`${p} features`}
            role="group"
            onDragOver={
              editable
                ? (e) => {
                    e.preventDefault();
                    if (over !== p) setOver(p);
                  }
                : undefined
            }
            onDragLeave={editable ? () => setOver(null) : undefined}
            onDrop={
              editable
                ? (e) => {
                    e.preventDefault();
                    if (drag) onEdit?.({ type: 'feature.move', id: drag, priority: p });
                    setDrag(null);
                    setOver(null);
                  }
                : undefined
            }
          >
            <div className="row between">
              <PriorityChip priority={p} />
              <span className="mono t-xs muted">{items.length}</span>
            </div>
            {items.map((f, i) => (
              <div
                key={f.id}
                className={cx('fchip a-in-y', drag === f.id && 'lifted')}
                style={{ ['--d' as string]: `${i * 80}ms` }}
                draggable={editable}
                onDragStart={editable ? () => setDrag(f.id) : undefined}
                onDragEnd={editable ? () => setDrag(null) : undefined}
              >
                {editable && (
                  <span className="grip" aria-hidden="true">
                    <GripIcon />
                  </span>
                )}
                <span className="grow">{f.label}</span>
                {editable && (
                  <span className="mv">
                    {gi > 0 && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm btn-icon mv-btn"
                        aria-label={`Move ${f.label} to ${PRIORITIES[gi - 1]}`}
                        onClick={() =>
                          onEdit?.({ type: 'feature.move', id: f.id, priority: PRIORITIES[gi - 1]! })
                        }
                      >
                        <Icon name="chevronLeft" size="sm" />
                      </button>
                    )}
                    {gi < 2 && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm btn-icon mv-btn"
                        aria-label={`Move ${f.label} to ${PRIORITIES[gi + 1]}`}
                        onClick={() =>
                          onEdit?.({ type: 'feature.move', id: f.id, priority: PRIORITIES[gi + 1]! })
                        }
                      >
                        <Icon name="chevronRight" size="sm" />
                      </button>
                    )}
                  </span>
                )}
              </div>
            ))}
            {over === p && <div className="dropzone">Drop to make it {p}</div>}
            {items.length === 0 && over !== p && <p className="t-xs muted fcol-empty">None yet</p>}
          </div>
        );
      })}
    </div>
  );
}
