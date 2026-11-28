'use server';

import { redirect } from 'next/navigation';
import { visibleSteps } from '@/components/intake/model';
import { aiConfigFromEnv, polishFollowUps } from '@/lib/ai/writer';
import { BUSINESS_TYPES, labelOf } from '@/lib/domain/catalog';
import { selectFollowUps, type FollowUpSet } from '@/lib/engine/followups';
import { getDraft, saveDraft } from '@/lib/repo/drafts-repo';
import { isId } from '@/lib/repo/ids';
import { loadSettings } from '@/lib/repo/settings-repo';
import {
  checkSubmission,
  cleanAnswers,
  saveDraftInput,
  startDraft,
  type SaveResult,
} from '@/lib/server/intake';
import { emailConfigFromEnv } from '@/lib/email/send';
import { appUrl } from '@/lib/server/context';
import { planStage, readStage, writeStage } from '@/lib/server/intake-brief';
import { getStore } from '@/lib/store';

export async function readStageAction(id: string) {
  return readStage(getStore(), id, await loadSettings(getStore()));
}

export async function planStageAction(id: string) {
  return planStage(getStore(), id, await loadSettings(getStore()));
}

export async function writeStageAction(id: string) {
  const store = getStore();
  return writeStage(store, id, await loadSettings(store), {
    ai: aiConfigFromEnv(),
    email: emailConfigFromEnv(),
    appUrl: appUrl(),
  });
}

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

/**
 * The follow-up questions for these answers, chosen by rule. When AI is on, Gemini may
 * polish the wording; ids and options never change.
 */
export async function followUpsAction(id: string, answers: unknown): Promise<FollowUpSet | null> {
  if (!isId(id) || !(await getDraft(getStore(), id))) return null;
  const a = cleanAnswers(answers);
  const settings = await loadSettings(getStore());
  const set = selectFollowUps(a);
  return polishFollowUps(
    set,
    { business: a.about.business || 'a business', type: labelOf(BUSINESS_TYPES, a.about.businessType) },
    settings,
    aiConfigFromEnv(),
  );
}

export type ConfirmResult = { ok: true } | { ok: false; screen?: string; message: string };

/** Final check before the brief is assembled. Saves the confirmed answers on the draft. */
export async function confirmAction(
  id: string,
  input: { answers: unknown; consent: boolean; trap?: string },
): Promise<ConfirmResult> {
  const store = getStore();
  const draft = isId(id) ? await getDraft(store, id) : null;
  if (!draft) return { ok: false, message: 'We couldn’t find this intake. Please start again.' };
  if (draft.briefId) return { ok: true };
  if (!input.consent)
    return { ok: false, message: 'Please tick the box so the studio can contact you about this project.' };
  const settings = await loadSettings(store);
  const answers = cleanAnswers(input.answers);
  const check = checkSubmission(answers, visibleSteps(settings.intake.steps), settings.intake.followUps);
  if (!check.ok) return { ok: false, screen: check.screen, message: check.message };
  await saveDraft(store, { ...draft, answers, updatedAt: new Date().toISOString() });
  return { ok: true };
}
