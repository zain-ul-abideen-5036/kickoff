import { rgb, type PDFDocument, type PDFFont, type PDFPage, type RGB } from 'pdf-lib';

/** A4 portrait in points. */
export const A4 = { width: 595.28, height: 841.89 };
export const MARGIN = 54;
export const CONTENT_W = A4.width - MARGIN * 2;

export function hex(color: string): RGB {
  const m = /^#?([0-9a-f]{6})$/i.exec(color.trim());
  const n = m ? Number.parseInt(m[1]!, 16) : 0x15173a;
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

export const C = {
  paper: hex('#F7F5EF'),
  card: hex('#FFFDF8'),
  paper2: hex('#EFEBE1'),
  ink: hex('#15173A'),
  ink2: hex('#6B6558'),
  rule: hex('#DDD7C9'),
  ruleStrong: hex('#BDB5A2'),
  brass: hex('#835A1E'),
  brassLine: hex('#B9853A'),
  won: hex('#2A6643'),
  lost: hex('#983A32'),
};

export interface Fonts {
  serif: PDFFont;
  sans: PDFFont;
  bold: PDFFont;
  mono: PDFFont;
}

/** Splits text into lines that fit the width, breaking long words if they must. */
export function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const out: string[] = [];
  for (const para of text.split(/\n/)) {
    let line = '';
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(next, size) <= width) {
        line = next;
        continue;
      }
      if (line) out.push(line);
      if (font.widthOfTextAtSize(word, size) <= width) {
        line = word;
        continue;
      }
      // A single word wider than the column: break it by characters.
      let chunk = '';
      for (const ch of word) {
        if (font.widthOfTextAtSize(chunk + ch, size) > width && chunk) {
          out.push(chunk);
          chunk = ch;
        } else chunk += ch;
      }
      line = chunk;
    }
    out.push(line);
  }
  return out;
}

/** Rounded rectangle via an SVG path. (x, yTop) is the top-left corner in PDF coordinates. */
export function roundRect(
  page: PDFPage,
  x: number,
  yTop: number,
  w: number,
  h: number,
  opts: { r?: number; fill?: RGB; stroke?: RGB; strokeWidth?: number; dash?: number[] },
) {
  const r = Math.min(opts.r ?? 6, w / 2, h / 2);
  const path = `M ${r} 0 H ${w - r} Q ${w} 0 ${w} ${r} V ${h - r} Q ${w} ${h} ${w - r} ${h} H ${r} Q 0 ${h} 0 ${h - r} V ${r} Q 0 0 ${r} 0 Z`;
  page.drawSvgPath(path, {
    x,
    y: yTop,
    color: opts.fill,
    borderColor: opts.stroke,
    borderWidth: opts.stroke ? (opts.strokeWidth ?? 1) : 0,
    borderDashArray: opts.dash,
  });
}

export interface TextOpts {
  font: PDFFont;
  size: number;
  color?: RGB;
}

/**
 * A page writer with a top-down cursor. It starts new pages when content won't fit, and
 * records every string it draws so tests can check the figures in the PDF.
 */
export class Writer {
  page!: PDFPage;
  /** Distance from the top of the page, in points. */
  y = 0;
  readonly pages: PDFPage[] = [];

  constructor(
    readonly doc: PDFDocument,
    readonly fonts: Fonts,
    private readonly onNewPage: (w: Writer) => void,
    readonly trace?: string[],
  ) {}

  /** PDF y coordinate for a distance from the top. */
  py(top: number): number {
    return A4.height - top;
  }

  newPage(withChrome = true): PDFPage {
    this.page = this.doc.addPage([A4.width, A4.height]);
    this.page.drawRectangle({ x: 0, y: 0, width: A4.width, height: A4.height, color: C.paper });
    this.pages.push(this.page);
    this.y = MARGIN;
    if (withChrome) this.onNewPage(this);
    return this.page;
  }

  /** Bottom limit for content, leaving room for the footer. */
  get limit(): number {
    return A4.height - MARGIN - 28;
  }

  ensure(height: number) {
    if (this.y + height > this.limit) this.newPage();
  }

  text(s: string, x: number, top: number, o: TextOpts) {
    this.trace?.push(s);
    this.page.drawText(s, {
      x,
      y: this.py(top) - o.size * 0.8,
      size: o.size,
      font: o.font,
      color: o.color ?? C.ink,
    });
  }

  /** Right-aligned text ending at x. */
  textRight(s: string, xRight: number, top: number, o: TextOpts) {
    this.text(s, xRight - o.font.widthOfTextAtSize(s, o.size), top, o);
  }

  /** Wrapped paragraph at the cursor; advances the cursor and breaks pages between lines. */
  para(s: string, o: TextOpts & { x?: number; width?: number; lineHeight?: number }) {
    const x = o.x ?? MARGIN;
    const lh = (o.lineHeight ?? 1.5) * o.size;
    for (const line of wrap(s, o.font, o.size, o.width ?? CONTENT_W)) {
      this.ensure(lh);
      this.text(line, x, this.y, o);
      this.y += lh;
    }
  }

  /** Height a wrapped paragraph will take, without drawing it. */
  measure(s: string, o: TextOpts & { width?: number; lineHeight?: number }): number {
    return wrap(s, o.font, o.size, o.width ?? CONTENT_W).length * (o.lineHeight ?? 1.5) * o.size;
  }

  rule(top: number, color = C.rule, x = MARGIN, w = CONTENT_W, thickness = 0.75) {
    this.page.drawLine({
      start: { x, y: this.py(top) },
      end: { x: x + w, y: this.py(top) },
      thickness,
      color,
    });
  }
}
