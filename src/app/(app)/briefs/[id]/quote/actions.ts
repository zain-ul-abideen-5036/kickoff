'use server';

import { revalidatePath } from 'next/cache';
import { QuoteSchema } from '@/lib/domain/brief';
import { quoteTotals } from '@/lib/engine/pricing';
import { formatGbp } from '@/lib/format';
import { getBrief, saveBrief } from '@/lib/repo/briefs-repo';
import { getSettings, requireOwner } from '@/lib/server/context';
import { getStore } from '@/lib/store';

export type QuoteSaveResult = { ok: true; total: number } | { ok: false; error: string };

/** Saves the whole quote after validating every line. Prices are whatever the studio set. */
export async function saveQuote(id: string, raw: unknown): Promise<QuoteSaveResult> {
  const owner = await requireOwner();
  const parsed = QuoteSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: 'Some figures aren’t valid. Check the highlighted lines.' };
  const store = getStore();
  const brief = await getBrief(store, id);
  if (!brief) return { ok: false, error: 'That brief no longer exists.' };
  const settings = await getSettings();
  const now = new Date();
  const total = quoteTotals(parsed.data, settings.rateCard.vatRate).total;
  const who = owner.name.split(' ')[0] || 'Owner';
  await saveBrief(
    store,
    {
      ...brief,
      quote: parsed.data,
      activity: [
        ...brief.activity,
        { at: now.toISOString(), text: `${who}: Quote updated to ${formatGbp(total)}` },
      ],
    },
    settings.rateCard.vatRate,
    now,
  );
  revalidatePath(`/briefs/${id}`);
  revalidatePath('/briefs');
  return { ok: true, total };
}
