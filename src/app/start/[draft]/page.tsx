import { notFound, redirect } from 'next/navigation';
import { IntakeApp } from '@/components/intake/intake-app';
import { visibleSteps } from '@/components/intake/model';
import { getDraft } from '@/lib/repo/drafts-repo';
import { isId } from '@/lib/repo/ids';
import { getSettings, logoUrl } from '@/lib/server/context';
import { getStore } from '@/lib/store';
import { saveDraftAction } from '../actions';

export const dynamic = 'force-dynamic';

/** The intake itself. The draft id in the URL is the client's private link back to their answers. */
export default async function DraftPage({ params }: { params: Promise<{ draft: string }> }) {
  const { draft: id } = await params;
  if (!isId(id)) notFound();
  const [draft, settings] = await Promise.all([getDraft(getStore(), id), getSettings()]);
  if (!draft) notFound();
  if (draft.briefId) redirect(`/start/${id}/ready`);
  return (
    <IntakeApp
      draftId={id}
      initialAnswers={draft.answers}
      initialStep={draft.step}
      updatedAt={draft.updatedAt}
      steps={visibleSteps(settings.intake.steps)}
      agency={{ name: settings.agency.name, color: settings.agency.brandColor, logoUrl: logoUrl(settings) }}
      save={saveDraftAction}
    />
  );
}
