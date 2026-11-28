import type { Brief } from '@/lib/domain/brief';

/**
 * "Send to client" lives in the page's top bar, outside the editor's state. After a send it
 * broadcasts the fields the server changed (status, share link, activity) so the open editor can
 * show them straight away instead of after a reload.
 */
export const BRIEF_SENT_EVENT = 'kickoff:brief-sent';

export interface BriefSentDetail {
  id: string;
  fields: Pick<Brief, 'status' | 'share' | 'activity'>;
}

export function announceBriefSent(detail: BriefSentDetail): void {
  window.dispatchEvent(new CustomEvent<BriefSentDetail>(BRIEF_SENT_EVENT, { detail }));
}

/** Merges the sent fields into the editor's copy if the event is for this brief. */
export function mergeSent(brief: Brief, detail: BriefSentDetail): Brief {
  return detail.id === brief.id ? { ...brief, ...detail.fields } : brief;
}
