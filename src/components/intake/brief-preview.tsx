'use client';

import type { CSSProperties } from 'react';
import { Icon } from '@/components/icons';
import { PriorityChip } from '@/components/ui/badges';
import type { Preview, ScreenKey } from './model';

const delay = (ms: number) => ({ ['--d' as string]: `${ms}ms` }) as CSSProperties;

/**
 * The brief building itself. Each section mounts the first time its step is reached, so the
 * slide-in and brass wash play once; the sitemap and feature chips stagger in.
 */
export function BriefPreview({
  preview,
  current,
  agencyName,
  onClose,
}: {
  preview: Preview;
  current: ScreenKey;
  agencyName: string;
  onClose: () => void;
}) {
  const fresh = (k: ScreenKey) => (current === k ? 'pv-sec fresh' : 'pv-sec');
  return (
    <aside className="pv card float" aria-label="Your brief so far">
      <span className="pv-grip" aria-hidden="true" />
      <div className="row between">
        <span className="eyebrow">Your brief · draft</span>
        <span className="row t-xs muted" style={{ gap: 6 }}>
          <i className="live-dot" />
          Builds as you answer
        </span>
        <button
          type="button"
          className="btn btn-ghost btn-sm btn-icon pv-close"
          onClick={onClose}
          aria-label="Close brief preview"
        >
          <Icon name="close" />
        </button>
      </div>
      <div>
        <h2 className="d-3">{preview.title}</h2>
        <p className="t-sm muted">New website · prepared for {agencyName}</p>
      </div>

      <div className={fresh('about')}>
        <h3>Summary</h3>
        <p className="t-sm">{preview.summary}</p>
      </div>

      {preview.goals && (
        <div className={fresh('goals')}>
          <h3>Goals</h3>
          {preview.goals.length ? (
            <ul className="col" style={{ gap: 6 }}>
              {preview.goals.map((g) => (
                <li key={g} className="row t-sm a-in-y" style={{ gap: 8 }}>
                  <Icon name="target" size="sm" className="brass" />
                  {g}
                </li>
              ))}
            </ul>
          ) : (
            <p className="t-sm muted">Choose a goal to see it here.</p>
          )}
        </div>
      )}

      {preview.audience && (
        <div className={fresh('audience')}>
          <h3>Audience</h3>
          <p className="t-sm">{preview.audience}</p>
        </div>
      )}

      {preview.pages && (
        <div className={fresh('features')}>
          <h3>
            Pages · <span className="mono">{preview.pages.length}</span>
          </h3>
          <div className="tree outline">
            <span className="node root">{preview.pages[0]?.label ?? 'Home'}</span>
            <span className="vstem" style={delay(120)} />
            <div className="kids">
              {preview.pages.slice(1).map((p, i) => (
                <div key={p.id} className="kid" style={delay(200 + i * 80)}>
                  <span className="node" style={delay(200 + i * 80)}>
                    {p.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {preview.features && (
        <div className={fresh('features')}>
          <h3>Features</h3>
          <div className="col" style={{ gap: 6 }}>
            {preview.features.map((f, i) => (
              <div key={f.id} className="row t-sm a-pop" style={{ gap: 10, ...delay(i * 80) }}>
                <span style={{ width: 64, display: 'inline-flex', justifyContent: 'center' }}>
                  <PriorityChip priority={f.priority} />
                </span>
                {f.label}
              </div>
            ))}
          </div>
        </div>
      )}

      {preview.content && (
        <div className={fresh('content')}>
          <h3>Content</h3>
          <div className="row wrapf t-sm" style={{ gap: 14 }}>
            {preview.content.map((c) => (
              <span key={c.label} className={c.ready ? 'row' : 'row muted'} style={{ gap: 6 }}>
                <Icon name={c.ready ? 'check' : 'close'} size="sm" />
                {c.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {preview.look && (
        <div className={fresh('inspiration')}>
          <h3>Look and feel</h3>
          <p className="t-sm">{preview.look}</p>
        </div>
      )}

      {preview.budget && (
        <div className={fresh('budget')}>
          <h3>Budget and timing</h3>
          <p className="t-sm mono">{preview.budget}</p>
        </div>
      )}

      {preview.details && (
        <div className={fresh('followups')}>
          <h3>Details</h3>
          <p className="t-sm">{preview.details}</p>
        </div>
      )}

      {preview.pending.length > 0 && (
        <div className="pv-sec pending">
          <h3>Still to come</h3>
          {preview.pending.map((p) => (
            <div key={p} className="row" style={{ gap: 12 }}>
              <span className="t-xs muted" style={{ width: 120 }}>
                {p}
              </span>
              <span className="sk" style={{ height: 8, flex: 1 }} />
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}
