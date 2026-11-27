'use server';

import { redirect } from 'next/navigation';
import { saveDraftInput, startDraft, type SaveResult } from '@/lib/server/intake';
import { getStore } from '@/lib/store';

/** "Start my brief": creates a draft and opens the first step. */
export async function startIntake(): Promise<void> {
  const id = await startDraft(getStore());
  redirect(`/start/${id}`);
}

/** Autosave. Called a moment after the client stops typing. */
export async function saveDraftAction(
  id: string,
  input: { step: number; answers: unknown },
): Promise<SaveResult> {
  return saveDraftInput(getStore(), id, input);
}
