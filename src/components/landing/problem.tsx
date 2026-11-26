const THREAD = [
  ['Mon 3 Nov', 'Website enquiry', 1],
  ['Wed 5 Nov', 'Re: what pages would you need?', 0.85],
  ['Mon 10 Nov', 'Re: Re: rough budget?', 0.7],
  ['Thu 13 Nov', 'Re: Re: Re: do you have photos?', 0.6],
  ['Tue 18 Nov', 'Can we just jump on a call?', 0.5],
] as const;

export function Problem() {
  return (
    <section className="wrap lp-sec" aria-labelledby="problem-h">
      <div className="split" style={{ gap: 64 }}>
        <div className="col" style={{ gap: 18, flex: '1 1 0', minWidth: 0 }}>
          <p className="eyebrow">The problem</p>
          <h2 className="d-1" id="problem-h">
            Discovery shouldn’t take a fortnight of emails.
          </h2>
          <p className="t-lg muted measure">
            Every new enquiry starts the same way: what pages do you need, what’s your budget, do you have
            photos, when do you want to launch? By the time you can quote, the client has cooled off.
          </p>
        </div>
        <div style={{ flex: '1 1 0', minWidth: 0 }}>
          <ul aria-label="A typical discovery email thread">
            {THREAD.map(([date, subject, o]) => (
              <li key={date} className="lp-mail" style={{ opacity: o }}>
                <span className="mono t-xs muted">{date}</span>
                <span>{subject}</span>
              </li>
            ))}
          </ul>
          <p className="row" style={{ gap: 12, paddingTop: 22, alignItems: 'flex-start' }}>
            <span className="pin" aria-hidden="true">
              K
            </span>
            <span>
              <span className="w5">With Kickoff:</span> one link, one five-minute intake, one brief ready to
              quote.
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
