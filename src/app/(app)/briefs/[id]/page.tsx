import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import '@/components/brief/brief.css';
import '@/components/brief/editor.css';
import { BriefEditor } from '@/components/brief/editor';
import { getBrief } from '@/lib/repo/briefs-repo';
import { isId } from '@/lib/repo/ids';
import { getSettings } from '@/lib/server/context';
import { getStore } from '@/lib/store';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const brief = isId(id) ? await getBrief(getStore(), id) : null;
  return { title: brief ? brief.answers.about.business : 'Brief' };
}

export default async function BriefPage({ params }: Props) {
  const { id } = await params;
  const brief = await getBrief(getStore(), id);
  if (!brief) notFound();
  const settings = await getSettings();
  return <BriefEditor initial={brief} vatRate={settings.rateCard.vatRate} agency={settings.agency.name} />;
}
