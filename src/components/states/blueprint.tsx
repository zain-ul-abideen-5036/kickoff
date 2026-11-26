import type { ReactNode } from 'react';

/**
 * The faint blueprint sketch used on empty and error states: a root page with dashed child
 * nodes. Decorative only.
 */
export function BlueprintSketch({
  root = 'Your first brief',
  kids = ['Pages', 'Features', 'Estimate'],
}: {
  root?: string;
  kids?: string[];
}) {
  return (
    <div className="tree ghost-tree" aria-hidden="true">
      <span className="node root">{root}</span>
      <span className="vstem" />
      <div className="kids">
        {kids.map((k, i) => (
          <div key={`${k}-${i}`} className="kid" style={{ ['--d' as string]: `${120 + i * 80}ms` }}>
            <span className="node" style={{ ['--d' as string]: `${120 + i * 80}ms` }}>
              {k}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** A centred empty or error state: sketch, heading, one line of help, one or two actions. */
export function StatePanel({
  eyebrow,
  title,
  body,
  actions,
  sketch,
  as: Heading = 'h1',
}: {
  eyebrow?: string;
  title: string;
  body: ReactNode;
  actions?: ReactNode;
  sketch?: ReactNode;
  as?: 'h1' | 'h2';
}) {
  return (
    <div className="card paper-grid state-panel">
      {sketch ?? <BlueprintSketch />}
      {eyebrow && <p className="eyebrow mono">{eyebrow}</p>}
      <Heading className="d-1">{title}</Heading>
      <p className="muted" style={{ maxWidth: '46ch' }}>
        {body}
      </p>
      {actions && (
        <div className="row wrapf" style={{ gap: 10, justifyContent: 'center' }}>
          {actions}
        </div>
      )}
    </div>
  );
}
