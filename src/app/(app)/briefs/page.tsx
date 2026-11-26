import type { Metadata } from 'next';
import { BriefTable, PipelineBoard } from '@/components/dashboard/board';
import '@/components/dashboard/dashboard.css';
import { EmptyDashboard } from '@/components/dashboard/empty';
import { FilterBar } from '@/components/dashboard/filter-bar';
import { MetricsStrip } from '@/components/dashboard/metrics';
import { ButtonLink } from '@/components/ui/button';
import { CopyButton } from '@/components/app/copy-button';
import { dashboardMetrics, filterBriefs, parseFilters } from '@/lib/brief-edit/dashboard';
import { listBriefs } from '@/lib/repo/briefs-repo';
import { appUrl, getSettings } from '@/lib/server/context';
import { getStore } from '@/lib/store';

export const metadata: Metadata = { title: 'Briefs' };

export default async function BriefsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const [rows, settings] = await Promise.all([listBriefs(getStore()), getSettings()]);
  const intakeUrl = `${appUrl()}/start`;
  const now = new Date();
  const filtered = filterBriefs(rows, parseFilters(sp), now);
  const view = sp.view === 'table' ? 'table' : 'pipeline';
  const month = now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  return (
    <main className="dash">
      <div className="row between wrapf" style={{ gap: 16 }}>
        <div className="col" style={{ gap: 4 }}>
          <p className="eyebrow">
            {settings.agency.name} · {month}
          </p>
          <h1 className="d-1">Briefs</h1>
        </div>
        <div className="row wrapf" style={{ gap: 10 }}>
          <CopyButton text={intakeUrl} label="Copy intake link" done="Intake link copied" size="md" />
          <ButtonLink href="/start" variant="primary" icon="plus" target="_blank" rel="noopener">
            New brief
          </ButtonLink>
        </div>
      </div>
      {rows.length === 0 ? (
        <EmptyDashboard intakeUrl={intakeUrl} />
      ) : (
        <>
          <MetricsStrip m={dashboardMetrics(rows, now)} />
          <FilterBar />
          {view === 'table' ? <BriefTable rows={filtered} /> : <PipelineBoard rows={filtered} />}
        </>
      )}
    </main>
  );
}
