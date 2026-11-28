import { describe, expect, it } from 'vitest';
import { parseNotificationsForm, parseRecipients } from './forms';

describe('parseRecipients', () => {
  it('splits, trims, lowercases and de-duplicates', () => {
    expect(
      parseRecipients('Amira@StudioNorth.co.uk, hello@studionorth.co.uk;amira@studionorth.co.uk\n'),
    ).toEqual({
      emails: ['amira@studionorth.co.uk', 'hello@studionorth.co.uk'],
      bad: [],
    });
  });
  it('reports entries that are not emails', () => {
    expect(parseRecipients('amira@, hello@studionorth.co.uk').bad).toEqual(['amira@']);
  });
});

describe('parseNotificationsForm', () => {
  const ok = { newBrief: 'on', approved: 'on', recipients: 'amira@studionorth.co.uk', shareDays: '30' };

  it('reads toggles, recipients and share days', () => {
    expect(parseNotificationsForm({ ...ok, approved: undefined })).toEqual({
      ok: true,
      value: {
        notifications: { newBrief: true, approved: false, recipients: ['amira@studionorth.co.uk'] },
        shareDays: 30,
      },
    });
  });

  it('needs a recipient while emails are on, but not when they are off', () => {
    const r = parseNotificationsForm({ ...ok, recipients: '' });
    expect(r.ok).toBe(false);
    expect(parseNotificationsForm({ shareDays: '7', recipients: '' }).ok).toBe(true);
  });

  it('refuses bad addresses and share days', () => {
    const r = parseNotificationsForm({ ...ok, recipients: 'nope', shareDays: '400' });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.recipients).toMatch(/nope/);
      expect(r.errors.shareDays).toMatch(/1 to 365/);
    }
  });
});
