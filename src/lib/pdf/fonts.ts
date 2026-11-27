import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

/** The brand fonts as raw bytes. Files live in src/lib/pdf/fonts and ship with the PDF routes. */
export interface FontBytes {
  serif: Uint8Array;
  sans: Uint8Array;
  sansBold: Uint8Array;
  mono: Uint8Array;
}

const FILES: Record<keyof FontBytes, string> = {
  serif: 'Fraunces-Regular.ttf',
  sans: 'Geist-Regular.ttf',
  sansBold: 'Geist-SemiBold.ttf',
  mono: 'GeistMono-Regular.ttf',
};

/** Resolved from the project root, which is the working directory locally and on Vercel. */
export const FONT_DIR = resolve(process.cwd(), 'src/lib/pdf/fonts');

let cached: Promise<FontBytes> | undefined;

export function loadFonts(): Promise<FontBytes> {
  cached ??= (async () => {
    const entries = await Promise.all(
      (Object.keys(FILES) as (keyof FontBytes)[]).map(
        async (k) => [k, new Uint8Array(await readFile(resolve(FONT_DIR, FILES[k])))] as const,
      ),
    );
    return Object.fromEntries(entries) as unknown as FontBytes;
  })();
  return cached;
}
