import { FEATURES } from '@/lib/domain/catalog';
import type { Quote, QuoteLine } from '@/lib/domain/brief';
import type { RateCard } from '@/lib/domain/rate-card';

/** Something the studio can add to a quote, priced from its rate card. */
export interface CatalogItem {
  id: string;
  label: string;
  basis: string;
  rate: number;
}

const FEATURE_LABEL: Record<string, string> = {
  booking: 'Booking integration',
  menu: 'Editable menu system',
  shop: 'Online shop setup',
};

/** Rate card items not already on the quote. Free items are left out. */
export function rateCardCatalog(rates: RateCard, quote: Quote): CatalogItem[] {
  const items: CatalogItem[] = [
    ...FEATURES.map((f) => ({
      id: f.id,
      label: FEATURE_LABEL[f.id] ?? f.label,
      basis: 'Rate card · feature',
      rate: rates.features[f.id],
    })),
    {
      id: 'products',
      label: 'Product setup',
      basis: 'Rate card · per 10 products',
      rate: rates.shopPer10Products,
    },
    { id: 'seo', label: 'SEO setup', basis: 'Rate card · local search', rate: rates.seo },
    { id: 'copy', label: 'Copywriting support', basis: 'Rate card · content', rate: rates.copywriting },
  ];
  const have = new Set(quote.lines.map((l) => l.id));
  return items.filter((i) => i.rate > 0 && !have.has(i.id));
}

const clampInt = (n: number, min: number, max: number) => Math.max(min, Math.min(max, Math.round(n || 0)));

export const quoteOps = {
  setQty: (q: Quote, id: string, qty: number): Quote => ({
    ...q,
    lines: q.lines.map((l) => (l.id === id ? { ...l, qty: clampInt(qty, 0, 999) } : l)),
  }),
  setRate: (q: Quote, id: string, rate: number): Quote => ({
    ...q,
    lines: q.lines.map((l) => (l.id === id ? { ...l, rate: clampInt(rate, 0, 1_000_000) } : l)),
  }),
  add: (q: Quote, item: CatalogItem): Quote => {
    if (q.lines.some((l) => l.id === item.id)) return q;
    const line: QuoteLine = { id: item.id, label: item.label, basis: item.basis, qty: 1, rate: item.rate };
    return { ...q, lines: [...q.lines, line] };
  },
  remove: (q: Quote, id: string): Quote => ({ ...q, lines: q.lines.filter((l) => l.id !== id) }),
  addAdjustment: (q: Quote): Quote => {
    const n = q.adjustments.length + 1;
    return {
      ...q,
      adjustments: [
        ...q.adjustments,
        { id: `adj-${Date.now().toString(36)}-${n}`, label: 'Adjustment', amount: 0 },
      ],
    };
  },
  setAdjustment: (q: Quote, id: string, patch: { label?: string; amount?: number }): Quote => ({
    ...q,
    adjustments: q.adjustments.map((a) =>
      a.id === id
        ? {
            ...a,
            ...(patch.label !== undefined ? { label: patch.label.slice(0, 80) } : {}),
            ...(patch.amount !== undefined ? { amount: clampInt(patch.amount, -1_000_000, 1_000_000) } : {}),
          }
        : a,
    ),
  }),
  removeAdjustment: (q: Quote, id: string): Quote => ({
    ...q,
    adjustments: q.adjustments.filter((a) => a.id !== id),
  }),
  setDiscount: (q: Quote, mode: 'percent' | 'amount', value: number): Quote => ({
    ...q,
    discount: {
      mode,
      value: Math.max(0, Math.min(mode === 'percent' ? 100 : 1_000_000, Number.isFinite(value) ? value : 0)),
    },
  }),
  setVat: (q: Quote, vat: boolean): Quote => ({ ...q, vat }),
};

/** Parses a typed money or number value: "£1,200" → 1200, junk → 0. */
export function parseAmount(raw: string): number {
  const n = Number.parseFloat(raw.replace(/[£,\s]/g, ''));
  return Number.isFinite(n) ? n : 0;
}
