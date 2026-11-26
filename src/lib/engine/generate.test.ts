import { describe, expect, it } from 'vitest';
import { BriefSchema } from '@/lib/domain/brief';
import { EMBER_AND_OAK } from '@/lib/domain/fixtures';
import type { IntakeAnswers } from '@/lib/domain/intake';
import { defaultSettings } from '@/lib/domain/settings';
import { briefFacts, generateBrief } from './generate';

const settings = defaultSettings();
const make = (answers: IntakeAnswers) =>
  generateBrief({ id: 'b1', ref: 'KO-0142', answers, settings, now: new Date('2026-11-26T09:15:00Z') });
const with_ = (patch: (a: IntakeAnswers) => void) => {
  const a = structuredClone(EMBER_AND_OAK);
  patch(a);
  return make(a);
};

describe('Ember & Oak — known answer', () => {
  const brief = make(EMBER_AND_OAK);

  it('is a valid brief', () => {
    expect(BriefSchema.safeParse(brief).success).toBe(true);
  });

  it('costs £4,850, takes 5.5 weeks and has 7 pages', () => {
    expect(briefFacts(brief, 0.2)).toEqual({
      pageCount: 7,
      weeks: 5.5,
      total: 4850,
      platform: 'WordPress with a booking integration',
    });
  });

  it('recommends the designed sitemap', () => {
    expect(brief.pages.map((p) => p.label)).toEqual([
      'Home',
      'Menu',
      'Book a table',
      'Private dining',
      'Gallery',
      'About',
      'Contact',
    ]);
    expect(brief.pages[1]?.sections).toEqual(['Lunch', 'Dinner', 'Tasting menu']);
  });

  it('phases the timeline as 0.5, 1.5, 2, 1, 0.5', () => {
    expect(brief.phases.map((p) => [p.name, p.weeks])).toEqual([
      ['Discovery', 0.5],
      ['Design', 1.5],
      ['Build', 2],
      ['Content and QA', 1],
      ['Launch', 0.5],
    ]);
  });

  it('sorts features into Must, Should and Could', () => {
    const by = (p: string) => brief.features.filter((f) => f.priority === p).map((f) => f.label);
    expect(by('Must')).toEqual(['Online booking', 'Mobile-first menu', 'Contact and map']);
    expect(by('Should').sort()).toEqual(['Gallery', 'Private dining enquiry form']);
    expect(by('Could')).toEqual(['Newsletter sign-up', 'Gift vouchers']);
  });

  it('flags exactly the two designed risks', () => {
    expect(brief.risks.map((r) => r.title)).toEqual([
      'Requested launch in 4 weeks vs a 5.5-week plan.',
      'Website text not ready.',
    ]);
    expect(brief.risks[0]?.detail).toBe(
      'Suggest launching core pages first: Home, Menu, Book a table and Contact.',
    );
    expect(brief.risks[1]?.detail).toBe('Copywriting support is included in the estimate.');
  });

  it('asks the three kickoff questions', () => {
    expect(brief.questions).toHaveLength(3);
    expect(brief.questions[0]).toMatch(/ResDiary/);
    expect(brief.questions[1]).toMatch(/usage rights/);
    expect(brief.questions[2]).toMatch(/Private dining/);
  });

  it('writes a template summary that names the business and place', () => {
    expect(brief.writtenBy).toBe('template');
    expect(brief.summary).toMatch(/^Ember & Oak is an independent restaurant in Barking, London/);
    expect(brief.summary).toMatch(/private dining/);
  });

  it('names the search term in the Google goal', () => {
    expect(brief.goals.map((g) => g.goal)).toContain('Rank on Google for "restaurant Barking"');
  });

  it('lists content to collect', () => {
    expect(brief.content.map((c) => [c.label, c.state])).toEqual([
      ['Logo', 'ready'],
      ['Professional photos', 'ready'],
      ['Written text', 'missing'],
      ['Lunch, dinner and tasting menus', 'collect'],
      ['Private dining capacity and set menus', 'collect'],
    ]);
  });
});

describe('rules beyond the known answer', () => {
  it('drops the timeline risk when the launch is flexible', () => {
    const b = with_((a) => (a.budget.launch = 'flex'));
    expect(b.risks.map((r) => r.id)).not.toContain('timeline');
  });

  it('drops copywriting and its risk when text is ready', () => {
    const b = with_((a) => (a.content.text = 'ready'));
    expect(b.quote.lines.map((l) => l.id)).not.toContain('copy');
    expect(briefFacts(b, 0.2).total).toBe(4550);
    expect(b.risks.map((r) => r.id)).not.toContain('text');
  });

  it('adds half a week when photos are not ready', () => {
    const b = with_((a) => (a.content.photos = 'no'));
    expect(briefFacts(b, 0.2).weeks).toBe(6);
    expect(b.risks.map((r) => r.id)).toContain('photos');
  });

  it('flags a quote above the budget range', () => {
    const b = with_((a) => (a.budget.budget = 'b1'));
    expect(b.risks.find((r) => r.id === 'budget')?.title).toBe(
      'Estimate of £4,850 is above the Under £3,000 range.',
    );
  });

  it('sends shops to Shopify, adds a build week and prices products', () => {
    const b = with_((a) => {
      a.about.businessType = 'shop';
      a.features.features = ['shop', 'newsletter'];
      a.followUps = { products: '40' };
    });
    expect(b.platform.id).toBe('shopify');
    expect(b.phases.find((p) => p.id === 'build')?.weeks).toBe(3);
    expect(b.quote.lines.find((l) => l.id === 'products')).toMatchObject({ qty: 3 });
  });

  it('lengthens build for large sitemaps', () => {
    const b = with_((a) => {
      a.features.features = [
        'booking',
        'menu',
        'gallery',
        'private',
        'testimonials',
        'team',
        'blog',
        'faq',
        'vouchers',
      ];
    });
    expect(b.pages.length).toBe(12);
    expect(b.phases.find((p) => p.id === 'build')?.weeks).toBe(2.5);
  });

  it('follows the agency timeline defaults', () => {
    const s = defaultSettings();
    s.timeline.phases = s.timeline.phases.map((p) => (p.id === 'design' ? { ...p, weeks: 2 } : p));
    const b = generateBrief({ id: 'x', ref: 'KO-1', answers: EMBER_AND_OAK, settings: s });
    expect(briefFacts(b, 0.2).weeks).toBe(6);
  });

  it('uses a services sitemap for other business types', () => {
    const b = with_((a) => {
      a.about.businessType = 'health';
      a.features.features = ['booking', 'testimonials'];
    });
    expect(b.pages.map((p) => p.label)).toEqual([
      'Home',
      'Services',
      'Book an appointment',
      'Reviews',
      'About',
      'Contact',
    ]);
  });

  it('asks a generic booking question when no system is known', () => {
    const b = with_((a) => (a.followUps = {}));
    expect(b.questions[0]).toMatch(/which one should we set up/);
  });
});
