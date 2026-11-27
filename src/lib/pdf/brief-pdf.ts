import fontkit from '@pdf-lib/fontkit';
import { PDFDocument, type PDFImage } from 'pdf-lib';
import { LAUNCHES } from '@/lib/domain/catalog';
import type { Brief, Priority } from '@/lib/domain/brief';
import type { Settings } from '@/lib/domain/settings';
import { briefFacts } from '@/lib/engine/generate';
import { lineAmount, quoteTotals } from '@/lib/engine/pricing';
import { phaseSpans, totalWeeks } from '@/lib/engine/timeline';
import { formatGbp, formatGbpExact, formatWeeks } from '@/lib/format';
import { A4, C, CONTENT_W, MARGIN, Writer, hex, roundRect, wrap, type Fonts } from './draw';
import { loadFonts, type FontBytes } from './fonts';

export interface PdfOptions {
  logo?: { bytes: Uint8Array; contentType: string } | null;
  fonts?: FontBytes;
  /** Collects every string drawn, for tests. */
  trace?: string[];
}

const TYPE_NOUN: Record<string, string> = {
  restaurant: 'an independent restaurant',
  shop: 'an independent shop',
  services: 'a professional services firm',
  health: 'a health and wellness practice',
  trades: 'a local trades business',
  other: 'a local business',
};

export function monogramOf(name: string): string {
  const w = name.trim().split(/\s+/).filter(Boolean);
  if (!w.length) return 'K';
  return (w.length === 1 ? w[0]!.slice(0, 2) : `${w[0]![0]}${w[1]![0]}`).toUpperCase();
}

export function pdfFilename(business: string): string {
  const slug = business
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase()
    .slice(0, 60);
  return `${slug || 'project'}-brief.pdf`;
}

const longDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });

async function embedLogo(doc: PDFDocument, logo: PdfOptions['logo']): Promise<PDFImage | null> {
  if (!logo) return null;
  try {
    if (logo.contentType === 'image/png') return await doc.embedPng(logo.bytes);
    if (logo.contentType === 'image/jpeg') return await doc.embedJpg(logo.bytes);
  } catch {
    /* fall through to the monogram */
  }
  return null; // WebP and anything else: the monogram is used instead.
}

/**
 * The client-facing brief as an A4 PDF. Every figure comes from the brief's rule-based data and
 * the rate card: quote lines, totals, weeks and page counts.
 */
