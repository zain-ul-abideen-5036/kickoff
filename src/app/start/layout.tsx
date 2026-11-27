import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './intake.css';

export const metadata: Metadata = {
  title: 'Tell us about your project',
  robots: { index: false },
};

/** The client-facing intake. Branding comes from the studio's settings on each page. */
export default function StartLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
