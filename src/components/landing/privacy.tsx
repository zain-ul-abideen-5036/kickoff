import { Icon } from '../icons';

const POINTS = [
  ['Answers are used only to write that brief', 'Never your rate card, notes or other clients.'],
  [
    'Figures are checked before they’re shown',
    'If AI text mentions a number we didn’t calculate, the template is used.',
  ],
  ['Bring your own key', 'Gemini’s free tier, under your own account and terms.'],
] as const;

export function Privacy() {
  return (
    <section className="sunk lp-band" id="privacy" aria-labelledby="privacy-h">
      <div className="wrap lp-sec">
        <div className="split" style={{ gap: 64 }}>
          <div className="col" style={{ gap: 16, flex: '1 1 0', minWidth: 0 }}>
            <p className="eyebrow">Privacy</p>
            <h2 className="d-1" id="privacy-h">
              AI is optional. Switch it off any time.
            </h2>
            <p className="t-lg muted measure">
              With AI off, briefs are written from templates. Quotes, timelines and sitemaps work exactly the
              same, because they never came from AI in the first place.
            </p>
            <div
              className="card row"
              style={{ padding: '16px 18px', gap: 14, maxWidth: 420, marginTop: 8 }}
              aria-hidden="true"
            >
              <span className="switch" aria-checked="true" style={{ display: 'block' }} />
              <span className="col">
                <span className="w5 t-sm">Use AI to write briefs</span>
                <span className="t-xs muted">Settings · AI and privacy</span>
              </span>
            </div>
          </div>
          <ul className="col" style={{ flex: '1 1 0', minWidth: 0 }}>
            {POINTS.map(([t, d]) => (
              <li key={t} className="lp-call">
                <Icon name="check" />
                <span>
                  <span className="w5">{t}</span>
                  <span className="t-sm muted" style={{ display: 'block' }}>
                    {d}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
