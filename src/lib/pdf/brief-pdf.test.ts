import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { EMBER_AND_OAK } from '@/lib/domain/fixtures';
import { defaultSettings } from '@/lib/domain/settings';
import { generateBrief } from '@/lib/engine/generate';
import { briefPdf, monogramOf, pdfFilename } from './brief-pdf';
import { wrap } from './draw';

const settings = defaultSettings();
const brief = generateBrief({
  id: 'brief-1234',
  ref: 'KO-0142',
  answers: EMBER_AND_OAK,
  settings,
  now: new Date('2026-11-26T09:15:00Z'),
});

describe('briefPdf', () => {
  it('produces a 4–6 page A4 PDF for Ember & Oak with metadata', async () => {
    const bytes = await briefPdf(brief, settings);
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBeGreaterThanOrEqual(4);
    expect(doc.getPageCount()).toBeLessThanOrEqual(6);
    const { width, height } = doc.getPage(0).getSize();
    expect(Math.round(width)).toBe(595);
    expect(Math.round(height)).toBe(842);
    expect(doc.getTitle()).toBe('Ember & Oak — project brief');
    expect(doc.getAuthor()).toBe('Studio North');
  });

  it('prints only the calculated figures', async () => {
    const trace: string[] = [];
    await briefPdf(brief, settings, { trace });
    const all = trace.join('\n');
    expect(all).toContain('£4,850');
    expect(all).toContain('7 pages · WordPress with a booking integration');
    expect(all).toContain('5.5 weeks');
    expect(all).toContain('7 × £250');
    expect(all).toContain('£1,750');
    expect(all).toContain('Requested launch · wk 4');
    for (const label of ['Home', 'Menu', 'Book a table', 'Private dining', 'Gallery', 'About', 'Contact'])
      expect(trace).toContain(label);
  });

  it('shows VAT and discount lines when the quote has them', async () => {
    const trace: string[] = [];
    await briefPdf(
      { ...brief, quote: { ...brief.quote, vat: true, discount: { mode: 'amount', value: 100 } } },
      settings,
      { trace },
    );
    expect(trace).toContain('VAT at 20%');
    expect(trace).toContain('−£100.00');
    expect(trace).toContain('£5,700');
  });

  it('flows long content onto extra pages instead of clipping', async () => {
    const long = { ...brief, summary: 'A very long summary sentence. '.repeat(400).slice(0, 1200) };
    const many = {
      ...long,
      risks: Array.from({ length: 10 }, (_, i) => ({
        id: `r${i}`,
        title: `Risk ${i}.`,
        detail: 'Detail. '.repeat(40),
      })),
    };
    const doc = await PDFDocument.load(await briefPdf(many, settings));
    expect(doc.getPageCount()).toBeGreaterThan(5);
  });

  it('falls back to the monogram for unsupported logos', async () => {
    const bytes = await briefPdf(brief, settings, {
      logo: { bytes: new Uint8Array([1, 2, 3]), contentType: 'image/webp' },
    });
    expect(bytes.length).toBeGreaterThan(1000);
  });
});

describe('helpers', () => {
  it('makes a safe filename', () => {
    expect(pdfFilename('Ember & Oak')).toBe('ember-oak-brief.pdf');
    expect(pdfFilename('../../etc"')).toBe('etc-brief.pdf');
    expect(pdfFilename('')).toBe('project-brief.pdf');
  });

  it('makes a monogram', () => {
    expect(monogramOf('Studio North')).toBe('SN');
  });

  it('wraps text to a width', async () => {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont('Helvetica');
    const lines = wrap('one two three four five six seven eight nine ten', font, 12, 60);
    expect(lines.length).toBeGreaterThan(2);
    for (const l of lines) expect(font.widthOfTextAtSize(l, 12)).toBeLessThanOrEqual(60);
  });
});
