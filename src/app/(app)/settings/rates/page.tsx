import type { Metadata } from 'next';
import { RateCardForm } from '@/components/settings/rate-card-form';
import { getSettings } from '@/lib/server/context';

export const metadata: Metadata = { title: 'Rate card · Settings' };

export default async function RatesPage() {
  const settings = await getSettings();
  return <RateCardForm rateCard={settings.rateCard} />;
}
