import { beforeEach, describe, expect, it } from 'vitest';
import { guard, trapped } from './intake-guard';
import { resetRateLimits } from './rate-limit';

beforeEach(() => resetRateLimits());

const from = (ip: string) => new Headers({ 'x-forwarded-for': ip });

describe('guard', () => {
  it('lets normal use through', () => {
    for (let i = 0; i < 6; i++) expect(guard('submit', from('203.0.113.1'), 0).ok).toBe(true);
  });

  it('stops a burst of submissions with a plain message', () => {
    for (let i = 0; i < 6; i++) guard('submit', from('203.0.113.2'), 0);
    const r = guard('submit', from('203.0.113.2'), 0);
    expect(r.ok).toBe(false);
    expect(!r.ok && r.message).toMatch(/try again in 60 minutes/);
  });

  it('counts each address and each kind separately', () => {
    for (let i = 0; i < 7; i++) guard('submit', from('203.0.113.3'), 0);
    expect(guard('submit', from('203.0.113.4'), 0).ok).toBe(true);
    expect(guard('draft', from('203.0.113.3'), 0).ok).toBe(true);
  });

  it('limits new drafts per hour', () => {
    for (let i = 0; i < 20; i++) guard('start', from('203.0.113.5'), 0);
    expect(guard('start', from('203.0.113.5'), 0).ok).toBe(false);
  });
});

describe('trapped', () => {
  it('only flags a filled trap field', () => {
    expect(trapped('')).toBe(false);
    expect(trapped(undefined)).toBe(false);
    expect(trapped('   ')).toBe(false);
    expect(trapped('https://spam.example')).toBe(true);
  });
});
