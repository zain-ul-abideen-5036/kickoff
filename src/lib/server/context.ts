import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { getOwner, type Owner } from '@/lib/auth/owner-repo';
import { SESSION_COOKIE, readSessionToken, sessionSecret } from '@/lib/auth/session';
import type { Settings } from '@/lib/domain/settings';
import { loadSettings } from '@/lib/repo/settings-repo';
import { getStore } from '@/lib/store';

/** Settings read once per request. */
export const getSettings = cache(async (): Promise<Settings> => loadSettings(getStore()));

/** The signed-in owner, or null. Checks the signature, expiry and session version. */
export const getSessionOwner = cache(async (): Promise<Owner | null> => {
  const jar = await cookies();
  const payload = readSessionToken(jar.get(SESSION_COOKIE)?.value, sessionSecret());
  if (!payload) return null;
  const owner = await getOwner(getStore());
  if (!owner || owner.email !== payload.sub || owner.sessionVersion !== payload.v) return null;
  return owner;
});

/**
 * Every agency page and action calls this. It is the authorisation check: there is no
 * middleware-only protection, so a missed check can't be bypassed by a direct request.
 */
export async function requireOwner(): Promise<Owner> {
  const owner = await getSessionOwner();
  if (!owner) {
    const hasOwner = await getOwner(getStore());
    redirect(hasOwner ? '/login' : '/setup');
  }
  return owner;
}

/** URL of the agency logo, or null to show the monogram. Cache-busted by the storage key. */
export function logoUrl(settings: Settings): string | null {
  return settings.agency.logoKey ? `/api/logo?v=${encodeURIComponent(settings.agency.logoKey)}` : null;
}

export function appUrl(): string {
  return (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
}
