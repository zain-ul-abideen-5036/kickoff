'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { Icon } from '../icons';

type Tone = 'ok' | 'error';
interface Toast {
  id: number;
  text: string;
  tone: Tone;
  action?: { label: string; run: () => void };
}

const Ctx = createContext<{ show: (text: string, opts?: { tone?: Tone; action?: Toast['action'] }) => void }>(
  {
    show: () => undefined,
  },
);

/** Toasts are announced politely (errors assertively) and dismiss themselves after a few seconds. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const n = useRef(0);
  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const show = useCallback(
    (text: string, opts: { tone?: Tone; action?: Toast['action'] } = {}) => {
      const id = ++n.current;
      setToasts((t) => [...t.slice(-2), { id, text, tone: opts.tone ?? 'ok', action: opts.action }]);
      window.setTimeout(() => dismiss(id), opts.tone === 'error' ? 8000 : 4000);
    },
    [dismiss],
  );
  const value = useMemo(() => ({ show }), [show]);
  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="toasts no-print" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="toast" role={t.tone === 'error' ? 'alert' : 'status'}>
            <Icon name={t.tone === 'error' ? 'alert' : 'check'} />
            <span className="grow">{t.text}</span>
            {t.action && (
              <button
                type="button"
                className="btn btn-sm btn-quiet"
                onClick={() => {
                  t.action?.run();
                  dismiss(t.id);
                }}
              >
                {t.action.label}
              </button>
            )}
            <button
              type="button"
              className="btn btn-sm btn-quiet btn-icon"
              aria-label="Dismiss"
              onClick={() => dismiss(t.id)}
            >
              <Icon name="close" size="sm" />
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  return useContext(Ctx);
}
