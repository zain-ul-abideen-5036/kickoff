import type { Store } from '@/lib/store';
import { hashToken } from './ids';

interface ShareRecord {
  briefId: string;
  expiresAt: string;
}

const keyOf = (token: string) => `shares/${hashToken(token)}.json`;
const TOKEN = /^[A-Za-z0-9_-]{40,64}$/;

export async function putShare(store: Store, token: string, briefId: string, expiresAt: string) {
  await store.putJSON(keyOf(token), { briefId, expiresAt } satisfies ShareRecord);
}

export async function removeShare(store: Store, token: string) {
  await store.delete(keyOf(token));
}

export type ShareLookup = { state: 'ok'; briefId: string } | { state: 'expired' } | { state: 'missing' };

/** Looks up a share link. Malformed tokens never touch storage. */
export async function lookupShare(store: Store, token: string, now = new Date()): Promise<ShareLookup> {
  if (!TOKEN.test(token)) return { state: 'missing' };
  const rec = await store.getJSON<ShareRecord>(keyOf(token));
  if (!rec) return { state: 'missing' };
  if (new Date(rec.expiresAt).getTime() < now.getTime()) return { state: 'expired' };
  return { state: 'ok', briefId: rec.briefId };
}
