import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getOwner } from '@/lib/auth/owner-repo';
import { getSessionOwner } from '@/lib/server/context';
import { getStore } from '@/lib/store';
import { LoginForm } from './login-form';

export const metadata: Metadata = { title: 'Sign in', robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await getSessionOwner()) redirect('/briefs');
  if (!(await getOwner(getStore()))) redirect('/setup');
  const { next } = await searchParams;
  return (
    <>
      <div className="col" style={{ gap: 8 }}>
        <p className="eyebrow">Studio sign in</p>
        <h1 className="d-2">Welcome back</h1>
        <p className="muted">Sign in to review new briefs and send quotes.</p>
      </div>
      <LoginForm next={next} />
    </>
  );
}
