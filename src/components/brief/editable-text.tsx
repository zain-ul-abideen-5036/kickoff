'use client';

import { useEffect, useState } from 'react';
import { cx } from '../ui/cx';

/**
 * Text that reads like the document but becomes an input when editable. Changes save on blur
 * (or Enter for single lines), so typing never fires a save per keystroke.
 */
export function EditableText({
  value,
  editable,
  label,
  onCommit,
  multiline,
  className,
  as: Tag = 'span',
  maxLength = 400,
}: {
  value: string;
  editable: boolean;
  label: string;
  onCommit: (v: string) => void;
  multiline?: boolean;
  className?: string;
  as?: 'span' | 'p' | 'h3';
  maxLength?: number;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  if (!editable) return <Tag className={className}>{value}</Tag>;
  const commit = () => {
    const v = draft.trim();
    if (!v) setDraft(value);
    else if (v !== value) onCommit(v);
  };
  const common = {
    'aria-label': label,
    value: draft,
    maxLength,
    className: 'inline-edit',
    onChange: (e: { target: { value: string } }) => setDraft(e.target.value),
    onBlur: commit,
  };
  // Always a textarea so long lines wrap like the document; single-line fields commit on Enter.
  // The typography class sits on the wrapper, so the field inherits the document's type.
  return (
    <Tag className={cx('edit-wrap', className)}>
      <textarea
        {...common}
        rows={1}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !multiline) {
            e.preventDefault();
            (e.target as HTMLTextAreaElement).blur();
          }
          if (e.key === 'Escape') {
            setDraft(value);
            (e.target as HTMLTextAreaElement).blur();
          }
        }}
      />
    </Tag>
  );
}
