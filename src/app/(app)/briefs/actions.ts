'use server';

import { revalidatePath } from 'next/cache';
import { STATUSES, type Status } from '@/lib/domain/brief';
import { getBrief, saveBrief } from '@/lib/repo/briefs-repo';
import { seedSampleBriefs } from '@/lib/repo/seed';
import { getSettings, requireOwner } from '@/lib/server/context';
import { getStore } from '@/lib/store';

export type ActionResult = { ok: true } | { ok: false; error: string };

/** Moves a brief to another pipeline column. */
export async function setBriefStatus(id: string, status: Status): Promise<ActionResult> {
  await requireOwner();
  if (!STATUSES.includes(status)) return { ok: false, error: 'Unknown status.' };
  const store = getStore();
  const brief = await getBrief(store, id);
  if (!brief) return { ok: false, error: 'That brief no longer exists.' };
  if (brief.status === status) return { ok: true };
  const settings = await getSettings();
  const now = new Date();
  await saveBrief(
    store,
    {
      ...brief,
      status,
      activity: [...brief.activity, { at: now.toISOString(), text: `Status changed to ${status}` }],
    },
    settings.rateCard.vatRate,
    now,
  );
  revalidatePath('/briefs');
  revalidatePath(`/briefs/${id}`);
  return { ok: true };
}

/** Fills an empty studio with the six sample briefs from the design. */
export async function loadSampleBriefs(): Promise<void> {
  await requireOwner();
  await seedSampleBriefs(getStore(), await getSettings());
  revalidatePath('/briefs', 'layout');
}
