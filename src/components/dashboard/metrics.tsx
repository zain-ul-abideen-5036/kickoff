import type { DashboardMetrics } from '@/lib/brief-edit/dashboard';
import { formatGbp } from '@/lib/format';

/** One ruled strip of three figures, editorial rather than three identical cards. */
export function MetricsStrip({ m }: { m: DashboardMetrics }) {
  return (
    <section className="mtr" aria-label="This month">
      <div>
        <span className="eyebrow">Briefs this month</span>
        <span className="serif num mtr-fig">{m.thisMonth}</span>
        <span className="t-sm muted">{m.awaitingReview} waiting for review</span>
      </div>
      <div>
        <span className="eyebrow">Pipeline value</span>
        <span className="serif num brass mtr-fig">{formatGbp(m.pipeline)}</span>
        <span className="t-sm muted">New, reviewed and quoted briefs</span>
      </div>
      <div>
        <span className="eyebrow">Win rate</span>
        <span className="serif num mtr-fig">{m.winRate === null ? '—' : `${m.winRate}%`}</span>
        <span className="t-sm muted">
          {m.won} won · {m.lost} lost
        </span>
      </div>
    </section>
  );
}
