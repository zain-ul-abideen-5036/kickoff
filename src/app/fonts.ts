import { Fraunces, Geist, Geist_Mono } from 'next/font/google';

/** Display serif with optical sizing, used large and confidently. */
export const fraunces = Fraunces({
  subsets: ['latin'],
  axes: ['opsz'],
  style: ['normal', 'italic'],
  variable: '--font-fraunces',
  display: 'swap',
});

/** UI and body grotesk. */
export const geist = Geist({ subsets: ['latin'], variable: '--font-geist', display: 'swap' });

/** Figures, prices, IDs and dates. */
export const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono', display: 'swap' });
