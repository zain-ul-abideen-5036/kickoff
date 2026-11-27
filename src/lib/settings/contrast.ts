/** WCAG 2.2 contrast maths, used to keep agency colours readable. */

export const IVORY = '#F7F5EF';
export const AA = 4.5;

function channel(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function parseHex(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = Number.parseInt(m[1]!, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function luminance(hex: string): number {
  const rgb = parseHex(hex);
  if (!rgb) return 0;
  const [r, g, b] = rgb.map(channel) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Ratio from 1 to 21 between two colours. */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** Can ivory text sit on this brand colour (logo tile, PDF cover, buttons)? */
export function brandColorCheck(hex: string): { ok: boolean; ratio: number; message: string } {
  if (!parseHex(hex)) return { ok: false, ratio: 0, message: 'Use a six-digit hex colour, like #1F3B34.' };
  const ratio = Math.round(contrastRatio(IVORY, hex) * 10) / 10;
  return ratio >= AA
    ? { ok: true, ratio, message: `Ivory text on ${hex.toUpperCase()} is ${ratio}:1, which passes.` }
    : {
        ok: false,
        ratio,
        message: `Ivory text on ${hex.toUpperCase()} is only ${ratio}:1. Choose a darker colour (4.5:1 or more).`,
      };
}

/** Normalises "1f3b34" or "#1F3B34" to "#1F3B34", or null if it isn't a colour. */
export function normaliseHex(input: string): string | null {
  const rgb = parseHex(input);
  return rgb ? `#${input.trim().replace(/^#/, '').toUpperCase()}` : null;
}
