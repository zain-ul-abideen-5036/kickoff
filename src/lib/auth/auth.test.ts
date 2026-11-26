import { describe, expect, it } from 'vitest';
import { MemoryStore } from '@/lib/store/memory';
import { changePassword, checkCredentials, createOwner, getOwner } from './owner-repo';
import { hashPassword, passwordProblem, verifyPassword } from './password';
import { createSessionToken, readSessionToken, sessionSecret } from './session';

const SECRET = 'x'.repeat(40);

describe('passwords', () => {
  it('verifies the right password and rejects the wrong one', async () => {
    const hash = await hashPassword('correct horse battery');
    expect(hash).toMatch(/^scrypt\$/);
    expect(await verifyPassword('correct horse battery', hash)).toBe(true);
    expect(await verifyPassword('wrong horse battery', hash)).toBe(false);
  });
  it('salts every hash', async () => {
    expect(await hashPassword('same password')).not.toBe(await hashPassword('same password'));
  });
  it('rejects malformed hashes', async () => {
    expect(await verifyPassword('x', 'md5$abc')).toBe(false);
  });
  it('explains weak passwords', () => {
    expect(passwordProblem('short')).toMatch(/at least 10/);
    expect(passwordProblem('aaaaaaaaaaaa')).toMatch(/repetitive/);
    expect(passwordProblem('a sensible passphrase')).toBeNull();
  });
});

describe('session tokens', () => {
  const now = Date.parse('2026-11-26T10:00:00Z');
  it('round-trips a valid session', () => {
    const t = createSessionToken('amira@studionorth.co.uk', 1, SECRET, now);
    expect(readSessionToken(t, SECRET, now + 1000)).toMatchObject({ sub: 'amira@studionorth.co.uk', v: 1 });
  });
  it('rejects a tampered payload', () => {
    const t = createSessionToken('a@b.co', 1, SECRET, now);
    const [, sig] = t.split('.');
    const forged = Buffer.from(JSON.stringify({ sub: 'evil@x.co', v: 1, exp: now + 1e9 })).toString(
      'base64url',
    );
    expect(readSessionToken(`${forged}.${sig}`, SECRET, now)).toBeNull();
  });
  it('rejects another secret, expiry and junk', () => {
    const t = createSessionToken('a@b.co', 1, SECRET, now, 1);
    expect(readSessionToken(t, 'y'.repeat(40), now)).toBeNull();
    expect(readSessionToken(t, SECRET, now + 2 * 86_400_000)).toBeNull();
    expect(readSessionToken('nonsense', SECRET, now)).toBeNull();
    expect(readSessionToken(undefined, SECRET, now)).toBeNull();
  });
  it('requires a real secret on Vercel production', () => {
    expect(() => sessionSecret({ NODE_ENV: 'production', VERCEL: '1' })).toThrow(/SESSION_SECRET/);
    expect(sessionSecret({ NODE_ENV: 'production', VERCEL: '1', SESSION_SECRET: SECRET })).toBe(SECRET);
    expect(sessionSecret({ NODE_ENV: 'development' }).length).toBeGreaterThanOrEqual(32);
  });
});

describe('owner account', () => {
  it('creates one owner and checks credentials case-insensitively', async () => {
    const store = new MemoryStore();
    await createOwner(store, {
      email: 'Amira@StudioNorth.co.uk',
      name: 'Amira Clarke',
      password: 'a sensible passphrase',
    });
    expect((await getOwner(store))?.email).toBe('amira@studionorth.co.uk');
    expect(await checkCredentials(store, 'amira@studionorth.co.uk ', 'a sensible passphrase')).not.toBeNull();
    expect(await checkCredentials(store, 'amira@studionorth.co.uk', 'wrong passphrase!')).toBeNull();
    expect(await checkCredentials(store, 'someone@else.co.uk', 'a sensible passphrase')).toBeNull();
    await expect(
      createOwner(store, { email: 'x@y.co', name: 'X', password: 'another passphrase' }),
    ).rejects.toThrow();
  });
  it('signs old sessions out on password change', async () => {
    const store = new MemoryStore();
    const owner = await createOwner(store, { email: 'a@b.co', name: 'A', password: 'a sensible passphrase' });
    const next = await changePassword(store, owner, 'a different passphrase');
    expect(next.sessionVersion).toBe(owner.sessionVersion + 1);
    expect(await checkCredentials(store, 'a@b.co', 'a different passphrase')).not.toBeNull();
  });
  it('returns null when there is no owner yet', async () => {
    expect(await checkCredentials(new MemoryStore(), 'a@b.co', 'anything at all')).toBeNull();
  });
});
