import { describe, expect, it } from 'vitest';
import { EMBER_AND_OAK } from '@/lib/domain/fixtures';
import { defaultSettings } from '@/lib/domain/settings';
import { generateBrief } from '@/lib/engine/generate';
import { emailEnabled, sendEmail } from './send';
import { approvedEmail, briefForClientEmail, esc, newBriefEmail } from './templates';

const settings = defaultSettings();
settings.notifications.recipients = ['amira@studionorth.co.uk'];
const brief = generateBrief({ id: 'brief-1234', ref: 'KO-0142', answers: EMBER_AND_OAK, settings });

describe('sendEmail', () => {
  const email = { to: ['daniel@emberandoak.co.uk'], subject: 'Hi', html: '<p>Hi</p>', text: 'Hi' };

  it('does nothing when Resend is not configured', async () => {
    expect(emailEnabled({})).toBe(false);
    expect(await sendEmail(email, {})).toEqual({ sent: false, reason: 'not-configured' });
  });

  it('posts to Resend with the key and returns the id', async () => {
    let seen: { url: string; init?: RequestInit } | null = null;
    const r = await sendEmail(email, {
      apiKey: 're_test',
      from: 'Kickoff <briefs@example.com>',
      fetchImpl: async (url, init) => {
        seen = { url, init };
        return new Response(JSON.stringify({ id: 'em_1' }), { status: 200 });
      },
    });
    expect(r).toEqual({ sent: true, id: 'em_1' });
    expect(seen!.url).toBe('https://api.resend.com/emails');
    expect((seen!.init?.headers as Record<string, string>).authorization).toBe('Bearer re_test');
  });

  it('reports failures instead of throwing', async () => {
    const r = await sendEmail(email, {
      apiKey: 'k',
      from: 'a@b.co',
      fetchImpl: async () => new Response('nope', { status: 422 }),
    });
    expect(r).toMatchObject({ sent: false, reason: 'failed' });
  });

  it('drops invalid recipients', async () => {
    const r = await sendEmail({ ...email, to: ['not-an-email'] }, { apiKey: 'k', from: 'a@b.co' });
    expect(r).toMatchObject({ sent: false, detail: 'No valid recipients' });
  });
});

describe('templates', () => {
  it('escapes HTML', () => {
    expect(esc('<b>"Ember" & \'Oak\'</b>')).toBe('&lt;b&gt;&quot;Ember&quot; &amp; &#39;Oak&#39;&lt;/b&gt;');
  });

  it('writes the client email with the calculated figures and link', () => {
    const e = briefForClientEmail(
      brief,
      settings,
      'https://studio.example/share/abc',
      'Looking forward to it.',
    );
    expect(e.to).toEqual(['daniel@emberandoak.co.uk']);
    expect(e.subject).toBe('Your project brief from Studio North');
    expect(e.text).toContain('7 pages · 5.5 weeks · estimate £4,850 excluding VAT');
    expect(e.text).toContain('https://studio.example/share/abc');
    expect(e.html).toContain('Ember &amp; Oak');
    expect(e.text.startsWith('Hi Daniel,')).toBe(true);
  });

  it('notifies the studio of new and approved briefs', () => {
    expect(newBriefEmail(brief, settings, 'u').subject).toBe('New brief: Ember & Oak · £4,850');
    expect(approvedEmail(brief, settings, 'u').to).toEqual(['amira@studionorth.co.uk']);
  });
});
