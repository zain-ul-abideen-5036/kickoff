import { describe, expect, it } from 'vitest';
import { formatGbp, formatGbpExact, formatWeeks } from './format';

describe('formatGbp', () => {
  it('formats whole pounds with a thousands separator', () => {
    expect(formatGbp(4850)).toBe('£4,850');
  });
  it('rounds pence away', () => {
    expect(formatGbp(249.6)).toBe('£250');
  });
  it('keeps pence when exact', () => {
    expect(formatGbpExact(5820)).toBe('£5,820.00');
  });
});

describe('formatWeeks', () => {
  it('pluralises', () => {
    expect(formatWeeks(5.5)).toBe('5.5 weeks');
    expect(formatWeeks(1)).toBe('1 week');
    expect(formatWeeks(2)).toBe('2 weeks');
  });
});
