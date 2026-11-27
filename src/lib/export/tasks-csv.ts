import type { Brief, Priority } from '@/lib/domain/brief';
import { phaseSpans } from '@/lib/engine/timeline';

export interface Task {
  name: string;
  description: string;
  section: string;
  dueWeek: number;
  labels: string;
  priority: Priority;
}

export const CSV_HEADERS = ['Name', 'Description', 'Section', 'Due week', 'Labels', 'Priority'] as const;

/** Spreadsheet apps run cells starting with these as formulas; an apostrophe makes them text. */
const FORMULA = /^[=+\-@\t\r]/;

export function csvCell(value: string | number): string {
  let s = String(value);
  if (FORMULA.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: (string | number)[][]): string {
  return rows.map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n';
}

/**
 * Turns a brief into import-ready tasks for Trello or Asana: a milestone per phase, then one
 * task per page, per feature and per piece of content still to collect, grouped by phase.
 */
export function briefTasks(brief: Brief): Task[] {
  const spans = phaseSpans(brief.phases);
  const due = (id: string) => Math.max(1, Math.ceil(spans.find((s) => s.id === id)?.end ?? 1));
  const name = (id: string) => brief.phases.find((p) => p.id === id)?.name ?? id;
  const tasks: Task[] = [];
  const byPhase = (id: string, list: Omit<Task, 'section' | 'dueWeek'>[]) =>
    list.forEach((t) => tasks.push({ ...t, section: name(id), dueWeek: due(id) }));

  for (const p of brief.phases) {
    const extra: Omit<Task, 'section' | 'dueWeek'>[] = [];
    if (p.id === 'discovery')
      extra.push({
        name: 'Kickoff call',
        description: brief.questions.length
          ? `Questions to answer:\n${brief.questions.map((q) => `- ${q}`).join('\n')}`
          : 'Confirm goals, content and sign-off.',
        labels: 'Milestone',
        priority: 'Must',
      });
    if (p.id === 'content')
      for (const c of brief.content.filter((x) => x.state !== 'ready'))
        extra.push({
          name: `Collect: ${c.label}`,
          description: c.note || `From ${brief.answers.about.name}`,
          labels: 'Content',
          priority: 'Must',
        });
    if (p.id === 'build') {
      for (const pg of brief.pages)
        extra.push({
          name: `Build page: ${pg.label}`,
          description: pg.sections.length ? `Sections: ${pg.sections.join(', ')}` : '',
          labels: 'Page',
          priority: 'Must',
        });
      for (const f of brief.features)
        extra.push({
          name: `Feature: ${f.label}`,
          description: f.priority === 'Could' ? 'Optional extra: confirm with the client first.' : '',
          labels: `Feature, ${f.priority}`,
          priority: f.priority,
        });
    }
    byPhase(p.id, [
      {
        name: `${p.name} (${p.weeks} ${p.weeks === 1 ? 'week' : 'weeks'})`,
        description: `Phase ends in week ${due(p.id)} of ${brief.ref}.`,
        labels: 'Phase',
        priority: 'Must',
      },
      ...extra,
    ]);
  }
  return tasks;
}

export function tasksCsv(brief: Brief): string {
  return toCsv([
    [...CSV_HEADERS],
    ...briefTasks(brief).map((t) => [t.name, t.description, t.section, t.dueWeek, t.labels, t.priority]),
  ]);
}
