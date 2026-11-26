import type { Metadata } from 'next';
import { BlueprintSketch, StatePanel } from '@/components/states/blueprint';
import { KickoffWordmark } from '@/components/ui/brand';
import { ButtonLink } from '@/components/ui/button';

export const metadata: Metadata = { title: 'Page not found', robots: { index: false } };

export default function NotFound() {
  return (
    <div className="state-page">
      <header className="wrap row" style={{ minHeight: 64 }}>
        <KickoffWordmark />
      </header>
      <main id="main">
        <StatePanel
          eyebrow="Error 404 · page not found"
          title="This page isn’t on the plan"
          body="The link may be mistyped, or the page has moved. If someone sent you a brief link, ask them for a fresh one."
          sketch={<BlueprintSketch root="Home" kids={['·  ·  ·', '·  ·  ·']} />}
          actions={
            <ButtonLink href="/" variant="primary" icon="arrowLeft">
              Back to the start
            </ButtonLink>
          }
        />
      </main>
    </div>
  );
}
