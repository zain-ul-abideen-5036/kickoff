import { describe, expect, it } from 'vitest';
import { DEFAULT_RATE_CARD } from '@/lib/domain/rate-card';
import { defaultSettings } from '@/lib/domain/settings';
import {
  FEATURE_FIELDS,
  OPTIONAL_STEPS,
  PLATFORM_FIELDS,
  parseMoney,
  parseRateCardForm,
  parseTimelineForm,
  parseWeeks,
  type Fields,
} from './forms';

function rateFields(): Fields {
  const r = DEFAULT_RATE_CARD;
  return {
    ...Object.fromEntries(PLATFORM_FIELDS.map((p) => [p.name, String(r.platforms[p.id])])),
    ...Object.fromEntries(FEATURE_FIELDS.map((x) => [x.name, String(r.features[x.id])])),
    perPage: '250',
    shopPer10Products: '450',
    seo: '350',
    copywriting: '300',
    vatPercent: '20',
  };
}

describe('parseMoney', () => {
  it('accepts pounds with symbols and separators', () => {
    expect(parseMoney('£1,200')).toBe(1200);
    expect(parseMoney(' 250 ')).toBe(250);
    expect(parseMoney('0')).toBe(0);
  });
  it('refuses pence, negatives, words and huge numbers', () => {
    expect(parseMoney('12.50')).toBeNull();
    expect(parseMoney('-5')).toBeNull();
    expect(parseMoney('lots')).toBeNull();
    expect(parseMoney('2000000')).toBeNull();
    expect(parseMoney(undefined)).toBeNull();
  });
});

describe('parseWeeks', () => {
  it('accepts half weeks in range', () => {
    expect(parseWeeks('1.5', 0.5, 26)).toBe(1.5);
    expect(parseWeeks('0.3', 0.5, 26)).toBeNull();
    expect(parseWeeks('1.25', 0, 26)).toBeNull();
    expect(parseWeeks('30', 0.5, 26)).toBeNull();
  });
});

describe('parseRateCardForm', () => {
  it('round-trips the default rate card', () => {
    expect(parseRateCardForm(rateFields())).toEqual({ ok: true, value: DEFAULT_RATE_CARD });
  });
  it('reports each bad field in plain words', () => {
    const r = parseRateCardForm({ ...rateFields(), perPage: 'two fifty', vatPercent: '120' });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.perPage).toBe('Price per page: use whole pounds, like 250.');
      expect(r.errors.vatPercent).toMatch(/0 to 100/);
    }
  });
});

describe('parseTimelineForm', () => {
  const s = defaultSettings();
  const fields = (): Fields => ({
    'phase.discovery': '0.5',
    'phase.design': '2',
    'phase.build': '2',
    'phase.content': '1',
    'phase.launch': '0.5',
    extraWeeksPer5Pages: '0.5',
    ...Object.fromEntries(OPTIONAL_STEPS.map((x) => [`step.${x.key}`, 'on'])),
    followUps: 'on',
  });

  it('updates phases, steps and follow-ups', () => {
    const r = parseTimelineForm({ ...fields(), 'step.inspiration': undefined, followUps: undefined }, s);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.timeline.phases.find((p) => p.id === 'design')?.weeks).toBe(2);
      expect(r.value.intake.steps.inspiration).toBe(false);
      expect(r.value.intake.steps.goals).toBe(true);
      expect(r.value.intake.followUps).toBe(false);
    }
  });

  it('refuses bad weeks and turning every step off', () => {
    const off = Object.fromEntries(OPTIONAL_STEPS.map((x) => [`step.${x.key}`, undefined]));
    const r = parseTimelineForm({ ...fields(), ...off, 'phase.build': '0' }, s);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors['phase.build']).toMatch(/Build/);
      expect(r.errors.steps).toBeTruthy();
    }
  });
});
