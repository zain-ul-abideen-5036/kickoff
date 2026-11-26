import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Briefs' };

/** Replaced by the dashboard. */
export default function BriefsPage() {
  return (
    <main className="wrap" style={{ paddingTop: 32 }}>
      <p className="eyebrow">Studio</p>
      <h1 className="d-1">Briefs</h1>
    </main>
  );
}
