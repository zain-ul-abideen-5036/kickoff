import { STATUSES, type Status } from '@/lib/domain/brief';
import type { BriefSummary } from '@/lib/repo/briefs-repo';

export interface DashboardMetrics {
  thisMonth: number;
  awaitingReview: number;
  pipeline: number;
  won: number;
  lost: number;
  /** Won as a share of decided briefs (won + lost), or null before any are decided. */
  winRate: number | null;
}

const OPEN: Status[] = ['New', 'Reviewed', 'Quoted'];

export function dashboardMetrics(rows: BriefSummary[], now = new Date()): DashboardMetrics {
  const month = now.getUTCFullYear() * 12 + now.getUTCMonth();
  const inMonth = (iso: string) => {
    const d = new Date(iso);
    return d.getUTCFullYear() * 12 + d.getUTCMonth() === month;
  };
  const won = rows.filter((r) => r.status === 'Won').length;
  const lost = rows.filter((r) => r.status === 'Lost').length;
  return {
    thisMonth: rows.filter((r) => inMonth(r.createdAt)).length,
    awaitingReview: rows.filter((r) => r.status === 'New').length,
    pipeline: rows.filter((r) => OPEN.includes(r.status)).reduce((s, r) => s + r.total, 0),
    won,
    lost,
    winRate: won + lost ? Math.round((100 * won) / (won + lost)) : null,
  };
}

export type BudgetFilter = 'any' | 'under3' | '3to6' | 'over6';
export type DateFilter = 'month' | 'quarter' | 'all';

export interface Filters {
  q: string;
  budget: BudgetFilter;
  date: DateFilter;
  status: Status | 'all';
}

export const DEFAULT_FILTERS: Filters = { q: '', budget: 'any', date: 'all', status: 'all' };

/** Reads filters from the query string, ignoring anything unexpected. */
export function parseFilters(sp: Record<string, string | string[] | undefined>): Filters {
  const one = (k: string) => (typeof sp[k] === 'string' ? (sp[k] as string) : '');
  const budget = one('budget');
  const date = one('date');
  const status = one('status');
  return {
    q: one('q').slice(0, 80),
    budget: (['under3', '3to6', 'over6'] as const).includes(budget as never)
      ? (budget as BudgetFilter)
      : 'any',
    date: (['month', 'quarter'] as const).includes(date as never) ? (date as DateFilter) : 'all',
    status: STATUSES.includes(status as Status) ? (status as Status) : 'all',
  };
}

export function filterBriefs(rows: BriefSummary[], f: Filters, now = new Date()): BriefSummary[] {
  const q = f.q.trim().toLowerCase();
  const days = f.date === 'month' ? 31 : f.date === 'quarter' ? 92 : Infinity;
  return rows.filter((r) => {
    if (q && !`${r.business} ${r.ref} ${r.type} ${r.location}`.toLowerCase().includes(q)) return false;
    if (f.status !== 'all' && r.status !== f.status) return false;
    if (f.budget === 'under3' && r.total >= 3000) return false;
    if (f.budget === '3to6' && (r.total < 3000 || r.total > 6000)) return false;
    if (f.budget === 'over6' && r.total <= 6000) return false;
    if (days !== Infinity && now.getTime() - new Date(r.createdAt).getTime() > days * 86_400_000)
      return false;
    return true;
  });
}

export function groupByStatus(
  rows: BriefSummary[],
): { status: Status; rows: BriefSummary[]; total: number }[] {
  return STATUSES.map((status) => {
    const list = rows.filter((r) => r.status === status);
    return { status, rows: list, total: list.reduce((s, r) => s + r.total, 0) };
  });
}
