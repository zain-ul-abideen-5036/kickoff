import { describe, expect, it } from 'vitest';
import { EMBER_AND_OAK } from '@/lib/domain/fixtures';
import { defaultSettings } from '@/lib/domain/settings';
import { generateBrief } from '@/lib/engine/generate';
import { MemoryStore } from '@/lib/store/memory';
import { deleteBrief, getBrief, listBriefs, nextRef, saveBrief } from './briefs-repo';
import { MAX_DRAFT_BYTES, getDraft, saveDraft } from './drafts-repo';
import { hashToken, isId, newId, newToken } from './ids';
import { seedSampleBriefs } from './seed';
import { loadSettings, saveSettings } from './settings-repo';
import { lookupShare, putShare } from './shares-repo';

const settings = defaultSettings();

describe('ids', () => {
  it('makes unique url-safe ids and long tokens', () => {
    const a = newId();
    expect(isId(a)).toBe(true);
    expect(a).not.toBe(newId());
    expect(newToken().length).toBeGreaterThanOrEqual(43);
  });
  it('hashes tokens one way', () => {
    const t = newToken();
    expect(hashToken(t)).toMatch(/^[a-f0-9]{64}$/);
    expect(hashToken(t)).not.toContain(t);
  });
  it('rejects ids that could be paths', () => {
    expect(isId('../settings')).toBe(false);
    expect(isId('a/b/c/d/e/f')).toBe(false);
  });
});

describe('settings repo', () => {
  it('returns defaults on a fresh store and saves changes', async () => {
    const store = new MemoryStore();
    expect((await loadSettings(store)).agency.name).toBe('Studio North');
    const s = defaultSettings();
    s.agency.name = 'Fieldwork Design';
    await saveSettings(store, s);
    expect((await loadSettings(store)).agency.name).toBe('Fieldwork Design');
  });
  it('refuses invalid settings', async () => {
    const s = defaultSettings();
    s.agency.brandColor = 'teal';
    await expect(saveSettings(new MemoryStore(), s)).rejects.toThrow();
  });
});

describe('briefs repo', () => {
  it('saves, reads and indexes a brief', async () => {
    const store = new MemoryStore();
    const ref = await nextRef(store);
    expect(ref).toBe('KO-0101');
    const brief = generateBrief({ id: newId(), ref, answers: EMBER_AND_OAK, settings });
    await saveBrief(store, brief, 0.2);
    expect((await getBrief(store, brief.id))?.ref).toBe('KO-0101');
    const [row] = await listBriefs(store);
    expect(row).toMatchObject({
      business: 'Ember & Oak',
      total: 4850,
      pageCount: 7,
      weeks: 5.5,
      status: 'New',
    });
  });

  it('updates the index row when a brief changes and removes it on delete', async () => {
    const store = new MemoryStore();
    const brief = generateBrief({ id: newId(), ref: 'KO-1', answers: EMBER_AND_OAK, settings });
    await saveBrief(store, brief, 0.2);
    await saveBrief(store, { ...brief, status: 'Won' }, 0.2);
    expect((await listBriefs(store)).map((r) => r.status)).toEqual(['Won']);
    await deleteBrief(store, brief.id);
    expect(await listBriefs(store)).toEqual([]);
  });

  it('returns null for unknown or unsafe ids', async () => {
    const store = new MemoryStore();
    expect(await getBrief(store, 'missing-id-123')).toBeNull();
    expect(await getBrief(store, '../settings')).toBeNull();
  });

  it('seeds six sample briefs once', async () => {
    const store = new MemoryStore();
    const made = await seedSampleBriefs(store, settings);
    expect(made).toHaveLength(6);
    expect(await seedSampleBriefs(store, settings)).toEqual([]);
    const rows = await listBriefs(store);
    expect(rows[0]?.business).toBe('Ember & Oak');
    expect(rows.map((r) => r.status).sort()).toEqual(['Lost', 'New', 'New', 'Quoted', 'Reviewed', 'Won']);
  });
});

describe('drafts repo', () => {
  it('round-trips a draft and fills missing answers', async () => {
    const store = new MemoryStore();
    const id = newId();
    await saveDraft(store, { id, step: 2, answers: EMBER_AND_OAK, updatedAt: 'now', briefId: null });
    const d = await getDraft(store, id);
    expect(d?.step).toBe(2);
    expect(d?.answers.about.business).toBe('Ember & Oak');
  });
  it('refuses oversized drafts', async () => {
    const big = {
      ...EMBER_AND_OAK,
      inspiration: { ...EMBER_AND_OAK.inspiration, notes: 'x'.repeat(MAX_DRAFT_BYTES) },
    };
    await expect(
      saveDraft(new MemoryStore(), { id: newId(), step: 0, answers: big, updatedAt: 'now', briefId: null }),
    ).rejects.toThrow(/too large/);
  });
});

describe('shares repo', () => {
  it('finds a live link, expires old ones, ignores junk', async () => {
    const store = new MemoryStore();
    const token = newToken();
    await putShare(store, token, 'brief-123456', '2026-12-26T00:00:00Z');
    expect(await lookupShare(store, token, new Date('2026-12-01'))).toEqual({
      state: 'ok',
      briefId: 'brief-123456',
    });
    expect(await lookupShare(store, token, new Date('2027-01-01'))).toEqual({ state: 'expired' });
    expect(await lookupShare(store, 'short')).toEqual({ state: 'missing' });
    expect(await lookupShare(store, newToken())).toEqual({ state: 'missing' });
  });
});
