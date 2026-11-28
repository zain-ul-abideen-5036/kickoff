'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { visibleSteps } from '@/components/intake/model';
import { aiConfigFromEnv, polishFollowUps } from '@/lib/ai/writer';
import { BUSINESS_TYPES, labelOf } from '@/lib/domain/catalog';
import { emailConfigFromEnv } from '@/lib/email/send';
import { selectFollowUps, type FollowUpSet } from '@/lib/engine/followups';
import { getDraft, saveDraft } from '@/lib/repo/drafts-repo';
import { isId } from '@/lib/repo/ids';
import { loadSettings } from '@/lib/repo/settings-repo';
import { appUrl } from '@/lib/server/context';
import {
  checkSubmission,
  cleanAnswers,
  saveDraftInput,
  startDraft,
  type SaveResult,
} from '@/lib/server/intake';
import { planStage, readStage, writeStage } from '@/lib/server/intake-brief';
import { guard, trapped, type GuardKind } from '@/lib/server/intake-guard';
import { getStore } from '@/lib/store';

/** Every public action is rate limited per address; see intake-guard. */
async function check(kind: GuardKind) {
  return guard(kind, await headers());
}

/** "Start my brief": creates a draft and opens the first step. */
export async function startIntake(): Promise<void> {
  if (!(await check('start')).ok) redirect('/start?busy=1');
  const id = await startDraft(getStore());
  redirect(`/start/${id}`);
}

/** Autosave. Called a moment after the client stops typing. */
export async function saveDraftAction(
  id: string,
  input: { step: number; answers: unknown },
): Promise<SaveResult> {
  if (!isId(id)) return { ok: false, reason: 'invalid' };
  if (!(await check('draft')).ok) return { ok: false, reason: 'busy' };
  return saveDraftInput(getStore(), id, input);
}

/**
 * The follow-up questions for these answers, chosen by rule. When AI is on, Gemini may
 * polish the wording; ids and options never change.
 */
export async function followUpsAction(id: string, answers: unknown): Promise<FollowUpSet | null> {
  if (!isId(id) || !(await check('draft')).ok) return null;
  if (!(await getDraft(getStore(), id))) return null;
  const a = cleanAnswers(answers);
  const settings = await loadSettings(getStore());
  return polishFollowUps(
    selectFollowUps(a),
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
  const limited = await check('draft');
  if (!limited.ok) return limited;
  // Bots fill the hidden field; give them nothing useful back.
  if (trapped(input.trap)) return { ok: false, message: 'Something went wrong. Please try again later.' };
  const store = getStore();
  const draft = isId(id) ? await getDraft(store, id) : null;
  if (!draft) return { ok: false, message: 'We couldn’t find this intake. Please start again.' };
  if (draft.briefId) return { ok: true };
  if (!input.consent)
    return { ok: false, message: 'Please tick the box so the studio can contact you about this project.' };
  const settings = await loadSettings(store);
  const answers = cleanAnswers(input.answers);
  const result = checkSubmission(answers, visibleSteps(settings.intake.steps), settings.intake.followUps);
  if (!result.ok) return { ok: false, screen: result.screen, message: result.message };
  await saveDraft(store, { ...draft, answers, updatedAt: new Date().toISOString() });
  return { ok: true };
}

export async function readStageAction(id: string) {
  const limited = await check('draft');
  if (!limited.ok) return limited;
  return readStage(getStore(), id, await loadSettings(getStore()));
}

export async function planStageAction(id: string) {
  const limited = await check('draft');
  if (!limited.ok) return limited;
  return planStage(getStore(), id, await loadSettings(getStore()));
}

/** Writing a brief costs an AI call and an email, so it has the tightest limit. */
export async function writeStageAction(id: string) {
  const store = getStore();
  const draft = isId(id) ? await getDraft(store, id) : null;
  if (draft?.briefId) return { ok: true as const, briefId: draft.briefId };
  const limited = await check('submit');
  if (!limited.ok) return limited;
  return writeStage(store, id, await loadSettings(store), {
    ai: aiConfigFromEnv(),
    email: emailConfigFromEnv(),
    appUrl: appUrl(),
  });
}
