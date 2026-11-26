'use server';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { checkCredentials, createOwner, getOwner, type Owner } from '@/lib/auth/owner-repo';
import { passwordProblem } from '@/lib/auth/password';
import { SESSION_COOKIE, SESSION_DAYS, createSessionToken, sessionSecret } from '@/lib/auth/session';
import { loadSettings, saveSettings } from '@/lib/repo/settings-repo';
import { LIMITS, clientKey, hit } from '@/lib/server/rate-limit';
import { getStore } from '@/lib/store';

export interface AuthState {
  error?: string;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
}

async function startSession(owner: Owner) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, createSessionToken(owner.email, owner.sessionVersion, sessionSecret()), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DAYS * 86_400,
  });
}

/** Only allow redirects back into the app, never to another site. */
function safeNext(raw: FormDataEntryValue | null): string {
  const next = typeof raw === 'string' ? raw : '';
  return next.startsWith('/') && !next.startsWith('//') ? next : '/briefs';
}

export async function signIn(_prev: AuthState, form: FormData): Promise<AuthState> {
  const email = String(form.get('email') ?? '').slice(0, 200);
  const password = String(form.get('password') ?? '').slice(0, 200);
  const limit = hit(`login:${clientKey(await headers())}`, LIMITS.login);
  if (!limit.ok) {
    const mins = Math.ceil(limit.retryAfterMs / 60_000);
    return {
      error: `Too many attempts. Try again in ${mins} minute${mins === 1 ? '' : 's'}.`,
      values: { email },
    };
  }
  const owner = await checkCredentials(getStore(), email, password);
  if (!owner) return { error: 'That email and password don’t match.', values: { email } };
  await startSession(owner);
  redirect(safeNext(form.get('next')));
}

const SetupSchema = z.object({
  studio: z.string().trim().min(1, 'Add your studio name.').max(80),
  name: z.string().trim().min(1, 'Add your name.').max(80),
  email: z.string().trim().email('That email looks incomplete.').max(200),
  password: z.string().max(200),
  code: z.string().max(200).optional(),
});

export async function setUp(_prev: AuthState, form: FormData): Promise<AuthState> {
  const store = getStore();
  if (await getOwner(store)) redirect('/login');
  const limit = hit(`setup:${clientKey(await headers())}`, LIMITS.setup);
  if (!limit.ok) return { error: 'Too many attempts. Try again later.' };

  const raw = Object.fromEntries(
    ['studio', 'name', 'email', 'password', 'code'].map((k) => [k, String(form.get(k) ?? '')]),
  );
  const values = { studio: raw.studio ?? '', name: raw.name ?? '', email: raw.email ?? '' };
  const parsed = SetupSchema.safeParse(raw);
  const fieldErrors: Record<string, string> = {};
  if (!parsed.success) for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
  const weak = passwordProblem(raw.password ?? '');
  if (weak) fieldErrors.password = weak;

  // On a public deployment, the first visitor must not be able to claim the studio.
  const required = process.env.SETUP_CODE;
  if (process.env.VERCEL && !required)
    return { error: 'Set the SETUP_CODE environment variable in Vercel, then reload this page.', values };
  if (required && raw.code !== required) fieldErrors.code = 'That setup code is not right.';

  if (Object.keys(fieldErrors).length || !parsed.success) return { fieldErrors, values };

  const owner = await createOwner(store, parsed.data);
  const settings = await loadSettings(store);
  settings.agency.name = parsed.data.studio;
  if (!settings.agency.replyTo) settings.agency.replyTo = owner.email;
  if (!settings.notifications.recipients.length) settings.notifications.recipients = [owner.email];
  await saveSettings(store, settings);
  await startSession(owner);
  redirect('/briefs');
}

export async function signOut(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
  redirect('/login');
}
