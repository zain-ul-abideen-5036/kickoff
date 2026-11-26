'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon, type IconName } from '../icons';

const LINKS: { href: string; label: string; icon: IconName; match: (p: string) => boolean }[] = [
  { href: '/briefs', label: 'Briefs', icon: 'brief', match: (p) => p.startsWith('/briefs') },
  { href: '/settings/rates', label: 'Rate card', icon: 'tag', match: (p) => p.startsWith('/settings/rates') },
  {
    href: '/settings',
    label: 'Settings',
    icon: 'settings',
    match: (p) => p.startsWith('/settings') && !p.startsWith('/settings/rates'),
  },
];

/** Workspace navigation; the current page is marked for screen readers and styled. */
export function NavLinks({ count, onNavigate }: { count?: number; onNavigate?: () => void }) {
  const path = usePathname() ?? '';
  return (
    <nav className="nav col" style={{ gap: 2 }} aria-label="Workspace">
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          aria-current={l.match(path) ? 'page' : undefined}
          onClick={onNavigate}
        >
          <Icon name={l.icon} />
          {l.label}
          {l.href === '/briefs' && count !== undefined && (
            <span className="mono t-xs muted" style={{ marginLeft: 'auto' }}>
              {count}
            </span>
          )}
        </Link>
      ))}
      <a href="/start" target="_blank" rel="noopener">
        <Icon name="link" />
        Intake form
        <span className="sr-only">(opens in a new tab)</span>
      </a>
    </nav>
  );
}
