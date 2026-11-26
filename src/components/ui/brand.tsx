import type { CSSProperties } from 'react';
import { KickoffMark } from '../icons';

/** Two-letter monogram from the agency name: "Studio North" → "SN". */
export function monogram(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'K';
  const letters = words.length === 1 ? words[0]!.slice(0, 2) : `${words[0]![0]}${words[1]![0]}`;
  return letters.toUpperCase();
}

/**
 * The agency's logo, or a monogram tile in their brand colour. Appears in the intake header,
 * shared view, PDF and emails.
 */
export function AgencyMark({
  name,
  color,
  logoUrl,
  size = 36,
  inverted,
}: {
  name: string;
  color: string;
  logoUrl?: string | null;
  size?: number;
  inverted?: boolean;
}) {
  if (logoUrl)
    // A user-uploaded logo of unknown dimensions: next/image would need a fixed size.
    return (
      <img
        src={logoUrl}
        alt=""
        width={size}
        height={size}
        style={{ objectFit: 'contain', borderRadius: 7 }}
      />
    );
  const style = {
    width: size,
    height: size,
    fontSize: Math.round(size * 0.42),
    background: inverted ? '#F7F5EF' : color,
    color: inverted ? color : '#F7F5EF',
  } as CSSProperties;
  return (
    <span className="logo-sn" style={style} aria-hidden="true">
      {monogram(name)}
    </span>
  );
}

export function AgencyLockup({
  name,
  color,
  logoUrl,
}: {
  name: string;
  color: string;
  logoUrl?: string | null;
}) {
  return (
    <span className="row" style={{ gap: 10 }}>
      <AgencyMark name={name} color={color} logoUrl={logoUrl} />
      <span className="w5">{name}</span>
    </span>
  );
}

export function KickoffWordmark({ size = 'md' }: { size?: 'md' | 'lg' }) {
  return (
    <span className="row" style={{ gap: 8 }}>
      <KickoffMark size={size} />
      <span className="serif" style={{ fontSize: size === 'lg' ? 22 : 19, fontWeight: 500 }}>
        Kickoff
      </span>
    </span>
  );
}

export function PoweredBy() {
  return (
    <span className="t-xs muted">
      Powered by{' '}
      <span className="serif" style={{ color: 'var(--ink)' }}>
        Kickoff
      </span>
    </span>
  );
}
