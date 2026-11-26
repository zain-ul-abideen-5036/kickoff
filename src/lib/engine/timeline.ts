import type { Phase } from '@/lib/domain/brief';
import type { IntakeAnswers } from '@/lib/domain/intake';
import type { Settings } from '@/lib/domain/settings';

/** Rounds up to the nearest half week, the unit the schedule is drawn in. */
export const toHalfWeeks = (w: number) => Math.ceil(w * 2 - 1e-9) / 2;

/**
 * Builds the phased timeline from the agency's defaults, then stretches it by rule:
 * - Build grows by `extraWeeksPer5Pages` for every 5 pages (or part) beyond 7.
 * - An online shop adds a week to Build.
 * - Photos that aren't ready add half a week to Content and QA.
 */
export function buildTimeline(a: IntakeAnswers, pages: number, timeline: Settings['timeline']): Phase[] {
  const phases: Phase[] = timeline.phases.map((p) => ({
    id: p.id,
    name: p.name,
    weeks: toHalfWeeks(p.weeks),
  }));
  const bump = (id: string, weeks: number) => {
    const p = phases.find((x) => x.id === id);
    if (p && weeks > 0) p.weeks = toHalfWeeks(p.weeks + weeks);
  };

  const extraPages = Math.max(0, pages - 7);
  bump('build', Math.ceil(extraPages / 5) * timeline.extraWeeksPer5Pages);
  if (a.features.features.includes('shop')) bump('build', 1);
  if (a.content.photos !== 'ready') bump('content', 0.5);
  return phases;
}

export function totalWeeks(phases: Phase[]): number {
  return phases.reduce((s, p) => s + p.weeks, 0);
}

/** Where each phase starts and ends, in weeks from kickoff, for drawing the schedule. */
export function phaseSpans(phases: Phase[]): { id: string; start: number; end: number }[] {
  let t = 0;
  return phases.map((p) => {
    const start = t;
    t += p.weeks;
    return { id: p.id, start, end: t };
  });
}
