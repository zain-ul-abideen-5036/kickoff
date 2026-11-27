import { z } from 'zod';
import { PRIORITIES, STATUSES, type Brief, type Priority } from '@/lib/domain/brief';

/**
 * Every change the editor can make, as plain data. The browser applies an edit at once for a
 * snappy feel; the server validates the same edit and applies it with the same function, so the
 * saved brief always matches what the studio saw.
 */
const id = z.string().min(1).max(40);
const short = z.string().trim().max(80);
const long = z.string().trim().max(1200);
const line = z.string().trim().max(400);

export const EditSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('summary'), value: long }),
  z.object({ type: z.literal('goal.set'), index: z.number().int().min(0).max(5), goal: line, measure: line }),
  z.object({ type: z.literal('goal.add') }),
  z.object({ type: z.literal('goal.remove'), index: z.number().int().min(0).max(5) }),
  z.object({
    type: z.literal('audience.set'),
    index: z.number().int().min(0).max(3),
    name: short,
    tag: z.string().trim().max(40),
    description: line,
    needs: z.array(z.string().trim().max(120)).max(6),
  }),
  z.object({ type: z.literal('page.add'), label: z.string().trim().min(1).max(60) }),
  z.object({ type: z.literal('page.rename'), id, label: z.string().trim().min(1).max(60) }),
  z.object({ type: z.literal('page.move'), id, to: z.number().int().min(0).max(40) }),
  z.object({ type: z.literal('page.remove'), id }),
  z.object({ type: z.literal('feature.move'), id, priority: z.enum(PRIORITIES) }),
  z.object({
    type: z.literal('feature.add'),
    label: z.string().trim().min(1).max(80),
    priority: z.enum(PRIORITIES),
  }),
  z.object({ type: z.literal('feature.remove'), id }),
  z.object({ type: z.literal('platform.set'), label: short, reasons: z.array(line).max(5) }),
  z.object({ type: z.literal('content.state'), id, state: z.enum(['ready', 'missing', 'collect']) }),
  z.object({ type: z.literal('phase.weeks'), id, weeks: z.number().min(0.5).max(26) }),
  z.object({ type: z.literal('risk.set'), id, title: line, detail: line }),
  z.object({ type: z.literal('risk.add') }),
  z.object({ type: z.literal('risk.remove'), id }),
  z.object({ type: z.literal('question.set'), index: z.number().int().min(0).max(9), value: line }),
  z.object({ type: z.literal('question.add') }),
  z.object({ type: z.literal('question.remove'), index: z.number().int().min(0).max(9) }),
  z.object({ type: z.literal('status'), status: z.enum(STATUSES) }),
]);
export type Edit = z.infer<typeof EditSchema>;

export class EditError extends Error {}

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30) || 'page';

function uniqueId(base: string, taken: string[]): string {
  let id = base;
  for (let n = 2; taken.includes(id); n++) id = `${base}-${n}`;
  return id;
}

/** The Pages quote line always prices one page per sitemap page. */
export function syncPagesLine(brief: Brief): Brief {
  const qty = brief.pages.length;
  if (!brief.quote.lines.some((l) => l.id === 'pages' && l.qty !== qty)) return brief;
  return {
    ...brief,
    quote: { ...brief.quote, lines: brief.quote.lines.map((l) => (l.id === 'pages' ? { ...l, qty } : l)) },
  };
}

const half = (w: number) => Math.round(w * 2) / 2;

export interface Applied {
  brief: Brief;
  /** A line for the activity log, for changes worth recording. */
  activity?: string;
}

