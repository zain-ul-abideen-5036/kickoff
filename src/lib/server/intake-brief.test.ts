import { describe, expect, it } from 'vitest';
import { EMBER_AND_OAK } from '@/lib/domain/fixtures';
import { defaultSettings } from '@/lib/domain/settings';
import { generateBrief } from '@/lib/engine/generate';
import { listBriefs } from '@/lib/repo/briefs-repo';
import { getDraft, saveDraft } from '@/lib/repo/drafts-repo';
import { MemoryStore } from '@/lib/store/memory';
import { startDraft } from './intake';
import { briefForDraft, budgetFit, planStage, readStage, writeStage } from './intake-brief';

const settings = defaultSettings();
settings.notifications.recipients = ['amira@studionorth.co.uk'];

async function filledDraft() {
  const store = new MemoryStore();
  const id = await startDraft(store);
  const d = (await getDraft(store, id))!;
  await saveDraft(store, { ...d, answers: EMBER_AND_OAK });
  return { store, id };
}

const deps = (sent: string[] = []) => ({
  ai: {},
  appUrl: 'https://studio.example',
  email: {
    apiKey: 'k',
    from: 'Kickoff <a@b.co>',
    fetchImpl: async (_u: string, init?: RequestInit) => {
      sent.push(String(init?.body));
      return new Response('{"id":"e1"}');
    },
  },
});

describe('assembling stages', () => {
  it('reads, plans and writes the Ember & Oak brief', async () => {
    const { store, id } = await filledDraft();
    expect(await readStage(store, id, settings)).toMatchObject({ ok: true, done: false });
    const plan = await planStage(store, id, settings);
    expect(plan).toMatchObject({ ok: true, weeks: 5.5 });
    expect(plan.ok && plan.pages).toHaveLength(7);

    const sent: string[] = [];
    const w = await writeStage(store, id, settings, deps(sent));
    expect(w.ok).toBe(true);
    const [row] = await listBriefs(store);
    expect(row).toMatchObject({ business: 'Ember & Oak', total: 4850, ref: 'KO-0101' });
    expect((await getDraft(store, id))?.briefId).toBe(row?.id);
    expect(sent).toHaveLength(1);
    expect(sent[0]).toContain('New brief: Ember & Oak');
  });

  it('returns the same brief when run twice', async () => {
    const { store, id } = await filledDraft();
    const a = await writeStage(store, id, settings, deps());
    const b = await writeStage(store, id, settings, deps());
    expect(a).toEqual(b);
    expect(await listBriefs(store)).toHaveLength(1);
  });

  it('writes from templates when there is no AI key', async () => {
    const { store, id } = await filledDraft();
    await writeStage(store, id, settings, deps());
    expect((await briefForDraft(store, id))?.writtenBy).toBe('template');
  });

  it('still saves the brief when email fails', async () => {
    const { store, id } = await filledDraft();
    const broken = {
      ...deps(),
      email: { apiKey: 'k', from: 'a@b.co', fetchImpl: async () => Promise.reject(new Error('down')) },
    };
    expect((await writeStage(store, id, settings, broken)).ok).toBe(true);
  });

  it('refuses incomplete answers and unknown drafts', async () => {
    const store = new MemoryStore();
    const id = await startDraft(store);
    expect(await writeStage(store, id, settings, deps())).toMatchObject({ ok: false });
    expect(await readStage(store, 'nope', settings)).toMatchObject({ ok: false });
  });
});

describe('budgetFit', () => {
  it('says the estimate fits without naming the price', () => {
    const brief = generateBrief({ id: 'b-12345678', ref: 'KO-1', answers: EMBER_AND_OAK, settings });
    const fit = budgetFit(brief, 0.2, 'Studio North');
    expect(fit.title).toBe('Fits your £3,000–£6,000 range');
    expect(JSON.stringify(fit)).not.toContain('4,850');
  });
  it('flags a range the estimate goes above', () => {
    const a = { ...EMBER_AND_OAK, budget: { ...EMBER_AND_OAK.budget, budget: 'b1' as const } };
    const brief = generateBrief({ id: 'b-12345678', ref: 'KO-1', answers: a, settings });
    expect(budgetFit(brief, 0.2, 'Studio North').title).toBe('A little above your Under £3,000 range');
  });
});
