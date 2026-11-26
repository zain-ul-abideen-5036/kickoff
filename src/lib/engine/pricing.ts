import { FEATURES, PLATFORMS, labelOf, type FeatureId, type PlatformId } from '@/lib/domain/catalog';
import type { Adjustment, Quote, QuoteLine } from '@/lib/domain/brief';
import type { RateCard } from '@/lib/domain/rate-card';

/** What the quote is priced from. Every input is a rule outcome, never AI output. */
export interface PricingInput {
  platform: PlatformId;
  pageCount: number;
  /** Features the client chose. Only Must and Should features are priced; Could items are optional extras. */
  pricedFeatures: FeatureId[];
  productCount?: number;
  seo: boolean;
  copywriting: boolean;
}

/** Feature line labels as they read on a quote. */
const QUOTE_LABELS: Partial<Record<FeatureId, string>> = {
  booking: 'Booking integration',
  menu: 'Editable menu system',
  gallery: 'Gallery',
  private: 'Private enquiry form',
  shop: 'Online shop setup',
  blog: 'News or blog',
  newsletter: 'Newsletter sign-up',
  vouchers: 'Gift vouchers',
};

/** Builds quote lines in a fixed, readable order. Lines that cost nothing are left out. */
export function buildQuoteLines(input: PricingInput, rates: RateCard): QuoteLine[] {
  const lines: QuoteLine[] = [];
  const platformLabel = labelOf(PLATFORMS, input.platform);
  lines.push({
    id: 'platform',
    label: `Platform setup (${platformLabel})`,
    basis: 'Rate card · platform base',
    qty: 1,
    rate: rates.platforms[input.platform],
  });
  lines.push({
    id: 'pages',
    label: 'Pages',
    basis: 'Rate card · per page',
    qty: Math.max(0, Math.round(input.pageCount)),
    rate: rates.perPage,
  });
  for (const f of FEATURES) {
    if (!input.pricedFeatures.includes(f.id)) continue;
    const rate = rates.features[f.id];
    if (!rate) continue;
    lines.push({
      id: f.id,
      label: QUOTE_LABELS[f.id] ?? f.label,
      basis: 'Rate card · feature',
      qty: 1,
      rate,
    });
  }
  if (input.pricedFeatures.includes('shop') && (input.productCount ?? 0) > 10) {
    const blocks = Math.ceil(((input.productCount ?? 0) - 10) / 10);
    lines.push({
      id: 'products',
      label: 'Product setup',
      basis: 'Rate card · per 10 products',
      qty: blocks,
      rate: rates.shopPer10Products,
    });
  }
  if (input.seo && rates.seo)
    lines.push({ id: 'seo', label: 'SEO setup', basis: 'Rate card · local search', qty: 1, rate: rates.seo });
  if (input.copywriting && rates.copywriting)
    lines.push({
      id: 'copy',
      label: 'Copywriting support',
      basis: 'Rate card · content',
      qty: 1,
      rate: rates.copywriting,
    });
  return lines.filter((l) => l.qty * l.rate > 0 || l.id === 'platform' || l.id === 'pages');
}

export interface QuoteTotals {
  subtotal: number;
  adjustments: number;
  discount: number;
  net: number;
  vat: number;
  total: number;
}

const lineTotal = (l: QuoteLine) => l.qty * l.rate;
const sumAdjustments = (a: Adjustment[]) => a.reduce((s, x) => s + x.amount, 0);
/** Round to pence, so floating point never leaks into a price. */
const pence = (n: number) => Math.round(n * 100) / 100;

/** The arithmetic of a quote. Discounts never take a quote below zero. */
export function quoteTotals(quote: Quote, vatRate: number): QuoteTotals {
  const subtotal = quote.lines.reduce((s, l) => s + lineTotal(l), 0);
  const adjustments = sumAdjustments(quote.adjustments);
  const before = Math.max(0, subtotal + adjustments);
  const raw =
    quote.discount.mode === 'percent'
      ? (before * Math.min(100, quote.discount.value)) / 100
      : quote.discount.value;
  const discount = pence(Math.min(before, raw));
  const net = pence(before - discount);
  const vat = quote.vat ? pence(net * vatRate) : 0;
  return { subtotal, adjustments, discount, net, vat, total: pence(net + vat) };
}

export function lineAmount(line: QuoteLine): number {
  return lineTotal(line);
}
