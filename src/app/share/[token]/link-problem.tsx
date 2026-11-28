import { Icon } from '@/components/icons';
import { AgencyLockup } from '@/components/ui/brand';

/** Shown when a share link has expired, been replaced or never existed. */
export function LinkProblem({
  kind,
  agency,
  color,
  logo,
  replyTo,
}: {
  kind: 'expired' | 'missing' | 'busy';
  agency: string;
  color: string;
  logo: string | null;
  replyTo: string;
}) {
  const copy = {
    expired: {
      code: 'Error 404 · link expired',
      title: 'This link has expired',
      body: `Share links stay open for a limited time to keep your brief private. Ask ${agency} for a fresh link and they’ll send one straight away.`,
    },
    missing: {
      code: 'Error 404 · link not found',
      title: 'This link isn’t active',
      body: `It may have been replaced by a newer link. Ask ${agency} to send you the latest one.`,
    },
    busy: {
      code: 'Too many requests',
      title: 'Please try again shortly',
      body: 'We’ve had a lot of requests from your connection. Wait a few minutes and reload the page.',
    },
  }[kind];
  return (
    <main id="main" className="paper-grid link-problem">
      <div className="card link-card">
        <AgencyLockup name={agency} color={color} logoUrl={logo} />
        <div className="tree ghost" aria-hidden="true">
          <span className="node root">Brief</span>
          <span className="vstem" />
          <div className="kids">
            <div className="kid">
              <span className="node">· · ·</span>
            </div>
            <div className="kid">
              <span className="node">· · ·</span>
            </div>
          </div>
        </div>
        <p className="eyebrow">{copy.code}</p>
        <h1 className="d-1">{copy.title}</h1>
        <p className="muted measure" style={{ maxWidth: '46ch' }}>
          {copy.body}
        </p>
        {replyTo && kind !== 'busy' && (
          <a
            className="btn btn-primary"
            href={`mailto:${replyTo}?subject=${encodeURIComponent('A new link for my project brief')}`}
          >
            <Icon name="mail" />
            Ask for a new link
          </a>
        )}
      </div>
    </main>
  );
}
