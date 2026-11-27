import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import '@/components/brief/editor.css';
import '@/components/brief/brief.css';
import '@/components/brief/quote.css';
import { QuoteEditor } from '@/components/brief/quote-editor';
import { getBrief } from '@/lib/repo/briefs-repo';
import { getSettings } from '@/lib/server/context';
import { getStore } from '@/lib/store';

export const metadata: Metadata = { title: 'Quote' };

export default async function QuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const brief = await getBrief(getStore(), id);
  if (!brief) notFound();
  const settings = await getSettings();
  return (
    <QuoteEditor
      briefId={brief.id}
      business={brief.answers.about.business}
      refCode={brief.ref}
      initial={brief.quote}
      rates={settings.rateCard}
    />
  );
}
