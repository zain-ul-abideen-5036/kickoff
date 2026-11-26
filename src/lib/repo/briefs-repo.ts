import { BUSINESS_TYPES, LAUNCHES, labelOf } from '@/lib/domain/catalog';
import { BriefSchema, type Brief, type Status } from '@/lib/domain/brief';
import { quoteTotals } from '@/lib/engine/pricing';
import { totalWeeks } from '@/lib/engine/timeline';
import type { Store } from '@/lib/store';
import { isId } from './ids';

/** What the dashboard needs about each brief, kept in one index file so it loads in one read. */
export interface BriefSummary {
  id: string;
  ref: string;
  business: string;
  type: string;
  location: string;
  status: Status;
  total: number;
  pageCount: number;
  weeks: number;
  scope: string;
  launch: string;
  createdAt: string;
  updatedAt: string;
}

const INDEX = 'briefs/index.json';
const COUNTER = 'meta/counter.json';
const keyOf = (id: string) => `briefs/${id}.json`;

export function summarise(brief: Brief, vatRate: number): BriefSummary {
  const a = brief.answers;
  const products = Number.parseInt(a.followUps.products ?? '', 10);
  return {
    id: brief.id,
    ref: brief.ref,
    business: a.about.business,
    type: labelOf(BUSINESS_TYPES, a.about.businessType),
    location: a.about.location,
    status: brief.status,
    total: quoteTotals(brief.quote, vatRate).total,
    pageCount: brief.pages.length,
    weeks: totalWeeks(brief.phases),
    scope:
      a.features.features.includes('shop') && products
        ? `Shop, ${products} products`
        : `${brief.pages.length} pages`,
    launch: labelOf(LAUNCHES, a.budget.launch),
    createdAt: brief.createdAt,
    updatedAt: brief.updatedAt,
  };
}

export async function getBrief(store: Store, id: string): Promise<Brief | null> {
  if (!isId(id)) return null;
  const raw = await store.getJSON(keyOf(id));
  if (!raw) return null;
  const res = BriefSchema.safeParse(raw);
  return res.success ? res.data : null;
}

/** Newest first. Rebuilds the index from the brief files if it is missing. */
export async function listBriefs(store: Store): Promise<BriefSummary[]> {
  const index = await store.getJSON<BriefSummary[]>(INDEX);
  if (index) return index;
  return rebuildIndex(store, 0.2);
}

export async function rebuildIndex(store: Store, vatRate: number): Promise<BriefSummary[]> {
  const keys = (await store.list('briefs/')).filter((k) => k !== INDEX && k.endsWith('.json'));
  const briefs = await Promise.all(keys.map((k) => getBrief(store, k.slice(7, -5))));
  const summaries = briefs.filter((b): b is Brief => !!b).map((b) => summarise(b, vatRate));
  return writeIndex(store, summaries);
}

async function writeIndex(store: Store, list: BriefSummary[]): Promise<BriefSummary[]> {
  const sorted = [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  await store.putJSON(INDEX, sorted);
  return sorted;
}

/** Validates, stamps `updatedAt`, saves the brief and refreshes its row in the index. */
export async function saveBrief(
  store: Store,
  brief: Brief,
  vatRate: number,
  now = new Date(),
): Promise<Brief> {
  const next = BriefSchema.parse({ ...brief, updatedAt: now.toISOString() });
  await store.putJSON(keyOf(next.id), next);
  const index = (await store.getJSON<BriefSummary[]>(INDEX)) ?? [];
  await writeIndex(store, [...index.filter((s) => s.id !== next.id), summarise(next, vatRate)]);
  return next;
}

export async function deleteBrief(store: Store, id: string): Promise<void> {
  if (!isId(id)) return;
  await store.delete(keyOf(id));
  const index = (await store.getJSON<BriefSummary[]>(INDEX)) ?? [];
  await writeIndex(
    store,
    index.filter((s) => s.id !== id),
  );
}

/** Human references count up from KO-0101. */
export async function nextRef(store: Store): Promise<string> {
  const c = (await store.getJSON<{ n: number }>(COUNTER)) ?? { n: 100 };
  const n = c.n + 1;
  await store.putJSON(COUNTER, { n });
  return `KO-${String(n).padStart(4, '0')}`;
}
