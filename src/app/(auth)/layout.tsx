import type { ReactNode } from 'react';
import { KickoffWordmark } from '@/components/ui/brand';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import './auth.css';

/** Editorial split for sign-in and first-run setup: blueprint panel left, form right. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth">
      <aside className="auth-side paper-grid" aria-hidden="true">
        <KickoffWordmark size="lg" />
        <div className="col" style={{ gap: 16 }}>
          <p className="eyebrow">For web design studios</p>
          <p className="d-1" style={{ maxWidth: '14ch' }}>
            Every client brief, ready to quote.
          </p>
        </div>
        <div className="tree auth-tree">
          <span className="node root">Home</span>
          <span className="vstem" style={{ ['--d' as string]: '120ms' }} />
          <div className="kids">
            {['Menu', 'Book', 'Gallery', 'Contact'].map((p, i) => (
              <div key={p} className="kid" style={{ ['--d' as string]: `${200 + i * 80}ms` }}>
                <span className="node" style={{ ['--d' as string]: `${200 + i * 80}ms` }}>
                  {p}
                </span>
              </div>
            ))}
          </div>
        </div>
      </aside>
      <main id="main" className="auth-main">
        <div className="auth-top">
          <span className="auth-brand">
            <KickoffWordmark />
          </span>
          <ThemeToggle />
        </div>
        <div className="auth-form">{children}</div>
      </main>
    </div>
  );
}
