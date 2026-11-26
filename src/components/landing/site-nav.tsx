import Link from 'next/link';
import { KickoffWordmark } from '../ui/brand';
import { ButtonLink } from '../ui/button';
import { ThemeToggle } from '../ui/theme-toggle';

const LINKS = [
  ['#how', 'How it works'],
  ['#anatomy', 'The brief'],
  ['#rates', 'Pricing logic'],
  ['#privacy', 'Privacy'],
  ['#faq', 'FAQ'],
] as const;

export function SiteNav() {
  return (
    <header className="rb lp-nav">
      <div className="wrap row between" style={{ minHeight: 72, gap: 16 }}>
        <Link href="/" aria-label="Kickoff home" style={{ textDecoration: 'none' }}>
          <KickoffWordmark size="lg" />
        </Link>
        <nav className="row lp-links" style={{ gap: 28 }} aria-label="Main">
          {LINKS.map(([href, label]) => (
            <a key={href} href={href} className="lp-link">
              {label}
            </a>
          ))}
        </nav>
        <div className="row" style={{ gap: 4 }}>
          <ThemeToggle />
          <ButtonLink href="/login" variant="ghost" size="sm" className="hide-m">
            Sign in
          </ButtonLink>
          <ButtonLink href="/setup" variant="primary" size="sm">
            Set up your studio
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}
