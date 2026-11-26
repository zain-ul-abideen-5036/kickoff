import Link from 'next/link';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { Icon, type IconName } from '../icons';
import { cx } from './cx';

type Variant = 'primary' | 'secondary' | 'ghost' | 'quiet' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface Common {
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  iconAfter?: IconName;
  /** Icon-only buttons must have a label for screen readers. */
  iconOnly?: boolean;
  loading?: boolean;
  children?: ReactNode;
}

function classes({ variant = 'secondary', size = 'md', iconOnly }: Common, extra?: string) {
  return cx('btn', `btn-${variant}`, size !== 'md' && `btn-${size}`, iconOnly && 'btn-icon', extra);
}

function Inner({ icon, iconAfter, loading, children, size }: Common) {
  const s = size === 'sm' ? 'sm' : 'md';
  return (
    <>
      {loading ? <span className="spin" aria-hidden="true" /> : icon && <Icon name={icon} size={s} />}
      {children}
      {iconAfter && <Icon name={iconAfter} size={s} />}
    </>
  );
}

export function Button({
  variant,
  size,
  icon,
  iconAfter,
  iconOnly,
  loading,
  className,
  children,
  type = 'button',
  disabled,
  ...rest
}: Common & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={classes({ variant, size, iconOnly }, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      <Inner icon={icon} iconAfter={iconAfter} loading={loading} size={size}>
        {children}
      </Inner>
    </button>
  );
}

/** A link styled as a button. Internal links use next/link. */
export function ButtonLink({
  href,
  variant,
  size,
  icon,
  iconAfter,
  iconOnly,
  className,
  children,
  ...rest
}: Common & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  const cls = classes({ variant, size, iconOnly }, className);
  const inner = (
    <Inner icon={icon} iconAfter={iconAfter} size={size}>
      {children}
    </Inner>
  );
  if (/^(https?:|mailto:|#)/.test(href))
    return (
      <a href={href} className={cls} {...rest}>
        {inner}
      </a>
    );
  return (
    <Link href={href} className={cls} {...rest}>
      {inner}
    </Link>
  );
}
