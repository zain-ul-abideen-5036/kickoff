import type { Metadata } from 'next';
import { Anatomy } from '@/components/landing/anatomy';
import { Closing, SiteFooter } from '@/components/landing/closing';
import { Faq } from '@/components/landing/faq';
import { Hero } from '@/components/landing/hero';
import { HowItWorks } from '@/components/landing/how-it-works';
import '@/components/landing/landing.css';
import { PricingLogic } from '@/components/landing/pricing-logic';
import { Privacy } from '@/components/landing/privacy';
import { Problem } from '@/components/landing/problem';
import { SiteNav } from '@/components/landing/site-nav';
import { WhiteLabel } from '@/components/landing/white-label';

export const metadata: Metadata = {
  title: { absolute: 'Kickoff — every client brief, ready to quote' },
  description:
    'A calm five-minute intake for your clients that becomes a professional brief: goals, sitemap, features, timeline and an estimate from your own rate card.',
  openGraph: {
    title: 'Kickoff — every client brief, ready to quote',
    description: 'From a client’s first enquiry to a ready-to-quote project brief.',
    type: 'website',
  },
};

export default function LandingPage() {
  return (
    <>
      <SiteNav />
      <main id="main">
        <Hero />
        <Problem />
        <HowItWorks />
        <Anatomy />
        <PricingLogic />
        <WhiteLabel />
        <Privacy />
        <Faq />
        <Closing />
      </main>
      <SiteFooter />
    </>
  );
}
