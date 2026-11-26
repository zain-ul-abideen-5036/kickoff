import { mkdir, readFile, readdir, rm, writeFile, rename } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { assertKey, type Store, type StoredBytes } from './types';

const TYPES: Record<string, string> = {
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
};

/** Stores files under a local folder. Used in development when no Blob token is set. */
export class FileStore implements Store {
  readonly kind = 'file' as const;
  private readonly root: string;

  constructor(root: string) {
    this.root = resolve(root);
  }

  private path(key: string): string {
    const p = resolve(this.root, assertKey(key));
    if (!p.startsWith(this.root + sep)) throw new Error('Storage key escapes the store');
    return p;
  }

  async getJSON<T>(key: string): Promise<T | null> {
    const hit = await this.getBytes(key);
    return hit ? (JSON.parse(new TextDecoder().decode(hit.bytes)) as T) : null;
  }

  async putJSON(key: string, value: unknown): Promise<void> {
    await this.putBytes(key, new TextEncoder().encode(JSON.stringify(value, null, 2)), 'application/json');
  }

  async getBytes(key: string): Promise<StoredBytes | null> {
    try {
      const bytes = new Uint8Array(await readFile(this.path(key)));
      const ext = key.slice(key.lastIndexOf('.')).toLowerCase();
      return { bytes, contentType: TYPES[ext] ?? 'application/octet-stream' };
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw e;
    }
  }

  /** Writes to a temp file then renames, so a crash never leaves half a file. */
  async putBytes(key: string, bytes: Uint8Array): Promise<void> {
    const p = this.path(key);
    await mkdir(dirname(p), { recursive: true });
    const tmp = `${p}.${process.pid}.${Date.now()}.tmp`;
    await writeFile(tmp, bytes);
    await rename(tmp, p);
  }

  async list(prefix: string): Promise<string[]> {
    const out: string[] = [];
    const walk = async (dir: string): Promise<void> => {
      let entries;
      try {
        entries = await readdir(dir, { withFileTypes: true });
      } catch {
        return;
      }
      for (const e of entries) {
        const full = join(dir, e.name);
        if (e.isDirectory()) await walk(full);
        else if (!e.name.endsWith('.tmp')) out.push(relative(this.root, full).split(sep).join('/'));
      }
    };
    await walk(this.root);
    return out.filter((k) => k.startsWith(prefix)).sort();
  }

  async delete(key: string): Promise<void> {
    await rm(this.path(key), { force: true });
  }
}
