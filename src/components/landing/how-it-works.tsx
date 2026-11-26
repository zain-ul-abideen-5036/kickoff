import type { ReactNode } from 'react';

function Row({
  n,
  title,
  body,
  visual,
  last,
}: {
  n: string;
  title: string;
  body: string;
  visual: ReactNode;
  last?: boolean;
}) {
  return (
    <li className="lp-how" style={last ? { borderBottom: '1px solid var(--rule)' } : undefined}>
      <span className="num" aria-hidden="true">
        {n}
      </span>
      <div className="col" style={{ gap: 8 }}>
        <h3 className="d-3">
          <span className="sr-only">Step {Number(n)}: </span>
          {title}
        </h3>
        <p className="muted">{body}</p>
      </div>
      <div className="vis" aria-hidden="true">
        {visual}
      </div>
    </li>
  );
}

const fake = (label: string, primary?: boolean) => (
  <span className={`btn btn-sm ${primary ? 'btn-primary' : 'btn-secondary'}`}>{label}</span>
);

/** An editorial sequence of four moves, not a row of identical cards. */
export function HowItWorks() {
  return (
    <section className="rt" id="how" aria-labelledby="how-h">
      <div className="wrap lp-sec" style={{ paddingBottom: 72 }}>
        <div className="lp-sec-h">
          <p className="eyebrow">How it works</p>
          <h2 className="d-1" id="how-h">
            From first enquiry to signed brief, in four moves.
          </h2>
        </div>
        <ol>
          <Row
            n="01"
            title="Send your intake link"
            body="Branded with your logo and colours. Clients answer one calm question at a time, in about five minutes, on any device."
            visual={
              <div className="row wrapf" style={{ gap: 10 }}>
                <span className="tag mono" style={{ height: 36, padding: '0 12px', fontSize: 13 }}>
                  yourstudio.kickoff.site/start
                </span>
                {fake('Copy link')}
              </div>
            }
          />
          <Row
            n="02"
            title="The brief builds itself"
            body="As they answer, a live brief takes shape beside the form: goals, audience, a sitemap drawn as a blueprint, features sorted into Must, Should and Could."
            visual={
              <div className="bp paper-grid" style={{ padding: '20px 12px 16px' }}>
                <div className="tree">
                  <span className="node root lp-node">Home</span>
                  <span className="vstem" style={{ height: 14 }} />
                  <div className="kids">
                    {['Menu', 'Book', 'Gallery', 'Contact'].map((p) => (
                      <div key={p} className="kid" style={{ padding: '14px 4px 0' }}>
                        <span className="node lp-node">{p}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            }
          />
          <Row
            n="03"
            title="Your rates set the price"
            body="Kickoff matches the brief to your rate card: platform, pages, features. The estimate is arithmetic you can check, not a guess."
            visual={
              <div className="card" style={{ padding: '6px 16px' }}>
                <div className="ql">
                  <span className="t-sm">
                    7 pages <span className="calc">× £250</span>
                  </span>
                  <span className="amt t-sm">£1,750</span>
                </div>
                <div className="ql">
                  <span className="t-sm">Booking integration</span>
                  <span className="amt t-sm">£600</span>
                </div>
                <div className="ql" style={{ borderBottom: 0 }}>
                  <span className="t-sm">SEO setup</span>
                  <span className="amt t-sm">£350</span>
                </div>
              </div>
            }
          />
          <Row
            n="04"
            last
            title="Review, send, kick off"
            body="Edit anything, then send a branded PDF and a share link the client can approve. Export tasks to Trello or Asana in one click."
            visual={
              <div className="row wrapf" style={{ gap: 8 }}>
                {fake('Send to client', true)}
                {fake('Download PDF')}
                {fake('Export tasks CSV')}
              </div>
            }
          />
        </ol>
      </div>
    </section>
  );
}
