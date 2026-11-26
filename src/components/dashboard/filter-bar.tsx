'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import { Icon } from '../icons';

/**
 * Search and filters live in the query string, so a filtered view can be bookmarked or shared
 * with the team. Typing is debounced; selects apply at once.
 */
export function FilterBar() {
  const router = useRouter();
  const path = usePathname();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get('q') ?? '');
  const [, start] = useTransition();
  const timer = useRef<number | undefined>(undefined);
  const view = sp.get('view') === 'table' ? 'table' : 'pipeline';

  const apply = (patch: Record<string, string>) => {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (!v || v === 'any' || v === 'all' || (k === 'view' && v === 'pipeline')) next.delete(k);
      else next.set(k, v);
    }
    const qs = next.toString();
    start(() => router.replace(qs ? `${path}?${qs}` : path, { scroll: false }));
  };

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <div className="row between wrapf filters" style={{ gap: 12 }}>
      <form className="row wrapf grow" style={{ gap: 10 }} role="search" onSubmit={(e) => e.preventDefault()}>
        <div className="affix filter-search">
          <Icon name="search" />
          <label htmlFor="brief-search" className="sr-only">
            Search briefs
          </label>
          <input
            id="brief-search"
            className="input input-sm"
            type="search"
            placeholder="Search clients or brief IDs"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              window.clearTimeout(timer.current);
              const v = e.target.value;
              timer.current = window.setTimeout(() => apply({ q: v }), 250);
            }}
          />
        </div>
        <label className="sr-only" htmlFor="f-budget">
          Filter by estimate
        </label>
        <select
          id="f-budget"
          className="input input-sm filter-select"
          value={sp.get('budget') ?? 'any'}
          onChange={(e) => apply({ budget: e.target.value })}
        >
          <option value="any">Any estimate</option>
          <option value="under3">Under £3,000</option>
          <option value="3to6">£3,000–£6,000</option>
          <option value="over6">Over £6,000</option>
        </select>
        <label className="sr-only" htmlFor="f-date">
          Filter by date received
        </label>
        <select
          id="f-date"
          className="input input-sm filter-select"
          value={sp.get('date') ?? 'all'}
          onChange={(e) => apply({ date: e.target.value })}
        >
          <option value="all">All time</option>
          <option value="month">Last 30 days</option>
          <option value="quarter">Last 3 months</option>
        </select>
      </form>
      <div className="seg seg-sm" role="group" aria-label="View">
        <button type="button" aria-pressed={view === 'pipeline'} onClick={() => apply({ view: 'pipeline' })}>
          <span className="row" style={{ gap: 6 }}>
            <Icon name="kanban" size="sm" />
            Pipeline
          </span>
        </button>
        <button type="button" aria-pressed={view === 'table'} onClick={() => apply({ view: 'table' })}>
          <span className="row" style={{ gap: 6 }}>
            <Icon name="list" size="sm" />
            Table
          </span>
        </button>
      </div>
    </div>
  );
}
