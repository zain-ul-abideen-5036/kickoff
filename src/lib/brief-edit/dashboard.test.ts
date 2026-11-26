import { describe, expect, it } from 'vitest';
import type { BriefSummary } from '@/lib/repo/briefs-repo';
import { dashboardMetrics, filterBriefs, groupByStatus, parseFilters, DEFAULT_FILTERS } from './dashboard';

const row = (p: Partial<BriefSummary>): BriefSummary => ({
  id: 'id-' + Math.random().toString(36).slice(2, 10),
  ref: 'KO-0101',
  business: 'Ember & Oak',
  type: 'Restaurant or café',
  location: 'Barking, London',
  status: 'New',
  total: 4850,
  pageCount: 7,
  weeks: 5.5,
  scope: '7 pages',
  launch: 'In 4 weeks',
  createdAt: '2026-11-26T09:00:00Z',
  updatedAt: '2026-11-26T09:00:00Z',
  ...p,
});

const now = new Date('2026-11-27T12:00:00Z');
const rows = [
  row({ business: 'Ember & Oak', status: 'New', total: 4850 }),
  row({ business: 'Mason & Reed Solicitors', status: 'New', total: 2600, ref: 'KO-0102' }),
  row({ business: 'Northfield Physio', status: 'Reviewed', total: 3900 }),
  row({ business: 'Barking Bloom Florist', status: 'Quoted', total: 7200 }),
  row({ business: 'Kiln Coffee Co.', status: 'Won', total: 5400, createdAt: '2026-10-20T09:00:00Z' }),
  row({ business: 'Lumen Yoga', status: 'Lost', total: 3100 }),
];

describe('dashboardMetrics', () => {
  it('matches the designed sample numbers', () => {
    expect(dashboardMetrics(rows, now)).toEqual({
      thisMonth: 5,
      awaitingReview: 2,
      pipeline: 18550,
      won: 1,
      lost: 1,
      winRate: 50,
    });
  });
  it('has no win rate before anything is decided', () => {
    expect(dashboardMetrics([row({})], now).winRate).toBeNull();
  });
});

describe('filters', () => {
  it('parses safely from the query string', () => {
    expect(parseFilters({ q: 'kiln', budget: 'over6', date: 'nope', status: 'Won' })).toEqual({
      q: 'kiln',
      budget: 'over6',
      date: 'all',
      status: 'Won',
    });
    expect(parseFilters({})).toEqual(DEFAULT_FILTERS);
  });
  it('searches name and reference', () => {
    expect(filterBriefs(rows, { ...DEFAULT_FILTERS, q: 'physio' }, now).map((r) => r.business)).toEqual([
      'Northfield Physio',
    ]);
    expect(filterBriefs(rows, { ...DEFAULT_FILTERS, q: 'ko-0102' }, now)).toHaveLength(1);
  });
  it('filters by budget band and date', () => {
    expect(filterBriefs(rows, { ...DEFAULT_FILTERS, budget: 'over6' }, now)).toHaveLength(1);
    expect(filterBriefs(rows, { ...DEFAULT_FILTERS, budget: 'under3' }, now)).toHaveLength(1);
    expect(
      filterBriefs(rows, { ...DEFAULT_FILTERS, date: 'month' }, now).some((r) => r.status === 'Won'),
    ).toBe(false);
  });
});

describe('groupByStatus', () => {
  it('returns all five columns in order with totals', () => {
    const g = groupByStatus(rows);
    expect(g.map((c) => c.status)).toEqual(['New', 'Reviewed', 'Quoted', 'Won', 'Lost']);
    expect(g[0]?.total).toBe(7450);
  });
});
