/**
 * The guard that keeps AI prose honest: every number the AI writes must be one we calculated or
 * one the client gave us. If it invents a price, a week count or a page count, the template wins.
 */

/** Pulls numbers out of text: £4,850 → 4850, 5.5 → 5.5, "7 pages" → 7. Ignores numbers inside words. */
export function figuresIn(text: string): number[] {
  const out: number[] = [];
  const re = /(?<![\p{L}\d])£?\s?(\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?)(k)?(?![\p{L}\d])/giu;
  for (const m of text.matchAll(re)) {
    const n = Number(m[1]!.replace(/,/g, ''));
    out.push(m[2] ? n * 1000 : n);
  }
  return out;
}

const WORD_NUMBERS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
};

/** Spelled-out numbers count too, so "seven pages" can't slip past the check. */
export function wordFiguresIn(text: string): number[] {
  return [
    ...text.toLowerCase().matchAll(/\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\b/g),
  ].map((m) => WORD_NUMBERS[m[1]!]!);
}

/** Numbers the AI may use, but only if they also appear among the allowed figures. */
export function unknownFigures(text: string, allowed: Iterable<number>): number[] {
  const ok = new Set([...allowed].map((n) => Math.round(n * 100) / 100));
  // "one" is common in plain English ("one place to book"), so only check words above one.
  const all = [...figuresIn(text), ...wordFiguresIn(text).filter((n) => n > 1)];
  return all.filter((n) => !ok.has(Math.round(n * 100) / 100));
}
