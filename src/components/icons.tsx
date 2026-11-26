import type { SVGProps } from 'react';

/** Thin line icons on a 24 grid, 1.5px stroke, round caps. Decorative by default. */
type IconProps = SVGProps<SVGSVGElement> & { size?: 'sm' | 'md' | 'lg'; label?: string };

const PATHS = {
  check: 'M5 12.5l4.5 4.5L19 7.5',
  arrowRight: 'M5 12h14M13 6l6 6-6 6',
  arrowLeft: 'M19 12H5M11 6l-6 6 6 6',
  plus: 'M12 5v14M5 12h14',
  minus: 'M6 12h12',
  close: 'M6 6l12 12M18 6L6 18',
  search: 'M15.8 15.8L20 20M11 4.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13z',
  filter: 'M4 6h16M7 12h10M10 18h4',
  download: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  upload: 'M12 16V5M7 10l5-5 5 5M5 20h14',
  link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  send: 'M4 12l16-8-6 16-2.5-6.5z',
  sitemap: 'M10 3h4a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM4 16h4a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1zM16 16h4a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1zM12 8v4M6 16v-4h12v4',
  calendar: 'M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM4 10h16M9 3v4M15 3v4',
  brief: 'M7 3h7l5 5v13H7zM14 3v5h5',
  edit: 'M4 20h4L19 9l-4-4L4 16z',
  lock: 'M7 11h10a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2zM8 11V8a4 4 0 0 1 8 0v3',
  offline: 'M7 18h10a4 4 0 0 0 .8-7.9A6 6 0 0 0 6.3 9.3 4.5 4.5 0 0 0 7 18zM4 4l16 16',
  settings: 'M4 7h10M18 7h2M4 17h4M12 17h8M16 5a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM10 15a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',
  tag: 'M3 12V4h8l10 10-8 8zM7.5 6.3a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4z',
  kanban: 'M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM9 4v16M15 4v16',
  list: 'M4 6h16M4 12h16M4 18h16',
  menu: 'M4 7h16M4 12h16M4 17h16',
  copy: 'M11 9h7a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2zM5 15V5a1 1 0 0 1 1-1h10',
  mail: 'M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM3 7l9 6 9-6',
  clock: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM12 8v4l3 2',
  alert: 'M12 4l9 16H3zM12 10v4M12 17v.5',
  info: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM12 11v5M12 8v.5',
  chevronDown: 'M6 9l6 6 6-6',
  chevronLeft: 'M15 6l-6 6 6 6',
  chevronRight: 'M9 6l6 6-6 6',
  bookmark: 'M6 4h12v16l-6-4-6 4z',
  sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  moon: 'M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  logout: 'M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 16l-4-4 4-4M6 12h10',
  palette:
    'M12 3a9 9 0 1 0 0 18c1 0 1.5-.7 1.5-1.5 0-.9-.8-1.2-.8-2 0-.9.7-1.5 1.6-1.5H17a4 4 0 0 0 4-4c0-5-4-9-9-9z',
  target: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z',
  statusNew: 'M12 4.5a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15zM12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',
  statusReviewed:
    'M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12zM12 9.2a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6z',
  statusQuoted: 'M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6',
  statusWon: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM8.5 12.2l2.5 2.5 4.5-5',
  statusLost: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM9.5 9.5l5 5M14.5 9.5l-5 5',
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 'md', label, className, ...rest }: IconProps & { name: IconName }) {
  const cls = ['ic', size === 'sm' ? 'ic-sm' : size === 'lg' ? 'ic-lg' : '', className ?? '']
    .filter(Boolean)
    .join(' ');
  return (
    <svg
      viewBox="0 0 24 24"
      className={cls}
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
      aria-label={label}
      focusable="false"
      {...rest}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}

/** Six dots: the drag handle. Drawn as circles so it reads at small sizes. */
export function GripIcon() {
  return (
    <svg viewBox="0 0 24 24" className="ic ic-sm" aria-hidden="true" focusable="false">
      {[6, 12, 18].flatMap((y) =>
        [9, 15].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="0.9" fill="currentColor" />),
      )}
    </svg>
  );
}

/** The Kickoff mark: a blueprint corner inside a rounded square. */
export function KickoffMark({ size = 'md' }: { size?: 'md' | 'lg' }) {
  return (
    <svg viewBox="0 0 24 24" className={size === 'lg' ? 'ic ic-lg' : 'ic'} aria-hidden="true" focusable="false">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M8 7.5v9h8.5" />
    </svg>
  );
}
