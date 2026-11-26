import { describe, expect, it } from 'vitest';
import { EMBER_AND_OAK } from './fixtures';
import { IntakeAnswersSchema, emptyAnswers, stepErrors } from './intake';
import { DEFAULT_RATE_CARD, RateCardSchema } from './rate-card';
import { defaultSettings, parseSettings } from './settings';

describe('intake schema', () => {
  it('accepts the Ember & Oak answers', () => {
    expect(IntakeAnswersSchema.safeParse(EMBER_AND_OAK).success).toBe(true);
  });

  it('explains a missing name and a broken email in plain words', () => {
    const errors = stepErrors('about', { ...EMBER_AND_OAK.about, name: '', email: 'daniel@' });
    expect(errors.name).toMatch(/tell us your name/);
    expect(errors.email).toMatch(/looks incomplete/);
  });

  it('limits goals to three', () => {
    const errors = stepErrors('goals', { goals: ['bookings', 'premium', 'google', 'sell'] });
    expect(errors.goals).toMatch(/up to 3/);
  });

  it('rejects an age range that runs backwards', () => {
    const errors = stepErrors('audience', { groups: ['couples'], ageMin: 60, ageMax: 30 });
    expect(errors.ageMin).toBeTruthy();
  });

  it('returns no errors for a valid step', () => {
    expect(stepErrors('budget', { budget: 'b2', launch: 'w4' })).toEqual({});
  });

  it('starts a blank draft in a valid shape for the choice steps', () => {
    const blank = emptyAnswers();
    expect(stepErrors('content', blank.content)).toEqual({});
    expect(stepErrors('budget', blank.budget)).toEqual({});
  });
});

describe('rate card', () => {
  it('ships a valid default', () => {
    expect(RateCardSchema.safeParse(DEFAULT_RATE_CARD).success).toBe(true);
  });

  it('refuses negative prices', () => {
    expect(RateCardSchema.safeParse({ ...DEFAULT_RATE_CARD, perPage: -1 }).success).toBe(false);
  });
});

describe('settings', () => {
  it('fills missing keys from the defaults', () => {
    const s = parseSettings({ agency: { name: 'Fieldwork Design' } });
    expect(s.agency.name).toBe('Fieldwork Design');
    expect(s.agency.brandColor).toBe('#1F3B34');
    expect(s.rateCard.perPage).toBe(250);
  });

  it('falls back to defaults for garbage', () => {
    expect(parseSettings('nope')).toEqual(defaultSettings());
    expect(parseSettings({ agency: { brandColor: 'red' } })).toEqual(defaultSettings());
  });

  it('defaults the timeline to 5.5 weeks', () => {
    const total = defaultSettings().timeline.phases.reduce((a, p) => a + p.weeks, 0);
    expect(total).toBe(5.5);
  });
});
