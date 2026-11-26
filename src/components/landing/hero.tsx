import { ButtonLink } from '../ui/button';

/**
 * The hero product shot: a client ticks "Photo gallery" and the brief beside it fills in, on a
 * 9-second loop. Pure CSS (transform and opacity); with reduced motion everything sits still.
 */
function ProductShot() {
  return (
    <figure
      className="card float lp-shot crop a-pop"
      style={{ ['--d' as string]: '150ms', margin: 0 }}
      aria-label="Product preview: as a client picks features, the brief fills in beside it"
    >
      <div className="lp-shot-l" aria-hidden="true">
        <div className="row" style={{ gap: 8 }}>
          <span className="logo-sn" style={{ width: 22, height: 22, fontSize: 9 }}>
            SN
          </span>
          <span className="t-xs w5">Studio North</span>
          <span className="t-xs mono muted" style={{ marginLeft: 'auto' }}>
            4 / 7
          </span>
        </div>
        <div className="progress">
          <i style={{ transform: 'scaleX(.55)' }} />
        </div>
        <p className="serif" style={{ fontSize: 19, lineHeight: 1.2 }}>
          What would you like the site to do?
        </p>
        <div className="mini-chip on">
          <span className="b" />
          Online table booking
        </div>
        <div className="mini-chip on">
          <span className="b" />
          Seasonal menu
        </div>
        <div className="mini-chip">
          <span className="b" />
          Photo gallery
          <span className="onlay loop-on">
            <span className="b" />
            Photo gallery
          </span>
        </div>
        <div className="mini-chip">
          <span className="b" />
          Private dining enquiries
        </div>
        <div className="mini-chip">
          <span className="b" />
          Gift vouchers
        </div>
        <span className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start', marginTop: 4 }}>
          Continue
        </span>
      </div>
      <div className="lp-shot-r" aria-hidden="true">
        <div className="row between">
          <span className="eyebrow">Brief · draft</span>
          <span className="t-xs muted row" style={{ gap: 6 }}>
            <i
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--brass-line)',
                display: 'block',
              }}
            />
            live
          </span>
        </div>
        <p className="d-3" style={{ fontSize: 22 }}>
          Ember &amp; Oak
        </p>
        <div className="lp-pl loop-1">
          <h3>Goals</h3>
          <p className="t-sm">More bookings · Look more premium · Rank on Google</p>
        </div>
        <div className="lp-pl loop-2">
          <h3>Pages</h3>
          <div className="row wrapf" style={{ gap: 5 }}>
            <span className="node root lp-node">Home</span>
            <span className="node lp-node">Menu</span>
            <span className="node lp-node">Book</span>
            <span className="node lp-node loop-4" style={{ borderColor: 'var(--brass)' }}>
              Gallery
            </span>
            <span className="node lp-node">Contact</span>
          </div>
        </div>
        <div className="lp-pl loop-3">
          <h3>Features</h3>
          <div className="col" style={{ gap: 5 }}>
            <div className="row t-xs" style={{ gap: 8 }}>
              <span className="prio prio-must">Must</span>Online booking
            </div>
            <div className="row t-xs" style={{ gap: 8 }}>
              <span className="prio prio-must">Must</span>Mobile-first menu
            </div>
            <div className="row t-xs loop-4" style={{ gap: 8 }}>
              <span className="prio prio-should">Should</span>Gallery
            </div>
          </div>
        </div>
        <div className="lp-pl loop-5">
          <h3>Estimate · your rates</h3>
          <p className="row between">
            <span className="t-sm muted">7 pages · 5.5 weeks</span>
            <span className="serif brass num" style={{ fontSize: 28 }}>
              £4,850
            </span>
          </p>
        </div>
      </div>
    </figure>
  );
}

export function Hero() {
  return (
    <section className="paper-grid rb">
      <div className="wrap lp-hero">
        <div className="col a-in-y" style={{ gap: 24 }}>
          <p className="eyebrow">For web design studios</p>
          <h1 className="d-hero">Every client brief, ready to quote — before the first call.</h1>
          <p className="t-lg muted" style={{ maxWidth: '50ch' }}>
            Send one link. Your client answers a calm, five-minute intake, and Kickoff turns it into a
            professional brief: goals, sitemap, features, timeline, and an estimate priced from your own rate
            card.
          </p>
          <div className="row wrapf" style={{ gap: 12 }}>
            <ButtonLink href="/setup" variant="primary" size="lg" iconAfter="arrowRight">
              Set up your studio
            </ButtonLink>
            <ButtonLink href="/start" size="lg">
              Try the client intake
            </ButtonLink>
          </div>
          <p className="t-sm muted">Free to run · bring your own rate card · white-label from day one</p>
        </div>
        <ProductShot />
      </div>
    </section>
  );
}
