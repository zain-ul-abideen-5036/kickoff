/**
 * A small fixed-window rate limiter kept in process memory. On serverless it limits per
 * instance, which is enough to blunt password guessing and form spam on a single-studio app.
 */
type Window = { count: number; resetAt: number };

const buckets = ((globalThis as { __kickoffRate?: Map<string, Window> }).__kickoffRate ??= new Map());

export interface Limit {
  /** Requests allowed per window. */
  max: number;
  windowMs: number;
}

export const LIMITS = {
  login: { max: 8, windowMs: 15 * 60_000 },
  setup: { max: 5, windowMs: 15 * 60_000 },
  draft: { max: 120, windowMs: 10 * 60_000 },
  submit: { max: 6, windowMs: 60 * 60_000 },
  share: { max: 60, windowMs: 10 * 60_000 },
} satisfies Record<string, Limit>;

export function hit(key: string, limit: Limit, now = Date.now()): { ok: boolean; retryAfterMs: number } {
  if (buckets.size > 10_000) {
    for (const [k, w] of buckets) if (w.resetAt <= now) buckets.delete(k);
  }
  const w = buckets.get(key);
  if (!w || w.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + limit.windowMs });
    return { ok: true, retryAfterMs: 0 };
  }
  w.count += 1;
  return w.count <= limit.max ? { ok: true, retryAfterMs: 0 } : { ok: false, retryAfterMs: w.resetAt - now };
}

export function resetRateLimits(): void {
  buckets.clear();
}

/** The client address as reported by Vercel's proxy, or a placeholder in development. */
export function clientKey(headers: Headers): string {
  const fwd = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return fwd || headers.get('x-real-ip') || 'local';
}