/** Applies one edit. Throws EditError for edits that refer to things that don't exist. */
export function applyEdit(brief: Brief, edit: Edit): Applied {
  const b = brief;
  switch (edit.type) {
    case 'summary':
      return { brief: { ...b, summary: edit.value } };
    case 'goal.set': {
      if (!b.goals[edit.index]) throw new EditError('Goal not found');
      const goals = b.goals.map((g, i) =>
        i === edit.index ? { goal: edit.goal, measure: edit.measure } : g,
      );
      return { brief: { ...b, goals } };
    }
    case 'goal.add':
      if (b.goals.length >= 6) throw new EditError('Up to six goals');
      return {
        brief: { ...b, goals: [...b.goals, { goal: 'New goal', measure: 'How we will measure it' }] },
      };
    case 'goal.remove':
      return { brief: { ...b, goals: b.goals.filter((_, i) => i !== edit.index) } };
    case 'audience.set': {
      if (!b.audience[edit.index]) throw new EditError('Profile not found');
      const { name, tag, description, needs } = edit;
      const audience = b.audience.map((p, i) => (i === edit.index ? { name, tag, description, needs } : p));
      return { brief: { ...b, audience } };
    }
    case 'page.add': {
      if (b.pages.length >= 40) throw new EditError('Up to 40 pages');
      const pid = uniqueId(
        slug(edit.label),
        b.pages.map((p) => p.id),
      );
      const page = { id: pid, label: edit.label, sections: [] };
      // New pages go before About and Contact, which conventionally close a sitemap.
      const tail = b.pages.findIndex((p) => p.id === 'about' || p.id === 'contact');
      const at = tail === -1 ? b.pages.length : tail;
      const pages = [...b.pages.slice(0, at), page, ...b.pages.slice(at)];
      return { brief: syncPagesLine({ ...b, pages }), activity: `Added the ${edit.label} page` };
    }
    case 'page.rename': {
      if (!b.pages.some((p) => p.id === edit.id)) throw new EditError('Page not found');
      return {
        brief: { ...b, pages: b.pages.map((p) => (p.id === edit.id ? { ...p, label: edit.label } : p)) },
      };
    }
    case 'page.move': {
      const from = b.pages.findIndex((p) => p.id === edit.id);
      if (from === -1) throw new EditError('Page not found');
      if (from === 0) throw new EditError('Home stays first');
      const to = Math.max(1, Math.min(b.pages.length - 1, edit.to));
      const pages = [...b.pages];
      const [moved] = pages.splice(from, 1);
      pages.splice(to, 0, moved!);
      return { brief: { ...b, pages } };
    }
    case 'page.remove': {
      const page = b.pages.find((p) => p.id === edit.id);
      if (!page) throw new EditError('Page not found');
      if (page.id === 'home') throw new EditError('Home can’t be removed');
      const pages = b.pages.filter((p) => p.id !== edit.id);
      return { brief: syncPagesLine({ ...b, pages }), activity: `Removed the ${page.label} page` };
    }
    case 'feature.move': {
      const f = b.features.find((x) => x.id === edit.id);
      if (!f) throw new EditError('Feature not found');
      if (f.priority === edit.priority) return { brief: b };
      const rest = b.features.filter((x) => x.id !== edit.id);
      const features = [...rest, { ...f, priority: edit.priority }];
      return {
        brief: { ...b, features: orderFeatures(features) },
        activity: `Moved ${f.label} to ${edit.priority}`,
      };
    }
    case 'feature.add': {
      const fid = uniqueId(
        slug(edit.label),
        b.features.map((f) => f.id),
      );
      const features = orderFeatures([
        ...b.features,
        { id: fid, label: edit.label, priority: edit.priority },
      ]);
      return { brief: { ...b, features }, activity: `Added ${edit.label} as ${edit.priority}` };
    }
    case 'feature.remove':
      return { brief: { ...b, features: b.features.filter((f) => f.id !== edit.id) } };
    case 'platform.set':
      return { brief: { ...b, platform: { ...b.platform, label: edit.label, reasons: edit.reasons } } };
    case 'content.state': {
      if (!b.content.some((c) => c.id === edit.id)) throw new EditError('Item not found');
      return {
        brief: { ...b, content: b.content.map((c) => (c.id === edit.id ? { ...c, state: edit.state } : c)) },
      };
    }
    case 'phase.weeks': {
      const p = b.phases.find((x) => x.id === edit.id);
      if (!p) throw new EditError('Phase not found');
      const weeks = Math.max(0.5, half(edit.weeks));
      return {
        brief: { ...b, phases: b.phases.map((x) => (x.id === edit.id ? { ...x, weeks } : x)) },
        activity: `${p.name} set to ${weeks} ${weeks === 1 ? 'week' : 'weeks'}`,
      };
    }
    case 'risk.set':
      if (!b.risks.some((r) => r.id === edit.id)) throw new EditError('Risk not found');
      return {
        brief: {
          ...b,
          risks: b.risks.map((r) =>
            r.id === edit.id ? { ...r, title: edit.title, detail: edit.detail } : r,
          ),
        },
      };
    case 'risk.add': {
      if (b.risks.length >= 10) throw new EditError('Up to ten risks');
      const rid = uniqueId(
        'risk',
        b.risks.map((r) => r.id),
      );
      return {
        brief: {
          ...b,
          risks: [...b.risks, { id: rid, title: 'New risk.', detail: 'What we will do about it.' }],
        },
      };
    }
    case 'risk.remove':
      return { brief: { ...b, risks: b.risks.filter((r) => r.id !== edit.id) } };
    case 'question.set': {
      if (b.questions[edit.index] === undefined) throw new EditError('Question not found');
      return { brief: { ...b, questions: b.questions.map((q, i) => (i === edit.index ? edit.value : q)) } };
    }
    case 'question.add':
      if (b.questions.length >= 10) throw new EditError('Up to ten questions');
      return { brief: { ...b, questions: [...b.questions, 'New question for the kickoff call'] } };
    case 'question.remove':
      return { brief: { ...b, questions: b.questions.filter((_, i) => i !== edit.index) } };
    case 'status':
      if (b.status === edit.status) return { brief: b };
      return { brief: { ...b, status: edit.status }, activity: `Status changed to ${edit.status}` };
  }
}

const RANK: Record<Priority, number> = { Must: 0, Should: 1, Could: 2 };
/** Keeps Must, Should, Could grouped while preserving order within each group. */
function orderFeatures(list: Brief['features']): Brief['features'] {
  return list
    .map((f, i) => ({ f, i }))
    .sort((a, b) => RANK[a.f.priority] - RANK[b.f.priority] || a.i - b.i)
    .map((x) => x.f);
}

/** Applies an edit and records it in the activity log with a timestamp. */
export function applyWithActivity(brief: Brief, edit: Edit, at: string, who = 'You'): Brief {
  const { brief: next, activity } = applyEdit(brief, edit);
  if (!activity) return next;
  return { ...next, activity: [...next.activity, { at, text: `${who}: ${activity}` }].slice(-500) };
}
