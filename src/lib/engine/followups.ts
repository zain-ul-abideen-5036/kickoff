import type { IntakeAnswers } from '@/lib/domain/intake';

export interface FollowUpOption {
  value: string;
  label: string;
}

export interface FollowUp {
  /** Key in `answers.followUps`. Some keys feed the rules, e.g. `products` prices a shop. */
  id: 'covers' | 'bookingSystem' | 'products' | 'currentPages' | 'groupSize';
  question: string;
  hint: string;
  options: FollowUpOption[];
}

export interface FollowUpSet {
  /** Why we're asking, in one gentle sentence. */
  reason: string;
  questions: FollowUp[];
}

const opts = (...labels: string[]): FollowUpOption[] => labels.map((l) => ({ value: l, label: l }));
const has = (a: IntakeAnswers, id: string) => a.features.features.includes(id as never);

/**
 * Picks one to three tailored questions from the answers. The questions are chosen by rule;
 * only their wording may be polished by AI later.
 */
export function selectFollowUps(a: IntakeAnswers): FollowUpSet {
  const q: FollowUp[] = [];
  const reasons: string[] = [];
  const restaurant = a.about.businessType === 'restaurant';

  if (has(a, 'booking')) {
    reasons.push(restaurant ? 'online table booking' : 'online booking');
    if (restaurant)
      q.push({
        id: 'covers',
        question: 'How many covers do you take on a busy night?',
        hint: 'Covers means guests seated. A rough number is fine.',
        options: opts('Under 40', '40–80', '80–120', '120+'),
      });
    q.push({
      id: 'bookingSystem',
      question: restaurant
        ? 'Do you already use a booking system such as OpenTable or ResDiary?'
        : 'Do you already use a booking system such as Fresha or Calendly?',
      hint: "If you do, we'll connect to it rather than set up something new.",
      options: restaurant
        ? opts('No, not yet', 'OpenTable', 'ResDiary', 'Something else')
        : opts('No, not yet', 'Fresha', 'Calendly', 'Something else'),
    });
  }

  if (has(a, 'shop')) {
    reasons.push('an online shop');
    q.push({
      id: 'products',
      question: 'Roughly how many products will you sell online?',
      hint: 'Product setup is priced in blocks of 10, so a rough number helps.',
      options: [
        { value: '10', label: 'Up to 10' },
        { value: '25', label: '11–25' },
        { value: '50', label: '26–50' },
        { value: '100', label: '51–100' },
        { value: '200', label: 'More than 100' },
      ],
    });
  }

  if (has(a, 'private') && !restaurant && q.length < 3) {
    reasons.push('group bookings');
    q.push({
      id: 'groupSize',
      question: 'What is the largest group you can host?',
      hint: 'So the enquiry form asks the right questions.',
      options: opts('Up to 10', '10–30', '30–60', 'More than 60'),
    });
  }

  if (q.length === 0 && a.about.website !== 'none') {
    reasons.push('your current website');
    q.push({
      id: 'currentPages',
      question: 'Roughly how many pages does your current website have?',
      hint: 'We use it to check nothing important gets left behind.',
      options: opts('Fewer than 5', '5–10', '10–25', 'More than 25'),
    });
  }

  const reason = reasons.length
    ? `You asked for ${reasons.slice(0, 2).join(' and ')}, so these help us size it properly.`
    : '';
  return { reason, questions: q.slice(0, 3) };
}

/** True when every chosen follow-up has an answer. */
export function followUpsComplete(a: IntakeAnswers): boolean {
  return selectFollowUps(a).questions.every((q) => !!a.followUps[q.id]);
}
