import { resolve } from 'node:path';
import { BlobStore } from './blob';
import { FileStore } from './file';
import type { Store } from './types';

export type { Store, StoredBytes } from './types';

type Shared = { store?: Store };
const shared: Shared = ((globalThis as { __kickoffStore?: Shared }).__kickoffStore ??= {});

/**
 * One store per process: private Vercel Blob when BLOB_READ_WRITE_TOKEN is set, otherwise a local
 * folder (./storage, or KICKOFF_STORAGE_DIR). On Vercel a token is required, because the
 * filesystem there does not persist between requests.
 */
export function getStore(): Store {
  if (shared.store) return shared.store;
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (token) shared.store = new BlobStore(token);
  else if (process.env.VERCEL) throw new Error('Set BLOB_READ_WRITE_TOKEN: Vercel has no persistent disk.');
  else shared.store = new FileStore(process.env.KICKOFF_STORAGE_DIR ?? resolve(process.cwd(), 'storage'));
  return shared.store;
}

/** Tests swap in a memory store. */
export function setStore(store: Store | undefined): void {
  shared.store = store;
}
