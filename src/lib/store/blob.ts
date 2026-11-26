import { BlobNotFoundError, del, get, list, put } from '@vercel/blob';
import { assertKey, type Store, type StoredBytes } from './types';

/**
 * Private Vercel Blob storage. Blobs are never publicly readable; reads skip the CDN cache so the
 * dashboard always shows the latest save. Keys map one-to-one to blob pathnames.
 */
export class BlobStore implements Store {
  readonly kind = 'blob' as const;

  constructor(
    private readonly token: string,
    private readonly prefix = 'kickoff/',
  ) {}

  private path(key: string) {
    return this.prefix + assertKey(key);
  }

  async getJSON<T>(key: string): Promise<T | null> {
    const hit = await this.getBytes(key);
    return hit ? (JSON.parse(new TextDecoder().decode(hit.bytes)) as T) : null;
  }

  async putJSON(key: string, value: unknown): Promise<void> {
    await this.putBytes(key, new TextEncoder().encode(JSON.stringify(value)), 'application/json');
  }

  async getBytes(key: string): Promise<StoredBytes | null> {
    try {
      const res = await get(this.path(key), { access: 'private', useCache: false, token: this.token });
      if (!res || res.statusCode !== 200) return null;
      const bytes = new Uint8Array(await new Response(res.stream).arrayBuffer());
      return { bytes, contentType: res.blob.contentType };
    } catch (e) {
      if (e instanceof BlobNotFoundError) return null;
      throw e;
    }
  }

  async putBytes(key: string, bytes: Uint8Array, contentType: string): Promise<void> {
    await put(this.path(key), Buffer.from(bytes), {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType,
      cacheControlMaxAge: 60,
      token: this.token,
    });
  }

  async list(prefix: string): Promise<string[]> {
    const keys: string[] = [];
    let cursor: string | undefined;
    do {
      const page = await list({ prefix: this.prefix + prefix, cursor, limit: 1000, token: this.token });
      for (const b of page.blobs) keys.push(b.pathname.slice(this.prefix.length));
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
    return keys.sort();
  }

  async delete(key: string): Promise<void> {
    await del(this.path(key), { token: this.token });
  }
}
