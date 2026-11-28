'use server';

import { headers } from 'next/headers';
import { emailConfigFromEnv, sendEmail } from '@/lib/email/send';
import { approvedEmail } from '@/lib/email/templates';
import { approveShared, openShare } from '@/lib/repo/share-service';
import { appUrl, getSettings } from '@/lib/server/context';
import { LIMITS, clientKey, hit } from '@/lib/server/rate-limit';
import { getStore } from '@/lib/store';

export type ApproveResult = { ok: true; approvedAt: string } | { ok: false; error: string };

/** The client approves the brief from their private link. The studio is told by email. */
export async function approveBrief(token: string): Promise<ApproveResult> {
  if (!hit(`share:${clientKey(await headers())}`, LIMITS.share).ok)
    return { ok: false, error: 'Too many requests. Try again in a few minutes.' };
  const store = getStore();
  const opened = await openShare(store, String(token));
  if (opened.state === 'expired')
    return { ok: false, error: 'This link has expired. Ask the studio for a new one.' };
  if (opened.state !== 'ok') return { ok: false, error: 'This link is no longer active.' };
  const settings = await getSettings();
  const already = opened.brief.share?.approvedAt;
  const saved = await approveShared(store, opened.brief, settings);
  if (!already && settings.notifications.approved && settings.notifications.recipients.length) {
    await sendEmail(
      approvedEmail(saved, settings, `${appUrl()}/briefs/${saved.id}`),
      emailConfigFromEnv(),
    ).catch(() => undefined);
  }
  return { ok: true, approvedAt: saved.share?.approvedAt ?? new Date().toISOString() };
}
