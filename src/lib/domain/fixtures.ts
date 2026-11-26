import type { IntakeAnswers } from './intake';

/**
 * The Ember & Oak intake from the approved design. It is the known answer for the rules engine:
 * with the default rate card it must produce £4,850, 5.5 weeks and 7 pages.
 */
export const EMBER_AND_OAK: IntakeAnswers = {
  about: {
    name: 'Daniel Okafor',
    business: 'Ember & Oak',
    businessType: 'restaurant',
    location: 'Barking, London',
    email: 'daniel@emberandoak.co.uk',
    website: 'replace',
  },
  goals: { goals: ['bookings', 'premium', 'google'], searchTerm: 'restaurant Barking' },
  audience: {
    groups: ['couples', 'families', 'corporate'],
    ageMin: 28,
    ageMax: 55,
    notes: 'Local companies book our private dining room for team dinners and celebrations.',
  },
  features: { features: ['booking', 'menu', 'gallery', 'private'] },
  content: { logo: 'ready', photos: 'ready', photoSource: 'pro', text: 'no' },
  inspiration: {
    sites: ['copperhouse-kitchen.co.uk', 'the-linden-table.co.uk'],
    words: ['clean', 'photos'],
    notes: 'Clean, big food photos. Easy to book from a phone.',
  },
  budget: { budget: 'b2', launch: 'w4' },
  followUps: { covers: '40–80', bookingSystem: 'ResDiary' },
};
