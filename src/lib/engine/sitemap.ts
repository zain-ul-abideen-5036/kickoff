import type { Page } from '@/lib/domain/brief';
import type { IntakeAnswers } from '@/lib/domain/intake';

const has = (a: IntakeAnswers, id: string) => a.features.features.includes(id as never);

/** Page ids are stable slugs so edits and CSV exports can refer to them. */
function page(id: string, label: string, sections: string[] = []): Page {
  return { id, label, sections };
}

/**
 * The recommended sitemap. Home comes first and Contact last; in between, pages follow from the
 * business type and the features the client chose. Every top-level page is priced as one page.
 */
export function buildSitemap(a: IntakeAnswers): Page[] {
  const type = a.about.businessType;
  const pages: Page[] = [page('home', 'Home')];

  if (type === 'restaurant') {
    pages.push(page('menu', 'Menu', has(a, 'menu') ? ['Lunch', 'Dinner', 'Tasting menu'] : []));
    if (has(a, 'booking')) pages.push(page('book', 'Book a table'));
    if (has(a, 'private')) pages.push(page('private', 'Private dining'));
  } else if (type === 'shop') {
    pages.push(page('shop', 'Shop', ['Categories', 'Product pages', 'Basket and checkout']));
    if (has(a, 'booking')) pages.push(page('book', 'Book a visit'));
    if (has(a, 'private')) pages.push(page('events', 'Events'));
  } else {
    pages.push(page('services', 'Services'));
    if (has(a, 'booking')) pages.push(page('book', 'Book an appointment'));
    if (has(a, 'private')) pages.push(page('events', 'Group bookings'));
  }

  if (has(a, 'shop') && type !== 'shop') pages.push(page('shop', 'Shop'));
  if (has(a, 'services') && type === 'restaurant') pages.push(page('services', 'Services'));
  if (has(a, 'gallery')) pages.push(page('gallery', type === 'trades' ? 'Our work' : 'Gallery'));
  if (has(a, 'testimonials')) pages.push(page('reviews', 'Reviews'));
  if (has(a, 'team')) pages.push(page('team', 'Team'));
  if (has(a, 'blog')) pages.push(page('news', 'News'));
  if (has(a, 'faq')) pages.push(page('faq', 'FAQ'));
  if (has(a, 'vouchers') && !has(a, 'shop')) pages.push(page('vouchers', 'Gift vouchers'));

  pages.push(page('about', 'About'));
  pages.push(page('contact', 'Contact'));
  return pages;
}

/** Top-level pages are what the rate card prices. Sections inside a page are free. */
export function pageCount(pages: Page[]): number {
  return pages.length;
}
