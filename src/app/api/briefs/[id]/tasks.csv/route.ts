import { tasksCsv } from '@/lib/export/tasks-csv';
import { pdfFilename } from '@/lib/pdf/brief-pdf';
import { getBrief } from '@/lib/repo/briefs-repo';
import { getSessionOwner } from '@/lib/server/context';
import { getStore } from '@/lib/store';

export const runtime = 'nodejs';

/** Tasks for Trello or Asana import, for the signed-in studio owner. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSessionOwner())) return new Response('Sign in to export tasks.', { status: 401 });
  const { id } = await params;
  const brief = await getBrief(getStore(), id);
  if (!brief) return new Response('Not found', { status: 404 });
  const name = pdfFilename(brief.answers.about.business).replace(/-brief\.pdf$/, '-tasks.csv');
  // A byte-order mark so Excel opens the £ signs and accents correctly.
  return new Response(`﻿${tasksCsv(brief)}`, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="${name}"`,
      'cache-control': 'private, no-store',
    },
  });
}
