import { FEATURES, PLATFORMS, labelOf } from '@/lib/domain/catalog';
import { STEPS } from '@/lib/domain/intake';
import type { RateCard } from '@/lib/domain/rate-card';
import type { Settings } from '@/lib/domain/settings';

/** Form fields arrive as strings; these turn them into settings, with plain-English errors. */

export type Fields = Record<string, string | undefined>;
export type Parsed<T> = { ok: true; value: T } | { ok: false; errors: Record<string, string> };

const MAX_PRICE = 1_000_000;

/** "£1,200", "1200" and " 1 200 " all mean 1200. Whole pounds only. */
export function parseMoney(raw: string | undefined): number | null {
  const s = (raw ?? '').replace(/[£,\s]/g, '');
  if (!/^\d+$/.test(s)) return null;
  const n = Number(s);
  return n <= MAX_PRICE ? n : null;
}

/** Weeks in half-week steps. */
export function parseWeeks(raw: string | undefined, min: number, max: number): number | null {
  const n = Number((raw ?? '').trim());
  if (!Number.isFinite(n) || n < min || n > max || Math.round(n * 2) !== n * 2) return null;
  return n;
}

export const PLATFORM_FIELDS = PLATFORMS.map((p) => ({ name: `platform.${p.id}`, id: p.id, label: p.label }));
export const FEATURE_FIELDS = FEATURES.map((f) => ({ name: `feature.${f.id}`, id: f.id, label: f.label }));

export function parseRateCardForm(f: Fields): Parsed<RateCard> {
  const errors: Record<string, string> = {};
  const money = (name: string, label: string) => {
    const n = parseMoney(f[name]);
    if (n === null) errors[name] = `${label}: use whole pounds, like 250.`;
    return n ?? 0;
  };
  const platforms = Object.fromEntries(
    PLATFORM_FIELDS.map((p) => [p.id, money(p.name, `${p.label} base`)]),
  ) as RateCard['platforms'];
  const features = Object.fromEntries(
    FEATURE_FIELDS.map((x) => [x.id, money(x.name, labelOf(FEATURES, x.id))]),
  ) as RateCard['features'];
  const vatRaw = (f.vatPercent ?? '').trim();
  const vat = vatRaw === '' ? Number.NaN : Number(vatRaw);
  if (!Number.isFinite(vat) || vat < 0 || vat > 100)
    errors.vatPercent = 'VAT: use a percentage from 0 to 100.';
  const value: RateCard = {
    platforms,
    perPage: money('perPage', 'Price per page'),
    features,
    shopPer10Products: money('shopPer10Products', 'Product setup'),
    seo: money('seo', 'SEO setup'),
    copywriting: money('copywriting', 'Copywriting support'),
    vatRate: Math.round(vat * 100) / 10000,
  };
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value };
}

export const OPTIONAL_STEPS = STEPS.filter((s) => s.key !== 'about');

export function parseTimelineForm(
  f: Fields,
  current: Settings,
): Parsed<{ timeline: Settings['timeline']; intake: Settings['intake'] }> {
  const errors: Record<string, string> = {};
  const phases = current.timeline.phases.map((p) => {
    const w = parseWeeks(f[`phase.${p.id}`], 0.5, 26);
    if (w === null) errors[`phase.${p.id}`] = `${p.name}: use half weeks from 0.5 to 26.`;
    return { ...p, weeks: w ?? p.weeks };
  });
  const extra = parseWeeks(f.extraWeeksPer5Pages, 0, 4);
  if (extra === null) errors.extraWeeksPer5Pages = 'Use half weeks from 0 to 4.';
  const steps = Object.fromEntries(OPTIONAL_STEPS.map((s) => [s.key, f[`step.${s.key}`] === 'on']));
  if (!Object.values(steps).some(Boolean))
    errors.steps = 'Keep at least one step besides About you, or the brief has nothing to work from.';
  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    value: {
      timeline: { phases, extraWeeksPer5Pages: extra ?? 0 },
      intake: { steps, followUps: f.followUps === 'on' },
    },
  };
}
