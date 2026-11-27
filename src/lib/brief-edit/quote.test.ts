import { describe, expect, it } from 'vitest';
import { QuoteSchema } from '@/lib/domain/brief';
import { EMBER_AND_OAK } from '@/lib/domain/fixtures';
import { defaultSettings } from '@/lib/domain/settings';
import { generateBrief } from '@/lib/engine/generate';
import { quoteTotals } from '@/lib/engine/pricing';
import { parseAmount, quoteOps, rateCardCatalog } from './quote';

const settings = defaultSettings();
const quote = generateBrief({ id: 'brief-1234', ref: 'KO-0142', answers: EMBER_AND_OAK, settings }).quote;
const total = (q: typeof quote) => quoteTotals(q, 0.2).total;

describe('rateCardCatalog', () => {
  it('offers priced rate card items not already on the quote', () => {
    const ids = rateCardCatalog(settings.rateCard, quote).map((i) => i.id);
    expect(ids).toEqual(expect.arrayContaining(['shop', 'blog', 'newsletter', 'vouchers', 'products']));
    expect(ids).not.toContain('booking');
    expect(ids).not.toContain('seo');
    expect(ids).not.toContain('private');
  });
});

describe('quoteOps', () => {
  it('changes quantity and rate', () => {
    expect(total(quoteOps.setQty(quote, 'pages', 8))).toBe(5100);
    expect(total(quoteOps.setRate(quote, 'platform', 1500))).toBe(5150);
  });

  it('clamps nonsense values', () => {
    const q = quoteOps.setQty(quoteOps.setRate(quote, 'pages', -50), 'pages', 1e9);
    const pages = q.lines.find((l) => l.id === 'pages')!;
    expect(pages.rate).toBe(0);
    expect(pages.qty).toBe(999);
    expect(QuoteSchema.safeParse(q).success).toBe(true);
  });

  it('adds from the rate card once and removes', () => {
    const [item] = rateCardCatalog(settings.rateCard, quote).filter((i) => i.id === 'newsletter');
    const q = quoteOps.add(quoteOps.add(quote, item!), item!);
    expect(q.lines.filter((l) => l.id === 'newsletter')).toHaveLength(1);
    expect(total(q)).toBe(5000);
    expect(total(quoteOps.remove(q, 'newsletter'))).toBe(4850);
  });

  it('handles adjustments, discount and VAT', () => {
    let q = quoteOps.addAdjustment(quote);
    const id = q.adjustments[0]!.id;
    q = quoteOps.setAdjustment(q, id, { label: 'Phased launch', amount: 150 });
    q = quoteOps.setDiscount(q, 'percent', 10);
    expect(total(q)).toBe(4500);
    expect(total(quoteOps.setVat(q, true))).toBe(5400);
    expect(quoteOps.setDiscount(q, 'percent', 400).discount.value).toBe(100);
    expect(total(quoteOps.removeAdjustment(q, id))).toBe(4365);
  });
});

describe('parseAmount', () => {
  it('reads typed money', () => {
    expect(parseAmount('£1,200')).toBe(1200);
    expect(parseAmount(' 12.5 ')).toBe(12.5);
    expect(parseAmount('abc')).toBe(0);
  });
});
