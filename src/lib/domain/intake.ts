import { z } from 'zod';
import {
  AUDIENCES,
  BUDGETS,
  BUSINESS_TYPES,
  FEATURES,
  GOALS,
  LAUNCHES,
  MAX_GOALS,
  PHOTO_SOURCES,
  READINESS,
  STYLE_WORDS,
  WEBSITE_STATES,
  ids,
} from './catalog';

const text = (max: number) => z.string().trim().max(max);

export const AboutSchema = z.object({
  name: text(80).min(1, 'Please tell us your name so we know who to reply to.'),
  business: text(100).min(1, 'Please add your business name.'),
  businessType: z.enum(ids(BUSINESS_TYPES)),
  location: text(100).min(1, 'Please tell us where you are based.'),
  email: z
    .string()
    .trim()
    .max(200)
    .email('That email looks incomplete. Check the ending, for example .co.uk.'),
  website: z.enum(ids(WEBSITE_STATES)),
});

export const GoalsSchema = z.object({
  goals: z
    .array(z.enum(ids(GOALS)))
    .min(1, 'Choose at least one goal.')
    .max(MAX_GOALS, `Choose up to ${MAX_GOALS} goals.`),
  searchTerm: text(80).optional().default(''),
});

export const AudienceSchema = z
  .object({
    groups: z.array(z.enum(ids(AUDIENCES))).min(1, 'Choose at least one group.'),
    ageMin: z.number().int().min(16).max(90),
    ageMax: z.number().int().min(16).max(90),
    notes: text(600).optional().default(''),
  })
  .refine((a) => a.ageMin <= a.ageMax, {
    message: 'The youngest age must be below the oldest.',
    path: ['ageMin'],
  });

export const FeaturesSchema = z.object({
  features: z.array(z.enum(ids(FEATURES))).max(FEATURES.length),
});

export const ContentSchema = z.object({
  logo: z.enum(ids(READINESS)),
  photos: z.enum(ids(READINESS)),
  photoSource: z.enum(ids(PHOTO_SOURCES)),
  text: z.enum(ids(READINESS)),
});

export const InspirationSchema = z.object({
  sites: z.array(text(200)).max(2).default([]),
  words: z
    .array(z.enum(ids(STYLE_WORDS)))
    .max(STYLE_WORDS.length)
    .default([]),
  notes: text(600).optional().default(''),
});

export const BudgetSchema = z.object({
  budget: z.enum(ids(BUDGETS)),
  launch: z.enum(ids(LAUNCHES)),
});

/** Answers to the 1–3 tailored follow-up questions, keyed by question id. */
export const FollowUpAnswersSchema = z.record(z.string().max(40), text(200)).default({});

export const IntakeAnswersSchema = z.object({
  about: AboutSchema,
  goals: GoalsSchema,
  audience: AudienceSchema,
  features: FeaturesSchema,
  content: ContentSchema,
  inspiration: InspirationSchema,
  budget: BudgetSchema,
  followUps: FollowUpAnswersSchema,
});

export type About = z.infer<typeof AboutSchema>;
export type IntakeAnswers = z.infer<typeof IntakeAnswersSchema>;

/** The seven steps a client walks through, in order. */
export const STEPS = [
  { key: 'about', label: 'About you', schema: AboutSchema },
  { key: 'goals', label: 'Goals', schema: GoalsSchema },
  { key: 'audience', label: 'Audience', schema: AudienceSchema },
  { key: 'features', label: 'Features', schema: FeaturesSchema },
  { key: 'content', label: 'Content', schema: ContentSchema },
  { key: 'inspiration', label: 'Inspiration', schema: InspirationSchema },
  { key: 'budget', label: 'Budget & timeline', schema: BudgetSchema },
] as const;
export type StepKey = (typeof STEPS)[number]['key'];

/** Field errors for one step, keyed by field name. Empty when the step is valid. */
export function stepErrors(key: StepKey, value: unknown): Record<string, string> {
  const step = STEPS.find((s) => s.key === key);
  if (!step) return {};
  const res = step.schema.safeParse(value);
  if (res.success) return {};
  const out: Record<string, string> = {};
  for (const issue of res.error.issues) {
    const field = String(issue.path[0] ?? '_');
    out[field] ??= issue.message;
  }
  return out;
}

/** A blank draft with sensible defaults, so every control starts in a valid shape. */
export function emptyAnswers(): IntakeAnswers {
  return {
    about: { name: '', business: '', businessType: 'restaurant', location: '', email: '', website: 'none' },
    goals: { goals: [], searchTerm: '' },
    audience: { groups: [], ageMin: 25, ageMax: 55, notes: '' },
    features: { features: [] },
    content: { logo: 'ready', photos: 'ready', photoSource: 'pro', text: 'no' },
    inspiration: { sites: ['', ''], words: [], notes: '' },
    budget: { budget: 'b2', launch: 'flex' },
    followUps: {},
  };
}
