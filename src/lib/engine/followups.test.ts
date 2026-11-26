import { describe, expect, it } from 'vitest';
import { EMBER_AND_OAK } from '@/lib/domain/fixtures';
import type { IntakeAnswers } from '@/lib/domain/intake';
import { followUpsComplete, selectFollowUps } from './followups';

const with_ = (patch: (a: IntakeAnswers) => void) => {
  const a = structuredClone(EMBER_AND_OAK);
  patch(a);
  return a;
};

describe('selectFollowUps', () => {
  it('asks Ember & Oak the two designed questions', () => {
    const set = selectFollowUps(EMBER_AND_OAK);
    expect(set.questions.map((q) => q.question)).toEqual([
      'How many covers do you take on a busy night?',
      'Do you already use a booking system such as OpenTable or ResDiary?',
    ]);
    expect(set.reason).toBe('You asked for online table booking, so these help us size it properly.');
  });

  it('asks a shop how many products it sells', () => {
    const set = selectFollowUps(
      with_((a) => {
        a.about.businessType = 'shop';
        a.features.features = ['shop'];
      }),
    );
    expect(set.questions.map((q) => q.id)).toEqual(['products']);
    expect(set.questions[0]?.options.map((o) => o.value)).toContain('50');
  });

  it('never asks more than three', () => {
    const set = selectFollowUps(
      with_((a) => {
        a.features.features = ['booking', 'shop', 'private', 'menu'];
      }),
    );
    expect(set.questions.length).toBeLessThanOrEqual(3);
  });

  it('falls back to a current-site question when nothing else applies', () => {
    const set = selectFollowUps(with_((a) => (a.features.features = ['gallery'])));
    expect(set.questions.map((q) => q.id)).toEqual(['currentPages']);
  });

  it('asks nothing for a first website with no special features', () => {
    const set = selectFollowUps(
      with_((a) => {
        a.features.features = ['gallery'];
        a.about.website = 'none';
      }),
    );
    expect(set.questions).toEqual([]);
    expect(set.reason).toBe('');
  });

  it('knows when the follow-ups are answered', () => {
    expect(followUpsComplete(EMBER_AND_OAK)).toBe(true);
    expect(followUpsComplete(with_((a) => (a.followUps = { covers: '40–80' })))).toBe(false);
  });
});
