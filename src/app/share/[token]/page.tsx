import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { BrandAccent } from '@/components/app/brand-accent';
import '@/components/brief/brief.css';
import { BriefDocument } from '@/components/brief/document';
import { AgencyLockup, PoweredBy } from '@/components/ui/brand';
import { ButtonLink } from '@/components/ui/button';
import { briefFacts } from '@/lib/engine/generate';
import { formatGbp, formatWeeks } from '@/lib/format';
import { openShare } from '@/lib/repo/share-service';
import { getSettings, logoUrl } from '@/lib/server/context';
import { LIMITS, clientKey, hit } from '@/lib/server/rate-limit';
import { getStore } from '@/lib/store';
import { ApproveBar } from './approve-bar';
import { LinkProblem } from './link-problem';
import './share.css';

export const metadata: Metadata = {
  title: 'Your project brief',
  robots: { index: false, follow: false, nocache: true },
  referrer: 'no-referrer',
};

/** The client's read-only, branded view of their brief, reached by an unguessable link. */
export default async function SharedBriefPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const settings = await getSettings();
  const brand = {
    agency: settings.agency.name,
    color: settings.agency.brandColor,
    logo: logoUrl(settings),
    replyTo: settings.agency.replyTo,
  };
  if (!hit(`share:${clientKey(await headers())}`, LIMITS.share).ok)
    return <LinkProblem kind="busy" {...brand} />;
  const opened = await openShare(getStore(), token);
  if (opened.state !== 'ok') return <LinkProblem kind={opened.state} {...brand} />;

  const brief = opened.brief;
  const f = briefFacts(brief, settings.rateCard.vatRate);
  const expires = new Date(brief.share!.expiresAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
  return (
    <BrandAccent agency={settings.agency}>
      <div className="shared">
        <div className="brand-rule" style={{ background: brand.color }} />
        <header className="sbar no-print">
          <div className="wrap row between" style={{ minHeight: 64, gap: 12 }}>
            <AgencyLockup name={brand.agency} color={brand.color} logoUrl={brand.logo} />
            <ButtonLink href={`/api/share/${token}/pdf`} variant="ghost" size="sm" icon="download">
              Download PDF
            </ButtonLink>
          </div>
        </header>
        <section className="paper-grid rb">
          <div className="sdoc share-hero">
            <p className="eyebrow">Shared with {brief.answers.about.name} · private link</p>
            <h1 className="d-hero">Your project brief</h1>
            <p className="t-lg muted measure">
              {brand.agency} has reviewed your answers and prepared this plan and estimate. Read it through,
              then approve it or ask a question.
            </p>
            <div className="row wrapf" style={{ gap: 10 }}>
              <span className={brief.share?.approvedAt ? 'st st-won' : 'st st-quo'}>
                {brief.share?.approvedAt ? 'Approved' : 'Ready for your approval'}
              </span>
              <span className="tag mono">Link open until {expires}</span>
            </div>
          </div>
        </section>
        <main id="main" className="sdoc" style={{ paddingTop: 40, paddingBottom: 48 }}>
          <BriefDocument brief={brief} vatRate={settings.rateCard.vatRate} agency={brand.agency} />
          <section className="card assumptions">
            <h2 className="d-3">Assumptions and next steps</h2>
            <ul className="col t-sm" style={{ gap: 8 }}>
              <li>
                · Prices {brief.quote.vat ? 'include' : 'exclude'} VAT and come from {brand.agency}&rsquo;s
                rate card.
              </li>
              <li>
                · The estimate covers the {f.pageCount} pages above; extra pages are{' '}
                {formatGbp(settings.rateCard.perPage)} each.
              </li>
              <li>· After you approve, {brand.agency} will book a short kickoff call.</li>
            </ul>
          </section>
        </main>
        <ApproveBar
          token={token}
          approvedAt={brief.share?.approvedAt ?? null}
          clientName={brief.answers.about.name}
          agency={brand.agency}
          replyTo={brand.replyTo}
          total={formatGbp(f.total)}
          weeks={formatWeeks(f.weeks)}
        />
        <footer>
          <p className="sdoc" style={{ paddingTop: 14, paddingBottom: 20 }}>
            <PoweredBy />{' '}
            <span className="t-xs muted">· This link is private to you and {brand.agency}.</span>
          </p>
        </footer>
      </div>
    </BrandAccent>
  );
}
