/**
 * Response headers applied to every route. The content security policy keeps everything
 * same-origin: fonts are self-hosted by next/font, the logo is served by our own API, and the
 * only third parties (Gemini, Resend, Vercel Blob) are called from the server, never the browser.
 *
 * Scripts allow 'unsafe-inline' because Next.js streams inline bootstrap scripts and we inline the
 * no-flash theme script; nothing user-supplied is ever rendered as HTML, and object/base/frame
 * sources are locked down.
 */
export function contentSecurityPolicy(dev = false): string {
  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", ...(dev ? ["'unsafe-eval'"] : [])],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'blob:'],
    'font-src': ["'self'"],
    'connect-src': ["'self'", ...(dev ? ['ws:'] : [])],
    'frame-ancestors': ["'none'"],
    'form-action': ["'self'"],
    'base-uri': ["'self'"],
    'object-src': ["'none'"],
  };
  const policy = Object.entries(directives).map(([k, v]) => `${k} ${v.join(' ')}`);
  if (!dev) policy.push('upgrade-insecure-requests');
  return policy.join('; ');
}

export function securityHeaders(dev = false): { key: string; value: string }[] {
  return [
    { key: 'Content-Security-Policy', value: contentSecurityPolicy(dev) },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
    { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
    ...(dev
      ? []
      : [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }]),
  ];
}

/** Share links and intake drafts are bearer secrets in the URL: keep them out of search and referrers. */
export const PRIVATE_ROUTE_HEADERS = [
  { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
  { key: 'Referrer-Policy', value: 'no-referrer' },
  { key: 'Cache-Control', value: 'private, no-store' },
];
