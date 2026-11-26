'use client';

import { Button } from '../ui/button';
import { useToast } from '../ui/toast';

/** Copies text to the clipboard and confirms with a toast. */
export function CopyButton({
  text,
  label = 'Copy link',
  done = 'Link copied',
  size = 'sm',
  variant = 'secondary',
}: {
  text: string;
  label?: string;
  done?: string;
  size?: 'sm' | 'md';
  variant?: 'secondary' | 'ghost' | 'primary';
}) {
  const toast = useToast();
  return (
    <Button
      size={size}
      variant={variant}
      icon="copy"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          toast.show(done);
        } catch {
          toast.show('Couldn’t copy. Select the link and copy it instead.', { tone: 'error' });
        }
      }}
    >
      {label}
    </Button>
  );
}
