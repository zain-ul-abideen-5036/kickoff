import { visibleSteps } from '@/components/intake/model';
import { polishBrief, type AiConfig } from '@/lib/ai/writer';
import { BUDGETS, labelOf } from '@/lib/domain/catalog';
import type { Brief } from '@/lib/domain/brief';
import type { Settings } from '@/lib/domain/settings';
import { newBriefEmail } from '@/lib/email/templates';
import { sendEmail, type EmailConfig } from '@/lib/email/send';
import { generateBrief } from '@/lib/engine/generate';
import { quoteTotals } from '@/lib/engine/pricing';
import { totalWeeks } from '@/lib/engine/timeline';
import { getBrief, nextRef, saveBrief } from '@/lib/repo/briefs-repo';
import { getDraft, saveDraft, type Draft } from '@/lib/repo/drafts-repo';
import { isId, newId } from '@/lib/repo/ids';
import type { Store } from '@/lib/store';
import { checkSubmission } from './intake';

/**
 * The three real stages behind "Assembling your brief". Each one is a separate request so the
 * client sees genuine progress: read the answers, plan the pages and estimate, write and save.
 */

export type StageError = { ok: false; message: string };

async function openDraft(store: Store, id: string): Promise<Draft | StageError> {
  if (!isId(id)) return { ok: false, message: 'This link isn’t right. Please start the intake again.' };
  const draft = await getDraft(store, id);
  if (!draft) return { ok: false, message: 'We couldn’t find these answers. Please start the intake again.' };
  return draft;
}

function checked(draft: Draft, settings: Settings) {
  return checkSubmission(draft.answers, visibleSteps(settings.intake.steps), settings.intake.followUps);
}

/** Stage 1: read and check the answers. */
export async function readStage(store: Store, id: string, settings: Settings) {
  const draft = await openDraft(store, id);
  if ('ok' in draft) return draft;
  if (draft.briefId) return { ok: true as const, sections: 0, answered: 0, done: true };
  const c = checked(draft, settings);
  if (!c.ok) return { ok: false as const, message: c.message };
  const a = c.answers;
  const answered =
    5 +
    a.goals.goals.length +
    a.audience.groups.length +
    a.features.features.length +
    a.inspiration.words.length +
    Object.keys(a.followUps).length;
  return {
    ok: true as const,
    sections: visibleSteps(settings.intake.steps).length + 1,
    answered,
    done: false,
  };
}

/** Stage 2: plan pages and the estimate by rule. Nothing is saved yet. */
export async function planStage(store: Store, id: string, settings: Settings) {
  const draft = await openDraft(store, id);
  if ('ok' in draft) return draft;
  const c = checked(draft, settings);
  if (!c.ok) return { ok: false as const, message: c.message };
  const plan = generateBrief({ id: 'plan', ref: 'plan', answers: c.answers, settings });
  return {
    ok: true as const,
    pages: plan.pages.map((p) => p.label),
    weeks: totalWeeks(plan.phases),
  };
}

export interface WriteDeps {
  ai: AiConfig;
  email: EmailConfig;
  appUrl: string;
  now?: Date;
}

/**
 * Stage 3: write the brief (AI prose when allowed, template otherwise), save it, link it to the
 * draft and tell the studio. Running it twice returns the same brief.
 */
export async function writeStage(store: Store, id: string, settings: Settings, deps: WriteDeps) {
  const draft = await openDraft(store, id);
  if ('ok' in draft) return draft;
  if (draft.briefId) return { ok: true as const, briefId: draft.briefId };
  const c = checked(draft, settings);
  if (!c.ok) return { ok: false as const, message: c.message };
  const now = deps.now ?? new Date();

  const base = generateBrief({ id: newId(), ref: await nextRef(store), answers: c.answers, settings, now });
  const { brief: written } = await polishBrief(base, settings, deps.ai);
  const saved = await saveBrief(store, written, settings.rateCard.vatRate, now);
  await saveDraft(store, { ...draft, answers: c.answers, briefId: saved.id, updatedAt: now.toISOString() });

  if (settings.notifications.newBrief && settings.notifications.recipients.length) {
    try {
      await sendEmail(newBriefEmail(saved, settings, `${deps.appUrl}/briefs/${saved.id}`), deps.email);
    } catch {
      /* email is a courtesy; the brief is already safe */
    }
  }
  return { ok: true as const, briefId: saved.id };
}

/** How the estimate sits against the client's budget, in words, without quoting a price. */
export function budgetFit(
  brief: Brief,
  vatRate: number,
  agencyName: string,
): { title: string; note: string } {
  const range = BUDGETS.find((b) => b.id === brief.answers.budget.budget);
  const total = quoteTotals(brief.quote, vatRate).total;
  const label = labelOf(BUDGETS, brief.answers.budget.budget);
  if (!range)
    return {
      title: 'Estimate on its way',
      note: `${agencyName} will confirm the figure after their review.`,
    };
  if (total > range.max)
    return {
      title: `A little above your ${label} range`,
      note: `${agencyName} will suggest what to phase or trim when they send your brief.`,
    };
  return {
    title: `Fits your ${label} range`,
    note: `${agencyName} will confirm the exact figure after their review. Prices come from their own rate card.`,
  };
}

/** The draft's finished brief, or null if it hasn't been written yet. */
export async function briefForDraft(store: Store, id: string): Promise<Brief | null> {
  if (!isId(id)) return null;
  const draft = await getDraft(store, id);
  return draft?.briefId ? getBrief(store, draft.briefId) : null;
}
