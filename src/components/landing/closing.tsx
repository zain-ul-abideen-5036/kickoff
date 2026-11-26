import Link from 'next/link';
import { KickoffWordmark } from '../ui/brand';
import { ButtonLink } from '../ui/button';

export function Closing() {
  return (
    <section className="paper-grid rt" aria-labelledby="closing-h">
      <div className="wrap lp-sec col" style={{ alignItems: 'center', textAlign: 'center', gap: 24 }}>
        <h2 className="d-hero" id="closing-h" style={{ maxWidth: '16ch' }}>
          Your next brief could be ready before lunch.
        </h2>
        <p className="t-lg muted" style={{ maxWidth: '48ch' }}>
          Set up your rate card and branding in ten minutes, then send your first link.
        </p>
        <div className="row wrapf" style={{ gap: 12, justifyContent: 'center' }}>
          <ButtonLink href="/setup" variant="primary" size="lg" iconAfter="arrowRight">
            Set up your studio
          </ButtonLink>
          <ButtonLink href="/start" size="lg">
            Try the client intake
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="rt">
      <div className="wrap row between wrapf" style={{ gap: 16, paddingTop: 28, paddingBottom: 36 }}>
        <KickoffWordmark />
        <nav className="row wrapf t-sm" style={{ gap: 20 }} aria-label="Footer">
          <a href="#privacy" className="muted">
            Privacy
          </a>
          <a href="#faq" className="muted">
            FAQ
          </a>
          <Link href="/login" className="muted">
            Sign in
          </Link>
        </nav>
        <span className="t-xs muted">Made for web design studios</span>
      </div>
    </footer>
  );
}
