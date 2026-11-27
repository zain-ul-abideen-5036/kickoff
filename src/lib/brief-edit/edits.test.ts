import { describe, expect, it } from 'vitest';
import { BriefSchema } from '@/lib/domain/brief';
import { EMBER_AND_OAK } from '@/lib/domain/fixtures';
import { defaultSettings } from '@/lib/domain/settings';
import { generateBrief } from '@/lib/engine/generate';
import { quoteTotals } from '@/lib/engine/pricing';
import { EditError, EditSchema, applyEdit, applyWithActivity, type Edit } from './edits';

const settings = defaultSettings();
const base = generateBrief({ id: 'brief-1234', ref: 'KO-0142', answers: EMBER_AND_OAK, settings });
const run = (...edits: Edit[]) => edits.reduce((b, e) => applyEdit(b, e).brief, base);
const pagesQty = (b: typeof base) => b.quote.lines.find((l) => l.id === 'pages')?.qty;

describe('sitemap edits keep the quote in sync', () => {
  it('adds a page before About and Contact and prices it', () => {
    const b = run({ type: 'page.add', label: 'Events' });
    expect(b.pages.map((p) => p.label).slice(-3)).toEqual(['Events', 'About', 'Contact']);
    expect(pagesQty(b)).toBe(8);
    expect(quoteTotals(b.quote, 0.2).total).toBe(5100);
  });

  it('removes a page and reprices', () => {
    const b = run({ type: 'page.remove', id: 'gallery' });
    expect(b.pages).toHaveLength(6);
    expect(pagesQty(b)).toBe(6);
  });

  it('refuses to remove or move Home', () => {
    expect(() => run({ type: 'page.remove', id: 'home' })).toThrow(EditError);
    expect(() => run({ type: 'page.move', id: 'home', to: 3 })).toThrow(EditError);
  });

  it('reorders but never ahead of Home', () => {
    const b = run({ type: 'page.move', id: 'contact', to: 0 });
    expect(b.pages[0]?.id).toBe('home');
    expect(b.pages[1]?.id).toBe('contact');
  });

  it('gives duplicate names unique ids', () => {
    const b = run({ type: 'page.add', label: 'Menu' });
    expect(new Set(b.pages.map((p) => p.id)).size).toBe(b.pages.length);
  });

  it('renames a page', () => {
    expect(run({ type: 'page.rename', id: 'gallery', label: 'Our gallery' }).pages[4]?.label).toBe(
      'Our gallery',
    );
  });
});

describe('feature moves', () => {
  it('moves Gallery to Must and keeps groups ordered', () => {
    const { brief, activity } = applyEdit(base, { type: 'feature.move', id: 'gallery', priority: 'Must' });
    const must = brief.features.filter((f) => f.priority === 'Must').map((f) => f.label);
    expect(must).toContain('Gallery');
    const ranks = brief.features.map((f) => ['Must', 'Should', 'Could'].indexOf(f.priority));
    expect(ranks).toEqual([...ranks].sort());
    expect(activity).toBe('Moved Gallery to Must');
  });
});

describe('timeline edits', () => {
  it('rounds to half weeks and never below half a week', () => {
    const b = run(
      { type: 'phase.weeks', id: 'build', weeks: 2.7 },
      { type: 'phase.weeks', id: 'launch', weeks: 0.5 },
    );
    expect(b.phases.find((p) => p.id === 'build')?.weeks).toBe(2.5);
    expect(EditSchema.safeParse({ type: 'phase.weeks', id: 'build', weeks: 0 }).success).toBe(false);
  });
});

describe('lists', () => {
  it('adds and removes goals, risks and questions', () => {
    const b = run(
      { type: 'goal.add' },
      { type: 'risk.add' },
      { type: 'question.add' },
      { type: 'question.remove', index: 0 },
    );
    expect(b.goals).toHaveLength(4);
    expect(b.risks).toHaveLength(3);
    expect(b.questions).toHaveLength(3);
    expect(b.questions[0]).toMatch(/usage rights/);
  });
});

describe('every edit leaves a valid brief', () => {
  it('validates after a run of edits', () => {
    const b = run(
      { type: 'summary', value: 'A short summary.' },
      { type: 'page.add', label: 'Events' },
      { type: 'feature.add', label: 'Allergen filter', priority: 'Could' },
      { type: 'content.state', id: 'text', state: 'ready' },
      { type: 'status', status: 'Reviewed' },
    );
    expect(BriefSchema.safeParse(b).success).toBe(true);
  });

  it('logs notable changes with a timestamp', () => {
    const b = applyWithActivity(base, { type: 'page.add', label: 'Events' }, '2026-11-27T10:00:00Z', 'Amira');
    expect(b.activity.at(-1)).toEqual({ at: '2026-11-27T10:00:00Z', text: 'Amira: Added the Events page' });
  });

  it('rejects malformed edits at the schema', () => {
    expect(EditSchema.safeParse({ type: 'page.add', label: '' }).success).toBe(false);
    expect(EditSchema.safeParse({ type: 'drop-tables' }).success).toBe(false);
  });
});
