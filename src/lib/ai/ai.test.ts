import { describe, expect, it } from 'vitest';
import { EMBER_AND_OAK } from '@/lib/domain/fixtures';
import { defaultSettings } from '@/lib/domain/settings';
import { selectFollowUps } from '@/lib/engine/followups';
import { generateBrief } from '@/lib/engine/generate';
import { figuresIn, unknownFigures, wordFiguresIn } from './figures';
import { polishBrief, polishFollowUps } from './writer';

const settings = defaultSettings();
const brief = generateBrief({ id: 'brief-1234', ref: 'KO-0142', answers: EMBER_AND_OAK, settings });

/** A fake Gemini that replies with the given object, or fails. */
const gemini =
  (reply: unknown, status = 200) =>
  async () =>
    new Response(
      JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(reply) }] } }] }),
      { status },
    );

const goodProse = {
  summary:
    'Ember & Oak is a seasonal restaurant in Barking, London, loved by local couples, families and office teams. The new site should make booking a table effortless and show off private dining.',
  audience: [
    {
      name: 'Local couples and families',
      tag: '28–55',
      description: 'They decide on a phone, often on the day.',
      needs: ["Tonight's menu", 'Quick booking', 'Opening times'],
    },
  ],
};

describe('figures', () => {
  it('reads prices, decimals and thousands', () => {
    expect(figuresIn('£4,850 over 5.5 weeks for 7 pages, budget £3k')).toEqual([4850, 5.5, 7, 3000]);
  });
  it('reads spelled-out numbers', () => {
    expect(wordFiguresIn('Seven pages in five weeks')).toEqual([7, 5]);
  });
  it('flags figures that were not calculated', () => {
    expect(unknownFigures('About £5,000 and 6 weeks', [4850, 5.5, 7])).toEqual([5000, 6]);
    expect(unknownFigures('Ages 28–55', [28, 55])).toEqual([]);
    expect(unknownFigures('one place to book', [])).toEqual([]);
  });
});

describe('polishBrief', () => {
  it('uses valid AI prose and marks the brief as AI-written', async () => {
    const { brief: out, outcome } = await polishBrief(brief, settings, {
      apiKey: 'k',
      fetchImpl: gemini(goodProse),
    });
    expect(outcome).toBe('ai');
    expect(out.writtenBy).toBe('ai');
    expect(out.summary).toBe(goodProse.summary);
    expect(out.audience).toHaveLength(1);
  });

  it('never lets AI touch the quote, timeline, pages or risks', async () => {
    const { brief: out } = await polishBrief(brief, settings, { apiKey: 'k', fetchImpl: gemini(goodProse) });
    expect(out.quote).toEqual(brief.quote);
    expect(out.phases).toEqual(brief.phases);
    expect(out.pages).toEqual(brief.pages);
    expect(out.risks).toEqual(brief.risks);
  });

  it('keeps the template when AI is switched off', async () => {
    const off = { ...settings, ai: { enabled: false } };
    const r = await polishBrief(brief, off, { apiKey: 'k', fetchImpl: gemini(goodProse) });
    expect(r.outcome).toBe('template:off');
    expect(r.brief).toBe(brief);
  });

  it('keeps the template when there is no key', async () => {
    expect((await polishBrief(brief, settings, {})).outcome).toBe('template:no-key');
  });

  it('keeps the template when Gemini fails', async () => {
    const r = await polishBrief(brief, settings, { apiKey: 'k', fetchImpl: gemini({}, 503) });
    expect(r.outcome).toBe('template:error');
    expect(r.brief.summary).toBe(brief.summary);
  });

  it('keeps the template when the reply has the wrong shape', async () => {
    const r = await polishBrief(brief, settings, { apiKey: 'k', fetchImpl: gemini({ summary: '' }) });
    expect(r.outcome).toBe('template:invalid');
  });

  it('rejects AI text with an invented price', async () => {
    const bad = { ...goodProse, summary: `${goodProse.summary} The site will cost about £5,200.` };
    const r = await polishBrief(brief, settings, { apiKey: 'k', fetchImpl: gemini(bad) });
    expect(r.outcome).toBe('template:figures');
    expect(r.brief.writtenBy).toBe('template');
  });

  it('rejects AI text with an invented timeline, even spelled out', async () => {
    const bad = { ...goodProse, summary: `${goodProse.summary} It will launch in six weeks.` };
    expect((await polishBrief(brief, settings, { apiKey: 'k', fetchImpl: gemini(bad) })).outcome).toBe(
      'template:figures',
    );
  });

  it('rejects money talk even when the figure happens to match', async () => {
    const bad = { ...goodProse, summary: `${goodProse.summary} The estimate is £4,850.` };
    expect((await polishBrief(brief, settings, { apiKey: 'k', fetchImpl: gemini(bad) })).outcome).toBe(
      'template:figures',
    );
  });
});

describe('polishFollowUps', () => {
  const set = selectFollowUps(EMBER_AND_OAK);
  const ctx = { business: 'Ember & Oak', type: 'Restaurant or café' };

  it('rewords questions but keeps ids and options', async () => {
    const reply = {
      questions: set.questions.map((q) => ({ id: q.id, question: `Quick one: ${q.question}`, hint: q.hint })),
    };
    const out = await polishFollowUps(set, ctx, settings, { apiKey: 'k', fetchImpl: gemini(reply) });
    expect(out.questions[0]?.question).toMatch(/^Quick one:/);
    expect(out.questions.map((q) => q.options)).toEqual(set.questions.map((q) => q.options));
  });

  it('keeps the original wording if ids change or figures appear', async () => {
    const wrongIds = {
      questions: set.questions.map((q) => ({ id: 'x', question: q.question, hint: q.hint })),
    };
    expect(await polishFollowUps(set, ctx, settings, { apiKey: 'k', fetchImpl: gemini(wrongIds) })).toEqual(
      set,
    );
    const figures = {
      questions: set.questions.map((q) => ({ id: q.id, question: 'Do you seat 250 guests?', hint: q.hint })),
    };
    expect(await polishFollowUps(set, ctx, settings, { apiKey: 'k', fetchImpl: gemini(figures) })).toEqual(
      set,
    );
  });

  it('does nothing without a key', async () => {
    expect(await polishFollowUps(set, ctx, settings, {})).toBe(set);
  });
});
