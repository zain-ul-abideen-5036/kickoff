/** Loading skeletons shaped like the layouts they stand in for, so nothing jumps on load. */

const sk = (style: React.CSSProperties) => <span className="sk" style={{ display: 'block', ...style }} />;

export function DashboardSkeleton() {
  return (
    <div
      className="wrap col"
      style={{ gap: 24, paddingTop: 28 }}
      aria-busy="true"
      aria-label="Loading briefs"
    >
      {sk({ height: 14, width: 180 })}
      {sk({ height: 44, width: 220 })}
      <div className="g3" style={{ gap: 16 }}>
        {sk({ height: 88 })}
        {sk({ height: 88 })}
        {sk({ height: 88 })}
      </div>
      <div className="row" style={{ gap: 10 }}>
        {sk({ height: 40, width: 280 })}
        {sk({ height: 40, width: 140, marginLeft: 'auto' })}
      </div>
      <div className="g4" style={{ gap: 12 }}>
        {[3, 2, 2, 1].map((n, c) => (
          <div key={c} className="sunk col" style={{ padding: 10, gap: 8 }}>
            {sk({ height: 20, width: '55%' })}
            {Array.from({ length: n }, (_, i) => (
              <span
                key={i}
                className="sk"
                style={{ display: 'block', height: 110, background: 'var(--card)' }}
              />
            ))}
          </div>
        ))}
      </div>
      <span className="sr-only" role="status">
        Loading briefs…
      </span>
    </div>
  );
}

export function DocumentSkeleton() {
  return (
    <div className="wrap state-doc" aria-busy="true" aria-label="Loading brief">
      <div className="col hide-m" style={{ gap: 10 }}>
        {Array.from({ length: 8 }, (_, i) => (
          <span
            key={i}
            className="sk"
            style={{ display: 'block', height: 12, width: `${60 + ((i * 13) % 35)}%` }}
          />
        ))}
      </div>
      <div className="card col" style={{ gap: 14, padding: 32 }}>
        {sk({ height: 12, width: '30%' })}
        {sk({ height: 42, width: '55%' })}
        {sk({ height: 12 })}
        {sk({ height: 12, width: '92%' })}
        {sk({ height: 180, marginTop: 12 })}
        {sk({ height: 12, width: '70%' })}
      </div>
      <div className="col hide-m" style={{ gap: 12 }}>
        {sk({ height: 120 })}
        {sk({ height: 160 })}
      </div>
      <span className="sr-only" role="status">
        Loading brief…
      </span>
    </div>
  );
}