export async function briefPdf(brief: Brief, settings: Settings, opts: PdfOptions = {}): Promise<Uint8Array> {
  const bytes = opts.fonts ?? (await loadFonts());
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const fonts: Fonts = {
    serif: await doc.embedFont(bytes.serif, { subset: true }),
    sans: await doc.embedFont(bytes.sans, { subset: true }),
    bold: await doc.embedFont(bytes.sansBold, { subset: true }),
    mono: await doc.embedFont(bytes.mono, { subset: true }),
  };
  const logo = await embedLogo(doc, opts.logo);
  const a = brief.answers;
  const agency = settings.agency;
  const brand = hex(agency.brandColor);
  const facts = briefFacts(brief, settings.rateCard.vatRate);
  const totals = quoteTotals(brief.quote, settings.rateCard.vatRate);
  const title = `${a.about.business} — project brief`;
  doc.setTitle(title);
  doc.setAuthor(agency.name);
  doc.setSubject(`Project brief ${brief.ref}`);
  doc.setCreator('Kickoff');
  doc.setProducer('Kickoff');
  doc.setCreationDate(new Date(brief.createdAt));

  const mark = (w: Writer, x: number, top: number, size: number, inverted = false) => {
    if (logo) {
      const s = logo.scaleToFit(size, size);
      w.page.drawImage(logo, { x, y: w.py(top) - s.height, width: s.width, height: s.height });
      return;
    }
    roundRect(w.page, x, w.py(top), size, size, { r: size * 0.2, fill: inverted ? C.paper : brand });
    const label = monogramOf(agency.name);
    const fs = size * 0.4;
    const tw = fonts.serif.widthOfTextAtSize(label, fs);
    w.text(label, x + (size - tw) / 2, top + (size - fs) / 2 - fs * 0.05, {
      font: fonts.serif,
      size: fs,
      color: inverted ? brand : C.paper,
    });
  };

  const header = (w: Writer) => {
    mark(w, MARGIN, MARGIN - 6, 16);
    w.text(agency.name, MARGIN + 22, MARGIN - 4, { font: fonts.bold, size: 9 });
    const mid = `${a.about.business} · Project brief`;
    const midW = fonts.sans.widthOfTextAtSize(mid, 9);
    w.text(mid, (A4.width - midW) / 2, MARGIN - 4, { font: fonts.sans, size: 9, color: C.ink2 });
    w.textRight(brief.ref, A4.width - MARGIN, MARGIN - 4, { font: fonts.mono, size: 9, color: C.ink2 });
    w.rule(MARGIN + 12, C.ink);
    w.y = MARGIN + 36;
  };

  const w = new Writer(doc, fonts, header, opts.trace);

  // ---------- Cover ----------
  w.newPage(false);
  const bandH = 270;
  w.page.drawRectangle({ x: 0, y: A4.height - bandH, width: A4.width, height: bandH, color: brand });
  mark(w, MARGIN, 42, 32, true);
  w.text(agency.name, MARGIN + 42, 51, { font: fonts.bold, size: 13, color: C.paper });
  w.textRight(brief.ref, A4.width - MARGIN, 52, { font: fonts.mono, size: 9, color: C.paper });
  w.text('PROJECT BRIEF', MARGIN, 168, { font: fonts.mono, size: 9, color: C.paper });
  let nameSize = 52;
  while (fonts.serif.widthOfTextAtSize(a.about.business, nameSize) > CONTENT_W && nameSize > 26)
    nameSize -= 2;
  w.text(a.about.business, MARGIN, 186, { font: fonts.serif, size: nameSize, color: C.paper });

  w.y = bandH + 36;
  w.para(`A new website for ${TYPE_NOUN[a.about.businessType] ?? 'a business'} in ${a.about.location}.`, {
    font: fonts.serif,
    size: 19,
    width: CONTENT_W * 0.78,
    lineHeight: 1.3,
  });
  w.y += 18;
  w.rule(w.y, C.ink);
  const meta: [string, string][] = [
    ['Prepared for', `${a.about.name}, ${a.about.business}`],
    ['Prepared by', agency.name],
    ['Date', longDate(brief.createdAt)],
    ['Scope', `${facts.pageCount} pages · ${brief.platform.label}`],
    [
      'Estimate',
      `${formatGbp(facts.total)} ${brief.quote.vat ? 'incl.' : 'excl.'} VAT · ${formatWeeks(facts.weeks)}`,
    ],
  ];
  for (const [k, v] of meta) {
    w.text(k, MARGIN, w.y + 9, { font: fonts.sans, size: 10.5, color: C.ink2 });
    w.text(v, MARGIN + 112, w.y + 9, {
      font: k === 'Estimate' ? fonts.bold : fonts.sans,
      size: 10.5,
      color: k === 'Estimate' ? C.brass : C.ink,
    });
    w.y += 30;
    w.rule(w.y);
  }

  // Sitemap overview near the bottom of the cover.
  const overviewTop = A4.height - MARGIN - 28 - 120;
  roundRect(w.page, MARGIN, w.py(overviewTop), CONTENT_W, 120, { r: 7, stroke: C.rule, fill: C.card });
  w.text('SITEMAP · OVERVIEW', MARGIN + 12, overviewTop + 10, { font: fonts.mono, size: 7.5, color: C.ink2 });
  drawTree(w, brief, overviewTop + 30, MARGIN + 8, CONTENT_W - 16, { compact: true });

  // ---------- Content ----------
  const section = (n: string, heading: string, minHeight = 80) => {
    w.ensure(minHeight + 34);
    w.text(n, MARGIN, w.y + 6, { font: fonts.mono, size: 9, color: C.brass });
    w.text(heading, MARGIN + 26, w.y, { font: fonts.serif, size: 17 });
    w.y += 34;
  };
  const body = { font: fonts.sans, size: 10.5 };

  w.newPage();
  section('01', 'Summary');
  w.para(brief.summary, { ...body, size: 11.5, lineHeight: 1.6 });
  w.y += 22;

  section('02', 'Goals and success measures');
  w.rule(w.y, C.ink);
  const gx = [MARGIN, MARGIN + 22, MARGIN + 22 + CONTENT_W * 0.42];
  w.text('#', gx[0]!, w.y + 7, { font: fonts.mono, size: 7.5, color: C.ink2 });
  w.text('GOAL', gx[1]!, w.y + 7, { font: fonts.mono, size: 7.5, color: C.ink2 });
  w.text('HOW WE’LL MEASURE IT', gx[2]!, w.y + 7, { font: fonts.mono, size: 7.5, color: C.ink2 });
  w.y += 24;
  brief.goals.forEach((g, i) => {
    const goalLines = wrap(g.goal, fonts.bold, 10.5, CONTENT_W * 0.42 - 30);
    const mLines = wrap(g.measure, fonts.sans, 10, CONTENT_W - (gx[2]! - MARGIN));
    const h = Math.max(goalLines.length * 15, mLines.length * 14) + 14;
    w.ensure(h);
    w.text(String(i + 1), gx[0]!, w.y + 4, { font: fonts.mono, size: 10, color: C.brass });
    goalLines.forEach((l, j) => w.text(l, gx[1]!, w.y + 4 + j * 15, { font: fonts.bold, size: 10.5 }));
    mLines.forEach((l, j) =>
      w.text(l, gx[2]!, w.y + 4 + j * 14, { font: fonts.sans, size: 10, color: C.ink2 }),
    );
    w.y += h;
    w.rule(w.y - 4);
  });
  w.y += 22;

  section('03', 'Audience', 120);
  const colW = (CONTENT_W - 14) / 2;
  for (let i = 0; i < brief.audience.length; i += 2) {
    const pair = brief.audience.slice(i, i + 2);
    const heights = pair.map(
      (p) =>
        44 +
        w.measure(p.description, { font: fonts.sans, size: 9.5, width: colW - 28, lineHeight: 1.45 }) +
        p.needs.length * 14,
    );
    const h = Math.max(...heights) + 10;
    w.ensure(h);
    pair.forEach((p, j) => {
      const x = MARGIN + j * (colW + 14);
      roundRect(w.page, x, w.py(w.y), colW, h, { r: 7, stroke: C.rule, fill: C.card });
      w.text(p.name, x + 14, w.y + 14, { font: fonts.bold, size: 10.5 });
      w.textRight(p.tag, x + colW - 14, w.y + 15, { font: fonts.mono, size: 8, color: C.ink2 });
      let yy = w.y + 34;
      for (const l of wrap(p.description, fonts.sans, 9.5, colW - 28)) {
        w.text(l, x + 14, yy, { font: fonts.sans, size: 9.5, color: C.ink2 });
        yy += 13.8;
      }
      yy += 4;
      for (const n of p.needs) {
        w.text(`· ${n}`, x + 14, yy, { font: fonts.sans, size: 9.5 });
        yy += 14;
      }
    });
    w.y += h + 12;
  }
  w.y += 10;

  section('04', 'What they already have', 60);
  for (const item of brief.content) {
    w.ensure(22);
    const state = item.state === 'ready' ? 'Ready' : item.state === 'missing' ? 'Not ready' : 'To collect';
    const color = item.state === 'ready' ? C.won : item.state === 'missing' ? C.lost : C.ink2;
    w.text(item.label, MARGIN, w.y + 4, { font: fonts.sans, size: 10.5 });
    if (item.note)
      w.text(`· ${item.note}`, MARGIN + fonts.sans.widthOfTextAtSize(item.label, 10.5) + 6, w.y + 5, {
        font: fonts.sans,
        size: 9,
        color: C.ink2,
      });
    w.textRight(state, A4.width - MARGIN, w.y + 5, { font: fonts.bold, size: 9, color });
    w.y += 22;
    w.rule(w.y - 4);
  }

  // Sitemap and features start a fresh page, as in the design.
  w.newPage();
  section('05', 'Recommended sitemap', 200);
  w.textRight(`${facts.pageCount} pages`, A4.width - MARGIN, w.y - 28, {
    font: fonts.mono,
    size: 9,
    color: C.ink2,
  });
  const treeH = treeHeight(w, brief);
  roundRect(w.page, MARGIN, w.py(w.y), CONTENT_W, treeH + 30, { r: 7, stroke: C.rule, fill: C.card });
  drawGrid(w, MARGIN, w.y, CONTENT_W, treeH + 30);
  w.text('SITEMAP', MARGIN + 12, w.y + 10, { font: fonts.mono, size: 7.5, color: C.ink2 });
  drawTree(w, brief, w.y + 30, MARGIN + 8, CONTENT_W - 16, {});
  w.y += treeH + 54;

  section('06', 'Features', 140);
  const groups: Priority[] = ['Must', 'Should', 'Could'];
  const fW = (CONTENT_W - 24) / 3;
  const rowsFor = (p: Priority) => brief.features.filter((f) => f.priority === p);
  const fH =
    Math.max(
      ...groups.map((p) =>
        rowsFor(p).reduce((s, f) => s + wrap(f.label, fonts.sans, 9.5, fW - 36).length * 13 + 14, 0),
      ),
    ) + 46;
  w.ensure(fH);
  groups.forEach((p, i) => {
    const x = MARGIN + i * (fW + 12);
    roundRect(w.page, x, w.py(w.y), fW, fH, { r: 7, stroke: C.rule });
    priorityChip(w, p, x + 12, w.y + 12);
    let yy = w.y + 40;
    for (const f of rowsFor(p)) {
      const lines = wrap(f.label, fonts.sans, 9.5, fW - 36);
      const h = lines.length * 13 + 8;
      roundRect(w.page, x + 10, w.py(yy), fW - 20, h, { r: 5, stroke: C.rule, fill: C.card });
      lines.forEach((l, j) => w.text(l, x + 18, yy + 5 + j * 13, { font: fonts.sans, size: 9.5 }));
      yy += h + 6;
    }
  });
  w.y += fH + 26;

  section('07', 'Platform', 90);
  w.para(brief.platform.label, { font: fonts.serif, size: 14, lineHeight: 1.3 });
  w.y += 4;
  for (const r of brief.platform.reasons) w.para(`· ${r}`, { ...body, size: 10 });
  if (brief.platform.alternatives.length) {
    w.y += 6;
    w.para(
      `Also considered: ${brief.platform.alternatives.map((x) => `${x.name} (${x.note})`).join('; ')}.`,
      { font: fonts.sans, size: 9.5, color: C.ink2 },
    );
  }

  // Timeline and estimate on a fresh page.
  w.newPage();
  const weeks = totalWeeks(brief.phases);
  section('08', 'Timeline', 170);
  w.textRight(formatWeeks(weeks), A4.width - MARGIN, w.y - 28, {
    font: fonts.mono,
    size: 10,
    color: C.brass,
  });
  const labelW = 110;
  const trackX = MARGIN + labelW;
  const trackW = CONTENT_W - labelW;
  const xOf = (wk: number) => trackX + (wk / weeks) * trackW;
  for (let k = 0; k < Math.ceil(weeks); k++) {
    w.page.drawLine({
      start: { x: xOf(k), y: w.py(w.y) },
      end: { x: xOf(k), y: w.py(w.y + 14) },
      thickness: 0.5,
      color: C.rule,
    });
    w.text(`W${k + 1}`, xOf(k) + 3, w.y + 2, { font: fonts.mono, size: 7.5, color: C.ink2 });
  }
  w.y += 20;
  const launch = LAUNCHES.find((l) => l.id === a.budget.launch);
  const spans = phaseSpans(brief.phases);
  const tlTop = w.y;
  brief.phases.forEach((p, i) => {
    const s = spans[i]!;
    w.text(p.name, MARGIN, w.y + 7, { font: fonts.bold, size: 9.5 });
    for (let k = 0; k <= weeks * 2; k++)
      w.page.drawLine({
        start: { x: trackX + (k / (weeks * 2)) * trackW, y: w.py(w.y) },
        end: { x: trackX + (k / (weeks * 2)) * trackW, y: w.py(w.y + 24) },
        thickness: 0.35,
        color: C.rule,
      });
    const last = i === brief.phases.length - 1;
    const bx = xOf(s.start);
    const bw = Math.max(4, xOf(s.end) - bx);
    roundRect(w.page, bx, w.py(w.y + 3), bw, 18, { r: 3, fill: last ? C.brass : C.ink });
    const label = `${p.weeks}w`;
    if (fonts.mono.widthOfTextAtSize(label, 8) < bw - 8)
      w.text(label, bx + 5, w.y + 8, { font: fonts.mono, size: 8, color: C.paper });
    w.y += 28;
  });
  if (launch && Number.isFinite(launch.weeks) && launch.weeks < weeks) {
    const mx = xOf(launch.weeks);
    w.page.drawLine({
      start: { x: mx, y: w.py(tlTop - 4) },
      end: { x: mx, y: w.py(w.y) },
      thickness: 1,
      color: C.lost,
      dashArray: [3, 3],
    });
    const label = `Requested launch · wk ${launch.weeks}`;
    const lw = fonts.mono.widthOfTextAtSize(label, 7.5);
    const lx = mx + 4 + lw > A4.width - MARGIN ? mx - 4 - lw : mx + 4;
    w.text(label, lx, w.y + 2, { font: fonts.mono, size: 7.5, color: C.lost });
    w.y += 14;
  }
  w.y += 12;
  const timelineRisk = brief.risks.find((r) => r.id === 'timeline');
  if (timelineRisk) w.para(timelineRisk.detail, { font: fonts.sans, size: 9.5, color: C.ink2 });
  w.y += 22;

  section('09', 'Estimate', 160);
  const amtX = A4.width - MARGIN;
  const basisX = MARGIN + CONTENT_W * 0.5;
  w.rule(w.y, C.ink);
  w.text('ITEM', MARGIN, w.y + 7, { font: fonts.mono, size: 7.5, color: C.ink2 });
  w.text('BASIS', basisX, w.y + 7, { font: fonts.mono, size: 7.5, color: C.ink2 });
  w.textRight('AMOUNT', amtX, w.y + 7, { font: fonts.mono, size: 7.5, color: C.ink2 });
  w.y += 24;
  const row = (label: string, basis: string, amount: string, strong = false) => {
    w.ensure(22);
    w.text(label, MARGIN, w.y + 3, { font: strong ? fonts.bold : fonts.sans, size: 10 });
    if (basis) w.text(basis, basisX, w.y + 4, { font: fonts.sans, size: 9, color: C.ink2 });
    w.textRight(amount, amtX, w.y + 3, { font: fonts.mono, size: 10 });
    w.y += 22;
    w.rule(w.y - 5);
  };
  for (const l of brief.quote.lines) {
    const basis = l.qty !== 1 ? `${l.qty} × ${formatGbp(l.rate)}` : l.basis.replace(/^Rate card · /, '');
    row(l.label, basis, formatGbp(lineAmount(l)));
  }
  for (const adj of brief.quote.adjustments) row(adj.label, 'Adjustment', formatGbp(adj.amount));
  if (totals.discount > 0) row('Discount', '', `−${formatGbpExact(totals.discount)}`);
  if (brief.quote.vat)
    row(`VAT at ${Math.round(settings.rateCard.vatRate * 100)}%`, '', formatGbpExact(totals.vat));
  w.ensure(56);
  w.y += 8;
  w.text('Total estimate', MARGIN, w.y + 6, { font: fonts.bold, size: 11 });
  w.text(
    `${brief.quote.vat ? 'Includes' : 'Excludes'} VAT · prices from ${agency.name}’s rate card`,
    MARGIN,
    w.y + 22,
    { font: fonts.sans, size: 8.5, color: C.ink2 },
  );
  w.textRight(formatGbp(totals.total), amtX, w.y - 6, { font: fonts.serif, size: 30, color: C.brass });
  w.y += 52;

  // Risks, questions, assumptions and next steps.
  w.newPage();
  section('10', 'Risks', 60);
  if (!brief.risks.length) w.para('No risks found from the answers.', { ...body, color: C.ink2 });
  brief.risks.forEach((r, i) => {
    const h =
      w.measure(r.title, { font: fonts.bold, size: 10.5, width: CONTENT_W - 36 }) +
      w.measure(r.detail, { font: fonts.sans, size: 10, width: CONTENT_W - 36 }) +
      12;
    w.ensure(h);
    w.text(`R${i + 1}`, MARGIN, w.y + 2, { font: fonts.mono, size: 9.5, color: C.brass });
    const top = w.y;
    w.para(r.title, { font: fonts.bold, size: 10.5, x: MARGIN + 36, width: CONTENT_W - 36 });
    w.para(r.detail, { font: fonts.sans, size: 10, color: C.ink2, x: MARGIN + 36, width: CONTENT_W - 36 });
    w.y = Math.max(w.y, top + 16) + 6;
    w.rule(w.y - 4);
  });
  w.y += 20;

  section('11', 'Questions for the kickoff call', 60);
  brief.questions.forEach((q, i) => {
    w.ensure(30);
    w.text(`Q${i + 1}`, MARGIN, w.y + 2, { font: fonts.mono, size: 9.5, color: C.brass });
    const top = w.y;
    w.para(q, { ...body, x: MARGIN + 36, width: CONTENT_W - 36 });
    w.y = Math.max(w.y, top + 16) + 6;
    w.rule(w.y - 4);
  });
  w.y += 20;

  section('12', 'Assumptions', 80);
  const collect = brief.content.filter((c) => c.state === 'collect').map((c) => c.label.toLowerCase());
  const assumptions = [
    `Prices ${brief.quote.vat ? 'include' : 'exclude'} VAT and come from ${agency.name}’s rate card.`,
    `The estimate covers the ${facts.pageCount} pages shown. Extra pages are ${formatGbp(settings.rateCard.perPage)} each.`,
    collect.length ? `${a.about.business} supplies ${collect.join(', ')}.` : '',
    'The timeline starts once the brief is approved.',
  ].filter(Boolean);
  for (const s of assumptions) w.para(`· ${s}`, { ...body, size: 10 });
  w.y += 24;

  const stepsH = 112;
  w.ensure(stepsH);
  roundRect(w.page, MARGIN, w.py(w.y), CONTENT_W, stepsH, { r: 8, stroke: C.ink });
  w.text('Next steps', MARGIN + 18, w.y + 16, { font: fonts.serif, size: 15 });
  const stepW = (CONTENT_W - 36) / 3;
  [
    ['01', 'Approve the brief', 'Using the link in your email'],
    ['02', 'Kickoff call', 'To answer the questions above'],
    ['03', 'Discovery starts', `Week 1 of ${weeks}`],
  ].forEach(([n, t, d], i) => {
    const x = MARGIN + 18 + i * stepW;
    w.text(n!, x, w.y + 46, { font: fonts.mono, size: 8.5, color: C.brass });
    w.text(t!, x, w.y + 60, { font: fonts.bold, size: 10 });
    w.text(d!, x, w.y + 76, { font: fonts.sans, size: 8.5, color: C.ink2 });
  });
  w.y += stepsH;

  // Footers, now that the page count is known.
  const total = w.pages.length;
  w.pages.forEach((page, i) => {
    w.page = page;
    const top = A4.height - MARGIN + 4;
    if (i > 0) w.rule(top - 10);
    const left =
      i === 0 || i === total - 1
        ? 'Powered by Kickoff'
        : `Prepared for ${a.about.name} · ${shortDate(brief.createdAt)}`;
    w.text(left, MARGIN, top, { font: fonts.sans, size: 8, color: C.ink2 });
    w.textRight(`${i + 1} / ${total}`, A4.width - MARGIN, top, { font: fonts.mono, size: 8, color: C.ink2 });
  });

  return doc.save();

  // ---------- helpers that need the fonts ----------
  function priorityChip(wr: Writer, p: Priority, x: number, top: number) {
    const label = p.toUpperCase();
    const tw = fonts.mono.widthOfTextAtSize(label, 7.5);
    const cw = tw + 12;
    if (p === 'Must') roundRect(wr.page, x, wr.py(top), cw, 15, { r: 3, fill: C.ink });
    else if (p === 'Should')
      roundRect(wr.page, x, wr.py(top), cw, 15, { r: 3, stroke: C.ink, strokeWidth: 1.2 });
    else roundRect(wr.page, x, wr.py(top), cw, 15, { r: 3, stroke: C.ink2, dash: [2, 2] });
    wr.text(label, x + 6, top + 4, {
      font: fonts.mono,
      size: 7.5,
      color: p === 'Must' ? C.paper : p === 'Should' ? C.ink : C.ink2,
    });
  }
}

