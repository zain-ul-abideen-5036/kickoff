import { EMBER_AND_OAK } from '@/lib/domain/fixtures';
import { defaultSettings } from '@/lib/domain/settings';
import { generateBrief } from '@/lib/engine/generate';
import { lineAmount, quoteTotals } from '@/lib/engine/pricing';
import { formatGbp } from '@/lib/format';
import { Icon } from '../icons';

/**
 * Rate card on the left, the Ember & Oak estimate on the right, both computed by the real
 * pricing engine, so the page can never drift from what the product does.
 */
export function PricingLogic() {
  const settings = defaultSettings();
  const r = settings.rateCard;
  const brief = generateBrief({ id: 'landing-sample', ref: 'KO-0142', answers: EMBER_AND_OAK, settings });
  const total = quoteTotals(brief.quote, r.vatRate).total;
  const card: [string, string][] = [
    ['WordPress base', formatGbp(r.platforms.wordpress)],
    ['Per page', formatGbp(r.perPage)],
    ['Booking integration', formatGbp(r.features.booking)],
    ['Editable menu', formatGbp(r.features.menu)],
    [
      'Gallery · SEO · Copy',
      `${formatGbp(r.features.gallery)} · ${formatGbp(r.seo)} · ${formatGbp(r.copywriting)}`,
    ],
  ];
  return (
    <section className="wrap lp-sec" id="rates" aria-labelledby="rates-h">
      <div className="lp-sec-h">
        <p className="eyebrow">Pricing logic</p>
        <h2 className="d-1" id="rates-h">
          AI writes. Your rates decide the price.
        </h2>
        <p className="t-lg muted">
          The AI only words the summary. Every figure comes from your rate card, and you can change any line.
        </p>
      </div>
      <div className="lp-rate">
        <div className="card" style={{ padding: 22 }}>
          <div className="row between" style={{ marginBottom: 8 }}>
            <h3 className="label">Your rate card</h3>
            <Icon name="lock" size="sm" className="muted" />
          </div>
          {card.map(([k, v], i) => (
            <div key={k} className="ql" style={i === card.length - 1 ? { borderBottom: 0 } : undefined}>
              <span className="t-sm">{k}</span>
              <span className="amt t-sm">{v}</span>
            </div>
          ))}
        </div>
        <svg
          className="arrow ic"
          viewBox="0 0 72 24"
          style={{ width: 72, height: 24, color: 'var(--brass)' }}
          aria-hidden="true"
        >
          <path d="M2 12h66M60 5l8 7-8 7" />
        </svg>
        <div className="card float" style={{ padding: 22 }}>
          <div className="row between" style={{ marginBottom: 8 }}>
            <h3 className="label">Ember &amp; Oak estimate</h3>
            <span className="tag">Calculated</span>
          </div>
          {brief.quote.lines.map((l) => (
            <div key={l.id} className="ql">
              <span className="t-sm">
                {l.label} {l.qty > 1 && <span className="calc">× {formatGbp(l.rate)}</span>}
              </span>
              <span className="amt t-sm">{formatGbp(lineAmount(l))}</span>
            </div>
          ))}
          <div className="total">
            <span className="w5">Total</span>
            <span className="fig">{formatGbp(total)}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
