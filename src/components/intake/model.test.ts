import { describe, expect, it } from 'vitest';
import { EMBER_AND_OAK } from '@/lib/domain/fixtures';
import { IntakeAnswersSchema, emptyAnswers } from '@/lib/domain/intake';
import {
  featureOptions,
  fillHiddenSteps,
  previewModel,
  screens,
  visibleSteps,
  type ScreenKey,
} from './model';

describe('visibleSteps', () => {
  it('shows all seven steps by default', () => {
    expect(visibleSteps({})).toHaveLength(7);
  });
  it('skips steps the studio turned off but never About you', () => {
    expect(visibleSteps({ about: false, inspiration: false, audience: false })).toEqual([
      'about',
      'goals',
      'features',
      'content',
      'budget',
    ]);
  });
});

describe('screens', () => {
  it('adds follow-ups only when there are questions, and always ends with review', () => {
    expect(screens(['about', 'goals'], true)).toEqual(['about', 'goals', 'followups', 'review']);
    expect(screens(['about'], false)).toEqual(['about', 'review']);
  });
});

describe('featureOptions', () => {
  it('speaks restaurant for restaurants', () => {
    const labels = featureOptions('restaurant').map((f) => f.label);
    expect(labels).toContain('Online table booking');
    expect(labels).toContain('Private dining enquiries');
    expect(labels).toContain('Menu with seasonal updates');
  });
  it('offers services and team to practices, not menus', () => {
    const ids = featureOptions('health').map((f) => f.id);
    expect(ids).toContain('services');
    expect(ids).not.toContain('menu');
  });
});

describe('fillHiddenSteps', () => {
  it('makes answers valid when goal and audience steps are hidden', () => {
    const a = emptyAnswers();
    a.about = EMBER_AND_OAK.about;
    const filled = fillHiddenSteps(a, ['about', 'features', 'content', 'budget']);
    expect(filled.goals.goals).toEqual(['enquiries']);
    expect(filled.audience.groups).toEqual(['visitors']);
    expect(IntakeAnswersSchema.safeParse(filled).success).toBe(true);
  });
  it('leaves answered steps alone', () => {
    expect(fillHiddenSteps(EMBER_AND_OAK, ['about'])).toEqual(EMBER_AND_OAK);
  });
});

describe('previewModel', () => {
  const all = new Set<ScreenKey>([
    'about',
    'goals',
    'audience',
    'features',
    'content',
    'inspiration',
    'budget',
    'followups',
  ]);

  it('starts with only the summary and lists what is still to come', () => {
    const p = previewModel(emptyAnswers(), new Set(['about']));
    expect(p.title).toBe('Your business');
    expect(p.goals).toBeNull();
    expect(p.pending).toEqual([
      'Goals',
      'Audience',
      'Pages and features',
      'Content',
      'Look and feel',
      'Budget and timing',
    ]);
    expect(p.readyCount).toBe(1);
  });

  it('fills in Ember & Oak as the steps are reached', () => {
    const p = previewModel(EMBER_AND_OAK, all);
    expect(p.summary).toBe(
      'A new website for Ember & Oak, a restaurant in Barking, London, replacing the current site.',
    );
    expect(p.goals).toEqual([
      'More table bookings',
      'Look more premium',
      'Rank on Google for "restaurant Barking"',
    ]);
    expect(p.audience).toBe('Local couples, Families and Corporate groups · ages 28–55');
    expect(p.pages?.length).toBe(7);
    expect(p.features?.map((f) => f.priority)).not.toContain('Could');
    expect(p.budget).toBe('£3,000–£6,000 · launch in 4 weeks');
    expect(p.details).toBe('40–80 · ResDiary');
    expect(p.pending).toEqual([]);
    expect(p.readyCount).toBe(7);
  });

  it('never shows a price', () => {
    expect(JSON.stringify(previewModel(EMBER_AND_OAK, all))).not.toMatch(/£4|£1,2|£250/);
  });
});
