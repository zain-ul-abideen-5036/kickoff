import { z } from 'zod';
import { PLATFORMS, ids } from './catalog';
import { IntakeAnswersSchema } from './intake';

export const STATUSES = ['New', 'Reviewed', 'Quoted', 'Won', 'Lost'] as const;
export type Status = (typeof STATUSES)[number];

export const PRIORITIES = ['Must', 'Should', 'Could'] as const;
export type Priority = (typeof PRIORITIES)[number];

const line = z.string().trim().max(400);

export const PageSchema = z.object({
  id: z.string().max(40),
  label: z.string().trim().min(1).max(60),
  /** Sections inside a page, e.g. Lunch, Dinner, Tasting menu. Not priced as pages. */
  sections: z.array(z.string().trim().max(40)).max(12).default([]),
});
export type Page = z.infer<typeof PageSchema>;

export const FeatureItemSchema = z.object({
  id: z.string().max(40),
  label: z.string().trim().min(1).max(80),
  priority: z.enum(PRIORITIES),
});
export type FeatureItem = z.infer<typeof FeatureItemSchema>;

export const PhaseSchema = z.object({
  id: z.string().max(40),
  name: z.string().trim().min(1).max(40),
  weeks: z.number().min(0.5).max(26).multipleOf(0.5),
});
export type Phase = z.infer<typeof PhaseSchema>;

export const QuoteLineSchema = z.object({
  id: z.string().max(40),
  label: z.string().trim().min(1).max(80),
  /** Where the price came from, shown in small type: "Rate card · per page". */
  basis: z.string().trim().max(80),
  qty: z.number().int().min(0).max(999),
  rate: z.number().int().min(0).max(1_000_000),
});
export type QuoteLine = z.infer<typeof QuoteLineSchema>;

export const AdjustmentSchema = z.object({
  id: z.string().max(40),
  label: z.string().trim().min(1).max(80),
  amount: z.number().int().min(-1_000_000).max(1_000_000),
});
export type Adjustment = z.infer<typeof AdjustmentSchema>;

export const QuoteSchema = z.object({
  lines: z.array(QuoteLineSchema).max(60),
  adjustments: z.array(AdjustmentSchema).max(20).default([]),
  discount: z
    .object({ mode: z.enum(['percent', 'amount']), value: z.number().min(0).max(1_000_000) })
    .default({ mode: 'percent', value: 0 }),
  vat: z.boolean().default(false),
});
export type Quote = z.infer<typeof QuoteSchema>;

export const ContentItemSchema = z.object({
  id: z.string().max(40),
  label: z.string().trim().min(1).max(80),
  note: z.string().trim().max(120).default(''),
  state: z.enum(['ready', 'missing', 'collect']),
});
export type ContentItem = z.infer<typeof ContentItemSchema>;

export const GoalItemSchema = z.object({ goal: line, measure: line });
export const AudienceProfileSchema = z.object({
  name: z.string().trim().max(80),
  tag: z.string().trim().max(40),
  description: line,
  needs: z.array(z.string().trim().max(120)).max(6),
});
export type AudienceProfile = z.infer<typeof AudienceProfileSchema>;

export const RiskSchema = z.object({ id: z.string().max(40), title: line, detail: line });
export type Risk = z.infer<typeof RiskSchema>;

export const NoteSchema = z.object({
  id: z.string(),
  author: z.string().max(80),
  at: z.string(),
  text: line,
});
export const ActivitySchema = z.object({ at: z.string(), text: z.string().max(200) });

export const BriefSchema = z.object({
  id: z.string().max(40),
  /** Human reference shown to agency and client, e.g. KO-0142. */
  ref: z.string().max(20),
  createdAt: z.string(),
  updatedAt: z.string(),
  status: z.enum(STATUSES),
  answers: IntakeAnswersSchema,
  /** "ai" when Gemini wrote the prose, "template" when the templates did. */
  writtenBy: z.enum(['ai', 'template']),
  summary: z.string().trim().max(1200),
  tags: z.array(z.string().max(40)).max(8),
  goals: z.array(GoalItemSchema).max(6),
  audience: z.array(AudienceProfileSchema).max(4),
  pages: z.array(PageSchema).max(40),
  features: z.array(FeatureItemSchema).max(40),
  platform: z.object({
    id: z.enum(ids(PLATFORMS)),
    label: z.string().max(80),
    reasons: z.array(line).max(5),
    alternatives: z.array(z.object({ name: z.string().max(40), note: line })).max(3),
  }),
  content: z.array(ContentItemSchema).max(20),
  phases: z.array(PhaseSchema).min(1).max(10),
  quote: QuoteSchema,
  risks: z.array(RiskSchema).max(10),
  questions: z.array(line).max(10),
  notes: z.array(NoteSchema).max(200).default([]),
  activity: z.array(ActivitySchema).max(500).default([]),
  share: z
    .object({ token: z.string(), expiresAt: z.string(), approvedAt: z.string().nullable() })
    .nullable()
    .default(null),
});
export type Brief = z.infer<typeof BriefSchema>;
