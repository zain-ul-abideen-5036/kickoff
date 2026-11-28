import { LIMITS, clientKey, hit } from './rate-limit';

/**
 * Abuse protection for the public intake. Everything a stranger can call goes through here:
 * per-address rate limits, plus the hidden trap field that only bots fill in.
 */

export type GuardKind = 'start' | 'draft' | 'submit';

const LIMIT_FOR = {
  start: { max: 20, windowMs: 60 * 60_000 },
  draft: LIMITS.draft,
  submit: LIMITS.submit,
} as const;

export type Guard = { ok: true } | { ok: false; message: string };

function minutes(ms: number) {
  const m = Math.max(1, Math.ceil(ms / 60_000));
  return `${m} minute${m === 1 ? '' : 's'}`;
}

export function guard(kind: GuardKind, headers: Headers, now = Date.now()): Guard {
  const r = hit(`intake-${kind}:${clientKey(headers)}`, LIMIT_FOR[kind], now);
  if (r.ok) return { ok: true };
  return {
    ok: false,
    message:
      kind === 'submit'
        ? `We’ve had a lot of briefs from this connection. Please try again in ${minutes(r.retryAfterMs)}.`
        : `Things are busy right now. Your answers are safe; please try again in ${minutes(r.retryAfterMs)}.`,
  };
}

/** The review step has a field people can't see. Anything typed into it means a bot. */
export function trapped(trap: unknown): boolean {
  return typeof trap === 'string' && trap.trim().length > 0;
}
