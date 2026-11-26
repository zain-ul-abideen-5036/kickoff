'use client';

import { useEffect } from 'react';
import { StatePanel } from '@/components/states/blueprint';
import { Button, ButtonLink } from '@/components/ui/button';

/** Catches unexpected errors in any page and offers a retry, without exposing details. */
export default function ErrorPage({
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
    <main id="main" className="wrap" style={{ paddingTop: 48, paddingBottom: 48 }}>
      <StatePanel
        eyebrow={error.digest ? `Reference ${error.digest}` : 'Something went wrong'}
        title="That didn’t load"
        body="Nothing you entered has been lost. Try again, and if it keeps happening, come back in a few minutes."
        actions={
          <>
            <Button variant="primary" icon="arrowRight" onClick={reset}>
              Try again
            </Button>
            <ButtonLink href="/" variant="ghost">
              Go to the home page
            </ButtonLink>
          </>
        }
      />
    </main>
  );
}
