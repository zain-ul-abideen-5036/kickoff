import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { BrandAccent } from '@/components/app/brand-accent';
import { getSettings } from '@/lib/server/context';
import './intake.css';

export const metadata: Metadata = {
  title: 'Tell us about your project',
  robots: { index: false },
};

/** The client-facing intake. Branding comes from the studio's settings on each page. */
export default async function StartLayout({ children }: { children: ReactNode }) {
  const settings = await getSettings();
  return <BrandAccent agency={settings.agency}>{children}</BrandAccent>;
}
