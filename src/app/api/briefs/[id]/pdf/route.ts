import { getBrief } from '@/lib/repo/briefs-repo';
import { loadSettings } from '@/lib/repo/settings-repo';
import { notFound, pdfResponse } from '@/lib/pdf/serve';
import { getSessionOwner } from '@/lib/server/context';
import { getStore } from '@/lib/store';

export const runtime = 'nodejs';

/** The brief as a PDF, for the signed-in studio owner. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSessionOwner())) return new Response('Sign in to download this brief.', { status: 401 });
  const { id } = await params;
  const store = getStore();
  const brief = await getBrief(store, id);
  if (!brief) return notFound();
  return pdfResponse(store, brief, await loadSettings(store));
}
