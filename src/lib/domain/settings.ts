import { z } from 'zod';
import { STEPS } from './intake';
import { DEFAULT_RATE_CARD, RateCardSchema } from './rate-card';

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Use a six-digit hex colour, like #1F3B34.');

export const PHASE_DEFAULTS = [
  { id: 'discovery', name: 'Discovery', weeks: 0.5 },
  { id: 'design', name: 'Design', weeks: 1.5 },
  { id: 'build', name: 'Build', weeks: 2 },
  { id: 'content', name: 'Content and QA', weeks: 1 },
  { id: 'launch', name: 'Launch', weeks: 0.5 },
] as const;

const optionalSteps = STEPS.map((s) => s.key).filter((k) => k !== 'about');

export const SettingsSchema = z.object({
  agency: z.object({
    name: z.string().trim().min(1).max(80),
    replyTo: z.string().trim().max(200).email().or(z.literal('')),
    brandColor: hex,
    /** Storage key of the uploaded logo, or null for the monogram. */
    logoKey: z.string().max(200).nullable(),
    accent: z.enum(['brass', 'brand']),
  }),
  rateCard: RateCardSchema,
  timeline: z.object({
    phases: z.array(
      z.object({ id: z.string(), name: z.string().max(40), weeks: z.number().min(0.5).max(26) }),
    ),
    /** Extra build weeks for every 5 pages beyond 7. */
    extraWeeksPer5Pages: z.number().min(0).max(4),
  }),
  intake: z.object({
    /** Steps the client sees. "about" is always on. */
    steps: z.record(z.string(), z.boolean()),
    followUps: z.boolean(),
  }),
  ai: z.object({ enabled: z.boolean() }),
  notifications: z.object({
    newBrief: z.boolean(),
    approved: z.boolean(),
    recipients: z.array(z.string().email()).max(10),
  }),
  shareDays: z.number().int().min(1).max(365),
});
export type Settings = z.infer<typeof SettingsSchema>;

export function defaultSettings(): Settings {
  return {
    agency: { name: 'Studio North', replyTo: '', brandColor: '#1F3B34', logoKey: null, accent: 'brass' },
    rateCard: structuredClone(DEFAULT_RATE_CARD),
    timeline: { phases: PHASE_DEFAULTS.map((p) => ({ ...p })), extraWeeksPer5Pages: 0.5 },
    intake: { steps: Object.fromEntries(optionalSteps.map((k) => [k, true])), followUps: true },
    ai: { enabled: true },
    notifications: { newBrief: true, approved: true, recipients: [] },
    shareDays: 30,
  };
}

/** Old or partial settings files are filled in from the defaults, so upgrades never break. */
export function parseSettings(raw: unknown): Settings {
  const base = defaultSettings();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<Settings>;
  const merged = {
    ...base,
    ...r,
    agency: { ...base.agency, ...r.agency },
    rateCard: {
      ...base.rateCard,
      ...r.rateCard,
      platforms: { ...base.rateCard.platforms, ...r.rateCard?.platforms },
      features: { ...base.rateCard.features, ...r.rateCard?.features },
    },
    timeline: { ...base.timeline, ...r.timeline },
    intake: { ...base.intake, ...r.intake, steps: { ...base.intake.steps, ...r.intake?.steps } },
    ai: { ...base.ai, ...r.ai },
    notifications: { ...base.notifications, ...r.notifications },
  };
  const res = SettingsSchema.safeParse(merged);
  return res.success ? res.data : base;
}
