import { AUDIENCES, BUSINESS_TYPES, LAUNCHES, labelOf } from '@/lib/domain/catalog';
import type { AudienceProfile, Brief } from '@/lib/domain/brief';
import type { IntakeAnswers } from '@/lib/domain/intake';

/**
 * Plain-English prose written from the answers alone. Used when AI is off, has no key, fails,
 * or writes something that doesn't match the calculated plan.
 */

const TYPE_NOUN: Record<IntakeAnswers['about']['businessType'], string> = {
  restaurant: 'an independent restaurant',
  shop: 'an independent shop',
  services: 'a professional services firm',
  health: 'a health and wellness practice',
  trades: 'a local trades business',
  other: 'a local business',
};

function join(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

function audienceWords(a: IntakeAnswers): string {
  return join(a.audience.groups.map((g) => labelOf(AUDIENCES, g).toLowerCase()));
}

/** What each goal asks the website to do, as a phrase after "The new site should …". */
function goalPhrase(id: string, a: IntakeAnswers): string | null {
  const restaurant = a.about.businessType === 'restaurant';
  switch (id) {
    case 'bookings':
      return restaurant ? 'turn local searches into table bookings' : 'turn visits into bookings';
    case 'premium':
      return restaurant
        ? 'present the restaurant as a premium choice'
        : 'present the business as a premium choice';
    case 'google':
      return 'be found on Google by people nearby';
    case 'sell':
      return 'make it easy to buy online';
    case 'enquiries':
      return 'bring in more enquiries';
    case 'faq':
      return 'answer common questions before customers ask';
    case 'staff':
      return 'help recruit new staff';
    default:
      return null;
  }
}

export function templateSummary(a: IntakeAnswers): string {
  const who = audienceWords(a);
  const first = `${a.about.business} is ${TYPE_NOUN[a.about.businessType]} in ${a.about.location}${who ? `, serving ${who}` : ''}.`;
  const phrases = a.goals.goals.map((g) => goalPhrase(g, a)).filter((x): x is string => !!x);
  if (a.features.features.includes('private'))
    phrases.push(
      a.about.businessType === 'restaurant'
        ? 'make private dining easy to enquire about'
        : 'make group bookings easy to enquire about',
    );
  const second = phrases.length ? ` The new site should ${join(phrases)}.` : '';
  const third =
    a.about.website === 'replace'
      ? ' It will replace the current website.'
      : a.about.website === 'tweak'
        ? ' It builds on the current website.'
        : '';
  return `${first}${second}${third}`;
}

export function templateTags(a: IntakeAnswers): string[] {
  const tags = [labelOf(BUSINESS_TYPES, a.about.businessType), a.about.location];
  if (a.about.website === 'replace') tags.push('Replacing current site');
  else if (a.about.website === 'tweak') tags.push('Refreshing current site');
  else tags.push('First website');
  const launch = LAUNCHES.find((l) => l.id === a.budget.launch);
  if (launch && launch.id !== 'flex') tags.push(`Launch wanted ${launch.label.toLowerCase()}`);
  return tags.filter(Boolean);
}

const MEASURES: Record<string, string> = {
  bookings: 'Online bookings per month, tracked from the booking widget',
  premium: 'Owner sign-off at design review; time spent on the key pages',
  google: 'First-page position within three months of launch',
  sell: 'Online orders and revenue per month',
  enquiries: 'Enquiry form submissions per month',
  faq: 'Fewer repeat questions by phone and email',
  staff: 'Job applications received through the site',
};

export function templateGoals(a: IntakeAnswers): Brief['goals'] {
  return a.goals.goals.map((g) => ({
    goal:
      g === 'google' && a.goals.searchTerm
        ? `Rank on Google for "${a.goals.searchTerm}"`
        : ({
            bookings: 'More bookings',
            premium: 'Look more premium',
            google: 'Rank on Google',
            sell: 'Sell online',
            enquiries: 'More enquiries',
            faq: 'Answer common questions',
            staff: 'Recruit staff',
          }[g] ?? g),
    measure: MEASURES[g] ?? 'Agreed at the kickoff call',
  }));
}

export function templateAudience(a: IntakeAnswers): AudienceProfile[] {
  const g = new Set(a.audience.groups);
  const restaurant = a.about.businessType === 'restaurant';
  const ages = `${a.audience.ageMin}–${a.audience.ageMax}`;
  const out: AudienceProfile[] = [];

  if (g.has('couples') || g.has('families')) {
    const name =
      g.has('couples') && g.has('families')
        ? 'Local couples and families'
        : g.has('couples')
          ? 'Local couples'
          : 'Local families';
    out.push({
      name,
      tag: ages,
      description: 'Live nearby and decide on a phone, often the same day.',
      needs: restaurant
        ? [
            "See tonight's menu and prices",
            'Book a table in under a minute',
            'Check opening times and parking',
          ]
        : [
            'See prices and availability',
            'Book or enquire in under a minute',
            'Find opening times and location',
          ],
    });
  }
  if (g.has('corporate') || g.has('businesses')) {
    out.push({
      name: g.has('corporate') ? 'Corporate groups' : 'Other businesses',
      tag: restaurant && a.features.features.includes('private') ? 'private dining' : 'group bookings',
      description: 'Plan ahead and compare options before they book.',
      needs: restaurant
        ? ['Room capacity and set menus', 'A simple enquiry form', 'Invoicing and deposit details']
        : ['Clear packages and prices', 'A simple enquiry form', 'Invoicing details'],
    });
  }
  for (const id of ['visitors', 'students', 'older'] as const) {
    if (!g.has(id) || out.length >= 3) continue;
    out.push({
      name: labelOf(AUDIENCES, id),
      tag: id === 'visitors' ? 'first visit' : ages,
      description:
        id === 'visitors'
          ? 'New to the area and looking for somewhere they can trust.'
          : id === 'students'
            ? 'Price-aware and quick to compare on a phone.'
            : 'Value clear text, larger type and a phone number.',
      needs:
        id === 'visitors'
          ? ['Directions and opening times', 'Photos that show what to expect', 'Reviews from others']
          : id === 'students'
            ? ['Prices up front', 'Offers and discounts', 'Fast mobile pages']
            : ['Readable text and contrast', 'A phone number to call', 'Simple booking'],
    });
  }
  if (out.length === 0)
    out.push({
      name: 'Local customers',
      tag: ages,
      description: 'Looking for a trusted local option.',
      needs: ['What you offer and prices', 'How to get in touch', 'Where you are'],
    });
  return out;
}
