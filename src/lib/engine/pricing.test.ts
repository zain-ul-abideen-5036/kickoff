import { describe, expect, it } from 'vitest';
import type { Quote } from '@/lib/domain/brief';
import { DEFAULT_RATE_CARD } from '@/lib/domain/rate-card';
import { buildQuoteLines, lineAmount, quoteTotals, type PricingInput } from './pricing';

const ember: PricingInput = {
  platform: 'wordpress',
  pageCount: 7,
  pricedFeatures: ['booking', 'menu', 'gallery', 'private'],
  seo: true,
  copywriting: true,
};

const quoteOf = (input: PricingInput, extra: Partial<Quote> = {}): Quote => ({
  lines: buildQuoteLines(input, DEFAULT_RATE_CARD),
  adjustments: [],
  discount: { mode: 'percent', value: 0 },
  vat: false,
  ...extra,
});

describe('buildQuoteLines — Ember & Oak known answer', () => {
  const lines = buildQuoteLines(ember, DEFAULT_RATE_CARD);

  it('produces the seven designed lines in order', () => {
    expect(lines.map((l) => [l.label, lineAmount(l)])).toEqual([
      ['Platform setup (WordPress)', 1200],
      ['Pages', 1750],
      ['Booking integration', 600],
      ['Editable menu system', 400],
      ['Gallery', 250],
      ['SEO setup', 350],
      ['Copywriting support', 300],
    ]);
  });

  it('prices pages as 7 × £250', () => {
    const pages = lines.find((l) => l.id === 'pages');
    expect(pages).toMatchObject({ qty: 7, rate: 250 });
  });

  it('totals £4,850', () => {
    expect(quoteTotals(quoteOf(ember), 0.2).total).toBe(4850);
  });

  it('leaves out free features rather than showing £0 lines', () => {
    expect(lines.some((l) => l.id === 'private')).toBe(false);
  });
});

describe('buildQuoteLines — other rules', () => {
  it('follows the rate card when prices change', () => {
    const lines = buildQuoteLines(ember, { ...DEFAULT_RATE_CARD, perPage: 300 });
    expect(lines.find((l) => l.id === 'pages')?.rate).toBe(300);
  });

  it('uses the chosen platform base', () => {
    const lines = buildQuoteLines({ ...ember, platform: 'shopify' }, DEFAULT_RATE_CARD);
    expect(lines[0]).toMatchObject({ label: 'Platform setup (Shopify)', rate: 1800 });
  });

  it('adds product setup per 10 products beyond the first 10', () => {
    const lines = buildQuoteLines(
      { ...ember, pricedFeatures: ['shop'], productCount: 40, seo: false, copywriting: false },
      DEFAULT_RATE_CARD,
    );
    expect(lines.find((l) => l.id === 'products')).toMatchObject({ qty: 3, rate: 450 });
  });

  it('skips SEO and copywriting when not needed', () => {
    const ids = buildQuoteLines({ ...ember, seo: false, copywriting: false }, DEFAULT_RATE_CARD).map(
      (l) => l.id,
    );
    expect(ids).not.toContain('seo');
    expect(ids).not.toContain('copy');
  });
});

describe('quoteTotals', () => {
  it('adds VAT at the rate card rate', () => {
    expect(quoteTotals(quoteOf(ember, { vat: true }), 0.2)).toMatchObject({
      net: 4850,
      vat: 970,
      total: 5820,
    });
  });

  it('applies a percentage discount after adjustments', () => {
    const t = quoteTotals(
      quoteOf(ember, {
        adjustments: [{ id: 'a', label: 'Phased launch', amount: 150 }],
        discount: { mode: 'percent', value: 10 },
      }),
      0.2,
    );
    expect(t).toMatchObject({ subtotal: 4850, adjustments: 150, discount: 500, total: 4500 });
  });

  it('applies a fixed discount', () => {
    expect(quoteTotals(quoteOf(ember, { discount: { mode: 'amount', value: 350 } }), 0.2).total).toBe(4500);
  });

  it('never goes below zero', () => {
    expect(quoteTotals(quoteOf(ember, { discount: { mode: 'amount', value: 99999 } }), 0.2).total).toBe(0);
    expect(quoteTotals(quoteOf(ember, { discount: { mode: 'percent', value: 250 } }), 0.2).total).toBe(0);
  });

  it('keeps pence exact', () => {
    const t = quoteTotals(quoteOf(ember, { discount: { mode: 'percent', value: 3.3 }, vat: true }), 0.2);
    expect(Number.isInteger(Math.round(t.total * 100))).toBe(true);
    expect(t.total).toBeCloseTo((4850 - 160.05) * 1.2, 2);
  });
});
