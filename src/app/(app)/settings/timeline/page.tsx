import type { Metadata } from 'next';
import { TimelineForm } from '@/components/settings/timeline-form';
import { getSettings } from '@/lib/server/context';

export const metadata: Metadata = { title: 'Timeline and intake · Settings' };

export default async function TimelinePage() {
  const settings = await getSettings();
  return <TimelineForm timeline={settings.timeline} intake={settings.intake} />;
}
