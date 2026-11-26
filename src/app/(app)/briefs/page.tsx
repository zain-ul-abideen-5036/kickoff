import type { Metadata } from 'next';
import { signOut } from '@/app/(auth)/actions';
import { Button } from '@/components/ui/button';
import { requireOwner } from '@/lib/server/context';

export const metadata: Metadata = { title: 'Briefs' };

export default async function BriefsPage() {
  const owner = await requireOwner();
  return (
    <main id="main" className="wrap" style={{ paddingTop: 40 }}>
      <p className="eyebrow">Signed in as {owner.email}</p>
      <h1 className="d-1">Briefs</h1>
      <form action={signOut} style={{ marginTop: 24 }}>
        <Button type="submit" icon="logout">
          Sign out
        </Button>
      </form>
    </main>
  );
}
