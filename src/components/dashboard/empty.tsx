import { loadSampleBriefs } from '@/app/(app)/briefs/actions';
import { CopyButton } from '../app/copy-button';
import { Button } from '../ui/button';

/** A faint blueprint sketch, one line of help, one action. */
export function EmptyDashboard({ intakeUrl }: { intakeUrl: string }) {
  return (
    <section className="card paper-grid empty-dash">
      <div className="tree ghost" aria-hidden="true">
        <span className="node root">Your first brief</span>
        <span className="vstem" />
        <div className="kids">
          {['Pages', 'Features', 'Estimate'].map((n, i) => (
            <div key={n} className="kid" style={{ ['--d' as string]: `${120 + i * 80}ms` }}>
              <span className="node" style={{ ['--d' as string]: `${120 + i * 80}ms` }}>
                {n}
              </span>
            </div>
          ))}
        </div>
      </div>
      <h2 className="d-3">No briefs yet</h2>
      <p className="t-sm muted" style={{ maxWidth: '42ch' }}>
        Share your intake link with a client. Their brief will appear here the moment they finish.
      </p>
      <div className="row wrapf" style={{ gap: 10, justifyContent: 'center' }}>
        <CopyButton
          text={intakeUrl}
          label="Copy intake link"
          done="Intake link copied"
          size="md"
          variant="primary"
        />
        <form action={loadSampleBriefs}>
          <Button type="submit" variant="ghost">
            Load sample briefs
          </Button>
        </form>
      </div>
    </section>
  );
}
