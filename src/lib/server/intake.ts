import { emptyAnswers, type IntakeAnswers } from '@/lib/domain/intake';
import { getDraft, saveDraft, type Draft } from '@/lib/repo/drafts-repo';
import { isId, newId } from '@/lib/repo/ids';
import type { Store } from '@/lib/store';

/**
 * Draft handling for the public intake. These functions take the store explicitly so they can be
 * tested without a server; the server actions in app/start wrap them with rate limits.
 */

export async function startDraft(store: Store, now = new Date()): Promise<string> {
  const id = newId();
  await saveDraft(store, {
    id,
    step: 0,
    answers: emptyAnswers(),
    updatedAt: now.toISOString(),
    briefId: null,
  });
  return id;
}

export type SaveResult =
  { ok: true; updatedAt: string } | { ok: false; reason: 'missing' | 'submitted' | 'too-large' | 'invalid' };

/** Shapes untrusted client input into a draft. Unknown keys are dropped; sizes are capped on save. */
export function cleanAnswers(raw: unknown): IntakeAnswers {
  const base = emptyAnswers();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<IntakeAnswers>;
  const obj = <T extends object>(v: unknown, fallback: T): T =>
    v && typeof v === 'object' && !Array.isArray(v) ? { ...fallback, ...(v as Partial<T>) } : fallback;
  const followUps: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj<Record<string, unknown>>(r.followUps, {}))) {
    if (/^[a-zA-Z]{1,40}$/.test(k) && typeof v === 'string') followUps[k] = v.slice(0, 200);
  }
  return {
    about: obj(r.about, base.about),
    goals: obj(r.goals, base.goals),
    audience: obj(r.audience, base.audience),
    features: obj(r.features, base.features),
    content: obj(r.content, base.content),
    inspiration: obj(r.inspiration, base.inspiration),
    budget: obj(r.budget, base.budget),
    followUps,
  };
}

export async function saveDraftInput(
  store: Store,
  id: string,
  input: { step: unknown; answers: unknown },
  now = new Date(),
): Promise<SaveResult> {
  if (!isId(id)) return { ok: false, reason: 'invalid' };
  const draft = await getDraft(store, id);
  if (!draft) return { ok: false, reason: 'missing' };
  if (draft.briefId) return { ok: false, reason: 'submitted' };
  const step = Number.isInteger(input.step) ? Math.max(0, Math.min(20, input.step as number)) : draft.step;
  const next: Draft = { ...draft, step, answers: cleanAnswers(input.answers), updatedAt: now.toISOString() };
  try {
    await saveDraft(store, next);
  } catch (e) {
    if (e instanceof Error && /too large/.test(e.message)) return { ok: false, reason: 'too-large' };
    throw e;
  }
  return { ok: true, updatedAt: next.updatedAt };
}
