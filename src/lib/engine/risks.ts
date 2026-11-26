import { BUDGETS, LAUNCHES } from '@/lib/domain/catalog';
import type { Page, Risk } from '@/lib/domain/brief';
import type { IntakeAnswers } from '@/lib/domain/intake';
import { formatGbp, formatWeeks } from '@/lib/format';

export interface RiskInput {
  answers: IntakeAnswers;
  pages: Page[];
  weeks: number;
  /** The calculated quote total before VAT. */
  total: number;
  copywritingIncluded: boolean;
}

/** The pages to launch first when time is short: Home, the first two working pages, and Contact. */
export function corePages(pages: Page[]): string[] {
  const middle = pages.filter((p) => !['home', 'about', 'contact', 'gallery', 'news', 'faq'].includes(p.id));
  return ['Home', ...middle.slice(0, 2).map((p) => p.label), 'Contact'];
}

function list(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

/** Risks are found by rule from the answers and the calculated plan, never by AI. */
export function findRisks(input: RiskInput): Risk[] {
  const { answers: a } = input;
  const risks: Risk[] = [];

  const launch = LAUNCHES.find((l) => l.id === a.budget.launch);
  if (launch && input.weeks > launch.weeks) {
    const asked = launch.id === 'asap' ? 'as soon as possible' : launch.label.toLowerCase();
    risks.push({
      id: 'timeline',
      title: `Requested launch ${asked} vs a ${formatWeeks(input.weeks).replace(' weeks', '-week')} plan.`,
      detail: `Suggest launching core pages first: ${list(corePages(input.pages))}.`,
    });
  }

  if (a.content.text !== 'ready') {
    risks.push({
      id: 'text',
      title: 'Website text not ready.',
      detail: input.copywritingIncluded
        ? 'Copywriting support is included in the estimate.'
        : 'Agree who writes each page before design starts.',
    });
  }

  if (a.content.photos !== 'ready') {
    risks.push({
      id: 'photos',
      title: 'Photography not ready.',
      detail: 'Plan a short shoot or agree stock images before the design phase.',
    });
  } else if (a.content.photoSource === 'phone') {
    risks.push({
      id: 'photos',
      title: 'Photos were taken on a phone.',
      detail: 'Check they hold up at large sizes, or plan a short professional shoot.',
    });
  }

  if (a.content.logo !== 'ready') {
    risks.push({
      id: 'logo',
      title: 'Logo not ready.',
      detail: 'The design phase needs a final logo; consider adding a logo refresh.',
    });
  }

  const budget = BUDGETS.find((b) => b.id === a.budget.budget);
  if (budget && input.total > budget.max) {
    risks.push({
      id: 'budget',
      title: `Estimate of ${formatGbp(input.total)} is above the ${budget.label} range.`,
      detail: 'Move Should features to a second phase to fit the budget.',
    });
  }

  return risks;
}
