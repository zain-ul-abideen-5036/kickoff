import { describe, expect, it } from 'vitest';
import { EMBER_AND_OAK } from '@/lib/domain/fixtures';
import { defaultSettings } from '@/lib/domain/settings';
import { generateBrief } from '@/lib/engine/generate';
import { mergeSent } from './sent-event';

const brief = generateBrief({
  id: 'brief-1234',
  ref: 'KO-0142',
  answers: EMBER_AND_OAK,
  settings: defaultSettings(),
});
const share = { token: 't'.repeat(43), expiresAt: '2026-12-26T00:00:00.000Z', approvedAt: null };

describe('mergeSent', () => {
  it('takes the new status, share link and activity for the same brief', () => {
    const activity = [...brief.activity, { at: 'now', text: 'Status changed to Quoted' }];
    const out = mergeSent(brief, { id: brief.id, fields: { status: 'Quoted', share, activity } });
    expect(out.status).toBe('Quoted');
    expect(out.share).toEqual(share);
    expect(out.activity.at(-1)?.text).toBe('Status changed to Quoted');
    expect(out.pages).toBe(brief.pages);
  });

  it('ignores events for another brief', () => {
    const out = mergeSent(brief, { id: 'other-brief', fields: { status: 'Won', share, activity: [] } });
    expect(out).toBe(brief);
  });
});
