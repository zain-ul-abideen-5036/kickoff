import type { Store } from '@/lib/store';
import { hashPassword, verifyPassword } from './password';

/** The studio owner: one account per Kickoff deployment. */
export interface Owner {
  email: string;
  name: string;
  passwordHash: string;
  /** Bumped on password change so old sessions stop working. */
  sessionVersion: number;
  createdAt: string;
}

const KEY = 'auth/owner.json';

export async function getOwner(store: Store): Promise<Owner | null> {
  return store.getJSON<Owner>(KEY);
}

export async function createOwner(
  store: Store,
  input: { email: string; name: string; password: string },
  now = new Date(),
): Promise<Owner> {
  if (await getOwner(store)) throw new Error('This studio already has an owner.');
  const owner: Owner = {
    email: input.email.trim().toLowerCase(),
    name: input.name.trim(),
    passwordHash: await hashPassword(input.password),
    sessionVersion: 1,
    createdAt: now.toISOString(),
  };
  await store.putJSON(KEY, owner);
  return owner;
}

/** Checks email and password. Always runs the hash so timing doesn't reveal the email. */
export async function checkCredentials(store: Store, email: string, password: string): Promise<Owner | null> {
  const owner = await getOwner(store);
  const hash =
    owner?.passwordHash ?? 'scrypt$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
  const ok = await verifyPassword(password, hash);
  if (!owner || !ok || owner.email !== email.trim().toLowerCase()) return null;
  return owner;
}

export async function changePassword(store: Store, owner: Owner, password: string): Promise<Owner> {
  const next = {
    ...owner,
    passwordHash: await hashPassword(password),
    sessionVersion: owner.sessionVersion + 1,
  };
  await store.putJSON(KEY, next);
  return next;
}
