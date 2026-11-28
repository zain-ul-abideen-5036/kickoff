import { describe, expect, it } from 'vitest';
import { BriefSchema } from '@/lib/domain/brief';
import { EMBER_AND_OAK } from '@/lib/domain/fixtures';
import { defaultSettings } from '@/lib/domain/settings';
import { generateBrief } from '@/lib/engine/generate';
import { NoteError, addNote, recentActivity, relativeTime, removeNote } from './notes';

const base = generateBrief({
  id: 'brief-1234',
  ref: 'KO-0142',
  answers: EMBER_AND_OAK,
  settings: defaultSettings(),
});

describe('notes', () => {
  it('adds and removes a team note', () => {
    const b = addNote(
      base,
      '  Called Daniel. Happy to phase the launch.  ',
      'Amira',
      '2026-11-27T10:02:00Z',
      'n1',
    );
    expect(b.notes).toEqual([
      {
        id: 'n1',
        author: 'Amira',
        at: '2026-11-27T10:02:00Z',
        text: 'Called Daniel. Happy to phase the launch.',
      },
    ]);
    expect(BriefSchema.safeParse(b).success).toBe(true);
    expect(removeNote(b, 'n1').notes).toEqual([]);
  });

  it('refuses empty and overlong notes', () => {
    expect(() => addNote(base, '   ', 'A', 'now', 'n')).toThrow(NoteError);
    expect(() => addNote(base, 'x'.repeat(401), 'A', 'now', 'n')).toThrow(/under 400/);
  });
});

describe('relativeTime', () => {
  const now = new Date('2026-11-27T12:00:00Z');
  it('reads naturally', () => {
    expect(relativeTime('2026-11-27T11:59:30Z', now)).toBe('just now');
    expect(relativeTime('2026-11-27T11:55:00Z', now)).toBe('5 min ago');
    expect(relativeTime('2026-11-27T09:00:00Z', now)).toBe('3 h ago');
    expect(relativeTime('2026-11-26T09:00:00Z', now)).toBe('yesterday');
    expect(relativeTime('2026-11-20T09:00:00Z', now)).toBe('20 Nov');
  });
});

describe('recentActivity', () => {
  it('lists newest first', () => {
    const b = {
      ...base,
      activity: [...base.activity, { at: '2026-11-27T10:00:00Z', text: 'Status changed to Reviewed' }],
    };
    expect(recentActivity(b)[0]?.text).toBe('Status changed to Reviewed');
  });
});
