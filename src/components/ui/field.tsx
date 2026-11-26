'use client';

import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { Icon, type IconName } from '../icons';
import { cx } from './cx';

interface FieldShell {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  /** Shown after the label in muted type. */
  optional?: boolean;
  success?: string;
  className?: string;
}

/** Wires label, hint and error to the control with ids so screen readers announce them. */
function useFieldIds(error?: string, hint?: ReactNode, success?: string) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-err` : undefined;
  const okId = success && !error ? `${id}-ok` : undefined;
  const describedBy = [errId, okId, hintId].filter(Boolean).join(' ') || undefined;
  return { id, hintId, errId, okId, describedBy };
}

function Messages({
  error,
  hint,
  success,
  ids,
}: Pick<FieldShell, 'error' | 'hint' | 'success'> & { ids: ReturnType<typeof useFieldIds> }) {
  return (
    <>
      {error && (
        <span className="err-msg" id={ids.errId}>
          <Icon name="info" size="sm" />
          {error}
        </span>
      )}
      {!error && success && (
        <span className="ok-msg" id={ids.okId}>
          <Icon name="check" size="sm" />
          {success}
        </span>
      )}
      {hint && (
        <span className="hint" id={ids.hintId}>
          {hint}
        </span>
      )}
    </>
  );
}

function Label({ htmlFor, label, optional }: { htmlFor: string; label: ReactNode; optional?: boolean }) {
  return (
    <label className="label" htmlFor={htmlFor}>
      {label} {optional && <span className="opt">Optional</span>}
    </label>
  );
}

export function TextField({
  label,
  hint,
  error,
  optional,
  success,
  className,
  icon,
  ...input
}: FieldShell & InputHTMLAttributes<HTMLInputElement> & { icon?: IconName }) {
  const ids = useFieldIds(error, hint, success);
  const control = (
    <input
      id={ids.id}
      className={cx('input', error && 'err')}
      aria-invalid={error ? true : undefined}
      aria-describedby={ids.describedBy}
      {...input}
    />
  );
  return (
    <div className={cx('field', className)}>
      <Label htmlFor={ids.id} label={label} optional={optional} />
      {icon ? (
        <div className="affix">
          <Icon name={icon} />
          {control}
        </div>
      ) : (
        control
      )}
      <Messages error={error} hint={hint} success={success} ids={ids} />
    </div>
  );
}

export function TextAreaField({
  label,
  hint,
  error,
  optional,
  className,
  ...area
}: FieldShell & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const ids = useFieldIds(error, hint);
  return (
    <div className={cx('field', className)}>
      <Label htmlFor={ids.id} label={label} optional={optional} />
      <textarea
        id={ids.id}
        className={cx('input', error && 'err')}
        aria-invalid={error ? true : undefined}
        aria-describedby={ids.describedBy}
        {...area}
      />
      <Messages error={error} hint={hint} ids={ids} />
    </div>
  );
}

export function SelectField({
  label,
  hint,
  error,
  className,
  children,
  ...select
}: FieldShell & SelectHTMLAttributes<HTMLSelectElement>) {
  const ids = useFieldIds(error, hint);
  return (
    <div className={cx('field', className)}>
      <Label htmlFor={ids.id} label={label} />
      <select
        id={ids.id}
        className={cx('input', error && 'err')}
        aria-invalid={error ? true : undefined}
        aria-describedby={ids.describedBy}
        {...select}
      >
        {children}
      </select>
      <Messages error={error} hint={hint} ids={ids} />
    </div>
  );
}
