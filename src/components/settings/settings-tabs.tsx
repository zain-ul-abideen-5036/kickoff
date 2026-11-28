'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon, type IconName } from '../icons';

export const SETTINGS_TABS: { href: string; label: string; icon: IconName }[] = [
  { href: '/settings', label: 'Branding', icon: 'palette' },
  { href: '/settings/rates', label: 'Rate card', icon: 'tag' },
  { href: '/settings/timeline', label: 'Timeline and intake', icon: 'calendar' },
  { href: '/settings/ai', label: 'AI and privacy', icon: 'lock' },
  { href: '/settings/notifications', label: 'Notifications', icon: 'mail' },
];

/** Section navigation: a vertical list on desktop, a scrolling row on phones. */
export function SettingsTabs() {
  const path = usePathname() ?? '';
  return (
    <nav className="set-tabs" aria-label="Settings sections">
      {SETTINGS_TABS.map((t) => (
        <Link key={t.href} href={t.href} aria-current={path === t.href ? 'page' : undefined}>
          <Icon name={t.icon} />
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
