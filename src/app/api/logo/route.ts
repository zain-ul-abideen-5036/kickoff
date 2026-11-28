import { loadSettings } from '@/lib/repo/settings-repo';
import { isLogoKey } from '@/lib/settings/logo';
import { getStore } from '@/lib/store';

export const runtime = 'nodejs';

/**
 * The agency logo. Public, because it appears on the client intake and shared briefs. The URL
 * carries the storage key as a version, so a new upload is fetched straight away.
 */
export async function GET() {
  const store = getStore();
  const { agency } = await loadSettings(store);
  if (!isLogoKey(agency.logoKey)) return new Response('No logo', { status: 404 });
  const hit = await store.getBytes(agency.logoKey);
  if (!hit || !/^image\/(png|jpeg|webp)$/.test(hit.contentType))
    return new Response('No logo', { status: 404 });
  return new Response(Buffer.from(hit.bytes), {
    headers: {
      'content-type': hit.contentType,
      'cache-control': 'public, max-age=300',
      'x-content-type-options': 'nosniff',
      'content-security-policy': "default-src 'none'",
    },
  });
}
