import type { Metadata } from 'next';
import { NotificationsForm } from '@/components/settings/notifications-form';
import { emailConfigFromEnv, emailEnabled } from '@/lib/email/send';
import { getSettings } from '@/lib/server/context';

export const metadata: Metadata = { title: 'Notifications · Settings' };

export default async function NotificationsPage() {
  const settings = await getSettings();
  return (
    <NotificationsForm
      notifications={settings.notifications}
      shareDays={settings.shareDays}
      emailConfigured={emailEnabled(emailConfigFromEnv())}
    />
  );
}
