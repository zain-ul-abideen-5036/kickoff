/**
 * The fixed vocabulary of the intake. Ids are stored; labels are shown to clients.
 * Keep ids stable: they are saved inside drafts and briefs.
 */

export const BUSINESS_TYPES = [
  { id: 'restaurant', label: 'Restaurant or café' },
  { id: 'shop', label: 'Shop' },
  { id: 'services', label: 'Professional services' },
  { id: 'health', label: 'Health and wellness' },
  { id: 'trades', label: 'Trades' },
  { id: 'other', label: 'Something else' },
] as const;
export type BusinessType = (typeof BUSINESS_TYPES)[number]['id'];

export const WEBSITE_STATES = [
  { id: 'none', label: 'No' },
  { id: 'replace', label: 'Yes, but it needs replacing' },
  { id: 'tweak', label: 'Yes, it needs small changes' },
] as const;
export type WebsiteState = (typeof WEBSITE_STATES)[number]['id'];

export const GOALS = [
  { id: 'bookings', label: 'More bookings', brief: 'More bookings' },
  { id: 'premium', label: 'Look more premium', brief: 'Look more premium' },
  { id: 'google', label: 'Rank on Google', brief: 'Rank on Google' },
  { id: 'sell', label: 'Sell online', brief: 'Sell online' },
  { id: 'enquiries', label: 'Get more enquiries', brief: 'More enquiries' },
  { id: 'faq', label: 'Answer common questions', brief: 'Answer common questions' },
  { id: 'staff', label: 'Recruit staff', brief: 'Recruit staff' },
] as const;
export type GoalId = (typeof GOALS)[number]['id'];
export const MAX_GOALS = 3;

export const AUDIENCES = [
  { id: 'couples', label: 'Local couples' },
  { id: 'families', label: 'Families' },
  { id: 'corporate', label: 'Corporate groups' },
  { id: 'visitors', label: 'Visitors to the area' },
  { id: 'students', label: 'Students' },
  { id: 'older', label: 'Older adults' },
  { id: 'businesses', label: 'Other businesses' },
] as const;
export type AudienceId = (typeof AUDIENCES)[number]['id'];

export const FEATURES = [
  { id: 'booking', label: 'Online booking', sub: 'Customers book from any page' },
  { id: 'menu', label: 'Menu with seasonal updates', sub: 'Change dishes yourself' },
  { id: 'gallery', label: 'Photo gallery', sub: 'Show off your work' },
  { id: 'private', label: 'Private event enquiries', sub: 'A form for group bookings' },
  { id: 'shop', label: 'Online shop', sub: 'Sell products to post or collect' },
  { id: 'blog', label: 'News or blog', sub: 'Share events and updates' },
  { id: 'newsletter', label: 'Newsletter sign-up', sub: 'Collect emails for offers' },
  { id: 'vouchers', label: 'Gift vouchers', sub: 'Sell vouchers online' },
  { id: 'services', label: 'Services and prices', sub: 'What you offer, clearly' },
  { id: 'testimonials', label: 'Reviews and testimonials', sub: 'Let customers vouch for you' },
  { id: 'team', label: 'Meet the team', sub: 'Faces behind the business' },
  { id: 'faq', label: 'FAQ page', sub: 'Answer questions before they ask' },
] as const;
export type FeatureId = (typeof FEATURES)[number]['id'];

export const READINESS = [
  { id: 'ready', label: 'Ready' },
  { id: 'wip', label: 'In progress' },
  { id: 'no', label: 'Not yet' },
] as const;
export type Readiness = (typeof READINESS)[number]['id'];

export const PHOTO_SOURCES = [
  { id: 'pro', label: 'A professional' },
  { id: 'phone', label: 'Us, on a phone' },
] as const;
export type PhotoSource = (typeof PHOTO_SOURCES)[number]['id'];

export const STYLE_WORDS = [
  { id: 'clean', label: 'Clean' },
  { id: 'photos', label: 'Big photos' },
  { id: 'warm', label: 'Warm' },
  { id: 'minimal', label: 'Minimal' },
  { id: 'classic', label: 'Classic' },
  { id: 'bold', label: 'Bold' },
] as const;
export type StyleWord = (typeof STYLE_WORDS)[number]['id'];

export const BUDGETS = [
  { id: 'b1', label: 'Under £3,000', short: 'Under £3k', min: 0, max: 3000 },
  { id: 'b2', label: '£3,000–£6,000', short: '£3k–£6k', min: 3000, max: 6000 },
  { id: 'b3', label: '£6,000–£10,000', short: '£6k–£10k', min: 6000, max: 10000 },
  { id: 'b4', label: '£10,000+', short: '£10k+', min: 10000, max: Number.POSITIVE_INFINITY },
] as const;
export type BudgetId = (typeof BUDGETS)[number]['id'];

/** `weeks` is the latest acceptable launch, used to flag a tight timeline. */
export const LAUNCHES = [
  { id: 'asap', label: 'As soon as possible', weeks: 3 },
  { id: 'w4', label: 'In 4 weeks', weeks: 4 },
  { id: 'm2', label: 'In 2–3 months', weeks: 10 },
  { id: 'flex', label: 'Flexible', weeks: Number.POSITIVE_INFINITY },
] as const;
export type LaunchId = (typeof LAUNCHES)[number]['id'];

export const PLATFORMS = [
  { id: 'wordpress', label: 'WordPress' },
  { id: 'shopify', label: 'Shopify' },
  { id: 'webflow', label: 'Webflow' },
  { id: 'squarespace', label: 'Squarespace' },
] as const;
export type PlatformId = (typeof PLATFORMS)[number]['id'];

export function labelOf<T extends { id: string; label: string }>(list: readonly T[], id: string): string {
  return list.find((x) => x.id === id)?.label ?? id;
}

export function ids<T extends { id: string }>(list: readonly T[]): [T['id'], ...T['id'][]] {
  return list.map((x) => x.id) as [T['id'], ...T['id'][]];
}
