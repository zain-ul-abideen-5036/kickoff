import type { CSSProperties } from 'react';
import { notFound, redirect } from 'next/navigation';
import { Icon } from '@/components/icons';
import { PriorityChip } from '@/components/ui/badges';
import { AgencyMark, PoweredBy } from '@/components/ui/brand';
import { totalWeeks } from '@/lib/engine/timeline';
import { formatWeeks } from '@/lib/format';
import { isId } from '@/lib/repo/ids';
import { getSettings, logoUrl } from '@/lib/server/context';
import { briefForDraft, budgetFit } from '@/lib/server/intake-brief';
import { getStore } from '@/lib/store';

export const dynamic = 'force-dynamic';

const d = (ms: number) => ({ ['--d' as string]: `${ms}ms` }) as CSSProperties;

/** The client's thank-you page: highlights of their brief and what happens next. */
export default async function ReadyPage({ params }: { params: Promise<{ draft: string }> }) {
  const { draft: id } = await params;
  if (!isId(id)) notFound();
  const [brief, settings] = await Promise.all([briefForDraft(getStore(), id), getSettings()]);
  if (!brief) redirect(`/start/${id}`);
  const { name, brandColor } = settings.agency;
  const a = brief.answers;
  const first = a.about.name.split(' ')[0] || a.about.name;
  const weeks = totalWeeks(brief.phases);
  const fit = budgetFit(brief, settings.rateCard.vatRate, name);
  const tight = brief.risks.find((r) => r.id === 'timeline');
  const must = brief.features.filter((f) => f.priority === 'Must').map((f) => f.label);
  const should = brief.features.filter((f) => f.priority === 'Should').map((f) => f.label);
  const [home, ...rest] = brief.pages;

  return (
    <>
      <div className="brand-rule" style={{ background: brandColor }} />
      <header className="rb">
        <div className="wrap row between" style={{ minHeight: 64 }}>
          <span className="row" style={{ gap: 10 }}>
            <AgencyMark name={name} color={brandColor} logoUrl={logoUrl(settings)} />
            <span className="w5">{name}</span>
          </span>
          <span className="eyebrow hide-m">Brief {brief.ref}</span>
        </div>
      </header>
      <main id="main" className="wrap col" style={{ paddingTop: 64, paddingBottom: 80, gap: 48 }}>
        <section className="col a-in-y" style={{ gap: 16, maxWidth: 760 }}>
          <p className="eyebrow row" style={{ gap: 8, color: 'var(--won-fg)' }}>
            <Icon name="statusWon" size="sm" />
            Brief received
          </p>
          <h1 className="d-1">Thank you, {first}. Your project brief is ready.</h1>
          <p className="t-lg muted measure">
            {name} will review your brief within 1 working day. We&rsquo;ll send it to{' '}
            <span style={{ color: 'var(--ink)' }}>{a.about.email}</span>.
          </p>
        </section>

        <section className="hl" aria-label="Brief highlights">
          <div
            className="card a-in-y"
            style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, ...d(100) }}
          >
            <div className="row between">
              <h2 className="d-3">Your recommended pages</h2>
              <span className="mono t-sm muted">{brief.pages.length} pages</span>
            </div>
            <div className="bp paper-grid">
              <span className="bp-label">Sitemap · draft</span>
              <div className="tree">
                <span className="node root" style={d(200)}>
                  {home?.label ?? 'Home'}
                  <span className="nid">01</span>
                </span>
                <span className="vstem" style={d(300)} />
                <div className="kids">
                  {rest.map((p, i) => (
                    <div key={p.id} className="kid" style={d(380 + i * 80)}>
                      <span className="node" style={d(380 + i * 80)}>
                        {p.label}
                        <span className="nid">{String(i + 2).padStart(2, '0')}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {must.length > 0 && (
              <div className="row wrapf" style={{ gap: 8 }}>
                <PriorityChip priority="Must" />
                <span className="t-sm">{must.join(' · ')}</span>
              </div>
            )}
            {should.length > 0 && (
              <div className="row wrapf" style={{ gap: 8 }}>
                <PriorityChip priority="Should" />
                <span className="t-sm">{should.join(' · ')}</span>
              </div>
            )}
          </div>
          <div className="col" style={{ gap: 24 }}>
            <div
              className="card a-in-y"
              style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14, ...d(180) }}
            >
              <p className="eyebrow">Suggested timeline</p>
              <p className="row" style={{ gap: 10, alignItems: 'baseline' }}>
                <span className="serif brass num" style={{ fontSize: 44, lineHeight: 1 }}>
                  {Number.isInteger(weeks) ? weeks : weeks.toFixed(1)}
                </span>
                <span className="muted">
                  {formatWeeks(weeks).replace(/^[\d.]+ /, '')}, in {brief.phases.length} phases
                </span>
              </p>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: brief.phases.map((p) => `${p.weeks}fr`).join(' '),
                  gap: 3,
                }}
              >
                {brief.phases.map((p, i) => (
                  <span
                    key={p.id}
                    className="a-grow-x"
                    title={`${p.name}: ${formatWeeks(p.weeks)}`}
                    style={{
                      height: 10,
                      borderRadius: 2,
                      background: i === brief.phases.length - 1 ? 'var(--brass)' : 'var(--ink)',
                      ...d(300 + i * 80),
                    }}
                  />
                ))}
              </div>
              <p className="t-xs mono muted">{brief.phases.map((p) => p.name).join(' · ')}</p>
            </div>
            <div
              className="card a-in-y"
              style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 10, ...d(240) }}
            >
              <p className="eyebrow">Budget</p>
              <p className="d-3">{fit.title}</p>
              <p className="t-sm muted">{fit.note}</p>
            </div>
            {tight && (
              <div className="note note-brass a-in-y" style={d(300)}>
                <Icon name="calendar" />
                <span>
                  Your launch date is tight for everything. {name} may suggest launching the key pages first,
                  then adding the rest.
                </span>
              </div>
            )}
          </div>
        </section>

        <section className="col" style={{ gap: 28 }}>
          <h2 className="d-2">What happens next</h2>
          <ol className="nx">
            <li className="now">
              <span className="mono t-xs brass">Within 1 working day</span>
              <span className="w5">{name} reviews your brief</span>
              <span className="t-sm muted">
                They check the pages, features and estimate, and adjust anything that needs a person&rsquo;s
                eye.
              </span>
            </li>
            <li>
              <span className="mono t-xs muted">Then</span>
              <span className="w5">You receive your brief and quote</span>
              <span className="t-sm muted">
                By email, with a private link you can share with a business partner.
              </span>
            </li>
            <li>
              <span className="mono t-xs muted">After that</span>
              <span className="w5">A short kickoff call</span>
              <span className="t-sm muted">To talk through the details and agree a start date.</span>
            </li>
          </ol>
        </section>
      </main>
      <footer className="rt">
        <p className="wrap" style={{ paddingTop: 14, paddingBottom: 14 }}>
          <PoweredBy />
        </p>
      </footer>
    </>
  );
}
