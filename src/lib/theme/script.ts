/**
 * Runs before first paint so the page never flashes the wrong theme. Uses the saved choice,
 * otherwise the system preference. Kept tiny and dependency-free because it is inlined.
 */
export const THEME_KEY = 'kickoff-theme';

export const themeScript = `(function(){try{var t=localStorage.getItem('${THEME_KEY}');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme='light'}})();`;

export type Theme = 'light' | 'dark';

export function nextTheme(current: string | undefined): Theme {
  return current === 'dark' ? 'light' : 'dark';
}
