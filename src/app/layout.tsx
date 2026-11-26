import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { ToastProvider } from '@/components/ui/toast';
import { themeScript } from '@/lib/theme/script';
import { fraunces, geist, geistMono } from './fonts';
import './globals.css';
import './kickoff.css';
import './app.css';
import '@/components/states/states.css';

export const metadata: Metadata = {
  title: { default: 'Kickoff', template: '%s · Kickoff' },
  description: 'Every client brief, ready to quote — before the first call.',
  applicationName: 'Kickoff',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F7F5EF' },
    { media: '(prefers-color-scheme: dark)', color: '#0E1026' },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en-GB"
      className={`${fraunces.variable} ${geist.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <div className="ko">
          <ToastProvider>{children}</ToastProvider>
        </div>
      </body>
    </html>
  );
}
