'use client';

import { Icon } from '@/components/icons';
import {
  AUDIENCES,
  BUDGETS,
  BUSINESS_TYPES,
  FEATURES,
  GOALS,
  LAUNCHES,
  READINESS,
  STYLE_WORDS,
  labelOf,
} from '@/lib/domain/catalog';
import type { IntakeAnswers, StepKey } from '@/lib/domain/intake';
import type { FollowUpSet } from '@/lib/engine/followups';
import { featureOptions } from './model';

const list = (items: string[]) => (items.length ? items.join(' · ') : 'Nothing chosen');

/** A plain summary of every answer, by step. */
export function reviewRows(a: IntakeAnswers, steps: StepKey[], followUps: FollowUpSet | null) {
  const rows: { key: StepKey | 'followups'; label: string; value: string }[] = [];
  const add = (key: StepKey, label: string, value: string) =>
    steps.includes(key) && rows.push({ key, label, value });
  add(
    'about',
    'About you',
    list(
      [
        a.about.name,
        a.about.business,
        labelOf(BUSINESS_TYPES, a.about.businessType),
        a.about.location,
        a.about.email,
      ].filter(Boolean),
    ),
  );
  add(
    'goals',
    'Goals',
    list(
      [
        ...a.goals.goals.map((g) => labelOf(GOALS, g)),
        a.goals.searchTerm && `"${a.goals.searchTerm}"`,
      ].filter(Boolean) as string[],
    ),
  );
  add(
    'audience',
    'Audience',
    `${list(a.audience.groups.map((g) => labelOf(AUDIENCES, g)))} · ages ${a.audience.ageMin}–${a.audience.ageMax}`,
  );
  const fopts = featureOptions(a.about.businessType);
  const featureLabel = (f: string) => fopts.find((o) => o.id === f)?.label ?? labelOf(FEATURES, f);
  add('features', 'Features', list(a.features.features.map(featureLabel)));
  add(
    'content',
    'Content',
    `Logo ${labelOf(READINESS, a.content.logo).toLowerCase()} · Photos ${labelOf(READINESS, a.content.photos).toLowerCase()} · Text ${labelOf(READINESS, a.content.text).toLowerCase()}`,
  );
  add(
    'inspiration',
    'Inspiration',
    list([
      ...a.inspiration.sites.filter((s) => s.trim()),
      ...a.inspiration.words.map((w) => labelOf(STYLE_WORDS, w)),
    ]),
  );
  add(
    'budget',
    'Budget and timing',
    `${labelOf(BUDGETS, a.budget.budget)} · ${labelOf(LAUNCHES, a.budget.launch)}`,
  );
  if (followUps && followUps.questions.length)
    rows.push({
      key: 'followups',
      label: 'Quick details',
      value: list(followUps.questions.map((q) => a.followUps[q.id]).filter((v): v is string => !!v)),
    });
  return rows;
}

export function ReviewStep({
  answers,
  steps,
  followUps,
  onEdit,
  consent,
  setConsent,
  agencyName,
}: {
  answers: IntakeAnswers;
  steps: StepKey[];
  followUps: FollowUpSet | null;
  onEdit: (key: StepKey | 'followups') => void;
  consent: boolean;
  setConsent: (v: boolean) => void;
  agencyName: string;
}) {
  return (
    <>
      <div>
        {reviewRows(answers, steps, followUps).map((r) => (
          <div key={r.key} className="rv">
            <span className="rv-k eyebrow">{r.label}</span>
            <span>{r.value}</span>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => onEdit(r.key)}
              aria-label={`Edit ${r.label}`}
            >
              <Icon name="edit" size="sm" />
              Edit
            </button>
          </div>
        ))}
      </div>
      <label className="consent t-sm">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        <span>
          {agencyName} may contact me about this project. My answers are only shared with {agencyName}.
        </span>
      </label>
      <div className="hp" aria-hidden="true">
        <label>
          Leave this empty
          <input type="text" name="website_url" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
    </>
  );
}
