import { describe, expect, it } from 'vitest';
import { defaultSettings } from '@/lib/domain/settings';
import { accentVars } from './brand-accent';

describe('accentVars', () => {
  it('keeps brass by default', () => {
    expect(accentVars(defaultSettings().agency)).toBeUndefined();
  });

  it('uses the brand colour when chosen', () => {
    const agency = { ...defaultSettings().agency, accent: 'brand' as const, brandColor: '#3B2C55' };
    expect(accentVars(agency)).toEqual({ '--agency-accent': '#3B2C55' });
  });
});
