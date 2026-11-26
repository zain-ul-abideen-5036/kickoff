import { Icon } from '../icons';

export const FAQS = [
  [
    'Do clients need an account?',
    'No. They open your link, answer the questions, and their answers save as they go. Nothing to install or sign up for.',
  ],
  [
    'Where do the prices come from?',
    'Only from your rate card: platform bases, a price per page and feature prices. AI never invents a number, and any AI text that mentions one is replaced by the template.',
  ],
  [
    'Can I change the questions?',
    'Yes. Turn steps on or off, and Kickoff adds one to three tailored follow-ups based on each client’s answers.',
  ],
  [
    'What do clients receive?',
    'A thank-you page with highlights straight away, then your reviewed brief as a branded PDF and a private link they can approve.',
  ],
  [
    'Does it work with Trello or Asana?',
    'Export tasks as CSV, ready to import: one task per page, feature and content item, grouped by phase.',
  ],
  [
    'What does it cost to run?',
    'It runs on free tiers: Vercel Hobby with Blob storage, Gemini’s free tier for the wording, and Resend’s free plan if you want email.',
  ],
] as const;

/** Native details/summary: keyboard and screen reader support for free. */
export function Faq() {
  return (
    <section className="wrap lp-sec lp-faq" id="faq" aria-labelledby="faq-h">
      <div className="split" style={{ gap: 64 }}>
        <div className="col" style={{ gap: 14, flex: '0 1 360px' }}>
          <p className="eyebrow">Questions</p>
          <h2 className="d-1" id="faq-h">
            Asked by studios like yours
          </h2>
        </div>
        <div style={{ flex: '1 1 0', minWidth: 0 }}>
          {FAQS.map(([q, a], i) => (
            <details key={q} open={i === 0}>
              <summary>
                {q}
                <Icon name="plus" />
              </summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
