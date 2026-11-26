import { beforeEach, describe, expect, it } from 'vitest';
import { clientKey, hit, resetRateLimits } from './rate-limit';

beforeEach(() => resetRateLimits());

describe('hit', () => {
  const limit = { max: 3, windowMs: 1000 };
  it('allows up to the limit then blocks with a retry time', () => {
    expect(hit('k', limit, 0).ok).toBe(true);
    expect(hit('k', limit, 1).ok).toBe(true);
    expect(hit('k', limit, 2).ok).toBe(true);
    const blocked = hit('k', limit, 3);
    expect(blocked).toEqual({ ok: false, retryAfterMs: 997 });
  });
  it('opens again after the window', () => {
    for (let i = 0; i < 4; i++) hit('k', limit, 0);
    expect(hit('k', limit, 1001).ok).toBe(true);
  });
  it('keeps keys separate', () => {
    for (let i = 0; i < 4; i++) hit('a', limit, 0);
    expect(hit('b', limit, 0).ok).toBe(true);
  });
});

describe('clientKey', () => {
  it('uses the first forwarded address', () => {
    expect(clientKey(new Headers({ 'x-forwarded-for': '203.0.113.7, 10.0.0.1' }))).toBe('203.0.113.7');
    expect(clientKey(new Headers())).toBe('local');
  });
});
