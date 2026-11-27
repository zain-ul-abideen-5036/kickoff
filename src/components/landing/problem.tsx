/** Later emails read quieter (muted ink, still 4.5:1), as the thread drags on. */
const THREAD = [
  ['Mon 3 Nov', 'Website enquiry', false],
  ['Wed 5 Nov', 'Re: what pages would you need?', false],
  ['Mon 10 Nov', 'Re: Re: rough budget?', true],
  ['Thu 13 Nov', 'Re: Re: Re: do you have photos?', true],
  ['Tue 18 Nov', 'Can we just jump on a call?', true],
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
            {THREAD.map(([date, subject, quiet]) => (
              <li key={date} className="lp-mail">
                <span className="mono t-xs muted">{date}</span>
                <span className={quiet ? 'muted' : undefined}>{subject}</span>
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
