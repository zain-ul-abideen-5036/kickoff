const gbp = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 });
const gbpPence = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 2 });

/** £4,850 — whole pounds, the way quotes are shown in the brief. */
export function formatGbp(pounds: number): string {
  return gbp.format(Math.round(pounds));
}

/** £4,850.00 — with pence, for invoices and VAT lines. */
export function formatGbpExact(pounds: number): string {
  return gbpPence.format(pounds);
}

/** 5.5 weeks, 1 week, 0.5 weeks. */
export function formatWeeks(weeks: number): string {
  const n = Number.isInteger(weeks) ? String(weeks) : weeks.toFixed(1);
  return `${n} ${weeks === 1 ? 'week' : 'weeks'}`;
}
