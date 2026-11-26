import { Icon } from '../icons';

function Header({
  color,
  mark,
  name,
  domain,
  line,
  offset,
}: {
  color: string;
  mark: string;
  name: string;
  domain: string;
  line: string;
  offset?: boolean;
}) {
  return (
    <div
      className={offset ? 'card' : 'card float'}
      style={{ overflow: 'hidden', marginLeft: offset ? 32 : 0 }}
    >
      <div style={{ height: 4, background: color }} />
      <div className="row" style={{ gap: 10, padding: '14px 18px' }}>
        <span className="logo-sn" style={{ width: 28, height: 28, fontSize: 11, background: color }}>
          {mark}
        </span>
        <span className="w5">{name}</span>
        <span className="t-xs mono muted hide-m" style={{ marginLeft: 'auto' }}>
          {domain}
        </span>
      </div>
      <p className="serif" style={{ fontSize: 24, padding: '4px 18px 20px' }}>
        {line}
      </p>
    </div>
  );
}

export function WhiteLabel() {
  return (
    <section className="rt" aria-labelledby="wl-h">
      <div className="wrap lp-sec">
        <div className="split" style={{ gap: 64, alignItems: 'center' }}>
          <div className="col" style={{ gap: 16, flex: '1 1 0', minWidth: 0 }}>
            <p className="eyebrow">White label</p>
            <h2 className="d-1" id="wl-h">
              Your studio’s name on everything.
            </h2>
            <p className="t-lg muted measure">
              Clients see your logo, your colours and your domain on the intake, the shared brief and the PDF.
              Kickoff stays in the background.
            </p>
            <ul className="col t-md" style={{ gap: 10, marginTop: 8 }}>
              {[
                'Logo and brand colour, previewed live',
                'Your own intake address',
                'Emails sent in your name',
              ].map((t) => (
                <li key={t} className="row" style={{ gap: 10 }}>
                  <Icon name="check" size="sm" className="brass" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="col" style={{ gap: 16, flex: '1 1 0', minWidth: 0 }} aria-hidden="true">
            <Header
              color="#1F3B34"
              mark="SN"
              name="Studio North"
              domain="studionorth.kickoff.site"
              line="Tell us about your project"
            />
            <Header
              color="#3B2C55"
              mark="FW"
              name="Fieldwork Design"
              domain="start.fieldwork.design"
              line="Let’s plan your new site"
              offset
            />
          </div>
        </div>
      </div>
    </section>
  );
}
