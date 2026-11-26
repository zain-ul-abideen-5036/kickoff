import { z } from 'zod';
import { emptyAnswers, type IntakeAnswers } from '@/lib/domain/intake';
import type { Store } from '@/lib/store';
import { isId } from './ids';

/**
 * An intake in progress. Saved as the client types so nothing is lost if they close the tab.
 * Drafts are only partially valid by nature, so they are stored loosely and validated on submit.
 */
export interface Draft {
  id: string;
  step: number;
  answers: IntakeAnswers;
  updatedAt: string;
  /** Set once the draft has become a brief, so a resubmit returns the same brief. */
  briefId: string | null;
}

const DraftShape = z.object({
  id: z.string(),
  step: z.number().int().min(0).max(20),
  answers: z.record(z.string(), z.unknown()),
  updatedAt: z.string(),
  briefId: z.string().nullable(),
});

const keyOf = (id: string) => `drafts/${id}.json`;
/** Drafts are small; this caps what a stranger can make us store. */
export const MAX_DRAFT_BYTES = 32_000;

export async function getDraft(store: Store, id: string): Promise<Draft | null> {
  if (!isId(id)) return null;
  const raw = await store.getJSON(keyOf(id));
  const res = DraftShape.safeParse(raw);
  if (!res.success) return null;
  return { ...res.data, answers: { ...emptyAnswers(), ...(res.data.answers as Partial<IntakeAnswers>) } };
}

export async function saveDraft(store: Store, draft: Draft): Promise<void> {
  if (!isId(draft.id)) throw new Error('Invalid draft id');
  const size = new TextEncoder().encode(JSON.stringify(draft)).length;
  if (size > MAX_DRAFT_BYTES) throw new Error('Draft too large');
  await store.putJSON(keyOf(draft.id), draft);
}
