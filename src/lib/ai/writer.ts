import { z } from 'zod';
import { AUDIENCES, BUSINESS_TYPES, FEATURES, GOALS, labelOf } from '@/lib/domain/catalog';
import type { Brief } from '@/lib/domain/brief';
import type { Settings } from '@/lib/domain/settings';
import type { FollowUpSet } from '@/lib/engine/followups';
import { briefFacts } from '@/lib/engine/generate';
import { figuresIn, unknownFigures } from './figures';
import { geminiJson, type GeminiOptions } from './gemini';

/**
 * Gemini may write three things only: the summary, the audience profiles and the wording of
 * follow-up questions. Everything else in a brief comes from rules and the rate card. Any reply
 * that fails validation, or mentions a figure we didn't calculate, is thrown away for the template.
 */

export interface AiConfig {
  apiKey?: string;
  model?: string;
  fetchImpl?: GeminiOptions['fetchImpl'];
}

export type WriteOutcome =
  'ai' | 'template:off' | 'template:no-key' | 'template:error' | 'template:invalid' | 'template:figures';

export function aiConfigFromEnv(env: Record<string, string | undefined> = process.env): AiConfig {
  return { apiKey: env.GEMINI_API_KEY || undefined, model: env.GEMINI_MODEL || undefined };
}

const text = (max: number) => z.string().trim().min(1).max(max);

const BriefProse = z.object({
  summary: text(600),
  audience: z
    .array(
      z.object({
        name: text(60),
        tag: text(30),
        description: text(160),
        needs: z.array(text(90)).min(2).max(4),
      }),
    )
    .min(1)
    .max(3),
});

const SYSTEM = `You write short, warm, plain-English project briefs for a web design studio.
Rules:
- Use only the facts given. Never invent prices, dates, durations, page counts, statistics or names.
- Do not mention money, weeks or numbers of pages at all, except the age range given.
- British English. No jargon, no hype, no emoji, no exclamation marks.
- Reply with JSON only, matching the requested shape exactly.`;

/** Every figure the AI could legitimately mention. */
function allowedFigures(brief: Brief, vatRate: number): Set<number> {
  const f = briefFacts(brief, vatRate);
  return new Set([
    f.total,
    f.weeks,
    f.pageCount,
    brief.answers.audience.ageMin,
    brief.answers.audience.ageMax,
    ...figuresIn(JSON.stringify(brief.answers)),
  ]);
}

function briefPrompt(brief: Brief): string {
  const a = brief.answers;
  const facts = {
    business: a.about.business,
    type: labelOf(BUSINESS_TYPES, a.about.businessType),
    location: a.about.location,
    goals: a.goals.goals.map((g) => labelOf(GOALS, g)),
    searchTerm: a.goals.searchTerm || undefined,
    audience: a.audience.groups.map((g) => labelOf(AUDIENCES, g)),
    ageRange: `${a.audience.ageMin}–${a.audience.ageMax}`,
    audienceNotes: a.audience.notes || undefined,
    features: a.features.features.map((f) => labelOf(FEATURES, f)),
    feel: a.inspiration.notes || undefined,
    currentWebsite: a.about.website,
    pages: brief.pages.map((p) => p.label),
  };
  return `Facts about the client (JSON):
${JSON.stringify(facts, null, 2)}

Write:
1. "summary": two or three sentences describing the business, who it serves and what the new website must do. Start with the business name.
2. "audience": one to three profiles. Each has "name" (e.g. "Local couples and families"), "tag" (the age range or a two-word label), "description" (one sentence about how they decide) and "needs" (three short things they need from the site).

Shape: {"summary": string, "audience": [{"name": string, "tag": string, "description": string, "needs": string[]}]}`;
}

/** Returns the brief with AI prose when it passes every check, otherwise the brief unchanged. */
export async function polishBrief(
  brief: Brief,
  settings: Settings,
  config: AiConfig,
): Promise<{ brief: Brief; outcome: WriteOutcome }> {
  if (!settings.ai.enabled) return { brief, outcome: 'template:off' };
  if (!config.apiKey) return { brief, outcome: 'template:no-key' };
  let raw: unknown;
  try {
    raw = await geminiJson(SYSTEM, briefPrompt(brief), {
      apiKey: config.apiKey,
      model: config.model,
      fetchImpl: config.fetchImpl,
    });
  } catch {
    return { brief, outcome: 'template:error' };
  }
  const parsed = BriefProse.safeParse(raw);
  if (!parsed.success) return { brief, outcome: 'template:invalid' };

  const allowed = allowedFigures(brief, settings.rateCard.vatRate);
  const prose = [
    parsed.data.summary,
    ...parsed.data.audience.flatMap((p) => [p.name, p.tag, p.description, ...p.needs]),
  ].join('\n');
  if (unknownFigures(prose, allowed).length) return { brief, outcome: 'template:figures' };
  if (/£|\bweeks?\b|\bpages?\b.*\d|\d.*\bpages?\b/i.test(prose))
    return { brief, outcome: 'template:figures' };

  return {
    brief: { ...brief, summary: parsed.data.summary, audience: parsed.data.audience, writtenBy: 'ai' },
    outcome: 'ai',
  };
}

const FollowUpWording = z.object({
  questions: z.array(z.object({ id: z.string(), question: text(160), hint: text(160) })),
});

/** Polishes the wording of the follow-up questions. Ids, order and options never change. */
export async function polishFollowUps(
  set: FollowUpSet,
  context: { business: string; type: string },
  settings: Settings,
  config: AiConfig,
): Promise<FollowUpSet> {
  if (!settings.ai.enabled || !config.apiKey || set.questions.length === 0) return set;
  const prompt = `A ${context.type.toLowerCase()} called ${context.business} is filling in a website intake.
Rewrite each question and hint so it reads naturally for them. Keep the meaning and keep it short.
Keep every "id" exactly as given, in the same order.
Questions (JSON): ${JSON.stringify(set.questions.map(({ id, question, hint }) => ({ id, question, hint })))}
Shape: {"questions": [{"id": string, "question": string, "hint": string}]}`;
  try {
    const parsed = FollowUpWording.safeParse(
      await geminiJson(SYSTEM, prompt, {
        apiKey: config.apiKey,
        model: config.model,
        fetchImpl: config.fetchImpl,
      }),
    );
    if (!parsed.success) return set;
    const out = parsed.data.questions;
    if (out.length !== set.questions.length || out.some((q, i) => q.id !== set.questions[i]!.id)) return set;
    const allowed = figuresIn(JSON.stringify(set));
    if (out.some((q) => unknownFigures(`${q.question} ${q.hint}`, allowed).length)) return set;
    return {
      ...set,
      questions: set.questions.map((q, i) => ({ ...q, question: out[i]!.question, hint: out[i]!.hint })),
    };
  } catch {
    return set;
  }
}
