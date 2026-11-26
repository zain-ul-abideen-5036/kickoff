import type { ReactNode } from 'react';
import { requireOwner } from '@/lib/server/context';

/** Everything under the agency workspace requires the signed-in studio owner. */
export default async function AppLayout({ children }: { children: ReactNode }) {
  await requireOwner();
  return <>{children}</>;
}
