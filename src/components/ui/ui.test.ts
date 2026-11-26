import { describe, expect, it } from 'vitest';
import { nextTheme } from '@/lib/theme/script';
import { monogram } from './brand';
import { cx } from './cx';

describe('monogram', () => {
  it('takes the first letters of the first two words', () => {
    expect(monogram('Studio North')).toBe('SN');
    expect(monogram('Fieldwork Design Co')).toBe('FD');
  });
  it('uses two letters of a single word', () => {
    expect(monogram('kiln')).toBe('KI');
  });
  it('falls back for an empty name', () => {
    expect(monogram('  ')).toBe('K');
  });
});

describe('cx', () => {
  it('skips falsy parts', () => {
    expect(cx('btn', false, null, undefined, 'btn-primary')).toBe('btn btn-primary');
  });
});

describe('nextTheme', () => {
  it('flips between light and dark', () => {
    expect(nextTheme('dark')).toBe('light');
    expect(nextTheme('light')).toBe('dark');
    expect(nextTheme(undefined)).toBe('dark');
  });
});
