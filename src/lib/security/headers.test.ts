import { describe, expect, it } from 'vitest';
import { PRIVATE_ROUTE_HEADERS, contentSecurityPolicy, securityHeaders } from './headers';

const get = (dev: boolean, key: string) => securityHeaders(dev).find((h) => h.key === key)?.value;

describe('content security policy', () => {
  it('locks framing, objects and base URIs in production', () => {
    const csp = contentSecurityPolicy(false);
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain('upgrade-insecure-requests');
    expect(csp).not.toContain('unsafe-eval');
  });

  it('only connects back to its own origin', () => {
    expect(contentSecurityPolicy(false)).toContain("connect-src 'self';");
  });

  it('allows eval and websockets only in development for hot reload', () => {
    const dev = contentSecurityPolicy(true);
    expect(dev).toContain("'unsafe-eval'");
    expect(dev).toContain('ws:');
    expect(dev).not.toContain('upgrade-insecure-requests');
  });
});

describe('security headers', () => {
  it('sends HSTS in production only', () => {
    expect(get(false, 'Strict-Transport-Security')).toMatch(/max-age=63072000/);
    expect(get(true, 'Strict-Transport-Security')).toBeUndefined();
  });

  it('denies framing and sniffing', () => {
    expect(get(false, 'X-Frame-Options')).toBe('DENY');
    expect(get(false, 'X-Content-Type-Options')).toBe('nosniff');
  });

  it('keeps private routes out of search engines, referrers and caches', () => {
    const keys = Object.fromEntries(PRIVATE_ROUTE_HEADERS.map((h) => [h.key, h.value]));
    expect(keys['X-Robots-Tag']).toMatch(/noindex/);
    expect(keys['Referrer-Policy']).toBe('no-referrer');
    expect(keys['Cache-Control']).toMatch(/no-store/);
  });
});
