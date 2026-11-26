import type { Brief } from '@/lib/domain/brief';
import type { IntakeAnswers } from '@/lib/domain/intake';

export type PlatformChoice = Brief['platform'];

const hasFeature = (a: IntakeAnswers, id: string) => a.features.features.includes(id as never);

/** The booking system the client named in a follow-up, if they use one. */
export function knownBookingSystem(a: IntakeAnswers): string | null {
  const v = a.followUps.bookingSystem?.trim();
  if (!v || /^no\b|not yet|none/i.test(v) || /something else/i.test(v)) return null;
  return v;
}

/**
 * Picks the platform by rule. Shops go to Shopify; small brochure sites on a tight budget go to
 * Squarespace; everything else goes to WordPress, which the agency can hand over for easy editing.
 */
export function choosePlatform(a: IntakeAnswers): PlatformChoice {
  const booking = hasFeature(a, 'booking');

  if (hasFeature(a, 'shop')) {
    return {
      id: 'shopify',
      label: 'Shopify',
      reasons: [
        'Built for selling online: payments, stock and delivery in one place',
        'Staff can add products and run offers without a developer',
        'Reliable checkout that customers already trust',
      ],
      alternatives: [
        { name: 'WordPress', note: 'flexible with WooCommerce, but more upkeep' },
        { name: 'Squarespace', note: 'simpler, but fewer shop features' },
      ],
    };
  }

  const small = a.budget.budget === 'b1' && !booking && !hasFeature(a, 'menu');
  if (small) {
    return {
      id: 'squarespace',
      label: 'Squarespace',
      reasons: [
        'Lowest running cost for a small brochure site',
        'Easy for the owner to edit text and photos',
        'Hosting and security are handled for you',
      ],
      alternatives: [
        { name: 'WordPress', note: 'more flexible, but needs updates and hosting' },
        { name: 'Webflow', note: 'beautiful, but costs more to set up' },
      ],
    };
  }

  const reasons: string[] = [];
  if (hasFeature(a, 'menu')) reasons.push('Staff can update seasonal menus without a developer');
  else reasons.push('Staff can update pages and photos without a developer');
  if (booking) {
    const system = knownBookingSystem(a);
    reasons.push(
      system ? `Connects to ${system}, which they already use` : 'Connects to the main booking systems',
    );
  }
  if (a.goals.goals.includes('google')) reasons.push('Strong local search setup out of the box');
  else reasons.push('A large choice of trusted plugins as the business grows');

  return {
    id: 'wordpress',
    label: booking ? 'WordPress with a booking integration' : 'WordPress',
    reasons,
    alternatives: [
      {
        name: 'Squarespace',
        note: booking ? 'simpler, but booking options are limited' : 'simpler, but less flexible',
      },
      {
        name: 'Webflow',
        note: hasFeature(a, 'menu')
          ? 'beautiful, but menu edits are harder for staff'
          : 'beautiful, but costs more to set up',
      },
    ],
  };
}
