import { assertKey, type Store, type StoredBytes } from './types';

/** An in-memory store for tests. JSON is copied in and out, like a real store would. */
export class MemoryStore implements Store {
  readonly kind = 'memory' as const;
  private readonly data = new Map<string, StoredBytes>();

  async getJSON<T>(key: string): Promise<T | null> {
    const hit = this.data.get(assertKey(key));
    return hit ? (JSON.parse(new TextDecoder().decode(hit.bytes)) as T) : null;
  }

  async putJSON(key: string, value: unknown): Promise<void> {
    const bytes = new TextEncoder().encode(JSON.stringify(value));
    this.data.set(assertKey(key), { bytes, contentType: 'application/json' });
  }

  async getBytes(key: string): Promise<StoredBytes | null> {
    const hit = this.data.get(assertKey(key));
    return hit ? { bytes: hit.bytes.slice(), contentType: hit.contentType } : null;
  }

  async putBytes(key: string, bytes: Uint8Array, contentType: string): Promise<void> {
    this.data.set(assertKey(key), { bytes: bytes.slice(), contentType });
  }

  async list(prefix: string): Promise<string[]> {
    return [...this.data.keys()].filter((k) => k.startsWith(prefix)).sort();
  }

  async delete(key: string): Promise<void> {
    this.data.delete(assertKey(key));
  }
}
