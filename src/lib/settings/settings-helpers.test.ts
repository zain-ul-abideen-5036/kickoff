import { describe, expect, it } from 'vitest';
import { brandColorCheck, contrastRatio, normaliseHex } from './contrast';
import { MAX_LOGO_BYTES, checkLogo, isLogoKey, sniffImage } from './logo';

describe('contrast', () => {
  it('matches the WCAG reference values', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(contrastRatio('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5);
  });
  it('passes the Studio North forest and fails a pale colour', () => {
    expect(brandColorCheck('#1F3B34').ok).toBe(true);
    const pale = brandColorCheck('#B9853A');
    expect(pale.ok).toBe(false);
    expect(pale.message).toMatch(/Choose a darker colour/);
  });
  it('rejects non-colours', () => {
    expect(brandColorCheck('teal').ok).toBe(false);
  });
  it('normalises hex input', () => {
    expect(normaliseHex('1f3b34')).toBe('#1F3B34');
    expect(normaliseHex(' #aabbcc ')).toBe('#AABBCC');
    expect(normaliseHex('#abc')).toBeNull();
  });
});

const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
const jpg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0]);
const webp = new TextEncoder().encode('RIFF\0\0\0\0WEBPVP8 ');
const svg = new TextEncoder().encode(
  '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
);

describe('logo uploads', () => {
  it('recognises PNG, JPEG and WebP by their bytes', () => {
    expect(sniffImage(png)?.ext).toBe('png');
    expect(sniffImage(jpg)?.ext).toBe('jpg');
    expect(sniffImage(webp)?.ext).toBe('webp');
  });
  it('refuses SVG and other files', () => {
    expect(checkLogo(svg)).toMatchObject({ ok: false, error: 'Upload a PNG, JPEG or WebP image.' });
  });
  it('refuses empty and oversized files', () => {
    expect(checkLogo(new Uint8Array())).toMatchObject({ ok: false });
    const big = new Uint8Array(MAX_LOGO_BYTES + 1);
    big.set(png);
    expect(checkLogo(big)).toMatchObject({ ok: false, error: expect.stringMatching(/up to 256 KB/) });
  });
  it('only serves keys it created', () => {
    expect(isLogoKey('assets/logo-AbC123xyz_.png')).toBe(true);
    expect(isLogoKey('settings.json')).toBe(false);
    expect(isLogoKey('assets/logo-../../x.png')).toBe(false);
    expect(isLogoKey(null)).toBe(false);
  });
});
