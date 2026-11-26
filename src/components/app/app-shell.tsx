'use client';

import { useState, type ReactNode } from 'react';
import { signOut } from '@/app/(auth)/actions';
import { Icon } from '../icons';
import { AgencyMark, KickoffWordmark } from '../ui/brand';
import { ThemeToggle } from '../ui/theme-toggle';
import { CopyButton } from './copy-button';
import { NavLinks } from './nav-links';

export interface ShellProps {
  agency: { name: string; color: string; logoUrl: string | null };
  owner: { name: string; email: string };
  intakeUrl: string;
  briefCount?: number;
  children: ReactNode;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');
}

/**
 * The agency workspace frame: sidebar on wide screens, a top bar with a menu drawer on phones.
 * The sidebar never sticks or uses 100vh, so it simply stacks above content on small screens.
 */
export function AppShell({ agency, owner, intakeUrl, briefCount, children }: ShellProps) {
  const [open, setOpen] = useState(false);
  const side = (
    <>
      <div className="row between" style={{ padding: '4px 6px' }}>
        <KickoffWordmark />
        <ThemeToggle />
      </div>
      <div className="row shell-agency">
        <AgencyMark name={agency.name} color={agency.color} logoUrl={agency.logoUrl} size={26} />
        <span className="grow w5 t-sm">{agency.name}</span>
      </div>
      <NavLinks count={briefCount} onNavigate={() => setOpen(false)} />
      <div className="note t-xs shell-intake">
        <span className="w5" style={{ fontSize: 13 }}>
          Your intake link
        </span>
        <span className="mono muted shell-url">{intakeUrl.replace(/^https?:\/\//, '')}</span>
        <CopyButton text={intakeUrl} done="Intake link copied" />
      </div>
      <div className="row" style={{ gap: 10, padding: '0 6px' }}>
        <span className="shell-avatar" aria-hidden="true">
          {initials(owner.name)}
        </span>
        <span className="col grow" style={{ minWidth: 0 }}>
          <span className="t-sm w5">{owner.name}</span>
          <span className="t-xs muted">Owner</span>
        </span>
        <form action={signOut}>
          <button
            type="submit"
            className="btn btn-ghost btn-sm btn-icon"
            aria-label="Sign out"
            title="Sign out"
          >
            <Icon name="logout" />
          </button>
        </form>
      </div>
    </>
  );
  return (
    <div className="shell">
      <aside className="shell-side" aria-label="Workspace">
        {side}
      </aside>
      <div className="shell-top no-print">
        <button
          type="button"
          className="btn btn-ghost btn-sm btn-icon"
          aria-label="Open menu"
          aria-expanded={open}
          aria-controls="shell-drawer"
          onClick={() => setOpen(true)}
        >
          <Icon name="menu" />
        </button>
        <KickoffWordmark />
        <AgencyMark name={agency.name} color={agency.color} logoUrl={agency.logoUrl} size={28} />
      </div>
      {open && (
        <div className="shell-drawer-wrap" onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}>
          <button
            type="button"
            className="scrim shell-scrim"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <div id="shell-drawer" className="shell-drawer" role="dialog" aria-modal="true" aria-label="Menu">
            {side}
          </div>
        </div>
      )}
      <div className="shell-main" id="main">
        {children}
      </div>
    </div>
  );
}
