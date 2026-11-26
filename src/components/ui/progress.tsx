import { cx } from './cx';

/** A bar that fills with a transform, so it animates smoothly and respects reduced motion. */
export function ProgressBar({ value, label }: { value: number; label: string }) {
  const v = Math.max(0, Math.min(1, value));
  return (
    <div
      className="progress"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(v * 100)}
    >
      <i style={{ transform: `scaleX(${v})` }} />
    </div>
  );
}

/** The seven-step stepper shown above the intake on wider screens. */
export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="steps" aria-label="Progress">
      {steps.map((label, i) => (
        <li
          key={label}
          className={cx(i < current && 'done', i === current && 'now')}
          aria-current={i === current ? 'step' : undefined}
        >
          <span className="bar">
            <i />
          </span>
          <span>
            <span className="mono">{String(i + 1).padStart(2, '0')}</span> {label}
          </span>
        </li>
      ))}
    </ol>
  );
}