/** Faint blueprint grid inside a box. */
function drawGrid(w: Writer, x: number, top: number, width: number, height: number) {
  for (let gx = x + 16; gx < x + width; gx += 16)
    w.page.drawLine({
      start: { x: gx, y: w.py(top + 1) },
      end: { x: gx, y: w.py(top + height - 1) },
      thickness: 0.3,
      color: C.paper2,
    });
  for (let gy = top + 16; gy < top + height; gy += 16)
    w.page.drawLine({
      start: { x: x + 1, y: w.py(gy) },
      end: { x: x + width - 1, y: w.py(gy) },
      thickness: 0.3,
      color: C.paper2,
    });
}

const NODE_H = 30;

function nodeWidth(w: Writer, label: string, size: number) {
  return Math.max(48, w.fonts.sans.widthOfTextAtSize(label, size) + 18);
}

function treeHeight(w: Writer, brief: Brief): number {
  const maxSections = Math.max(0, ...brief.pages.slice(1).map((p) => p.sections.length));
  return NODE_H * 2 + 28 + (maxSections ? 14 + maxSections * (NODE_H - 6 + 8) : 0);
}

/**
 * The sitemap as a blueprint tree: Home on top, top-level pages in a row joined by connector
 * lines, page sections stacked under their page.
 */
