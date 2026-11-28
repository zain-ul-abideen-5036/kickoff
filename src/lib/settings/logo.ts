/** Logo uploads: small raster images only, checked by their bytes, not their name. */

export const MAX_LOGO_BYTES = 256 * 1024;

export type LogoType = {
  contentType: 'image/png' | 'image/jpeg' | 'image/webp';
  ext: 'png' | 'jpg' | 'webp';
};

/** Detects PNG, JPEG or WebP from the file's first bytes. SVG is refused: it can carry scripts. */
export function sniffImage(bytes: Uint8Array): LogoType | null {
  const b = bytes;
  if (
    b.length >= 8 &&
    b[0] === 0x89 &&
    b[1] === 0x50 &&
    b[2] === 0x4e &&
    b[3] === 0x47 &&
    b[4] === 0x0d &&
    b[5] === 0x0a
  )
    return { contentType: 'image/png', ext: 'png' };
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff)
    return { contentType: 'image/jpeg', ext: 'jpg' };
  if (
    b.length >= 12 &&
    String.fromCharCode(b[0]!, b[1]!, b[2]!, b[3]!) === 'RIFF' &&
    String.fromCharCode(b[8]!, b[9]!, b[10]!, b[11]!) === 'WEBP'
  )
    return { contentType: 'image/webp', ext: 'webp' };
  return null;
}

export function checkLogo(bytes: Uint8Array): { ok: true; type: LogoType } | { ok: false; error: string } {
  if (bytes.length === 0) return { ok: false, error: 'Choose an image to upload.' };
  if (bytes.length > MAX_LOGO_BYTES)
    return {
      ok: false,
      error: `That file is ${Math.ceil(bytes.length / 1024)} KB. Logos can be up to 256 KB.`,
    };
  const type = sniffImage(bytes);
  if (!type) return { ok: false, error: 'Upload a PNG, JPEG or WebP image.' };
  return { ok: true, type };
}

const LOGO_KEY = /^assets\/logo-[A-Za-z0-9_-]{8,64}\.(png|jpg|webp)$/;

/** Only keys we created can be served as the logo. */
export function isLogoKey(key: string | null | undefined): key is string {
  return !!key && LOGO_KEY.test(key);
}
