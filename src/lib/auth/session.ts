import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Stateless signed session cookies: base64url(JSON payload) + "." + HMAC-SHA256 signature.
 * `v` is the owner's session version; changing the password bumps it and signs everyone out.
 */
export interface SessionPayload {
  sub: string;
  v: number;
  exp: number;
}

export const SESSION_COOKIE = 'kickoff_session';
export const SESSION_DAYS = 14;

const sign = (data: string, secret: string) => createHmac('sha256', secret).update(data).digest('base64url');

export function createSessionToken(
  sub: string,
  version: number,
  secret: string,
  now = Date.now(),
  days = SESSION_DAYS,
): string {
  const payload: SessionPayload = { sub, v: version, exp: now + days * 86_400_000 };
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${data}.${sign(data, secret)}`;
}

/** Returns the payload only if the signature is valid and the session hasn't expired. */
export function readSessionToken(token: string | undefined, secret: string, now = Date.now()) {
  if (!token || token.length > 2000) return null;
  const [data, sig] = token.split('.');
  if (!data || !sig) return null;
  const expected = Buffer.from(sign(data, secret));
  const actual = Buffer.from(sig);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  try {
    const p = JSON.parse(Buffer.from(data, 'base64url').toString()) as SessionPayload;
    if (typeof p.sub !== 'string' || typeof p.v !== 'number' || typeof p.exp !== 'number') return null;
    return p.exp > now ? p : null;
  } catch {
    return null;
  }
}

const DEV_SECRET = 'kickoff-development-secret-do-not-use-in-production';

/**
 * SESSION_SECRET is required in production. Locally a fixed development secret keeps the app
 * working with no setup.
 */
export function sessionSecret(env: Record<string, string | undefined> = process.env): string {
  const s = env.SESSION_SECRET;
  if (s && s.length >= 32) return s;
  if (env.NODE_ENV === 'production' && env.VERCEL)
    throw new Error('Set SESSION_SECRET to at least 32 random characters.');
  return DEV_SECRET;
}
