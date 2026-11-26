import type { Brief } from '@/lib/domain/brief';
import type { IntakeAnswers } from '@/lib/domain/intake';
import type { Settings } from '@/lib/domain/settings';
import { contentChecklist, kickoffQuestions } from './checklists';
import { prioritiseFeatures, pricedFeatureIds } from './features';
import { choosePlatform } from './platform';
import { buildQuoteLines, quoteTotals } from './pricing';
import { findRisks } from './risks';
import { buildSitemap, pageCount } from './sitemap';
import { templateAudience, templateGoals, templateSummary, templateTags } from './templates';
import { buildTimeline, totalWeeks } from './timeline';

export interface GenerateInput {
  id: string;
  ref: string;
  answers: IntakeAnswers;
  settings: Settings;
  now?: Date;
}

/** The calculated facts of a brief. These come only from rules and the rate card. */
export interface BriefFacts {
  pageCount: number;
  weeks: number;
  total: number;
  platform: string;
}

/**
 * Turns intake answers into a complete brief using rules and templates only. The AI writer may
 * later replace the summary and audience wording, but never anything in this function's maths.
 */
export function generateBrief({ id, ref, answers, settings, now = new Date() }: GenerateInput): Brief {
  const pages = buildSitemap(answers);
  const platform = choosePlatform(answers);
  const seo = answers.goals.goals.includes('google');
  const copywriting = answers.content.text !== 'ready';
  const lines = buildQuoteLines(
    {
      platform: platform.id,
      pageCount: pageCount(pages),
      pricedFeatures: pricedFeatureIds(answers),
      productCount: Number.parseInt(answers.followUps.products ?? '', 10) || undefined,
      seo,
      copywriting,
    },
    settings.rateCard,
  );
  const quote: Brief['quote'] = {
    lines,
    adjustments: [],
    discount: { mode: 'percent', value: 0 },
    vat: false,
  };
  const phases = buildTimeline(answers, pageCount(pages), settings.timeline);
  const weeks = totalWeeks(phases);
  const total = quoteTotals(quote, settings.rateCard.vatRate).total;
  const iso = now.toISOString();

  return {
    id,
    ref,
    createdAt: iso,
    updatedAt: iso,
    status: 'New',
    answers,
    writtenBy: 'template',
    summary: templateSummary(answers),
    tags: templateTags(answers),
    goals: templateGoals(answers),
    audience: templateAudience(answers),
    pages,
    features: prioritiseFeatures(answers),
    platform,
    content: contentChecklist(answers, copywriting),
    phases,
    quote,
    risks: findRisks({ answers, pages, weeks, total, copywritingIncluded: copywriting }),
    questions: kickoffQuestions(answers),
    notes: [],
    activity: [{ at: iso, text: `${answers.about.name} submitted the intake` }],
    share: null,
  };
}

export function briefFacts(brief: Brief, vatRate: number): BriefFacts {
  return {
    pageCount: brief.pages.length,
    weeks: totalWeeks(brief.phases),
    total: quoteTotals(brief.quote, vatRate).total,
    platform: brief.platform.label,
  };
}
