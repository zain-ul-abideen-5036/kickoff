import type { Metadata } from 'next';
import { Icon } from '@/components/icons';
import { PriorityChip, StatusBadge } from '@/components/ui/badges';
import { KickoffWordmark } from '@/components/ui/brand';
import { Button } from '@/components/ui/button';
import { ProgressBar, Stepper } from '@/components/ui/progress';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { STATUSES, PRIORITIES } from '@/lib/domain/brief';
import { Showcase } from './showcase';

export const metadata: Metadata = { title: 'Design system', robots: { index: false } };

const SWATCHES = [
  ['Paper', 'var(--paper)'],
  ['Paper 2', 'var(--paper-2)'],
  ['Card', 'var(--card)'],
  ['Rule', 'var(--rule)'],
  ['Ink', 'var(--ink)'],
  ['Ink 2', 'var(--ink-2)'],
  ['Brass', 'var(--brass)'],
  ['Brass tint', 'var(--brass-tint)'],
];

/** A living reference of tokens and components, in whichever theme is active. */
export default function DesignSystemPage() {
  return (
    <main id="main" className="wrap" style={{ paddingTop: 40, paddingBottom: 80 }}>
      <div className="row between" style={{ marginBottom: 32 }}>
        <KickoffWordmark />
        <ThemeToggle />
      </div>
      <p className="eyebrow">Design system</p>
      <h1 className="d-1" style={{ margin: '8px 0 40px' }}>
        The studio dossier
      </h1>

      <section className="col rt" style={{ gap: 16, padding: '32px 0' }}>
        <h2 className="d-3">Colour</h2>
        <div className="g4" style={{ gap: 12 }}>
          {SWATCHES.map(([name, v]) => (
            <div key={name} className="col" style={{ gap: 6 }}>
              <i
                style={{
                  display: 'block',
                  height: 64,
                  borderRadius: 8,
                  background: v,
                  border: '1px solid var(--rule)',
                }}
              />
              <span className="t-xs w5">{name}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="col rt" style={{ gap: 12, padding: '32px 0' }}>
        <h2 className="d-3">Type</h2>
        <p className="d-hero">Ready to quote</p>
        <p className="d-1">Ember &amp; Oak</p>
        <p className="d-2">Recommended sitemap</p>
        <p className="t-lg">Tell us about your project. It takes about 5 minutes.</p>
        <p className="mono" style={{ fontSize: 24 }}>
          £4,850 · 5.5 weeks · 7 pages
        </p>
      </section>

      <section className="col rt" style={{ gap: 16, padding: '32px 0' }}>
        <h2 className="d-3">Buttons</h2>
        <div className="row wrapf">
          <Button variant="primary" iconAfter="arrowRight">
            Continue
          </Button>
          <Button icon="download">Download PDF</Button>
          <Button variant="ghost" icon="arrowLeft">
            Back
          </Button>
          <Button variant="primary" loading>
            Saving
          </Button>
          <Button variant="primary" disabled>
            Disabled
          </Button>
          <Button iconOnly icon="plus" aria-label="Add" />
        </div>
      </section>

      <section className="col rt" style={{ gap: 16, padding: '32px 0' }}>
        <h2 className="d-3">Status and priority</h2>
        <div className="row wrapf">
          {STATUSES.map((s) => (
            <StatusBadge key={s} status={s} />
          ))}
        </div>
        <div className="row wrapf">
          {PRIORITIES.map((p) => (
            <PriorityChip key={p} priority={p} />
          ))}
        </div>
      </section>

      <section className="col rt" style={{ gap: 16, padding: '32px 0' }}>
        <h2 className="d-3">Progress</h2>
        <Stepper
          steps={['About you', 'Goals', 'Audience', 'Features', 'Content', 'Inspiration', 'Budget']}
          current={1}
        />
        <div style={{ maxWidth: 360 }}>
          <ProgressBar value={0.24} label="Intake progress" />
        </div>
      </section>

      <section className="col rt" style={{ gap: 16, padding: '32px 0' }}>
        <h2 className="d-3">Inputs and selectors</h2>
        <Showcase />
      </section>

      <p className="t-xs muted row" style={{ gap: 6 }}>
        <Icon name="info" size="sm" /> Every animation uses transform and opacity, and stops with reduced
        motion.
      </p>
    </main>
  );
}
