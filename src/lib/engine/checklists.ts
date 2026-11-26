import type { ContentItem } from '@/lib/domain/brief';
import type { IntakeAnswers } from '@/lib/domain/intake';
import { knownBookingSystem } from './platform';

const has = (a: IntakeAnswers, id: string) => a.features.features.includes(id as never);

/** What the client has, and what the studio still needs to collect. */
export function contentChecklist(a: IntakeAnswers, copywritingIncluded: boolean): ContentItem[] {
  const state = (r: string): ContentItem['state'] => (r === 'ready' ? 'ready' : 'missing');
  const items: ContentItem[] = [
    {
      id: 'logo',
      label: 'Logo',
      note: a.content.logo === 'wip' ? 'in progress' : '',
      state: state(a.content.logo),
    },
    {
      id: 'photos',
      label: a.content.photoSource === 'pro' ? 'Professional photos' : 'Photos',
      note: a.content.photos === 'ready' ? 'confirm web usage rights' : 'shoot or stock to agree',
      state: state(a.content.photos),
    },
    {
      id: 'text',
      label: 'Written text',
      note:
        a.content.text === 'ready'
          ? ''
          : copywritingIncluded
            ? 'copywriting support included'
            : 'to be written',
      state: state(a.content.text),
    },
  ];
  const collect = (id: string, label: string) => items.push({ id, label, note: '', state: 'collect' });
  const restaurant = a.about.businessType === 'restaurant';
  if (has(a, 'menu')) collect('menus', 'Lunch, dinner and tasting menus');
  if (has(a, 'private'))
    collect(
      'private',
      restaurant ? 'Private dining capacity and set menus' : 'Group booking details and prices',
    );
  if (has(a, 'shop')) collect('products', 'Product list, prices and photos');
  if (has(a, 'services')) collect('services', 'Service list and prices');
  if (has(a, 'team')) collect('team', 'Team photos and short bios');
  if (has(a, 'testimonials')) collect('reviews', 'Three to five customer reviews');
  return items;
}

/** Questions for the kickoff call, so it starts informed. */
export function kickoffQuestions(a: IntakeAnswers): string[] {
  const q: string[] = [];
  if (has(a, 'booking')) {
    const system = knownBookingSystem(a);
    q.push(
      system
        ? `Booking system: confirm we connect ${system}, and who manages the account.`
        : 'Booking system: which one should we set up, and who will manage it?',
    );
  }
  if (a.content.photos === 'ready' && a.content.photoSource === 'pro')
    q.push('Photography: do we have usage rights for the web and social media?');
  if (has(a, 'private'))
    q.push(
      a.about.businessType === 'restaurant'
        ? 'Private dining: how many guests can the room seat, and are there set menus?'
        : 'Group bookings: what sizes and packages should the enquiry form cover?',
    );
  if (has(a, 'shop')) q.push('Products: who adds products and photos, and how is stock managed today?');
  if (a.content.logo !== 'ready') q.push('Logo: when will the final logo be ready, and in which formats?');
  if (q.length < 2 && a.about.website !== 'none')
    q.push('Current site: do you have the logins for the domain and hosting?');
  if (q.length < 2) q.push('Sign-off: who approves designs and copy on your side?');
  return q.slice(0, 5);
}
