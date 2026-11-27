'use client';

import { useId, type ReactNode } from 'react';
import { cx } from './cx';

export interface Choice<T extends string> {
  id: T;
  label: string;
  sub?: string;
}

/** The check that draws in when a chip is selected. */
function ChipBox() {
  return (
    <span className="box" aria-hidden="true">
      <svg viewBox="0 0 24 24">
        <path d="M5 12.5l4.5 4.5L19 7.5" />
      </svg>
    </span>
  );
}

interface GroupProps {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  /** Visually hide the group label when the step heading already says it. */
  hideLabel?: boolean;
}

function GroupLabel({ id, label, hideLabel }: { id: string; label: ReactNode; hideLabel?: boolean }) {
  return (
    <span className={hideLabel ? 'sr-only' : 'label'} id={id}>
      {label}
    </span>
  );
}

function GroupMessages({ error, hint, id }: { error?: string; hint?: ReactNode; id: string }) {
  return (
    <>
      {error && (
        <span className="err-msg" id={`${id}-err`} role="alert">
          {error}
        </span>
      )}
      {hint && <span className="hint">{hint}</span>}
    </>
  );
}

/**
 * Multi-select chips. Each chip is a toggle button with aria-pressed, so it works with
 * Tab and Space/Enter and announces its state.
 */
export function ChipGroup<T extends string>({
  label,
  hint,
  error,
  hideLabel,
  options,
  value,
  onChange,
  max,
  cards,
}: GroupProps & {
  options: readonly Choice<T>[];
  value: T[];
  onChange: (next: T[]) => void;
  max?: number;
  cards?: boolean;
}) {
  const id = useId();
  const full = max !== undefined && value.length >= max;
  return (
    <div className="field">
      <GroupLabel id={id} label={label} hideLabel={hideLabel} />
      <div
        className={cards ? 'g2' : 'chips'}
        style={cards ? { gap: 10 } : undefined}
        role="group"
        aria-labelledby={id}
        aria-describedby={error ? `${id}-err` : undefined}
      >
        {options.map((o) => {
          const on = value.includes(o.id);
          return (
            <button
              key={o.id}
              type="button"
              className={cx('chip', on && 'on', cards && 'chip-card')}
              aria-pressed={on}
              aria-disabled={!on && full ? true : undefined}
              onClick={() => {
                if (on) onChange(value.filter((v) => v !== o.id));
                else if (!full) onChange([...value, o.id]);
              }}
            >
              <ChipBox />
              {cards ? (
                <span>
                  <span className="w5">{o.label}</span>
                  {o.sub && <span className="sub">{o.sub}</span>}
                </span>
              ) : (
                o.label
              )}
            </button>
          );
        })}
      </div>
      <GroupMessages error={error} hint={hint} id={id} />
    </div>
  );
}

/** Single-select chips, for choices that read better as chips than as a segmented control. */
export function ChipSelect<T extends string>({
  label,
  hint,
  error,
  hideLabel,
  options,
  value,
  onChange,
}: GroupProps & { options: readonly Choice<T>[]; value: T; onChange: (next: T) => void }) {
  const id = useId();
  return (
    <div className="field">
      <GroupLabel id={id} label={label} hideLabel={hideLabel} />
      <div className="chips" role="radiogroup" aria-labelledby={id}>
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={value === o.id}
            className={cx('chip', value === o.id && 'on')}
            onClick={() => onChange(o.id)}
          >
            <ChipBox />
            {o.label}
          </button>
        ))}
      </div>
      <GroupMessages error={error} hint={hint} id={id} />
    </div>
  );
}

/** A segmented control for ranges and short single choices. Arrow keys move the selection. */
export function Segmented<T extends string>({
  label,
  hint,
  hideLabel,
  options,
  value,
  onChange,
  size,
  fillMobile = true,
  mono,
}: GroupProps & {
  options: readonly { id: T; label: string }[];
  value: T;
  onChange: (next: T) => void;
  size?: 'sm';
  fillMobile?: boolean;
  mono?: boolean;
}) {
  const id = useId();
  const move = (dir: number) => {
    const i = options.findIndex((o) => o.id === value);
    const next = options[(i + dir + options.length) % options.length];
    if (next) onChange(next.id);
  };
  return (
    <div className="field">
      <GroupLabel id={id} label={label} hideLabel={hideLabel} />
      <div
        className={cx('seg', size === 'sm' && 'seg-sm', fillMobile && 'fill-m')}
        role="radiogroup"
        aria-labelledby={id}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault();
            move(1);
          } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            move(-1);
          }
        }}
      >
        {options.map((o, i) => (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={value === o.id}
            tabIndex={value === o.id || (i === 0 && !options.some((x) => x.id === value)) ? 0 : -1}
            className={mono ? 'mono' : undefined}
            onClick={() => onChange(o.id)}
          >
            {o.label}
          </button>
        ))}
      </div>
      {hint && <span className="hint">{hint}</span>}
    </div>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="row between" style={{ gap: 16 }}>
      <span className="col">
        <span className="w5 t-sm" id={`${id}-l`}>
          {label}
        </span>
        {description && <span className="t-xs muted">{description}</span>}
      </span>
      <button
        type="button"
        role="switch"
        className="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-l`}
        disabled={disabled}
        onClick={() => onChange(!checked)}
      />
    </div>
  );
}

/**
 * Two-thumb range for the age band. Uses two native range inputs layered on one track, so
 * keyboard and screen reader support come for free.
 */
export function RangePair({
  label,
  min,
  max,
  low,
  high,
  onChange,
  format = String,
}: {
  label: string;
  min: number;
  max: number;
  low: number;
  high: number;
  onChange: (low: number, high: number) => void;
  format?: (n: number) => string;
}) {
  const id = useId();
  const pct = (n: number) => ((n - min) / (max - min)) * 100;
  return (
    <div className="field">
      <div className="row between">
        <span className="label" id={id}>
          {label}
        </span>
        <span className="mono brass w5">
          {format(low)}–{format(high)}
        </span>
      </div>
      <div className="range range-pair" role="group" aria-labelledby={id}>
        <span className="track" />
        <span className="fill" style={{ left: `${pct(low)}%`, width: `${pct(high) - pct(low)}%` }} />
        <input
          type="range"
          min={min}
          max={max}
          value={low}
          aria-label={`Youngest age, ${low}`}
          onChange={(e) => onChange(Math.min(Number(e.target.value), high), high)}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={high}
          aria-label={`Oldest age, ${high}`}
          onChange={(e) => onChange(low, Math.max(Number(e.target.value), low))}
        />
      </div>
      <div className="range-scale" aria-hidden="true">
        <span>{format(min)}</span>
        <span>{format(Math.round((min + max) / 2))}</span>
        <span>{format(max)}+</span>
      </div>
    </div>
  );
}
