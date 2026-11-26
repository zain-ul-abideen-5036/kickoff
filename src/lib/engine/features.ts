import type { FeatureId } from '@/lib/domain/catalog';
import type { FeatureItem, Priority } from '@/lib/domain/brief';
import type { IntakeAnswers } from '@/lib/domain/intake';

/** Features that carry the main job of the site when chosen. */
const CORE: FeatureId[] = ['booking', 'menu', 'shop', 'services'];

/** Sensible extras to suggest as Could, by business type, when the client didn't pick them. */
const SUGGESTED: Record<IntakeAnswers['about']['businessType'], FeatureId[]> = {
  restaurant: ['newsletter', 'vouchers'],
  shop: ['newsletter', 'testimonials'],
  services: ['testimonials', 'faq'],
  health: ['testimonials', 'faq'],
  trades: ['testimonials', 'gallery'],
  other: ['newsletter', 'faq'],
};

function featureLabel(id: FeatureId, a: IntakeAnswers): string {
  const restaurant = a.about.businessType === 'restaurant';
  switch (id) {
    case 'booking':
      return 'Online booking';
    case 'menu':
      return 'Mobile-first menu';
    case 'private':
      return restaurant ? 'Private dining enquiry form' : 'Group enquiry form';
    case 'gallery':
      return 'Gallery';
    case 'shop':
      return 'Online shop';
    case 'blog':
      return 'News or blog';
    case 'newsletter':
      return 'Newsletter sign-up';
    case 'vouchers':
      return 'Gift vouchers';
    case 'services':
      return 'Services and prices';
    case 'testimonials':
      return 'Reviews and testimonials';
    case 'team':
      return 'Meet the team';
    case 'faq':
      return 'FAQ page';
  }
}

/**
 * Sorts features into Must, Should and Could. Chosen core features are Must, other chosen features
 * are Should, and suggestions the client didn't ask for are Could. Contact and map is always Must.
 */
export function prioritiseFeatures(a: IntakeAnswers): FeatureItem[] {
  const chosen = a.features.features;
  const items: FeatureItem[] = [];
  const add = (id: string, label: string, priority: Priority) => items.push({ id, label, priority });

  for (const id of chosen) if (CORE.includes(id)) add(id, featureLabel(id, a), 'Must');
  add('contact', 'Contact and map', 'Must');
  for (const id of chosen) if (!CORE.includes(id)) add(id, featureLabel(id, a), 'Should');
  for (const id of SUGGESTED[a.about.businessType])
    if (!chosen.includes(id)) add(id, featureLabel(id, a), 'Could');

  return items;
}

/** Only features the client chose are priced. Could suggestions are optional extras. */
export function pricedFeatureIds(a: IntakeAnswers): FeatureId[] {
  return [...a.features.features];
}
