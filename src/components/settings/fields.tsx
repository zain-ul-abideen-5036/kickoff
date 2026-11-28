'use client';

import { useId, useState, type ReactNode } from 'react';
import { Switch } from '../ui/choices';

/** A labelled settings group: label and hint on the left, controls on the right. */
export function Group({ title, hint, children }: { title: string; hint?: ReactNode; children: ReactNode }) {
  const id = useId();
  return (
    <section className="set-grp" aria-labelledby={id}>
      <div className="set-grp-l">
        <h2 className="label" id={id}>
          {title}
        </h2>
        {hint && <span className="hint">{hint}</span>}
      </div>
      <div style={{ minWidth: 0 }}>{children}</div>
    </section>
  );
}

/** One row of a price or week list: label on the left, a short input with a unit on the right. */
export function UnitRow({
  label,
  name,
  defaultValue,
  error,
  prefix,
  suffix,
  inputMode = 'numeric',
}: {
  label: string;
  name: string;
  defaultValue: string | number;
  error?: string;
  prefix?: string;
  suffix?: string;
  inputMode?: 'numeric' | 'decimal';
}) {
  const id = useId();
  return (
    <div className="set-rc">
      <label htmlFor={id} className="t-sm">
        {label}
      </label>
      <div>
        <span className={`set-money${error ? ' err' : ''}`}>
          {prefix && <span aria-hidden="true">{prefix}</span>}
          <input
            id={id}
            name={name}
            defaultValue={defaultValue}
            inputMode={inputMode}
            autoComplete="off"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-e` : undefined}
          />
          {suffix && <span aria-hidden="true">{suffix}</span>}
        </span>
        {error && (
          <span className="err-msg" id={`${id}-e`} style={{ marginTop: 4 }}>
            {error}
          </span>
        )}
      </div>
    </div>
  );
}

/** A switch that submits with its form, as "on" when checked (like a checkbox). */
export function FormSwitch({
  name,
  label,
  description,
  defaultChecked,
  disabled,
}: {
  name: string;
  label: string;
  description?: string;
  defaultChecked: boolean;
  disabled?: boolean;
}) {
  const [on, setOn] = useState(defaultChecked);
  return (
    <div className="set-tg">
      {on && <input type="hidden" name={name} value="on" />}
      <Switch label={label} description={description} checked={on} onChange={setOn} disabled={disabled} />
    </div>
  );
}
