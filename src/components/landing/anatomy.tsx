const LEFT = [
  ['1', 'Summary and goals', 'With a way to measure each one.'],
  ['2', 'Audience profiles', 'Who they are and what they need.'],
  ['3', 'Sitemap blueprint', 'Editable: add, rename, drag.'],
] as const;
const RIGHT = [
  ['4', 'Prioritised features', 'Drag between Must, Should, Could.'],
  ['5', 'Phased timeline', 'Flags when the launch date is tight.'],
  ['6', 'Estimate from your rates', 'Every line traceable.'],
  ['7', 'Risks and call questions', 'So the kickoff call starts informed.'],
] as const;

function Callouts({ items }: { items: readonly (readonly [string, string, string])[] }) {
  return (
    <ul>
      {items.map(([n, title, sub]) => (
        <li key={n} className="lp-call">
          <span className="pin" aria-hidden="true">
            {n}
          </span>
          <span>
            <span className="w5">{title}</span>
            <span className="t-sm muted" style={{ display: 'block' }}>
              {sub}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

const bar = (bg: string) => <i style={{ height: 8, background: bg, borderRadius: 2, display: 'block' }} />;

/** An annotated brief: numbered pins on a document, explained on either side. */
export function Anatomy() {
  return (
    <section className="sunk lp-band" id="anatomy" aria-labelledby="anatomy-h">
      <div className="wrap lp-sec">
        <div className="lp-sec-h">
          <p className="eyebrow">Anatomy of a brief</p>
          <h2 className="d-1" id="anatomy-h">
            Everything you’d ask on a discovery call, already answered.
          </h2>
        </div>
        <div className="lp-anat">
          <Callouts items={LEFT} />
          <div
            className="card float"
            style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 14 }}
            aria-hidden="true"
          >
            <div className="row between">
              <span className="logo-sn" style={{ width: 26, height: 26, fontSize: 10 }}>
                SN
              </span>
              <span className="eyebrow">KO-0142</span>
            </div>
            <p className="d-2">Ember &amp; Oak</p>
            <div className="row" style={{ gap: 10 }}>
              <span className="pin">1</span>
              <span className="sk" style={{ height: 8, flex: 1 }} />
            </div>
            <div className="row" style={{ gap: 10 }}>
              <span className="pin">2</span>
              <span className="sk" style={{ height: 8, width: '70%' }} />
            </div>
            <div className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
              <span className="pin">3</span>
              <div className="bp paper-grid grow" style={{ padding: '14px 8px 10px' }}>
                <div className="row wrapf" style={{ gap: 4, justifyContent: 'center' }}>
                  {['Home', 'Menu', 'Book', 'Private dining'].map((p, i) => (
                    <span key={p} className={`node lp-node${i === 0 ? ' root' : ''}`}>
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="row wrapf" style={{ gap: 6 }}>
              <span className="pin">4</span>
              <span className="prio prio-must">Must</span>
              <span className="prio prio-should">Should</span>
              <span className="prio prio-could">Could</span>
            </div>
            <div className="row" style={{ gap: 10 }}>
              <span className="pin">5</span>
              <div
                className="grow"
                style={{ display: 'grid', gridTemplateColumns: '1fr 3fr 4fr 2fr 1fr', gap: 2 }}
              >
                {bar('var(--ink)')}
                {bar('var(--ink)')}
                {bar('var(--ink)')}
                {bar('var(--ink)')}
                {bar('var(--brass)')}
              </div>
            </div>
            <div className="row between" style={{ gap: 10 }}>
              <span className="row" style={{ gap: 10 }}>
                <span className="pin">6</span>
                <span className="t-sm">Estimate</span>
              </span>
              <span className="serif brass num" style={{ fontSize: 26 }}>
                £4,850
              </span>
            </div>
            <div className="row" style={{ gap: 10 }}>
              <span className="pin">7</span>
              <span className="sk" style={{ height: 8, width: '55%' }} />
            </div>
          </div>
          <Callouts items={RIGHT} />
        </div>
      </div>
    </section>
  );
}
