'use client';

import { useEffect, useState } from 'react';
import { THEME_KEY, nextTheme, type Theme } from '@/lib/theme/script';
import { Icon } from '../icons';

/** Switches light and dark, remembering the choice on this device. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);
  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
  }, []);
  const label = theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
  return (
    <button
      type="button"
      className="btn btn-ghost btn-sm btn-icon"
      aria-label={label}
      title={label}
      onClick={() => {
        const t = nextTheme(document.documentElement.dataset.theme);
        document.documentElement.dataset.theme = t;
        try {
          localStorage.setItem(THEME_KEY, t);
        } catch {
          /* private mode: the choice just isn't remembered */
        }
        setTheme(t);
      }}
    >
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
    </button>
  );
}
