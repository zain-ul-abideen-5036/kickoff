import {
  AUDIENCES,
  BUDGETS,
  FEATURES,
  GOALS,
  LAUNCHES,
  labelOf,
  type BusinessType,
  type FeatureId,
} from '@/lib/domain/catalog';
import type { FeatureItem, Page } from '@/lib/domain/brief';
import { STEPS, type IntakeAnswers, type StepKey } from '@/lib/domain/intake';
import { prioritiseFeatures } from '@/lib/engine/features';
import { buildSitemap } from '@/lib/engine/sitemap';

/** Every screen of the intake after the welcome, in order. */
export type ScreenKey = StepKey | 'followups' | 'review';

/** Which of the seven steps the client sees. "About you" can't be turned off. */
export function visibleSteps(enabled: Record<string, boolean>): StepKey[] {
  return STEPS.map((s) => s.key).filter((k) => k === 'about' || enabled[k] !== false);
}

/** The full screen order: visible steps, then follow-ups when there are any, then review. */
export function screens(steps: StepKey[], hasFollowUps: boolean): ScreenKey[] {
  return [...steps, ...(hasFollowUps ? (['followups'] as const) : []), 'review'];
}

const RESTAURANT_FEATURES: FeatureId[] = [
  'booking',
  'menu',
  'gallery',
  'private',
  'newsletter',
  'vouchers',
  'shop',
  'blog',
];
const SHOP_FEATURES: FeatureId[] = [
  'shop',
  'gallery',
  'newsletter',
  'testimonials',
  'blog',
  'booking',
  'vouchers',
  'faq',
];
const SERVICE_FEATURES: FeatureId[] = [
  'services',
  'booking',
  'testimonials',
  'team',
  'gallery',
  'faq',
  'blog',
  'newsletter',
  'private',
];

/** Feature choices that make sense for the business, with labels in their language. */
export function featureOptions(type: BusinessType): { id: FeatureId; label: string; sub: string }[] {
  const ids =
    type === 'restaurant' ? RESTAURANT_FEATURES : type === 'shop' ? SHOP_FEATURES : SERVICE_FEATURES;
  return ids.map((id) => {
    const f = FEATURES.find((x) => x.id === id)!;
    if (id === 'booking' && type === 'restaurant')
      return { id, label: 'Online table booking', sub: 'Guests book from any page' };
    if (id === 'private')
      return type === 'restaurant'
        ? { id, label: 'Private dining enquiries', sub: 'A form for group bookings' }
        : { id, label: 'Group booking enquiries', sub: 'A form for larger groups' };
    if (id === 'gallery' && type !== 'restaurant')
      return { id, label: 'Photo gallery', sub: 'Show off your work' };
    if (id === 'gallery') return { id, label: 'Photo gallery', sub: 'Show off the food and room' };
    return { id, label: f.label, sub: f.sub };
  });
}

/**
 * Steps the studio has switched off still need valid answers for the brief. These are the
 * gentlest defaults: a generic goal and audience, and the existing defaults for the rest.
 */
export function fillHiddenSteps(answers: IntakeAnswers, steps: StepKey[]): IntakeAnswers {
  const out = structuredClone(answers);
  if (!steps.includes('goals') && out.goals.goals.length === 0) out.goals.goals = ['enquiries'];
  if (!steps.includes('audience') && out.audience.groups.length === 0) out.audience.groups = ['visitors'];
  if (!steps.includes('features')) out.features.features = out.features.features ?? [];
  return out;
}

/** What the live brief panel shows. Sections appear once the client has reached their step. */
export interface Preview {
  title: string;
  summary: string;
  goals: string[] | null;
  audience: string | null;
  pages: Page[] | null;
  features: FeatureItem[] | null;
  content: { label: string; ready: boolean }[] | null;
  look: string | null;
  budget: string | null;
  details: string | null;
  pending: string[];
  readyCount: number;
}

const TYPE_WORDS: Record<BusinessType, string> = {
  restaurant: 'a restaurant',
  shop: 'a shop',
  services: 'a professional services firm',
  health: 'a health and wellness practice',
  trades: 'a trades business',
  other: 'a local business',
};

function join(items: string[]) {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

const GOAL_TEXT: Record<string, (a: IntakeAnswers) => string> = {
  bookings: (a) => (a.about.businessType === 'restaurant' ? 'More table bookings' : 'More bookings'),
  premium: () => 'Look more premium',
  google: (a) => (a.goals.searchTerm ? `Rank on Google for "${a.goals.searchTerm}"` : 'Rank on Google'),
};

export function previewModel(a: IntakeAnswers, reached: ReadonlySet<ScreenKey>): Preview {
  const name = a.about.business.trim() || 'Your business';
  const where = a.about.location.trim();
  const summary = `A new website for ${a.about.business.trim() || 'your business'}, ${TYPE_WORDS[a.about.businessType]}${
    where ? ` in ${where}` : ''
  }${a.about.website === 'replace' ? ', replacing the current site' : ''}.`;

  const has = (k: ScreenKey) => reached.has(k);
  const goals = has('goals') ? a.goals.goals.map((g) => GOAL_TEXT[g]?.(a) ?? labelOf(GOALS, g)) : null;
  const audience = has('audience')
    ? a.audience.groups.length
      ? `${join(a.audience.groups.map((g) => labelOf(AUDIENCES, g)))} · ages ${a.audience.ageMin}–${a.audience.ageMax}`
      : `Ages ${a.audience.ageMin}–${a.audience.ageMax}`
    : null;
  const pages = has('features') ? buildSitemap(a) : null;
  const features = has('features') ? prioritiseFeatures(a).filter((f) => f.priority !== 'Could') : null;
  const content = has('content')
    ? [
        { label: 'Logo', ready: a.content.logo === 'ready' },
        {
          label: a.content.photoSource === 'pro' ? 'Photos (professional)' : 'Photos',
          ready: a.content.photos === 'ready',
        },
        {
          label: a.content.text === 'ready' ? 'Text' : 'Text · copy support',
          ready: a.content.text === 'ready',
        },
      ]
    : null;
  const look = has('inspiration')
    ? [
        a.inspiration.notes.trim() ? `"${a.inspiration.notes.trim().slice(0, 80)}"` : '',
        `${a.inspiration.sites.filter((s) => s.trim()).length} reference sites`,
      ]
        .filter(Boolean)
        .join(' · ')
    : null;
  const budget = has('budget')
    ? `${labelOf(BUDGETS, a.budget.budget)} · launch ${labelOf(LAUNCHES, a.budget.launch).toLowerCase()}`
    : null;
  const details =
    has('followups') && Object.keys(a.followUps).length
      ? Object.values(a.followUps).filter(Boolean).join(' · ')
      : null;

  const sections: [string, unknown][] = [
    ['Goals', goals],
    ['Audience', audience],
    ['Pages and features', pages],
    ['Content', content],
    ['Look and feel', look],
    ['Budget and timing', budget],
  ];
  const pending = sections.filter(([, v]) => v === null).map(([k]) => k);
  return {
    title: name,
    summary,
    goals,
    audience,
    pages,
    features,
    content,
    look,
    budget,
    details,
    pending,
    readyCount: 1 + sections.length - pending.length,
  };
}
