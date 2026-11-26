import type { ReactNode } from 'react';
import { AppShell } from '@/components/app/app-shell';
import '@/components/app/shell.css';
import { listBriefs } from '@/lib/repo/briefs-repo';
import { appUrl, getSettings, logoUrl, requireOwner } from '@/lib/server/context';
import { getStore } from '@/lib/store';

/** Everything under the agency workspace requires the signed-in studio owner. */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const owner = await requireOwner();
  const settings = await getSettings();
  const briefs = await listBriefs(getStore());
  return (
    <AppShell
      agency={{ name: settings.agency.name, color: settings.agency.brandColor, logoUrl: logoUrl(settings) }}
      owner={{ name: owner.name, email: owner.email }}
      intakeUrl={`${appUrl()}/start`}
      briefCount={briefs.length}
    >
      {children}
    </AppShell>
  );
}