function drawTree(w: Writer, brief: Brief, top: number, x: number, width: number, o: { compact?: boolean }) {
  const [root, ...kids] = brief.pages;
  if (!root) return;
  const size = o.compact ? 8.5 : 9.5;
  const gap = o.compact ? 6 : 8;
  let widths = kids.map((k) => nodeWidth(w, k.label, size));
  let rowW = widths.reduce((s, n) => s + n, 0) + gap * Math.max(0, kids.length - 1);
  if (rowW > width) {
    const scale = (width - gap * (kids.length - 1)) / (rowW - gap * (kids.length - 1));
    widths = widths.map((n) => n * scale);
    rowW = width;
  }
  const line = { thickness: 0.8, color: C.ruleStrong };
  const rootW = nodeWidth(w, root.label, size + 0.5);
  const cx = x + width / 2;
  const box = (label: string, bx: number, btop: number, bw: number, sub = false, rootNode = false) => {
    roundRect(w.page, bx, w.py(btop), bw, sub ? NODE_H - 8 : NODE_H - 4, {
      r: 4,
      fill: C.card,
      stroke: sub ? C.ruleStrong : C.ink,
      strokeWidth: rootNode ? 1.4 : 0.9,
    });
    const fs = sub ? size - 1 : size;
    let text = label;
    while (w.fonts.sans.widthOfTextAtSize(text, fs) > bw - 8 && text.length > 3)
      text = `${text.slice(0, -2)}…`;
    const tw = w.fonts.sans.widthOfTextAtSize(text, fs);
    w.text(text, bx + (bw - tw) / 2, btop + (sub ? 6 : 8), {
      font: sub ? w.fonts.sans : w.fonts.bold,
      size: fs,
    });
  };
  box(root.label, cx - rootW / 2, top, rootW, false, true);
  if (!kids.length) return;
  const stemTop = top + NODE_H - 4;
  const barY = stemTop + 12;
  w.page.drawLine({ start: { x: cx, y: w.py(stemTop) }, end: { x: cx, y: w.py(barY) }, ...line });
  let bx = cx - rowW / 2;
  const centres = widths.map((nw) => {
    const c = bx + nw / 2;
    bx += nw + gap;
    return c;
  });
  w.page.drawLine({
    start: { x: centres[0]!, y: w.py(barY) },
    end: { x: centres.at(-1)!, y: w.py(barY) },
    ...line,
  });
  const kidTop = barY + 12;
  kids.forEach((k, i) => {
    const c = centres[i]!;
    const nw = widths[i]!;
    w.page.drawLine({ start: { x: c, y: w.py(barY) }, end: { x: c, y: w.py(kidTop) }, ...line });
    box(k.label, c - nw / 2, kidTop, nw);
    if (o.compact) return;
    let st = kidTop + NODE_H - 4;
    for (const s of k.sections) {
      w.page.drawLine({ start: { x: c, y: w.py(st) }, end: { x: c, y: w.py(st + 8) }, ...line });
      st += 8;
      // Sections may be wider than their page node; keep them centred and inside the box.
      const sw = Math.max(nw - 8, w.fonts.sans.widthOfTextAtSize(s, size - 1) + 16);
      const sx = Math.min(Math.max(c - sw / 2, x), x + width - sw);
      box(s, sx, st, sw, true);
      st += NODE_H - 8;
    }
  });
}
