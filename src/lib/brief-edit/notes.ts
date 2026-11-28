import type { Brief } from '@/lib/domain/brief';

export const MAX_NOTE = 400;

export class NoteError extends Error {}

/** Adds a team-only note, newest last. Notes never appear on the client's shared view or PDF. */
export function addNote(brief: Brief, text: string, author: string, at: string, id: string): Brief {
  const clean = text.replace(/\s+\n/g, '\n').trim();
  if (!clean) throw new NoteError('Write something first.');
  if (clean.length > MAX_NOTE) throw new NoteError(`Keep notes under ${MAX_NOTE} characters.`);
  const note = { id, author: author.slice(0, 80), at, text: clean };
  return { ...brief, notes: [...brief.notes, note].slice(-200) };
}

export function removeNote(brief: Brief, id: string): Brief {
  return { ...brief, notes: brief.notes.filter((n) => n.id !== id) };
}

/** "just now", "5 min ago", "3 h ago", "yesterday", or a date. */
export function relativeTime(iso: string, now = new Date()): string {
  const s = Math.max(0, (now.getTime() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86_400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 172_800) return 'yesterday';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

/** Newest first, capped for the rail. */
export function recentActivity(brief: Brief, limit = 8) {
  return [...brief.activity].reverse().slice(0, limit);
}
