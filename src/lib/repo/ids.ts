import { createHash, randomBytes } from 'node:crypto';

/** Short url-safe ids for briefs and drafts (16 random bytes, ~128 bits). */
export function newId(): string {
  return randomBytes(16).toString('base64url');
}

/** Share tokens are long and random so links can't be guessed (32 bytes, 256 bits). */
export function newToken(): string {
  return randomBytes(32).toString('base64url');
}

/** Tokens are stored only as hashes in the lookup index, so a storage leak doesn't leak links. */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

const ID = /^[A-Za-z0-9_-]{8,64}$/;
export function isId(v: unknown): v is string {
  return typeof v === 'string' && ID.test(v);
}
