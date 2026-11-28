'use client';

import type { Quote } from '@/lib/domain/brief';
import { lineAmount, quoteTotals } from '@/lib/engine/pricing';
import { formatGbp } from '@/lib/format';
import { useCountUp } from './use-count-up';

/** The estimate as it appears in the brief. The total counts up once on first view. */
export function QuoteSummary({ quote, vatRate, agency }: { quote: Quote; vatRate: number; agency: string }) {
  const t = quoteTotals(quote, vatRate);
  const shown = useCountUp(t.total);
  return (
    <div>
      {quote.lines.map((l) => (
        <div key={l.id} className="ql">
          <span className="col" style={{ gap: 2 }}>
            <span>{l.label}</span>
            <span className="calc">
              {l.qty > 1 ? `${l.qty} × ${formatGbp(l.rate)} · ` : ''}
              {l.basis}
            </span>
          </span>
          <span className="amt">{formatGbp(lineAmount(l))}</span>
        </div>
      ))}
      {quote.adjustments.map((a) => (
        <div key={a.id} className="ql">
          <span>{a.label}</span>
          <span className="amt">{formatGbp(a.amount)}</span>
        </div>
      ))}
      {t.discount > 0 && (
        <div className="ql">
          <span>Discount</span>
          <span className="amt">−{formatGbp(t.discount)}</span>
        </div>
      )}
      {quote.vat && (
        <div className="ql">
          <span>VAT</span>
          <span className="amt">{formatGbp(t.vat)}</span>
        </div>
      )}
      <div className="total">
        <span className="col" style={{ gap: 2 }}>
          <span className="w5">Total estimate</span>
          <span className="t-xs muted">
            {quote.vat ? 'Includes VAT' : 'Excludes VAT'} · calculated from {agency}&rsquo;s rate card
          </span>
        </span>
        <span className="fig">
          <span className="sr-only">{formatGbp(t.total)}</span>
          <span aria-hidden="true">{formatGbp(shown)}</span>
        </span>
      </div>
    </div>
  );
}
