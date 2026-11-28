import type { CSSProperties, ReactNode } from 'react';
import type { Settings } from '@/lib/domain/settings';

/**
 * The CSS variables that swap brass for the studio's brand colour, or undefined to keep brass.
 * The colour was checked for 4.5:1 against ivory when it was saved; the stylesheet applies it in
 * the light theme only, because a dark brand colour would fail on dark paper.
 */
export function accentVars(agency: Settings['agency']): CSSProperties | undefined {
  if (agency.accent !== 'brand') return undefined;
  return { ['--agency-accent' as string]: agency.brandColor };
}

/** Wraps client-facing pages so buttons, the active step and key figures use the studio's colour. */
export function BrandAccent({ agency, children }: { agency: Settings['agency']; children: ReactNode }) {
  const vars = accentVars(agency);
  if (!vars) return <>{children}</>;
  return (
    <div className="brand-accent" style={vars}>
      {children}
    </div>
  );
}
