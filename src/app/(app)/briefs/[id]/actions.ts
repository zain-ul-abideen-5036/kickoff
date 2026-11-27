'use server';

import { revalidatePath } from 'next/cache';
import { EditError, EditSchema, applyWithActivity } from '@/lib/brief-edit/edits';
import { getBrief, saveBrief } from '@/lib/repo/briefs-repo';
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
