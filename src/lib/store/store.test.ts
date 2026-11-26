import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { FileStore } from './file';
import { MemoryStore } from './memory';
import { assertKey, type Store } from './types';

describe('assertKey', () => {
  it.each(['briefs/abc.json', 'settings.json', 'assets/logo-1.png'])('accepts %s', (k) => {
    expect(assertKey(k)).toBe(k);
  });
  it.each(['../secret', '/etc/passwd', 'a//b', 'folder/', '', 'a/../b', 'with space.json'])(
    'refuses %j',
    (k) => {
      expect(() => assertKey(k)).toThrow(/Invalid storage key/);
    },
  );
});

let dir = '';
beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'kickoff-store-'));
});
afterAll(async () => {
  await rm(dir, { recursive: true, force: true });
});

const stores: [string, () => Store][] = [
  ['memory', () => new MemoryStore()],
  ['file', () => new FileStore(join(dir, String(Math.random()).slice(2)))],
];

describe.each(stores)('%s store', (_name, make) => {
  it('round-trips JSON', async () => {
    const s = make();
    await s.putJSON('briefs/a.json', { total: 4850, pages: ['Home'] });
    expect(await s.getJSON('briefs/a.json')).toEqual({ total: 4850, pages: ['Home'] });
  });

  it('returns null for missing keys', async () => {
    const s = make();
    expect(await s.getJSON('nope.json')).toBeNull();
    expect(await s.getBytes('nope.png')).toBeNull();
  });

  it('overwrites', async () => {
    const s = make();
    await s.putJSON('x.json', 1);
    await s.putJSON('x.json', 2);
    expect(await s.getJSON('x.json')).toBe(2);
  });

  it('stores bytes with a content type', async () => {
    const s = make();
    await s.putBytes('assets/logo.png', new Uint8Array([137, 80, 78, 71]), 'image/png');
    const hit = await s.getBytes('assets/logo.png');
    expect([...(hit?.bytes ?? [])]).toEqual([137, 80, 78, 71]);
    expect(hit?.contentType).toBe('image/png');
  });

  it('lists by prefix in order and deletes', async () => {
    const s = make();
    await s.putJSON('briefs/b.json', {});
    await s.putJSON('briefs/a.json', {});
    await s.putJSON('drafts/z.json', {});
    expect(await s.list('briefs/')).toEqual(['briefs/a.json', 'briefs/b.json']);
    await s.delete('briefs/a.json');
    expect(await s.list('briefs/')).toEqual(['briefs/b.json']);
  });

  it('copies data so callers cannot mutate what is stored', async () => {
    const s = make();
    const value = { n: 1 };
    await s.putJSON('c.json', value);
    value.n = 2;
    expect(await s.getJSON('c.json')).toEqual({ n: 1 });
  });
});
