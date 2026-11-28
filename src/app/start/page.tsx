import { Icon } from '@/components/icons';
import { AgencyMark, PoweredBy } from '@/components/ui/brand';
import { Button } from '@/components/ui/button';
import { getSettings, logoUrl } from '@/lib/server/context';
import { startIntake } from './actions';

export const dynamic = 'force-dynamic';

/** The client's first screen, branded for the studio. */
export default async function WelcomePage({ searchParams }: { searchParams: Promise<{ busy?: string }> }) {
  const { busy } = await searchParams;
  const settings = await getSettings();
  const { name, brandColor } = settings.agency;
  const logo = logoUrl(settings);
  return (
    <>
      <div className="brand-rule" style={{ background: brandColor }} />
      <header className="rb">
        <div className="wrap row between" style={{ minHeight: 68 }}>
          <span className="row" style={{ gap: 10 }}>
            <AgencyMark name={name} color={brandColor} logoUrl={logo} />
            <span className="w5">{name}</span>
          </span>
          <span className="t-sm muted row" style={{ gap: 6 }}>
            <Icon name="lock" size="sm" />
            <span className="hide-m">Private to {name}</span>
            <span className="only-m">Private</span>
          </span>
        </div>
      </header>
      <main id="main" className="wl">
        <div className="wl-l">
          <div className="col a-in-y" style={{ gap: 20 }}>
            <p className="eyebrow">New website enquiry</p>
            <h1 className="d-hero" style={{ maxWidth: '11ch' }}>
              Tell us about your project
            </h1>
            <p className="t-lg muted" style={{ maxWidth: '46ch' }}>
              It takes about 5 minutes. Answer in your own words, and we&rsquo;ll turn it into a clear project
              brief you can keep.
            </p>
          </div>
          <div className="col a-in-y" style={{ gap: 6, ['--d' as string]: '120ms' }}>
            <h2 className="label" style={{ marginBottom: 6 }}>
              What you&rsquo;ll receive
            </h2>
            <ul className="recv" style={{ maxWidth: 520 }}>
              {[
                ['A clear project summary', 'Your goals, your customers and what success looks like.'],
                ['A recommended set of pages', 'A simple map of the website, drawn up for you.'],
                ['A timeline and ballpark estimate', `Based on ${name}’s own prices, reviewed by a person.`],
              ].map(([title, sub], i) => (
                <li key={title}>
                  <span className="mono brass">{String(i + 1).padStart(2, '0')}</span>
                  <span>
                    <span className="w5">{title}</span>
                    <span className="t-sm muted" style={{ display: 'block' }}>
                      {sub}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          {busy && (
            <div className="note note-err" role="alert" style={{ maxWidth: 520 }}>
              <Icon name="clock" />
              <span>
                Lots of briefs have been started from this connection. Please try again in a little while.
              </span>
            </div>
          )}
          <form
            action={startIntake}
            className="row wrapf a-in-y"
            style={{ gap: 16, ['--d' as string]: '220ms' }}
          >
            <Button type="submit" variant="primary" size="lg" iconAfter="arrowRight">
              Start my brief
            </Button>
            <span className="t-sm muted row" style={{ gap: 6 }}>
              <Icon name="clock" size="sm" />
              About 5 minutes · saves as you go
            </span>
          </form>
        </div>
        <div className="wl-r paper-grid" aria-hidden="true">
          <div className="card cover2" />
          <div className="card float cover a-pop" style={{ ['--d' as string]: '200ms' }}>
            <div className="row between">
              <AgencyMark name={name} color={brandColor} logoUrl={logo} size={28} />
              <span className="eyebrow">Project brief</span>
            </div>
            <div style={{ height: 2, width: 48, background: brandColor }} />
            <div className="col" style={{ gap: 6 }}>
              <p className="d-3">Your business</p>
              <p className="t-sm muted">New website · prepared by {name}</p>
            </div>
            <div className="bp" style={{ padding: '22px 8px 14px', background: 'var(--paper)' }}>
              <div className="tree">
                <span className="node root">Home</span>
                <span className="vstem" style={{ height: 14 }} />
                <div className="kids">
                  {['Pages', 'Services', 'Contact'].map((p) => (
                    <div key={p} className="kid">
                      <span className="node sub">{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="col" style={{ gap: 8 }}>
              <div className="row" style={{ gap: 8 }}>
                <span className="prio prio-must">Must</span>
                <span className="sk" style={{ height: 8, flex: 1 }} />
              </div>
              <div className="row" style={{ gap: 8 }}>
                <span className="prio prio-should">Should</span>
                <span className="sk" style={{ height: 8, width: '60%' }} />
              </div>
            </div>
            <div className="row between rt" style={{ paddingTop: 14 }}>
              <span className="t-xs muted">Timeline</span>
              <span className="mono t-sm">— weeks</span>
            </div>
          </div>
        </div>
      </main>
      <footer className="rt">
        <p className="wrap" style={{ paddingTop: 14, paddingBottom: 14 }}>
          <PoweredBy />{' '}
          <span className="t-xs muted">· {name} will only use your answers for this project.</span>
        </p>
      </footer>
    </>
  );
}
