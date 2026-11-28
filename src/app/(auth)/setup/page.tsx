import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { getOwner } from '@/lib/auth/owner-repo';
import { getStore } from '@/lib/store';
import { SetupForm } from './setup-form';

export const metadata: Metadata = { title: 'Set up your studio', robots: { index: false } };

/** First run only: creates the studio owner. Once an owner exists this page sends you to sign in. */
export default async function SetupPage() {
  // Render per request: whether an owner exists changes after the first visit.
  await connection();
  if (await getOwner(getStore())) redirect('/login');
  return (
    <>
      <div className="col" style={{ gap: 8 }}>
        <p className="eyebrow">First run</p>
        <h1 className="d-2">Set up your studio</h1>
        <p className="muted">One owner account looks after briefs, quotes and settings.</p>
      </div>
      <SetupForm needsCode={!!process.env.SETUP_CODE || !!process.env.VERCEL} />
    </>
  );
}
