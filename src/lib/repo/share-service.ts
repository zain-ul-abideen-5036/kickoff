import type { Brief } from '@/lib/domain/brief';
import type { Settings } from '@/lib/domain/settings';
import type { Store } from '@/lib/store';
import { getBrief, saveBrief } from './briefs-repo';
import { newToken } from './ids';
import { lookupShare, putShare, removeShare } from './shares-repo';

export const sharePath = (token: string) => `/share/${token}`;

/**
 * Returns a live share link for the brief, reusing the current one if it hasn't expired, or
 * issuing a fresh 256-bit token. The old token stops working when a new one is issued.
 */
export async function ensureShareLink(
  store: Store,
  brief: Brief,
  settings: Settings,
  now = new Date(),
): Promise<{ brief: Brief; token: string; fresh: boolean }> {
  if (brief.share && new Date(brief.share.expiresAt) > now)
    return { brief, token: brief.share.token, fresh: false };
  if (brief.share) await removeShare(store, brief.share.token);
  const token = newToken();
  const expiresAt = new Date(now.getTime() + settings.shareDays * 86_400_000).toISOString();
  await putShare(store, token, brief.id, expiresAt);
  const next: Brief = {
    ...brief,
    share: { token, expiresAt, approvedAt: null },
    activity: [...brief.activity, { at: now.toISOString(), text: 'Share link created' }],
  };
  return { brief: await saveBrief(store, next, settings.rateCard.vatRate, now), token, fresh: true };
}

/** Turns a link off immediately. */
export async function revokeShareLink(store: Store, brief: Brief, settings: Settings, now = new Date()) {
  if (!brief.share) return brief;
  await removeShare(store, brief.share.token);
  return saveBrief(
    store,
    {
      ...brief,
      share: null,
      activity: [...brief.activity, { at: now.toISOString(), text: 'Share link turned off' }],
    },
    settings.rateCard.vatRate,
    now,
  );
}

export type SharedBrief = { state: 'ok'; brief: Brief } | { state: 'expired' } | { state: 'missing' };

/** What the public share page shows for a token. A revoked or replaced token is "missing". */
export async function openShare(store: Store, token: string, now = new Date()): Promise<SharedBrief> {
  const found = await lookupShare(store, token, now);
  if (found.state !== 'ok') return found;
  const brief = await getBrief(store, found.briefId);
  if (!brief || brief.share?.token !== token) return { state: 'missing' };
  return { state: 'ok', brief };
}

/** The client approves from the shared link. Approving twice is harmless. */
export async function approveShared(store: Store, brief: Brief, settings: Settings, now = new Date()) {
  if (!brief.share || brief.share.approvedAt) return brief;
  return saveBrief(
    store,
    {
      ...brief,
      share: { ...brief.share, approvedAt: now.toISOString() },
      activity: [
        ...brief.activity,
        { at: now.toISOString(), text: `${brief.answers.about.name} approved the brief` },
      ],
    },
    settings.rateCard.vatRate,
    now,
  );
}
