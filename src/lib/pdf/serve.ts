import type { Brief } from '@/lib/domain/brief';
import type { Settings } from '@/lib/domain/settings';
import type { Store } from '@/lib/store';
import { briefPdf, pdfFilename } from './brief-pdf';

/** Builds the PDF response, with the agency logo when one is uploaded. */
export async function pdfResponse(store: Store, brief: Brief, settings: Settings): Promise<Response> {
  const logo = settings.agency.logoKey ? await store.getBytes(settings.agency.logoKey) : null;
  const bytes = await briefPdf(brief, settings, { logo });
  return new Response(Buffer.from(bytes), {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `attachment; filename="${pdfFilename(brief.answers.about.business)}"`,
      'cache-control': 'private, no-store',
      'x-content-type-options': 'nosniff',
    },
  });
}

export function notFound(): Response {
  return new Response('Not found', { status: 404, headers: { 'cache-control': 'no-store' } });
}
