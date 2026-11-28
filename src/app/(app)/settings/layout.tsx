import type { ReactNode } from 'react';
import { SettingsTabs } from '@/components/settings/settings-tabs';
import '@/components/settings/settings.css';
import { requireOwner } from '@/lib/server/context';

/** Settings sections share one frame: tabs on the left, the section on the right. */
export default async function SettingsLayout({ children }: { children: ReactNode }) {
  await requireOwner();
  return (
    <main className="set-page">
      <SettingsTabs />
      <div style={{ minWidth: 0 }}>{children}</div>
    </main>
  );
}
