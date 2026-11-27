'use client';

import { Segmented } from '@/components/ui/choices';
import type { FollowUpSet } from '@/lib/engine/followups';

/** One to three tailored questions, each a quick single choice. */
export function FollowUpsStep({
  set,
  values,
  onChange,
  showErrors,
}: {
  set: FollowUpSet;
  values: Record<string, string>;
  onChange: (id: string, value: string) => void;
  showErrors: boolean;
}) {
  return (
    <>
      {set.questions.map((q) => (
        <div
          key={q.id}
          className="card"
          style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          <Segmented
            label={<span style={{ fontSize: 16 }}>{q.question}</span>}
            hint={q.hint}
            options={q.options.map((o) => ({ id: o.value, label: o.label }))}
            value={values[q.id] ?? ''}
            onChange={(v) => onChange(q.id, v)}
          />
          {showErrors && !values[q.id] && (
            <span className="err-msg" role="alert">
              Please choose the closest answer.
            </span>
          )}
        </div>
      ))}
    </>
  );
}
