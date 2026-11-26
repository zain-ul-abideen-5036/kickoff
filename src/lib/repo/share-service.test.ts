import { describe, expect, it } from 'vitest';
import { EMBER_AND_OAK } from '@/lib/domain/fixtures';
import { defaultSettings } from '@/lib/domain/settings';
import { generateBrief } from '@/lib/engine/generate';
import { MemoryStore } from '@/lib/store/memory';
import { saveBrief } from './briefs-repo';
import { newId } from './ids';
import { approveShared, ensureShareLink, openShare, revokeShareLink } from './share-service';

const settings = defaultSettings();
const now = new Date('2026-11-26T10:00:00Z');

async function setup() {
  const store = new MemoryStore();
  const brief = await saveBrief(
    store,
    generateBrief({ id: newId(), ref: 'KO-0142', answers: EMBER_AND_OAK, settings, now }),
    0.2,
    now,
  );
  return { store, brief };
}

describe('share links', () => {
  it('issues a long unguessable token that opens the brief', async () => {
    const { store, brief } = await setup();
    const { token, fresh, brief: shared } = await ensureShareLink(store, brief, settings, now);
    expect(fresh).toBe(true);
    expect(token.length).toBeGreaterThanOrEqual(43);
    expect(shared.share?.expiresAt).toBe('2026-12-26T10:00:00.000Z');
    const open = await openShare(store, token, now);
    expect(open.state).toBe('ok');
  });

  it('reuses a live link', async () => {
    const { store, brief } = await setup();
    const a = await ensureShareLink(store, brief, settings, now);
    const b = await ensureShareLink(store, a.brief, settings, now);
    expect(b.fresh).toBe(false);
    expect(b.token).toBe(a.token);
  });

  it('expires after the configured days and replaces the old token', async () => {
    const { store, brief } = await setup();
    const a = await ensureShareLink(store, brief, settings, now);
    const later = new Date('2027-01-05T00:00:00Z');
    expect((await openShare(store, a.token, later)).state).toBe('expired');
    const b = await ensureShareLink(store, a.brief, settings, later);
    expect(b.token).not.toBe(a.token);
    expect((await openShare(store, a.token, later)).state).toBe('missing');
    expect((await openShare(store, b.token, later)).state).toBe('ok');
  });

  it('revokes immediately', async () => {
    const { store, brief } = await setup();
    const a = await ensureShareLink(store, brief, settings, now);
    await revokeShareLink(store, a.brief, settings, now);
    expect((await openShare(store, a.token, now)).state).toBe('missing');
  });

  it('records approval once', async () => {
    const { store, brief } = await setup();
    const a = await ensureShareLink(store, brief, settings, now);
    const approved = await approveShared(store, a.brief, settings, now);
    expect(approved.share?.approvedAt).toBe(now.toISOString());
    expect(approved.activity.at(-1)?.text).toBe('Daniel Okafor approved the brief');
    const again = await approveShared(store, approved, settings, new Date('2026-11-27'));
    expect(again.share?.approvedAt).toBe(now.toISOString());
  });
});
