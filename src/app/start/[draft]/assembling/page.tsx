import { notFound, redirect } from 'next/navigation';
import { Assembling } from '@/components/intake/assembling';
import { AgencyMark } from '@/components/ui/brand';
import { getDraft } from '@/lib/repo/drafts-repo';
import { isId } from '@/lib/repo/ids';
import { getSettings, logoUrl } from '@/lib/server/context';
import { getStore } from '@/lib/store';
import { planStageAction, readStageAction, writeStageAction } from '../../actions';

export const dynamic = 'force-dynamic';

export default async function AssemblingPage({ params }: { params: Promise<{ draft: string }> }) {
  const { draft: id } = await params;
  if (!isId(id)) notFound();
  const [draft, settings] = await Promise.all([getDraft(getStore(), id), getSettings()]);
  if (!draft) notFound();
  if (draft.briefId) redirect(`/start/${id}/ready`);
  const { name, brandColor } = settings.agency;
  return (
    <>
      <header className="rb">
        <div className="wrap row" style={{ minHeight: 64, gap: 10 }}>
          <AgencyMark name={name} color={brandColor} logoUrl={logoUrl(settings)} />
          <span className="w5">{name}</span>
        </div>
      </header>
      <Assembling
        draftId={id}
        business={draft.answers.about.business || 'Your business'}
        agencyName={name}
        read={readStageAction}
        plan={planStageAction}
        write={writeStageAction}
      />
    </>
  );
}
