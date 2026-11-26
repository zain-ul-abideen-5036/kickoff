/**
 * Everything Kickoff saves goes through this interface: settings, briefs, intake drafts,
 * share-link records and logo uploads. Production uses private Vercel Blob storage;
 * development uses a local folder; tests use memory.
 */
export interface Store {
  readonly kind: 'blob' | 'file' | 'memory';
  getJSON<T>(key: string): Promise<T | null>;
  putJSON(key: string, value: unknown): Promise<void>;
  getBytes(key: string): Promise<StoredBytes | null>;
  putBytes(key: string, bytes: Uint8Array, contentType: string): Promise<void>;
  /** Keys under a prefix, sorted. */
  list(prefix: string): Promise<string[]>;
  delete(key: string): Promise<void>;
}

export interface StoredBytes {
  bytes: Uint8Array;
  contentType: string;
}

const KEY = /^[a-z0-9][a-z0-9/_.-]{0,199}$/i;

/** Keys are plain relative paths. Anything that could escape the store is refused. */
export function assertKey(key: string): string {
  if (!KEY.test(key) || key.includes('..') || key.includes('//') || key.endsWith('/'))
    throw new Error(`Invalid storage key: ${JSON.stringify(key)}`);
  return key;
}
