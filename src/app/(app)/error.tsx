'use client';

import { useEffect } from 'react';
import { StatePanel } from '@/components/states/blueprint';
import { Button, ButtonLink } from '@/components/ui/button';

/** Errors inside the workspace keep the shell, so navigation still works. */
export default function WorkspaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="wrap" style={{ paddingTop: 32, paddingBottom: 48 }}>
      <StatePanel
        as="h1"
        eyebrow={error.digest ? `Reference ${error.digest}` : 'Couldn’t load'}
        title="This page didn’t load"
        body="Your saved briefs are safe. If storage is unreachable or you’re offline, try again in a moment."
        actions={
          <>
            <Button variant="primary" onClick={reset}>
              Try again
            </Button>
            <ButtonLink href="/briefs" variant="ghost">
              Back to briefs
            </ButtonLink>
          </>
        }
      />
    </div>
  );
}
