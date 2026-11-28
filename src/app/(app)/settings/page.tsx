import type { Metadata } from 'next';
import { BrandingForm } from '@/components/settings/branding-form';
import { getSettings, logoUrl } from '@/lib/server/context';

export const metadata: Metadata = { title: 'Branding · Settings' };

export default async function BrandingPage() {
  const settings = await getSettings();
  const a = settings.agency;
  return (
    <BrandingForm
      name={a.name}
      replyTo={a.replyTo}
      brandColor={a.brandColor}
      accent={a.accent}
      logoUrl={logoUrl(settings)}
    />
  );
}
