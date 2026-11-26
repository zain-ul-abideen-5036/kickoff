import type { Brief, Status } from '@/lib/domain/brief';
import { EMBER_AND_OAK } from '@/lib/domain/fixtures';
import type { IntakeAnswers } from '@/lib/domain/intake';
import type { Settings } from '@/lib/domain/settings';
import { generateBrief } from '@/lib/engine/generate';
import type { Store } from '@/lib/store';
import { listBriefs, nextRef, saveBrief } from './briefs-repo';
import { newId } from './ids';

/** Fictional sample clients from the design, so a new studio sees a working dashboard. */
function sample(
  business: string,
  name: string,
  email: string,
  type: IntakeAnswers['about']['businessType'],
  location: string,
  patch: (a: IntakeAnswers) => void,
): IntakeAnswers {
  const a = structuredClone(EMBER_AND_OAK);
  a.about = { name, business, businessType: type, location, email, website: 'replace' };
  a.followUps = {};
  patch(a);
  return a;
}

export const SAMPLES: { answers: IntakeAnswers; status: Status; daysAgo: number }[] = [
  { answers: EMBER_AND_OAK, status: 'New', daysAgo: 0 },
  {
    answers: sample(
      'Mason & Reed Solicitors',
      'Helen Mason',
      'helen@masonreed.co.uk',
      'services',
      'Ilford',
      (a) => {
        a.goals.goals = ['enquiries', 'premium'];
        a.audience.groups = ['businesses', 'families'];
        a.features.features = ['services', 'team'];
        a.content = { logo: 'ready', photos: 'no', photoSource: 'phone', text: 'ready' };
        a.budget = { budget: 'b1', launch: 'flex' };
        a.about.website = 'none';
      },
    ),
    status: 'New',
    daysAgo: 1,
  },
  {
    answers: sample(
      'Northfield Physio',
      'Sam Patel',
      'sam@northfieldphysio.co.uk',
      'health',
      'Romford',
      (a) => {
        a.goals.goals = ['bookings', 'google'];
        a.goals.searchTerm = 'physio Romford';
        a.audience.groups = ['older', 'families'];
        a.features.features = ['booking', 'testimonials', 'team'];
        a.content.text = 'ready';
        a.budget = { budget: 'b2', launch: 'm2' };
        a.followUps = { bookingSystem: 'Fresha' };
      },
    ),
    status: 'Reviewed',
    daysAgo: 5,
  },
  {
    answers: sample(
      'Barking Bloom Florist',
      'Grace Owusu',
      'grace@barkingbloom.co.uk',
      'shop',
      'Barking',
      (a) => {
        a.goals.goals = ['sell', 'google'];
        a.goals.searchTerm = 'florist Barking';
        a.audience.groups = ['couples', 'businesses'];
        a.features.features = ['shop', 'gallery', 'newsletter'];
        a.budget = { budget: 'b3', launch: 'm2' };
        a.followUps = { products: '40' };
      },
    ),
    status: 'Quoted',
    daysAgo: 8,
  },
  {
    answers: sample('Kiln Coffee Co.', 'Tom Hayes', 'tom@kilncoffee.co.uk', 'shop', 'Leyton', (a) => {
      a.goals.goals = ['sell', 'premium'];
      a.audience.groups = ['students', 'businesses'];
      a.features.features = ['shop', 'blog'];
      a.content.text = 'ready';
      a.budget = { budget: 'b2', launch: 'm2' };
      a.followUps = { products: '25' };
    }),
    status: 'Won',
    daysAgo: 14,
  },
  {
    answers: sample('Lumen Yoga', 'Priya Shah', 'priya@lumenyoga.co.uk', 'health', 'Stratford', (a) => {
      a.goals.goals = ['bookings'];
      a.audience.groups = ['couples', 'students'];
      a.features.features = ['booking', 'team', 'faq'];
      a.budget = { budget: 'b2', launch: 'flex' };
      a.followUps = { bookingSystem: 'No, not yet' };
    }),
    status: 'Lost',
    daysAgo: 20,
  },
];

/** Adds the sample briefs. Does nothing if the studio already has briefs. */
export async function seedSampleBriefs(store: Store, settings: Settings, now = new Date()): Promise<Brief[]> {
  if ((await listBriefs(store)).length > 0) return [];
  const out: Brief[] = [];
  for (const s of [...SAMPLES].reverse()) {
    const at = new Date(now.getTime() - s.daysAgo * 86_400_000);
    const brief = generateBrief({
      id: newId(),
      ref: await nextRef(store),
      answers: s.answers,
      settings,
      now: at,
    });
    brief.status = s.status;
    out.push(await saveBrief(store, brief, settings.rateCard.vatRate, at));
  }
  return out;
}
