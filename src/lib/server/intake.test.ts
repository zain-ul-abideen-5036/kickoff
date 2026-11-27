import { describe, expect, it } from 'vitest';
import { EMBER_AND_OAK } from '@/lib/domain/fixtures';
import { getDraft, saveDraft } from '@/lib/repo/drafts-repo';
import { MemoryStore } from '@/lib/store/memory';
import { checkSubmission, cleanAnswers, saveDraftInput, startDraft } from './intake';

describe('drafts', () => {
  it('starts an empty draft with a fresh id', async () => {
    const store = new MemoryStore();
    const id = await startDraft(store);
    const d = await getDraft(store, id);
    expect(d?.step).toBe(0);
    expect(d?.answers.about.name).toBe('');
  });

  it('saves answers and the current step', async () => {
    const store = new MemoryStore();
    const id = await startDraft(store);
    const r = await saveDraftInput(store, id, { step: 3, answers: EMBER_AND_OAK });
    expect(r.ok).toBe(true);
    const d = await getDraft(store, id);
    expect(d?.step).toBe(3);
    expect(d?.answers.about.business).toBe('Ember & Oak');
  });

  it('refuses unknown, invalid and submitted drafts', async () => {
    const store = new MemoryStore();
    expect(await saveDraftInput(store, '../x', { step: 0, answers: {} })).toEqual({
      ok: false,
      reason: 'invalid',
    });
    expect(await saveDraftInput(store, 'abcdefghijklmnop', { step: 0, answers: {} })).toEqual({
      ok: false,
      reason: 'missing',
    });
    const id = await startDraft(store);
    const d = (await getDraft(store, id))!;
    await saveDraft(store, { ...d, briefId: 'brief-123456' });
    expect(await saveDraftInput(store, id, { step: 1, answers: {} })).toEqual({
      ok: false,
      reason: 'submitted',
    });
  });

  it('refuses oversized answers politely', async () => {
    const store = new MemoryStore();
    const id = await startDraft(store);
    const big = { ...EMBER_AND_OAK, audience: { ...EMBER_AND_OAK.audience, notes: 'x'.repeat(40_000) } };
    expect(await saveDraftInput(store, id, { step: 1, answers: big })).toEqual({
      ok: false,
      reason: 'too-large',
    });
  });

  it('clamps a bogus step number', async () => {
    const store = new MemoryStore();
    const id = await startDraft(store);
    await saveDraftInput(store, id, { step: 999, answers: {} });
    expect((await getDraft(store, id))?.step).toBe(20);
  });
});

describe('checkSubmission', () => {
  const all = ['about', 'goals', 'audience', 'features', 'content', 'inspiration', 'budget'] as const;

  it('accepts the Ember & Oak answers', () => {
    expect(checkSubmission(EMBER_AND_OAK, [...all], true)).toMatchObject({ ok: true });
  });

  it('sends the client back to the first step that needs a look', () => {
    const a = { ...EMBER_AND_OAK, goals: { goals: [], searchTerm: '' } };
    expect(checkSubmission(a, [...all], true)).toEqual({
      ok: false,
      screen: 'goals',
      message: 'Choose at least one goal.',
    });
  });

  it('asks for unanswered follow-ups only when they are on', () => {
    const a = { ...EMBER_AND_OAK, followUps: {} };
    expect(checkSubmission(a, [...all], true)).toMatchObject({ ok: false, screen: 'followups' });
    expect(checkSubmission(a, [...all], false)).toMatchObject({ ok: true });
  });

  it('fills steps the studio turned off', () => {
    const a = {
      ...EMBER_AND_OAK,
      goals: { goals: [], searchTerm: '' },
      audience: { ...EMBER_AND_OAK.audience, groups: [] },
    };
    const r = checkSubmission(a, ['about', 'features', 'content', 'budget'], false);
    expect(r.ok && r.answers.goals.goals).toEqual(['enquiries']);
  });
});

describe('cleanAnswers', () => {
  it('drops unknown top-level keys and junk follow-ups', () => {
    const a = cleanAnswers({
      ...EMBER_AND_OAK,
      evil: 'x',
      followUps: { covers: '40–80', 'bad key': 'x', n: 5 },
    });
    expect(a).not.toHaveProperty('evil');
    expect(a.followUps).toEqual({ covers: '40–80' });
  });
  it('falls back to defaults for garbage', () => {
    expect(cleanAnswers('nope').about.businessType).toBe('restaurant');
    expect(cleanAnswers({ goals: [1, 2] }).goals.goals).toEqual([]);
  });
});
