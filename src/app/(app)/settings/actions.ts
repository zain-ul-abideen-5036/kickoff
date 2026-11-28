'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { Settings } from '@/lib/domain/settings';
import { newId } from '@/lib/repo/ids';
import { loadSettings, saveSettings } from '@/lib/repo/settings-repo';
import { requireOwner } from '@/lib/server/context';
import { brandColorCheck, normaliseHex } from '@/lib/settings/contrast';
import { cookies, headers } from 'next/headers';
import { changePassword, checkCredentials } from '@/lib/auth/owner-repo';
import { passwordProblem } from '@/lib/auth/password';
import { SESSION_COOKIE, SESSION_DAYS, createSessionToken, sessionSecret } from '@/lib/auth/session';
import { LIMITS, clientKey, hit } from '@/lib/server/rate-limit';
import {
  parseNotificationsForm,
  parseRateCardForm,
  parseTimelineForm,
  type Fields,
} from '@/lib/settings/forms';
import { checkLogo, isLogoKey } from '@/lib/settings/logo';
import { getStore } from '@/lib/store';

export interface SettingsState {
  ok?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
}

/** Loads, changes and strictly saves settings, then refreshes every page that shows them. */
async function update(change: (s: Settings) => void): Promise<void> {
  const store = getStore();
  const s = await loadSettings(store);
  change(s);
  await saveSettings(store, s);
  revalidatePath('/', 'layout');
}

const BrandingSchema = z.object({
  name: z.string().trim().min(1, 'Add your studio name.').max(80, 'Keep the name under 80 characters.'),
  replyTo: z
    .string()
    .trim()
    .max(200)
    .refine((v) => v === '' || z.email().safeParse(v).success, 'That email looks incomplete.'),
  accent: z.enum(['brass', 'brand']),
});

export async function saveBranding(_prev: SettingsState, form: FormData): Promise<SettingsState> {
  await requireOwner();
  const parsed = BrandingSchema.safeParse({
    name: String(form.get('name') ?? ''),
    replyTo: String(form.get('replyTo') ?? ''),
    accent: String(form.get('accent') ?? 'brass'),
  });
  const fieldErrors: Record<string, string> = {};
  if (!parsed.success) for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
  const color = normaliseHex(String(form.get('brandColor') ?? ''));
  const check = brandColorCheck(color ?? '');
  if (!color || !check.ok) fieldErrors.brandColor = check.message;
  if (!parsed.success || Object.keys(fieldErrors).length) return { fieldErrors };
  await update((s) => {
    s.agency.name = parsed.data.name;
    s.agency.replyTo = parsed.data.replyTo;
    s.agency.accent = parsed.data.accent;
    s.agency.brandColor = color!;
  });
  return { ok: 'Branding saved.' };
}

/** FormData as plain strings; checkboxes that are off are simply missing. */
function fields(form: FormData): Fields {
  const out: Fields = {};
  for (const [k, v] of form.entries()) if (typeof v === 'string') out[k] = v;
  return out;
}

export async function saveRateCard(_prev: SettingsState, form: FormData): Promise<SettingsState> {
  await requireOwner();
  const parsed = parseRateCardForm(fields(form));
  if (!parsed.ok) return { fieldErrors: parsed.errors };
  await update((s) => {
    s.rateCard = parsed.value;
  });
  return { ok: 'Rate card saved. New briefs use these prices.' };
}

export async function saveTimeline(_prev: SettingsState, form: FormData): Promise<SettingsState> {
  await requireOwner();
  const parsed = parseTimelineForm(fields(form), await loadSettings(getStore()));
  if (!parsed.ok) return { fieldErrors: parsed.errors };
  await update((s) => {
    s.timeline = parsed.value.timeline;
    s.intake = parsed.value.intake;
  });
  return { ok: 'Timeline and intake saved.' };
}

export async function saveAi(_prev: SettingsState, form: FormData): Promise<SettingsState> {
  await requireOwner();
  const enabled = form.get('aiEnabled') === 'on';
  await update((s) => {
    s.ai.enabled = enabled;
  });
  return { ok: enabled ? 'AI is on for new briefs.' : 'AI is off. New briefs are written from templates.' };
}

export async function saveNotifications(_prev: SettingsState, form: FormData): Promise<SettingsState> {
  await requireOwner();
  const parsed = parseNotificationsForm(fields(form));
  if (!parsed.ok) return { fieldErrors: parsed.errors };
  await update((s) => {
    s.notifications = parsed.value.notifications;
    s.shareDays = parsed.value.shareDays;
  });
  return { ok: 'Notifications saved.' };
}

/** Changes the owner password, signs every other session out, and keeps this one signed in. */
export async function updatePassword(_prev: SettingsState, form: FormData): Promise<SettingsState> {
  const owner = await requireOwner();
  const limit = hit(`password:${clientKey(await headers())}`, LIMITS.login);
  if (!limit.ok) return { error: 'Too many attempts. Try again later.' };
  const current = String(form.get('current') ?? '').slice(0, 200);
  const next = String(form.get('next') ?? '').slice(0, 200);
  const confirm = String(form.get('confirm') ?? '').slice(0, 200);
  const fieldErrors: Record<string, string> = {};
  const store = getStore();
  if (!(await checkCredentials(store, owner.email, current)))
    fieldErrors.current = 'That isn’t your current password.';
  const weak = passwordProblem(next);
  if (weak) fieldErrors.next = weak;
  else if (next === current) fieldErrors.next = 'Choose a password you haven’t used here.';
  if (!fieldErrors.next && confirm !== next) fieldErrors.confirm = 'The two new passwords don’t match.';
  if (Object.keys(fieldErrors).length) return { fieldErrors };
  const updated = await changePassword(store, owner, next);
  (await cookies()).set(
    SESSION_COOKIE,
    createSessionToken(updated.email, updated.sessionVersion, sessionSecret()),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_DAYS * 86_400,
    },
  );
  return { ok: 'Password changed. Other devices have been signed out.' };
}

export async function uploadLogo(_prev: SettingsState, form: FormData): Promise<SettingsState> {
  await requireOwner();
  const file = form.get('logo');
  if (!(file instanceof File) || file.size === 0) return { error: 'Choose an image to upload.' };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const checked = checkLogo(bytes);
  if (!checked.ok) return { error: checked.error };
  const store = getStore();
  const key = `assets/logo-${newId()}.${checked.type.ext}`;
  await store.putBytes(key, bytes, checked.type.contentType);
  const old = (await loadSettings(store)).agency.logoKey;
  await update((s) => {
    s.agency.logoKey = key;
  });
  if (isLogoKey(old) && old !== key) await store.delete(old);
  return { ok: 'Logo uploaded.' };
}

export async function removeLogo(): Promise<SettingsState> {
  await requireOwner();
  const store = getStore();
  const old = (await loadSettings(store)).agency.logoKey;
  await update((s) => {
    s.agency.logoKey = null;
  });
  if (isLogoKey(old)) await store.delete(old);
  return { ok: 'Logo removed. Your monogram is shown instead.' };
}
