'use client';

import Link from 'next/link';
import { useOptimistic, useTransition } from 'react';
import { setBriefStatus } from '@/app/(app)/briefs/actions';
import { groupByStatus } from '@/lib/brief-edit/dashboard';
import { STATUSES, type Status } from '@/lib/domain/brief';
import { formatGbp } from '@/lib/format';
import type { BriefSummary } from '@/lib/repo/briefs-repo';
import { StatusBadge } from '../ui/badges';
import { useToast } from '../ui/toast';

export const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });

/** Status changes move the card at once, then save; a failed save moves it back. */
function useStatusMoves(rows: BriefSummary[]) {
  const toast = useToast();
  const [, start] = useTransition();
  const [optimistic, move] = useOptimistic(rows, (cur, m: { id: string; status: Status }) =>
    cur.map((r) => (r.id === m.id ? { ...r, status: m.status } : r)),
  );
  const change = (row: BriefSummary, status: Status) =>
    start(async () => {
      move({ id: row.id, status });
      const res = await setBriefStatus(row.id, status);
      if (res.ok) toast.show(`${row.business} moved to ${status}`);
      else toast.show(res.error, { tone: 'error' });
    });
  return { rows: optimistic, change };
}

function StatusSelect({ row, onChange }: { row: BriefSummary; onChange: (s: Status) => void }) {
  return (
    <label className="row kcard-status">
      <span className="t-xs muted">Status</span>
      <select
        className="input input-sm"
        value={row.status}
        aria-label={`Status for ${row.business}`}
        onChange={(e) => onChange(e.target.value as Status)}
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </label>
  );
}

export function PipelineBoard({ rows: initial }: { rows: BriefSummary[] }) {
  const { rows, change } = useStatusMoves(initial);
  return (
    <div className="board">
      {groupByStatus(rows).map((col) => (
        <section key={col.status} className="kcol" aria-label={`${col.status}, ${col.rows.length} briefs`}>
          <div className="kcol-h">
            <StatusBadge status={col.status} />
            <span className="mono t-xs muted">{col.rows.length ? formatGbp(col.total) : '—'}</span>
          </div>
          {col.rows.map((r) => (
            <article key={r.id} className="kcard">
              <div className="row between t-xs mono muted">
                <span>{r.ref}</span>
                <span>{shortDate(r.createdAt)}</span>
              </div>
              <Link href={`/briefs/${r.id}`} className="kcard-title">
                {r.business}
              </Link>
              <p className="t-sm muted">
                {r.type} · {r.location}
              </p>
              <div className="row between" style={{ marginTop: 14 }}>
                <span className="mono w5">{formatGbp(r.total)}</span>
                <span className="t-xs muted">{r.scope}</span>
              </div>
              <StatusSelect row={r} onChange={(s) => change(r, s)} />
            </article>
          ))}
          {col.rows.length === 0 && <p className="kcol-empty t-xs muted">Nothing here yet</p>}
        </section>
      ))}
    </div>
  );
}

export function BriefTable({ rows: initial }: { rows: BriefSummary[] }) {
  const { rows, change } = useStatusMoves(initial);
  return (
    <div className="tbl-wrap a-in-y">
      <table className="tbl">
        <caption className="sr-only">Briefs</caption>
        <thead>
          <tr>
            <th scope="col">Client</th>
            <th scope="col">Brief</th>
            <th scope="col">Status</th>
            <th scope="col">Scope</th>
            <th scope="col" className="r">
              Estimate
            </th>
            <th scope="col">Received</th>
            <th scope="col">Wants launch</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>
                <Link href={`/briefs/${r.id}`} className="w5" style={{ textDecoration: 'none' }}>
                  {r.business}
                </Link>
                <div className="t-xs muted">{r.type}</div>
              </td>
              <td className="mono t-sm muted">{r.ref}</td>
              <td>
                <div className="row" style={{ gap: 8 }}>
                  <StatusBadge status={r.status} />
                  <select
                    className="input input-sm tbl-status"
                    value={r.status}
                    aria-label={`Change status for ${r.business}`}
                    onChange={(e) => change(r, e.target.value as Status)}
                  >
                    {STATUSES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </td>
              <td className="t-sm">{r.scope}</td>
              <td className="r mono">{formatGbp(r.total)}</td>
              <td className="mono t-sm">{shortDate(r.createdAt)}</td>
              <td className="t-sm">{r.launch}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={7} className="t-sm muted" style={{ textAlign: 'center', padding: 32 }}>
                No briefs match these filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
