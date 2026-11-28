'use server';

import { revalidatePath } from 'next/cache';
import { EditError, EditSchema, applyWithActivity } from '@/lib/brief-edit/edits';
import { NoteError, addNote, removeNote } from '@/lib/brief-edit/notes';
import type { Brief } from '@/lib/domain/brief';
import { getBrief, saveBrief } from '@/lib/repo/briefs-repo';
import { newId } from '@/lib/repo/ids';
import { emailConfigFromEnv, emailEnabled, sendEmail } from '@/lib/email/send';
import { briefForClientEmail } from '@/lib/email/templates';
import { ensureShareLink, sharePath } from '@/lib/repo/share-service';
import { appUrl, getSettings, requireOwner } from '@/lib/server/context';
import { getStore } from '@/lib/store';

export type SaveResult = { ok: true; updatedAt: string } | { ok: false; error: string };

/** Validates and saves one editor change. The same reducer runs in the browser. */
export async function saveBriefEdit(id: string, raw: unknown): Promise<SaveResult> {
  const owner = await requireOwner();
  const parsed = EditSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: 'That change wasn’t valid.' };
  const store = getStore();
  const brief = await getBrief(store, id);
  if (!brief) return { ok: false, error: 'That brief no longer exists.' };
  const settings = await getSettings();
  const now = new Date();
  try {
    const next = applyWithActivity(
      brief,
      parsed.data,
      now.toISOString(),
      owner.name.split(' ')[0] || 'Owner',
    );
    const saved = await saveBrief(store, next, settings.rateCard.vatRate, now);
    if (parsed.data.type === 'status') revalidatePath('/briefs');
    return { ok: true, updatedAt: saved.updatedAt };
  } catch (e) {
    if (e instanceof EditError) return { ok: false, error: e.message };
    return { ok: false, error: 'Couldn’t save that change. Try again.' };
  }
}

/** Returns the brief's live share link, creating one if needed. */
export async function getShareLink(
  id: string,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  await requireOwner();
  const store = getStore();
  const brief = await getBrief(store, id);
  if (!brief) return { ok: false, error: 'That brief no longer exists.' };
  const { token } = await ensureShareLink(store, brief, await getSettings());
  return { ok: true, url: `${appUrl()}${sharePath(token)}` };
}

export type NoteResult = { ok: true; notes: Brief['notes'] } | { ok: false; error: string };

/** Adds a team-only note. Notes never reach the client. */
export async function addBriefNote(id: string, text: string): Promise<NoteResult> {
  const owner = await requireOwner();
  const store = getStore();
  const brief = await getBrief(store, id);
  if (!brief) return { ok: false, error: 'That brief no longer exists.' };
  const settings = await getSettings();
  const now = new Date();
  try {
    const next = addNote(brief, String(text ?? ''), owner.name, now.toISOString(), newId());
    const saved = await saveBrief(store, next, settings.rateCard.vatRate, now);
    return { ok: true, notes: saved.notes };
  } catch (e) {
    return { ok: false, error: e instanceof NoteError ? e.message : 'Couldn’t save the note.' };
  }
}

export async function removeBriefNote(id: string, noteId: string): Promise<NoteResult> {
  await requireOwner();
  const store = getStore();
  const brief = await getBrief(store, id);
  if (!brief) return { ok: false, error: 'That brief no longer exists.' };
  const settings = await getSettings();
  const saved = await saveBrief(store, removeNote(brief, noteId), settings.rateCard.vatRate);
  return { ok: true, notes: saved.notes };
}

export type SendResult =
  { ok: true; url: string; emailed: boolean; to: string; note?: string } | { ok: false; error: string };

/**
 * Sends the brief to the client: makes sure a share link exists, emails it when email is set up,
 * and moves a New or Reviewed brief to Quoted. Without email it still returns the link to share.
 */
export async function sendToClient(id: string, message: string): Promise<SendResult> {
  const owner = await requireOwner();
  const store = getStore();
  const found = await getBrief(store, id);
  if (!found) return { ok: false, error: 'That brief no longer exists.' };
  const settings = await getSettings();
  const { brief, token } = await ensureShareLink(store, found, settings);
  const url = `${appUrl()}${sharePath(token)}`;
  const to = brief.answers.about.email;
  const config = emailConfigFromEnv();
  let emailed = false;
  let note: string | undefined;
  if (emailEnabled(config)) {
    const res = await sendEmail(
      briefForClientEmail(brief, settings, url, String(message ?? '').slice(0, 1000)),
      config,
    );
    emailed = res.sent;
    if (!res.sent) note = 'The email didn’t go through. Copy the link and send it yourself.';
  }
  const now = new Date();
  const who = owner.name.split(' ')[0] || 'Owner';
  const activity = [
    ...brief.activity,
    {
      at: now.toISOString(),
      text: emailed ? `${who}: Sent the brief to ${to}` : `${who}: Shared the brief link`,
    },
  ];
  const status = brief.status === 'New' || brief.status === 'Reviewed' ? 'Quoted' : brief.status;
  if (status !== brief.status) activity.push({ at: now.toISOString(), text: `Status changed to ${status}` });
  await saveBrief(store, { ...brief, status, activity }, settings.rateCard.vatRate, now);
  revalidatePath('/briefs');
  return { ok: true, url, emailed, to, note };
}
