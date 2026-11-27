import { headers } from 'next/headers';
import { loadSettings } from '@/lib/repo/settings-repo';
import { openShare } from '@/lib/repo/share-service';
import { notFound, pdfResponse } from '@/lib/pdf/serve';
import { LIMITS, clientKey, hit } from '@/lib/server/rate-limit';
import { getStore } from '@/lib/store';

export const runtime = 'nodejs';

/** The shared brief as a PDF, for whoever holds a live share link. */
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  if (!hit(`share-pdf:${clientKey(await headers())}`, LIMITS.share).ok)
    return new Response('Too many requests. Try again shortly.', { status: 429 });
  const { token } = await params;
  const store = getStore();
  const shared = await openShare(store, token);
  if (shared.state !== 'ok') return notFound();
  return pdfResponse(store, shared.brief, await loadSettings(store));
}
